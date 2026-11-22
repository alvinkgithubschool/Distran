"""Adaptive personalization experiment (notebook 05); run on CPU in Colab.

Trains two neural content encoders on the pinned Kaggle metadata corpus -- a
TextCNN score-bucket classifier (1D convolutions over token embeddings) and a
small decoder-only GPT-style language model (causal transformer, next-token
pretraining) -- then trains the adaptive preference classifier proposed in
notebooks/ADAPTIVE_PERSONALIZATION_RESEARCH.md on the sampled Amazon 5-core
interactions: a shared logistic prior plus a private per-user residual updated
online with chronological predict-before-learn replay.

Raw source IDs are used only in memory; exported coefficients are keyed by
salted hashes. Research artifacts only; nothing here is promoted to the app.
"""
import csv, gzip, hashlib, json, math, os, platform, re, subprocess, sys, time, unicodedata, urllib.request
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np

SEED = 42
AMAZON_BASE = 'https://mcauleylab.ucsd.edu/public_datasets/data/amazon_2023/benchmark/5core/rating_only/'
KAGGLE = {'movies': 'balaka18/tmdb-top-10000-popular-movies-dataset/versions/2',
          'hltb': 'zaireali/howlongtobeat-games-scraper-2162025/versions/1'}
KAGGLE_FILES = {'movies': 'movies_tmdb_popular.csv', 'hltb': 'hltb_data.csv'}
HLTB_SAMPLE = 10000
MAX_TOKENS = 48
MODEL_NAME = 'Distran APC-1 (Adaptive Preference Classifier: shared-prior online logistic with per-user residual)'
MODEL_ID = 'distran-apc-v1'
MODULE_VERSION = 3
FEATURES = ['item_pop_pct', 'item_quality', 'item_dom_game', 'item_dom_screen', 'item_recency_90d',
            'user_activity', 'user_pos_rate', 'user_aff_game', 'user_aff_screen', 'user_recency_30d',
            'inter_aff_game', 'inter_aff_screen', 'collab_pct']


def clean(value):
    if value is None or (isinstance(value, float) and not np.isfinite(value)):
        return ''
    return re.sub(r'\s+', ' ', str(value)).strip()


def title_key(value):
    value = unicodedata.normalize('NFKD', clean(value)).encode('ascii', 'ignore').decode().lower()
    value = value.replace("'", '')
    return re.sub(r'[^a-z0-9]+', ' ', value).strip()


def split_bucket(title):
    return int(hashlib.sha256(title_key(title).encode()).hexdigest()[:8], 16) % 10


def text_key(text):
    return re.sub(r'\s+', ' ', re.sub(r"[^a-z0-9'\s]", ' ', clean(text).lower())).strip()


def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-np.clip(z, -30, 30)))


class Adam:
    def __init__(self, params, lr=0.01, b1=0.9, b2=0.999, eps=1e-8):
        self.params = params
        self.lr, self.b1, self.b2, self.eps = lr, b1, b2, eps
        self.m = [np.zeros_like(p) for p in params]
        self.v = [np.zeros_like(p) for p in params]
        self.t = 0

    def step(self, grads):
        self.t += 1
        for p, g, m, v in zip(self.params, grads, self.m, self.v):
            m *= self.b1; m += (1 - self.b1) * g
            v *= self.b2; v += (1 - self.b2) * g * g
            mh = m / (1 - self.b1 ** self.t); vh = v / (1 - self.b2 ** self.t)
            p -= self.lr * mh / (np.sqrt(vh) + self.eps)


# ---------------------------------------------------------------- data

def prepare_amazon(root):
    salt = os.urandom(32)
    events = []; sources = []; user_sets = []
    for domain, category in [('game', 'Video_Games'), ('screen', 'Movies_and_TV')]:
        path = root / (category + '.csv.gz'); url = AMAZON_BASE + path.name
        print('Downloading complete file:', category, flush=True)
        if not path.exists():
            with urllib.request.urlopen(url, timeout=180) as response, path.open('wb') as out:
                while chunk := response.read(1024 * 1024):
                    out.write(chunk)
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        users = set(); count = 0; kept = 0
        with gzip.open(path, 'rt') as stream:
            for row in csv.DictReader(stream):
                count += 1; raw = row['user_id']; users.add(raw)
                if int.from_bytes(hashlib.sha256(raw.encode()).digest()[:8], 'big') % 128:
                    continue
                rating = float(row['rating']); timestamp = int(row['timestamp'])
                if not np.isfinite(rating) or not 1 <= rating <= 5:
                    raise ValueError('Invalid rating')
                user = hashlib.sha256(salt + raw.encode()).hexdigest()
                events.append(dict(user_id=user, item_id=domain + ':' + row['parent_asin'],
                                   rating=rating, timestamp=timestamp)); kept += 1
        user_sets.append(users)
        sources.append(dict(url=url, sha256=digest, bytes=path.stat().st_size, rows=count,
                            users=len(users), sampled_rows=kept))
        print(category, sources[-1], flush=True)
    overlap = len(user_sets[0] & user_sets[1]); del user_sets
    unique = {(e['user_id'], e['item_id'], e['timestamp']): e for e in events}
    audit = dict(sources=sources, full_file_overlap_users=overlap, duplicates_removed=len(events) - len(unique),
                 sample='SHA256(source_user_id) first 8 bytes big endian modulo 128 == 0; complete file scans; no future-based user filtering',
                 pseudonyms='Random per-run salt, not exported; sampled cohort deterministic, pseudonyms differ each run',
                 limitations='Publisher 5-core selection uses complete history; screen combines movies and TV. Same sampling rule as notebook 03 so cohorts are comparable.')
    return list(unique.values()), audit


def prepare_corpus(root):
    import kagglehub
    import pandas as pd
    raw = {}; sources = {}
    for key, handle in KAGGLE.items():
        directory = Path(kagglehub.dataset_download(handle)); path = directory / KAGGLE_FILES[key]
        raw[key] = pd.read_csv(path, low_memory=False)
        sources[key] = dict(handle=handle, file=path.name, sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                            bytes=path.stat().st_size, rows=len(raw[key]))
        print('Kaggle', key, sources[key], flush=True)
    docs = []
    for _, row in raw['movies'].iterrows():
        title = clean(row.get('title'))
        if not title:
            continue
        votes = float(pd.to_numeric(pd.Series([row.get('vote_count')]), errors='coerce').iloc[0])
        score = float(pd.to_numeric(pd.Series([row.get('vote_average')]), errors='coerce').iloc[0])
        score = score if np.isfinite(score) and np.isfinite(votes) and votes >= 5 and 0 <= score <= 10 else None
        docs.append(dict(title=title, source='tmdb', score=score,
                         text=title + '. ' + clean(row.get('overview')) + ' language_' + clean(row.get('original_lang'))))
    hltb = raw['hltb']
    hltb = hltb[hltb['game_game_name'].notna()].copy()
    hltb = hltb.sort_values(['game_game_id', 'platform_platform'], kind='stable').drop_duplicates('game_game_id')
    hltb['order'] = hltb['game_game_name'].map(lambda t: hashlib.sha256(title_key(t).encode()).hexdigest())
    hltb = hltb.sort_values('order', kind='stable').head(HLTB_SAMPLE)
    for _, row in hltb.iterrows():
        title = clean(row.get('game_game_name'))
        reviews = float(pd.to_numeric(pd.Series([row.get('game_count_review')]), errors='coerce').iloc[0])
        score = float(pd.to_numeric(pd.Series([row.get('game_review_score')]), errors='coerce').iloc[0])
        score = score / 10.0 if np.isfinite(score) and np.isfinite(reviews) and reviews >= 5 and 0 < score <= 100 else None
        doc = ' '.join(clean(row.get(c)) for c in ('game_profile_summary', 'game_profile_genre', 'game_profile_dev', 'game_profile_pub'))
        docs.append(dict(title=title, source='hltb', score=score, text=title + '. ' + doc))
    for d in docs:
        d['bucket'] = split_bucket(d['title'])
        d['label'] = None if d['score'] is None else (0 if d['score'] < 6 else 1 if d['score'] <= 7.5 else 2)
    audit = dict(sources=sources, docs=len(docs), scored=sum(d['label'] is not None for d in docs),
                 hltb_sample=HLTB_SAMPLE, hltb_policy='deterministic SHA256-title-ordered subset; one row per game_game_id',
                 split='SHA256(normalized title)[:8] hex mod 10; buckets 0-5 train, 6-7 validation, 8-9 test',
                 score_policy='TMDB vote_average (0-10) with vote_count>=5; HLTB game_review_score/10 with game_count_review>=5; buckets low<6, mid 6-7.5, high>7.5')
    return docs, audit


def synthetic_events(rng, n_users=300, n_items=400, days=60):
    items = [(('game' if i % 2 else 'screen') + ':item%03d' % i, float(rng.random())) for i in range(n_items)]
    events = []
    base = 1704067200000  # 2024-01-01 in ms
    for u in range(n_users):
        user = 'synthetic:%03d' % u
        pref_game = float(rng.random())
        for it, quality in items:
            if rng.random() > 0.08:
                continue
            dom = it.split(':')[0]
            affinity = pref_game if dom == 'game' else 1 - pref_game
            p = 0.15 + 0.6 * affinity * quality + 0.2 * quality
            rating = 5 if rng.random() < p else (1 if rng.random() < 0.5 else 3)
            day = int(rng.integers(0, days))
            events.append(dict(user_id=user, item_id=it, rating=float(rating),
                               timestamp=base + day * 86400000 + int(rng.integers(0, 86400000))))
    return events, dict(note='synthetic local test', users=n_users, items=n_items)


def synthetic_corpus(rng, n=1200):
    game_words = 'space shooter loot online boss raid squad competitive arena'.split()
    movie_words = 'family drama romance wedding love story musical comedy'.split()
    docs = []
    for i in range(n):
        words = game_words if i % 2 else movie_words
        k = int(rng.integers(10, 30))
        toks = rng.choice(words, size=k).tolist()
        text = ' '.join(toks) + ' title%04d' % i
        frac = float(np.mean([w in game_words for w in toks]))
        score = 6.0 + (3.0 if i % 2 else -3.0) * (frac if i % 2 else 1 - frac) * 0 + (3.0 if i % 2 else -2.0) + float(rng.normal(0, .5))
        score = float(np.clip(score, 1, 10))
        docs.append(dict(title='title%04d' % i, source='synthetic_game' if i % 2 else 'synthetic_movie',
                         score=score, text=text, bucket=int(rng.integers(0, 10)),
                         label=0 if score < 6 else 1 if score <= 7.5 else 2))
    return docs, dict(note='synthetic local test', docs=n)


# ---------------------------------------------------------------- tokenizer

class Tokenizer:
    def __init__(self):
        self.vocab = {'<pad>': 0, '<unk>': 1}

    def fit(self, texts, min_df=2, cap=8000):
        cnt = Counter()
        for t in texts:
            cnt.update(set(text_key(t).split()))
        words = sorted(((w, c) for w, c in cnt.items() if c >= min_df), key=lambda wc: (-wc[1], wc[0]))
        for w, _ in words[:cap]:
            self.vocab[w] = len(self.vocab)
        return self

    def encode(self, text, L=MAX_TOKENS):
        ids = [self.vocab.get(w, 1) for w in text_key(text).split()][:L]
        return np.array(ids + [0] * (L - len(ids)), dtype=np.int64)

    def encode_many(self, texts, L=MAX_TOKENS):
        return np.stack([self.encode(t, L) for t in texts])


# ---------------------------------------------------------------- TextCNN

class TextCNN:
    """Kim-style 1D CNN over token embeddings with max-over-time pooling and a
    linear score-bucket head. Pure NumPy forward/backward."""

    def __init__(self, vocab, de=24, sizes=(3, 4, 5), nf=16, classes=3, seed=SEED, dt=np.float32):
        rng = np.random.default_rng(seed)
        self.de, self.sizes, self.nf, self.classes = de, sizes, nf, classes
        self.E = rng.normal(0, 0.1, (vocab, de)).astype(dt)
        self.W = [(rng.normal(0, 1, (nf, k, de)) / np.sqrt(k * de)).astype(dt) for k in sizes]
        self.cb = [np.zeros(nf, dt) for _ in sizes]
        self.Wh = (rng.normal(0, 1, (nf * len(sizes), classes)) / np.sqrt(nf * len(sizes))).astype(dt)
        self.bh = np.zeros(classes, dt)

    def params(self):
        return [self.E] + list(self.W) + list(self.cb) + [self.Wh, self.bh]

    def forward(self, x):
        B, L = x.shape
        emb = self.E[x]
        zs = []; cache = []
        for W, b in zip(self.W, self.cb):
            k = W.shape[1]; P = L - k + 1
            cols = np.stack([emb[:, i:i + P, :] for i in range(k)], axis=2).reshape(B * P, k * self.de)
            out = (cols @ W.reshape(self.nf, k * self.de).T + b).reshape(B, P, self.nf)
            act = np.maximum(out, 0)
            zs.append(act.max(axis=1))
            cache.append((cols, W, act, act.argmax(axis=1)))
        z = np.concatenate(zs, axis=1)
        logits = z @ self.Wh + self.bh
        return logits, z, cache, emb

    def loss_grads(self, x, y):
        B, L = x.shape
        logits, z, cache, emb = self.forward(x)
        p = np.exp(logits - logits.max(-1, keepdims=True)); p /= p.sum(-1, keepdims=True)
        loss = float(-np.log(p[np.arange(B), y] + 1e-12).mean())
        dlogits = p; dlogits[np.arange(B), y] -= 1; dlogits /= B
        gWh = z.T @ dlogits; gbh = dlogits.sum(0)
        dz = dlogits @ self.Wh.T
        gE = np.zeros_like(self.E); gW = []; gcb = []
        rows = np.arange(B)[:, None]; cols_nf = np.arange(self.nf)[None, :]
        for s, (cols, W, act, am) in enumerate(cache):
            k = W.shape[1]; P = act.shape[1]
            dm = dz[:, s * self.nf:(s + 1) * self.nf]
            dpool = np.zeros((B, P, self.nf), dz.dtype)
            dpool[rows, am, cols_nf] = dm
            dout = dpool * (act > 0)
            dout2 = dout.reshape(B * P, self.nf)
            gW.append((dout2.T @ cols).reshape(self.nf, k, self.de))
            gcb.append(dout2.sum(0))
            dcols = (dout2 @ W.reshape(self.nf, k * self.de)).reshape(B, P, k, self.de)
            demb = np.zeros_like(emb)
            for i in range(k):
                demb[:, i:i + P, :] += dcols[:, :, i, :]
            np.add.at(gE, x.ravel(), demb.reshape(B * L, self.de))
        return loss, [gE] + gW + gcb + [gWh, gbh]

    def fit(self, X, y, Xv, yv, epochs=20, batch=64, lr=0.02, seed=SEED):
        rng = np.random.default_rng(seed)
        opt = Adam(self.params(), lr=lr)
        history = []
        n = len(X)
        for ep in range(epochs):
            order = rng.permutation(n)
            total = 0.0
            for i in range(0, n, batch):
                idx = order[i:i + batch]
                loss, grads = self.loss_grads(X[idx], y[idx])
                opt.step(grads)
                total += loss * len(idx)
            acc = self.accuracy(Xv, yv)
            history.append(dict(epoch=ep, train_loss=round(total / n, 6), val_accuracy=round(acc, 6)))
            print('CNN epoch', ep, 'loss %.4f' % (total / n), 'val_acc %.4f' % acc, flush=True)
        return history

    def predict(self, X, batch=512):
        out = []
        for i in range(0, len(X), batch):
            logits, _, _, _ = self.forward(X[i:i + batch])
            out.append(logits.argmax(-1))
        return np.concatenate(out)

    def accuracy(self, X, y):
        return float((self.predict(X) == y).mean())

    def embed(self, X, batch=512):
        out = []
        for i in range(0, len(X), batch):
            _, z, _, _ = self.forward(X[i:i + batch])
            out.append(z)
        z = np.concatenate(out).astype(np.float32)
        return z / np.maximum(np.linalg.norm(z, axis=1, keepdims=True), 1e-12)


def macro_f1(y, p, classes=3):
    f1s = []
    for c in range(classes):
        tp = float(((p == c) & (y == c)).sum()); fp = float(((p == c) & (y != c)).sum()); fn = float(((p != c) & (y == c)).sum())
        f1s.append(2 * tp / max(2 * tp + fp + fn, 1))
    return float(np.mean(f1s))


# ---------------------------------------------------------------- mini GPT

def ln_fwd(x, g, b, eps=1e-5):
    mu = x.mean(-1, keepdims=True); var = ((x - mu) ** 2).mean(-1, keepdims=True)
    s = 1.0 / np.sqrt(var + eps)
    return (x - mu) * s * g + b, (x - mu, s, g)


def ln_bwd(dy, cache):
    u, s, g = cache
    N = u.shape[-1]
    gdy = g * dy
    dg = (dy * u * s).sum((0, 1)); db = dy.sum((0, 1))
    dx = (s / N) * (N * gdy - gdy.sum(-1, keepdims=True) - u * (s * s) * (gdy * u).sum(-1, keepdims=True))
    return dx, dg, db


def gelu(x):
    return 0.5 * x * (1 + np.tanh(0.7978845608 * (x + 0.044715 * x ** 3)))


def gelu_grad(x):
    inner = 0.7978845608 * (x + 0.044715 * x ** 3)
    t = np.tanh(inner)
    return 0.5 * (1 + t) + 0.5 * x * (1 - t ** 2) * 0.7978845608 * (1 + 3 * 0.044715 * x ** 2)


def softmax(z, axis=-1):
    z = z - z.max(axis=axis, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=axis, keepdims=True)


class MiniGPT:
    """Small decoder-only transformer (GPT-style causal LM) in pure NumPy."""

    def __init__(self, vocab, L=MAX_TOKENS, d=48, heads=2, layers=2, ff=96, seed=SEED, dt=np.float32):
        rng = np.random.default_rng(seed)
        self.L, self.d, self.H, self.layers_n, self.ff = L, d, heads, layers, ff
        self.dh = d // heads
        self.tok = rng.normal(0, 0.05, (vocab, d)).astype(dt)
        self.pos = rng.normal(0, 0.02, (L, d)).astype(dt)
        self.layers = []
        for _ in range(layers):
            self.layers.append(dict(
                g1=np.ones(d, dt), b1=np.zeros(d, dt),
                Wq=(rng.normal(0, 1, (d, d)) / np.sqrt(d)).astype(dt),
                Wk=(rng.normal(0, 1, (d, d)) / np.sqrt(d)).astype(dt),
                Wv=(rng.normal(0, 1, (d, d)) / np.sqrt(d)).astype(dt),
                Wo=(rng.normal(0, 1, (d, d)) / np.sqrt(d)).astype(dt),
                g2=np.ones(d, dt), b2=np.zeros(d, dt),
                W1=(rng.normal(0, 1, (d, ff)) / np.sqrt(d)).astype(dt),
                bf1=np.zeros(ff, dt),
                W2=(rng.normal(0, 1, (ff, d)) / np.sqrt(ff)).astype(dt),
                bf2=np.zeros(d, dt)))
        self.gf = np.ones(d, dt); self.bf = np.zeros(d, dt)
        self.head = rng.normal(0, 0.05, (d, vocab)).astype(dt)

    def params(self):
        ps = [self.tok, self.pos]
        for l in self.layers:
            ps += [l[k] for k in ('g1', 'b1', 'Wq', 'Wk', 'Wv', 'Wo', 'g2', 'b2', 'W1', 'bf1', 'W2', 'bf2')]
        ps += [self.gf, self.bf, self.head]
        return ps

    def forward(self, x):
        B, L = x.shape
        H, dh = self.H, self.dh
        mask = np.triu(np.full((L, L), -1e9, np.float32), k=1)
        h = self.tok[x] + self.pos[None, :, :]
        caches = []
        for l in self.layers:
            a, c1 = ln_fwd(h, l['g1'], l['b1'])
            q = (a @ l['Wq']).reshape(B, L, H, dh).transpose(0, 2, 1, 3)
            k = (a @ l['Wk']).reshape(B, L, H, dh).transpose(0, 2, 1, 3)
            v = (a @ l['Wv']).reshape(B, L, H, dh).transpose(0, 2, 1, 3)
            scores = q @ k.transpose(0, 1, 3, 2) / np.sqrt(dh) + mask[None, None]
            attn = softmax(scores, -1)
            ctx = (attn @ v).transpose(0, 2, 1, 3).reshape(B, L, self.d)
            out = ctx @ l['Wo']
            h1 = h + out
            a2, c2 = ln_fwd(h1, l['g2'], l['b2'])
            pre = a2 @ l['W1'] + l['bf1']
            f = gelu(pre)
            h2 = h1 + f @ l['W2'] + l['bf2']
            caches.append((c1, a, q, k, v, attn, ctx, c2, a2, pre, f))
            h = h2
        hf, cf = ln_fwd(h, self.gf, self.bf)
        logits = hf @ self.head
        return logits, (h, hf, caches, cf, x)

    def loss_grads(self, x):
        B, L = x.shape
        V = self.head.shape[1]
        logits, (h, hf, caches, cf, _) = self.forward(x)
        targets = np.concatenate([x[:, 1:], np.zeros((B, 1), np.int64)], axis=1)
        p = softmax(logits, -1)
        flat_p = p.reshape(B * L, V)
        loss = float(-np.log(flat_p[np.arange(B * L), targets.reshape(-1)] + 1e-12).mean())
        dlogits = p.copy()
        dlogits.reshape(B * L, V)[np.arange(B * L), targets.reshape(-1)] -= 1
        dlogits /= B * L
        ghead = hf.reshape(-1, self.d).T @ dlogits.reshape(-1, V)
        dh = dlogits.reshape(B, L, V) @ self.head.T
        dh, dgf, dbf = ln_bwd(dh, cf)
        layer_grads = []
        for li in range(self.layers_n - 1, -1, -1):
            l = self.layers[li]
            c1, a, q, k, v, attn, ctx, c2, a2, pre, f = caches[li]
            # FFN branch (h2 = h1 + f @ W2 + bf2)
            df2 = dh
            gW2 = f.reshape(-1, self.ff).T @ df2.reshape(-1, self.d)
            gbf2 = df2.sum((0, 1))
            dpre = (df2 @ l['W2'].T) * gelu_grad(pre)
            gW1 = a2.reshape(-1, self.d).T @ dpre.reshape(-1, self.ff)
            gbf1 = dpre.sum((0, 1))
            da2 = dpre @ l['W1'].T
            dx2, dg2, db2 = ln_bwd(da2, c2)
            dh1 = dh + dx2
            # attention branch (h1 = h + ctx @ Wo)
            dout = dh1
            gWo = ctx.reshape(-1, self.d).T @ dout.reshape(-1, self.d)
            dctx = (dout @ l['Wo'].T).reshape(B, L, self.H, self.dh).transpose(0, 2, 1, 3)
            dv = attn.transpose(0, 1, 3, 2) @ dctx
            dattn = dctx @ v.transpose(0, 1, 3, 2)
            dscores = attn * (dattn - (dattn * attn).sum(-1, keepdims=True)) / np.sqrt(self.dh)
            dq = (dscores @ k).transpose(0, 2, 1, 3).reshape(B, L, self.d)
            dk = (dscores.transpose(0, 1, 3, 2) @ q).transpose(0, 2, 1, 3).reshape(B, L, self.d)
            dv = dv.transpose(0, 2, 1, 3).reshape(B, L, self.d)
            da = dq @ l['Wq'].T + dk @ l['Wk'].T + dv @ l['Wv'].T
            gWq = a.reshape(-1, self.d).T @ dq.reshape(-1, self.d)
            gWk = a.reshape(-1, self.d).T @ dk.reshape(-1, self.d)
            gWv = a.reshape(-1, self.d).T @ dv.reshape(-1, self.d)
            da_ln = ln_bwd(da, c1)
            dh = dh1 + da_ln[0]
            layer_grads.append((da_ln[1], da_ln[2], gWq, gWk, gWv, gWo, dg2, db2, gW1, gbf1, gW2, gbf2))
        layer_grads.reverse()
        gtok = np.zeros_like(self.tok)
        np.add.at(gtok, x.ravel(), dh.reshape(B * L, self.d))
        gpos = dh.sum(0)
        grads = [gtok, gpos]
        for g in layer_grads:
            grads += list(g)
        grads += [dgf, dbf, ghead]
        return loss, grads

    def nll(self, X, batch=64):
        L = X.shape[1]
        V = self.head.shape[1]
        total = 0.0; count = 0
        for i in range(0, len(X), batch):
            x = X[i:i + batch]
            b = len(x)
            logits, _ = self.forward(x)
            targets = np.concatenate([x[:, 1:], np.zeros((b, 1), np.int64)], axis=1)
            p = softmax(logits, -1)
            total += float(-np.log(p.reshape(b * L, V)[np.arange(b * L), targets.reshape(-1)] + 1e-12).sum())
            count += b * L
        return total / max(count, 1)

    def fit(self, X, Xv, steps=1500, batch=16, lr=0.005, seed=SEED, log_every=250):
        rng = np.random.default_rng(seed)
        opt = Adam(self.params(), lr=lr)
        history = []
        n = len(X)
        for s in range(steps):
            idx = rng.integers(0, n, size=batch)
            loss, grads = self.loss_grads(X[idx])
            opt.step(grads)
            if (s + 1) % log_every == 0:
                ppl = math.exp(self.nll(Xv[:256]))
                history.append(dict(step=s + 1, train_loss=round(loss, 6), val_perplexity=round(ppl, 4)))
                print('GPT step', s + 1, 'loss %.4f' % loss, 'val_ppl %.2f' % ppl, flush=True)
        return history

    def embed(self, X, batch=128):
        out = []
        for i in range(0, len(X), batch):
            _, (h, _, _, _, _) = self.forward(X[i:i + batch])
            out.append(h.mean(axis=1))
        z = np.concatenate(out).astype(np.float32)
        return z / np.maximum(np.linalg.norm(z, axis=1, keepdims=True), 1e-12)


def unigram_perplexity(train_texts, val_texts, L=MAX_TOKENS):
    cnt = Counter(); total = 0
    for t in train_texts:
        ws = text_key(t).split()[:L]
        cnt.update(ws); total += len(ws)
    V = len(cnt) + 1
    logp = {w: math.log((c + 1) / (total + V)) for w, c in cnt.items()}
    default = math.log(1.0 / (total + V))
    nll = 0.0; n = 0
    for t in val_texts:
        for w in text_key(t).split()[:L]:
            nll -= logp.get(w, default); n += 1
    return math.exp(nll / max(n, 1))


def svd_encoder(train_texts, all_texts, dim=64):
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.decomposition import TruncatedSVD
    tf = TfidfVectorizer(stop_words='english', ngram_range=(1, 2), max_features=20000, min_df=2, sublinear_tf=True)
    Xtr = tf.fit_transform(train_texts)
    svd = TruncatedSVD(n_components=dim, n_iter=5, random_state=SEED)
    svd.fit(Xtr)
    Z = svd.transform(tf.transform(all_texts))
    Z = Z / np.maximum(np.linalg.norm(Z, axis=1, keepdims=True), 1e-12)
    return Z.astype(np.float32), float(svd.explained_variance_ratio_.sum()), len(tf.vocabulary_)


# ---------------------------------------------------------------- preference classifier

def build_stats(train, dim=16, epochs=30):
    from distran_ml.baseline import fit
    users = sorted({e['user_id'] for e in train})
    items = sorted({e['item_id'] for e in train})
    ui = {u: i for i, u in enumerate(users)}; ii = {x: j for j, x in enumerate(items)}
    i_pos = Counter(); i_cnt = Counter(); i_sum = defaultdict(float); i_last = {}
    u_cnt = Counter(); u_pos = Counter(); u_last = {}; u_dom = defaultdict(Counter)
    for e in train:
        r = e['rating']; u = e['user_id']; it = e['item_id']; t = e['timestamp']; d = it.split(':')[0]
        i_cnt[it] += 1; i_sum[it] += r; i_pos[it] += int(r >= 4); i_last[it] = max(i_last.get(it, 0), t)
        u_cnt[u] += 1; u_pos[u] += int(r >= 4); u_last[u] = max(u_last.get(u, 0), t); u_dom[u][d] += int(r >= 4)
    max_t = max(e['timestamp'] for e in train)
    pop_sorted = np.sort(np.array([i_pos[i] for i in items], dtype=float))
    i_vec = np.zeros((len(items), 5), np.float32)
    for j, it in enumerate(items):
        dom = it.split(':')[0]
        age_days = max(0.0, (max_t - i_last.get(it, max_t)) / 86400000.0)
        i_vec[j] = [np.searchsorted(pop_sorted, i_pos[it], side='right') / len(pop_sorted),
                    (i_sum[it] / i_cnt[it]) / 5.0,
                    1.0 if dom == 'game' else 0.0, 1.0 if dom == 'screen' else 0.0,
                    2.0 ** (-age_days / 90.0)]
    max_cnt = max(u_cnt.values())
    u_vec = np.zeros((len(users), 5), np.float32)
    aff = np.zeros((len(users), 2), np.float32)
    for i, u in enumerate(users):
        tot_pos = max(1, u_pos[u])
        aff[i] = [u_dom[u]['game'] / tot_pos, u_dom[u]['screen'] / tot_pos]
        u_vec[i] = [math.log1p(u_cnt[u]) / math.log1p(max_cnt), u_pos[u] / u_cnt[u],
                    aff[i, 0], aff[i, 1],
                    2.0 ** (-max(0.0, (max_t - u_last.get(u, max_t)) / 86400000.0) / 30.0)]
    print('Fitting BPR item factors on train for the collaborative feature', flush=True)
    b_users, b_items, U, V = fit(train, dim=dim, epochs=epochs, seed=SEED)
    assert b_users == users and b_items == items
    collab_pct = np.zeros((len(users), len(items)), np.float32)
    for i in range(len(users)):
        row = U[i] @ V.T
        collab_pct[i] = np.searchsorted(np.sort(row), row, side='right') / len(row)
    # Cold items (present only in validation/test) get a neutral item vector:
    # zero popularity, global mean quality, domain one-hots, no recency, median collab.
    cold_quality = float(np.mean([i_sum[i] / i_cnt[i] for i in items]) / 5.0)
    return dict(users=users, items=items, ui=ui, ii=ii, i_vec=i_vec, u_vec=u_vec, aff=aff,
                collab_pct=collab_pct, u_cnt=u_cnt, cold_quality=cold_quality)


def user_item_matrix(stats, i):
    """Feature matrix over all items for user index i (n_items x len(FEATURES))."""
    X = np.empty((len(stats['items']), len(FEATURES)), np.float32)
    X[:, :5] = stats['i_vec']
    X[:, 5:10] = stats['u_vec'][i]
    X[:, 10] = stats['aff'][i, 0] * stats['i_vec'][:, 2]
    X[:, 11] = stats['aff'][i, 1] * stats['i_vec'][:, 3]
    X[:, 12] = stats['collab_pct'][i]
    return X


def cold_i_vec(it, quality):
    dom = it.split(':')[0]
    return np.array([0.0, quality, 1.0 if dom == 'game' else 0.0,
                     1.0 if dom == 'screen' else 0.0, 0.0], np.float32)


def event_features(stats, u, it):
    i = stats['ui'][u]; j = stats['ii'].get(it)
    iv = stats['i_vec'][j] if j is not None else cold_i_vec(it, stats['cold_quality'])
    collab = stats['collab_pct'][i, j] if j is not None else 0.5
    return np.concatenate([iv, stats['u_vec'][i],
                           [stats['aff'][i, 0] * iv[2], stats['aff'][i, 1] * iv[3], collab]]).astype(np.float32)


def score_rows(stats, theta, b, state=None):
    rows = {}
    for i, u in enumerate(stats['users']):
        delta, bu = (state or {}).get(u, (np.zeros(len(FEATURES), np.float32), 0.0))
        rows[u] = sigmoid(b + bu + user_item_matrix(stats, i) @ (theta + delta)).astype(np.float32)
    return rows


def train_shared_theta(train, stats, epochs=6, neg_per_user=5, lr=0.01, seed=SEED):
    rng = np.random.default_rng(seed)
    seen = defaultdict(set)
    for e in train:
        seen[e['user_id']].add(e['item_id'])
    Xs = []; ys = []
    for e in train:
        Xs.append(event_features(stats, e['user_id'], e['item_id']))
        ys.append(1.0 if e['rating'] >= 4 else 0.0)
    items = stats['items']
    for u in stats['users']:
        negs = [it for it in items if it not in seen[u]]
        if not negs:
            continue
        for it in rng.choice(negs, size=min(neg_per_user, len(negs)), replace=False):
            Xs.append(event_features(stats, u, it)); ys.append(0.0)
    X = np.stack(Xs); y = np.array(ys, np.float32)
    theta = np.zeros(len(FEATURES), np.float32); b = np.array(0.0, dtype=np.float32)
    opt = Adam([theta, b], lr=lr)
    n = len(X)
    for ep in range(epochs):
        order = rng.permutation(n)
        total = 0.0
        for i in range(0, n, 512):
            idx = order[i:i + 512]
            p = sigmoid(b + X[idx] @ theta)
            g = (X[idx].T @ (p - y[idx]) / len(idx)).astype(np.float32)
            gb = np.array(float((p - y[idx]).mean()), dtype=np.float32)
            opt.step([g, gb])
            total += float(-(y[idx] * np.log(p + 1e-12) + (1 - y[idx]) * np.log(1 - p + 1e-12)).mean()) * len(idx)
        print('shared theta epoch', ep, 'logloss %.4f' % (total / n), flush=True)
    return theta, float(b)


def replay(events, stats, theta, b, lr_u, reg_u, state=None):
    """Chronological predict-before-learn replay of the per-user residual.

    p(u,i,c) = sigmoid(b + b_u + (theta + delta_u) . x); after each event
    delta_u += lr_u * clip_norm((y - p) * x) - lr_u * reg_u * delta_u.
    """
    state = dict(state or {})
    preds = []
    for e in sorted(events, key=lambda e: e['timestamp']):
        u = e['user_id']
        if u not in stats['ui']:  # validation/test-only user: neutral profile
            x = np.concatenate([cold_i_vec(e['item_id'], stats['cold_quality']),
                                np.zeros(5, np.float32),
                                [0.0, 0.0, 0.5]]).astype(np.float32)
        else:
            x = event_features(stats, u, e['item_id'])
        delta, bu = state.get(u, (np.zeros(len(FEATURES), np.float32), 0.0))
        p = float(sigmoid(b + bu + (theta + delta) @ x))
        preds.append(dict(user_id=u, item_id=e['item_id'], rating=e['rating'], p=p))
        y = 1.0 if e['rating'] >= 4 else 0.0
        upd = lr_u * (y - p) * x
        norm = float(np.linalg.norm(upd))
        if norm > 1.0:
            upd = upd / norm
        delta = np.clip(delta + upd - lr_u * reg_u * delta, -10, 10)
        bu = float(np.clip(bu + lr_u * (y - p), -10, 10))
        state[u] = (delta, bu)
    return preds, state


def pointwise(preds):
    y = np.array([1.0 if p['rating'] >= 4 else 0.0 for p in preds])
    q = np.array([p['p'] for p in preds])
    eps = 1e-12
    logloss = float(-(y * np.log(q + eps) + (1 - y) * np.log(1 - q + eps)).mean())
    brier = float(((y - q) ** 2).mean())
    bins = []
    edges = np.linspace(0, 1, 11)
    for lo, hi in zip(edges[:-1], edges[1:]):
        m = (q >= lo) & (q < hi) if hi < 1 else (q >= lo) & (q <= hi)
        if m.sum():
            bins.append(dict(range=[float(lo), float(hi)], n=int(m.sum()),
                             mean_pred=round(float(q[m].mean()), 4), observed=round(float(y[m].mean()), 4)))
    return dict(logloss=round(logloss, 6), brier=round(brier, 6), n=len(preds), calibration=bins)


def rank_eval(score_fn, stats, train, heldout, domain=None, source=None, k=10, seed=SEED):
    users, items = stats['users'], stats['items']
    ii = stats['ii']
    seen = defaultdict(set); relevant = defaultdict(set); positive_domains = defaultdict(set)
    for e in train:
        seen[e['user_id']].add(e['item_id'])
        if e['rating'] >= 4:
            positive_domains[e['user_id']].add(e['item_id'].split(':')[0])
    for e in heldout:
        if e['rating'] >= 4 and (domain is None or e['item_id'].startswith(domain + ':')):
            relevant[e['user_id']].add(e['item_id'])
    domain_mask = np.ones(len(items), bool) if domain is None else np.array([x.startswith(domain + ':') for x in items])
    rows = []; recommended = set()
    item_set = set(items)
    cold_users = 0; cold_item_positives = 0
    for u, truth in relevant.items():
        cold_item_positives += len(truth - item_set)
        if source and source not in positive_domains[u]:
            continue
        if u not in stats['ui']:
            cold_users += 1
            continue
        truth = (truth & item_set) - seen[u]
        if not truth:
            continue
        scores = score_fn(u)
        mask = domain_mask.copy()
        if seen[u]:
            mask[[ii[x] for x in seen[u]]] = False
        candidates = np.nonzero(mask)[0]
        ranked = candidates[np.argsort(-scores[candidates], kind='stable')[:k]]
        recommended.update(items[j] for j in ranked)
        hits = np.array([items[j] in truth for j in ranked], dtype=float)
        recall = float(hits.sum() / len(truth))
        ideal = sum(1 / np.log2(r + 2) for r in range(min(k, len(truth))))
        ndcg = float(sum(h / np.log2(r + 2) for r, h in enumerate(hits)) / ideal)
        rows.append((recall, ndcg))
    a = np.array(rows)
    metrics = dict(evaluated_users=len(rows), positive_heldout_users=len(relevant), cold_heldout_users=cold_users,
                   cold_item_positives=cold_item_positives, k=k,
                   ranking='full train catalog, exclude all training interactions',
                   catalog_coverage=len(recommended) / max(1, int(domain_mask.sum())))
    for j, key in enumerate(['recall_at_10', 'ndcg_at_10']):
        metrics[key] = float(a[:, j].mean()) if len(rows) else None
        if len(rows):
            rng = np.random.default_rng(seed)
            boots = [float(a[rng.integers(0, len(a), len(a)), j].mean()) for _ in range(400)]
            metrics[key + '_ci95'] = [round(float(x), 6) for x in np.quantile(boots, [.025, .975])]
    return metrics


COHORTS = [('all', None, None), ('game', 'game', None), ('screen', 'screen', None),
           ('game_to_screen', 'screen', 'game'), ('screen_to_game', 'game', 'screen')]


def evaluate_models(models, stats, train, heldout):
    results = {}
    for name, fn in models.items():
        results[name] = {cohort: rank_eval(fn, stats, train, heldout, domain, source)
                         for cohort, domain, source in COHORTS}
        print('Evaluated', name, flush=True)
    return results


# ---------------------------------------------------------------- staged run

def _load_ctx(root):
    import pickle
    cache = root / 'cache'; cache.mkdir(exist_ok=True, parents=True)
    ckpt = cache / 'checkpoint.json'
    done = set(json.loads(ckpt.read_text())['done']) if ckpt.exists() else set()
    ctx = {}
    pkl = cache / 'ctx.pkl'
    if pkl.exists():
        ctx = pickle.loads(pkl.read_bytes())
    return cache, done, ctx


def _save_ctx(cache, done, ctx):
    import pickle
    (cache / 'ctx.pkl').write_bytes(pickle.dumps(ctx))
    (cache / 'checkpoint.json').write_text(json.dumps({'version': MODULE_VERSION, 'done': sorted(done)}))


def run(root=Path('/content/distran-adaptive')):
    """Staged, checkpointed run: each stage persists to root/cache so an
    interrupted Colab cell can resume on the next `colab exec` call."""
    started = time.time()
    root = Path(root); output = root / 'artifacts'; output.mkdir(exist_ok=True, parents=True)
    local_test = os.environ.get('ADAPTIVE_LOCAL_TEST') == '1'
    cache, done, ctx = _load_ctx(root)
    # invalidate checkpoints written by older module versions
    done.discard('encoders')
    if cache.joinpath('checkpoint.json').exists():
        try:
            old_version = json.loads(cache.joinpath('checkpoint.json').read_text()).get('version')
        except Exception:
            old_version = None
        if old_version != MODULE_VERSION:
            for k in ('grid', 'test', 'export'):
                done.discard(k)
            if old_version is None or old_version < 2:
                for k in ('stats', 'theta'):
                    done.discard(k)
    rng = np.random.default_rng(SEED)

    def stage(name):
        if name in done:
            print('stage', name, 'cached', flush=True)
            return False
        print('stage', name, 'running', flush=True)
        return True

    if local_test:
        catalog = [dict(id='synthetic-%02d' % i, title='title%04d' % (i * 37 % 1200),
                        medium='game' if i % 2 else 'movie',
                        description='synthetic work description number %d with some words' % i,
                        tags=['a', 'b'], maker='studio') for i in range(12)]
        (root / 'catalog-metadata.json').write_text(json.dumps(catalog))
    else:
        catalog = json.loads((root / 'catalog-metadata.json').read_text())
    v2 = json.loads((root / 'catalog-model-v2.json').read_text()) if (root / 'catalog-model-v2.json').exists() else None

    # stage 1/2: Amazon download and parse
    if local_test:
        if stage('parse_amazon'):
            ctx['events'], ctx['event_audit'] = synthetic_events(rng)
            from distran_ml.baseline import temporal_split
            ctx['train'], ctx['val'], ctx['test'] = temporal_split(ctx['events'])
            print('Split', len(ctx['train']), len(ctx['val']), len(ctx['test']), flush=True)
            done.add('parse_amazon'); _save_ctx(cache, done, ctx)
    else:
      if stage('dl_amazon'):
        salt = os.urandom(32)
        sources = []
        for category in ('Video_Games', 'Movies_and_TV'):
            path = root / (category + '.csv.gz'); url = AMAZON_BASE + path.name
            print('Downloading complete file:', category, flush=True)
            if not path.exists():
                with urllib.request.urlopen(url, timeout=180) as response, path.open('wb') as out:
                    while chunk := response.read(1024 * 1024):
                        out.write(chunk)
            sources.append(dict(url=url, sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                                bytes=path.stat().st_size))
        ctx['amazon_sources'] = sources; ctx['salt'] = salt
        done.add('dl_amazon'); _save_ctx(cache, done, ctx)
      if stage('parse_amazon'):
        events = []; user_sets = []
        for domain, category in [('game', 'Video_Games'), ('screen', 'Movies_and_TV')]:
            path = root / (category + '.csv.gz')
            users = set(); count = 0; kept = 0
            with gzip.open(path, 'rt') as stream:
                for row in csv.DictReader(stream):
                    count += 1; raw = row['user_id']; users.add(raw)
                    if int.from_bytes(hashlib.sha256(raw.encode()).digest()[:8], 'big') % 128:
                        continue
                    rating = float(row['rating']); timestamp = int(row['timestamp'])
                    if not np.isfinite(rating) or not 1 <= rating <= 5:
                        raise ValueError('Invalid rating')
                    user = hashlib.sha256(ctx['salt'] + raw.encode()).hexdigest()
                    events.append(dict(user_id=user, item_id=domain + ':' + row['parent_asin'],
                                       rating=rating, timestamp=timestamp)); kept += 1
            user_sets.append(users)
            ctx['amazon_sources'][[s['url'] for s in ctx['amazon_sources']].index(AMAZON_BASE + path.name)].update(
                rows=count, users=len(users), sampled_rows=kept)
            print(category, 'rows', count, 'sampled', kept, flush=True)
        overlap = len(user_sets[0] & user_sets[1]); del user_sets
        unique = {(e['user_id'], e['item_id'], e['timestamp']): e for e in events}
        ctx['events'] = list(unique.values())
        ctx['event_audit'] = dict(sources=ctx['amazon_sources'], full_file_overlap_users=overlap,
                                  duplicates_removed=len(events) - len(unique),
                                  sample='SHA256(source_user_id) first 8 bytes big endian modulo 128 == 0; complete file scans; no future-based user filtering',
                                  pseudonyms='Random per-run salt, not exported; sampled cohort deterministic, pseudonyms differ each run',
                                  limitations='Publisher 5-core selection uses complete history; screen combines movies and TV. Same sampling rule as notebook 03 so cohorts are comparable.')
        from distran_ml.baseline import temporal_split
        ctx['train'], ctx['val'], ctx['test'] = temporal_split(ctx['events'])
        print('Split', len(ctx['train']), len(ctx['val']), len(ctx['test']), flush=True)
        done.add('parse_amazon'); _save_ctx(cache, done, ctx)

    # stage 3/4: Kaggle corpus download and build
    if local_test:
        if stage('build_corpus'):
            ctx['docs'], ctx['corpus_audit'] = synthetic_corpus(rng)
            done.add('build_corpus'); _save_ctx(cache, done, ctx)
    else:
      if stage('dl_corpus'):
        import kagglehub
        ctx['kaggle_sources'] = {}
        for key, handle in KAGGLE.items():
            directory = Path(kagglehub.dataset_download(handle)); path = directory / KAGGLE_FILES[key]
            ctx['kaggle_sources'][key] = dict(handle=handle, file=path.name,
                                              sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                                              bytes=path.stat().st_size, resolved=str(directory))
            print('Kaggle', key, ctx['kaggle_sources'][key]['sha256'][:16], ctx['kaggle_sources'][key]['bytes'], flush=True)
        done.add('dl_corpus'); _save_ctx(cache, done, ctx)
      if stage('build_corpus'):
        import kagglehub
        import pandas as pd
        docs = []
        directory = Path(kagglehub.dataset_download(KAGGLE['movies']))
        raw = pd.read_csv(directory / KAGGLE_FILES['movies'], low_memory=False)
        ctx['kaggle_sources']['movies']['rows'] = len(raw)
        for _, row in raw.iterrows():
            title = clean(row.get('title'))
            if not title:
                continue
            votes = float(pd.to_numeric(pd.Series([row.get('vote_count')]), errors='coerce').iloc[0])
            score = float(pd.to_numeric(pd.Series([row.get('vote_average')]), errors='coerce').iloc[0])
            score = score if np.isfinite(score) and np.isfinite(votes) and votes >= 5 and 0 <= score <= 10 else None
            docs.append(dict(title=title, source='tmdb', score=score,
                             text=title + '. ' + clean(row.get('overview')) + ' language_' + clean(row.get('original_lang'))))
        directory = Path(kagglehub.dataset_download(KAGGLE['hltb']))
        hltb = pd.read_csv(directory / KAGGLE_FILES['hltb'], low_memory=False)
        ctx['kaggle_sources']['hltb']['rows'] = len(hltb)
        hltb = hltb[hltb['game_game_name'].notna()].copy()
        hltb = hltb.sort_values(['game_game_id', 'platform_platform'], kind='stable').drop_duplicates('game_game_id')
        hltb['order'] = hltb['game_game_name'].map(lambda t: hashlib.sha256(title_key(t).encode()).hexdigest())
        hltb = hltb.sort_values('order', kind='stable').head(HLTB_SAMPLE)
        for _, row in hltb.iterrows():
            title = clean(row.get('game_game_name'))
            reviews = float(pd.to_numeric(pd.Series([row.get('game_count_review')]), errors='coerce').iloc[0])
            score = float(pd.to_numeric(pd.Series([row.get('game_review_score')]), errors='coerce').iloc[0])
            score = score / 10.0 if np.isfinite(score) and np.isfinite(reviews) and reviews >= 5 and 0 < score <= 100 else None
            doc = ' '.join(clean(row.get(c)) for c in ('game_profile_summary', 'game_profile_genre', 'game_profile_dev', 'game_profile_pub'))
            docs.append(dict(title=title, source='hltb', score=score, text=title + '. ' + doc))
        for d in docs:
            d['bucket'] = split_bucket(d['title'])
            d['label'] = None if d['score'] is None else (0 if d['score'] < 6 else 1 if d['score'] <= 7.5 else 2)
        ctx['docs'] = docs
        ctx['corpus_audit'] = dict(sources=ctx['kaggle_sources'], docs=len(docs),
                                   scored=sum(d['label'] is not None for d in docs), hltb_sample=HLTB_SAMPLE,
                                   hltb_policy='deterministic SHA256-title-ordered subset; one row per game_game_id',
                                   split='SHA256(normalized title)[:8] hex mod 10; buckets 0-5 train, 6-7 validation, 8-9 test',
                                   score_policy='TMDB vote_average (0-10) with vote_count>=5; HLTB game_review_score/10 with game_count_review>=5; buckets low<6, mid 6-7.5, high>7.5')
        done.add('build_corpus'); _save_ctx(cache, done, ctx)

    docs = ctx['docs']; train, val, test = ctx['train'], ctx['val'], ctx['test']

    # stage 5a: tokenizer + TextCNN encoder
    if stage('cnn'):
        tok = Tokenizer().fit([d['text'] for d in docs if d['bucket'] < 6])
        X_all = tok.encode_many([d['text'] for d in docs])
        tr = [i for i, d in enumerate(docs) if d['bucket'] < 6]
        va = [i for i, d in enumerate(docs) if 6 <= d['bucket'] < 8]
        te = [i for i, d in enumerate(docs) if d['bucket'] >= 8]
        scored = lambda idxs: [i for i in idxs if docs[i]['label'] is not None]
        str_, sva, ste = scored(tr), scored(va), scored(te)
        print('corpus', len(docs), 'vocab', len(tok.vocab), 'scored', len(str_) + len(sva) + len(ste),
              'docs train/val/test', len(tr), len(va), len(te), flush=True)
        cnn = TextCNN(len(tok.vocab))
        ytr = np.array([docs[i]['label'] for i in str_]); yva = np.array([docs[i]['label'] for i in sva])
        yte = np.array([docs[i]['label'] for i in ste])
        cnn_hist = cnn.fit(X_all[str_], ytr, X_all[sva], yva, epochs=3 if local_test else 15)
        cnn_pred = cnn.predict(X_all[ste])
        cnn_report = dict(architecture='TextCNN: 24-d token embeddings, conv1d filter sizes 3/4/5 with 16 filters each, ReLU, max-over-time pooling, linear 3-class score-bucket head; NumPy Adam',
                          params=int(sum(p.size for p in cnn.params())), train_epochs=len(cnn_hist),
                          test_accuracy=round(cnn.accuracy(X_all[ste], yte), 6), test_macro_f1=round(macro_f1(yte, cnn_pred), 6),
                          majority_baseline=round(Counter(yte.tolist()).most_common(1)[0][1] / len(yte), 6),
                          history=cnn_hist[-3:])
        print('CNN test acc', cnn_report['test_accuracy'], 'f1', cnn_report['test_macro_f1'],
              'baseline', cnn_report['majority_baseline'], flush=True)
        ctx.update(tok=tok, X_all=X_all, tr=tr, va=va, te=te, str_=str_, sva=sva, ste=ste,
                   ytr=ytr, yva=yva, yte=yte, cnn=cnn, cnn_report=cnn_report)
        done.add('cnn'); _save_ctx(cache, done, ctx)

    # stage 5b: mini-GPT encoder
    if stage('gpt'):
        tok, X_all = ctx['tok'], ctx['X_all']
        tr, va = ctx['tr'], ctx['va']
        gpt = MiniGPT(len(tok.vocab))
        gpt_hist = gpt.fit(X_all[tr], X_all[va], steps=120 if local_test else 1200,
                           log_every=40 if local_test else 200)
        gpt_ppl = math.exp(gpt.nll(X_all[va]))
        uni_ppl = unigram_perplexity([docs[i]['text'] for i in tr], [docs[i]['text'] for i in va])
        gpt_report = dict(architecture='decoder-only transformer (GPT-style): d=48, 2 heads, 2 pre-LN blocks, ff=96, causal next-token LM over 48-token windows; NumPy Adam',
                          params=int(sum(p.size for p in gpt.params())), steps=gpt_hist[-1]['step'],
                          val_perplexity=round(gpt_ppl, 4), unigram_baseline_perplexity=round(uni_ppl, 4),
                          history=gpt_hist[-3:])
        print('GPT val ppl', gpt_report['val_perplexity'], 'unigram', gpt_report['unigram_baseline_perplexity'], flush=True)
        ctx.update(gpt=gpt, gpt_report=gpt_report)
        done.add('gpt'); _save_ctx(cache, done, ctx)

    # stage 5c: SVD baseline, corpus embeddings, curated-work probes
    if stage('compare'):
        tok, X_all = ctx['tok'], ctx['X_all']
        tr = ctx['tr']
        cnn, gpt = ctx['cnn'], ctx['gpt']
        Z_svd, svd_var, svd_vocab = svd_encoder([docs[i]['text'] for i in tr], [d['text'] for d in docs])
        Z_cnn = cnn.embed(X_all); Z_gpt = gpt.embed(X_all)
        sample = rng.choice(len(docs), size=min(2000, len(docs)), replace=False)
        agreement = {'cnn_gpt_mean_cosine': round(float((Z_cnn[sample] * Z_gpt[sample]).sum(1).mean()), 6)}
        curated_text = [' '.join([w['title'], clean(w.get('description')), ' '.join(w.get('tags', [])), clean(w.get('maker'))]) for w in catalog]
        Xc = tok.encode_many(curated_text)
        Zc_svd, _, _ = svd_encoder([docs[i]['text'] for i in tr], curated_text)
        P = {'cnn': cnn.embed(Xc), 'gpt': gpt.embed(Xc), 'svd': Zc_svd}
        if v2 is not None:
            Z = np.array(v2['vectors'], np.float32)
            P['svd_v2_app'] = Z / np.maximum(np.linalg.norm(Z, axis=1, keepdims=True), 1e-12)
        probes = {}
        for enc, Z in P.items():
            probes[enc] = [dict(seed=w['id'], neighbors=[catalog[j]['id'] for j in np.argsort(-(Z @ Z[n])) if j != n][:3])
                           for n, w in enumerate(catalog)]
        for i, a in enumerate(list(P)):
            for b in list(P)[i + 1:]:
                ja = [len(set(pa['neighbors']) & set(pb['neighbors'])) / max(1, len(set(pa['neighbors']) | set(pb['neighbors'])))
                      for pa, pb in zip(probes[a], probes[b])]
                agreement[f'probe_top3_jaccard_{a}_{b}'] = round(float(np.mean(ja)), 6)
        ctx.update(Z_svd=Z_svd, svd_var=svd_var, svd_vocab=svd_vocab, agreement=agreement, probes=probes)
        done.add('compare'); _save_ctx(cache, done, ctx)

    # stage 6: interaction feature stats + BPR collaborative feature
    if stage('stats'):
        ctx['stats'] = build_stats(train)
        done.add('stats'); _save_ctx(cache, done, ctx)

    # stage 7: shared logistic prior
    if stage('theta'):
        ctx['theta'], ctx['b'] = train_shared_theta(train, ctx['stats'])
        done.add('theta'); _save_ctx(cache, done, ctx)

    # stage 8: per-user residual hyperparameter selection on validation (logloss only;
    # one validation ranking for the selected point, to keep the stage bounded)
    if stage('grid'):
        stats = ctx['stats']; theta, b = ctx['theta'], ctx['b']
        grid = [(lr, reg) for lr in (0.05, 0.1) for reg in (0.0, 0.01)]
        validation = {}; best = None
        for lr_u, reg_u in grid:
            _, state = replay(train, stats, theta, b, lr_u, reg_u)
            vp, _ = replay(val, stats, theta, b, lr_u, reg_u, state=dict(state))
            pw = pointwise(vp)
            validation[f'lr={lr_u},reg={reg_u}'] = dict(logloss=pw['logloss'])
            print('adaptive grid', lr_u, reg_u, 'val logloss %.4f' % pw['logloss'], flush=True)
            if best is None or pw['logloss'] < validation[best]['logloss']:
                best = f'lr={lr_u},reg={reg_u}'
        ctx['validation'] = validation; ctx['best'] = best
        ctx['lr_u'], ctx['reg_u'] = (float(x.split('=')[1]) for x in best.split(','))
        _, ctx['state'] = replay(train, stats, theta, b, ctx['lr_u'], ctx['reg_u'])
        rows = score_rows(stats, theta, b, ctx['state'])
        ctx['validation'][best]['ndcg_at_10'] = rank_eval(lambda u: rows[u], stats, train, val)['ndcg_at_10']
        done.add('grid'); _save_ctx(cache, done, ctx)

    # stage 9: heldout test evaluation, once, after selection
    if stage('test'):
        stats = ctx['stats']; theta, b = ctx['theta'], ctx['b']; state = ctx['state']
        tp, _ = replay(test, stats, theta, b, ctx['lr_u'], ctx['reg_u'], state=dict(state))
        sp, _ = replay(test, stats, theta, b, 0.0, 0.0)
        tpw = pointwise(tp); spw = pointwise(sp)
        print('selected', ctx['best'], 'test logloss adaptive %.4f shared %.4f' % (tpw['logloss'], spw['logloss']), flush=True)
        fixed_theta = np.array([1.0, 0.8, 0.0, 0.0, 0.1, 0.2, 0.5, 0.0, 0.0, 0.1, 1.5, 1.5, 1.2], np.float32)
        fixed_rows = {u: sigmoid(-2.0 + user_item_matrix(stats, i) @ fixed_theta).astype(np.float32)
                      for i, u in enumerate(stats['users'])}
        shared_rows = score_rows(stats, theta, b)
        adaptive_rows = score_rows(stats, theta, b, state)
        pop_row = stats['i_vec'][:, 0]
        models = {
            'popularity': lambda u: pop_row,
            'bpr': lambda u: stats['collab_pct'][stats['ui'][u]],
            'fixed_linear_heuristic': lambda u: fixed_rows[u],
            'shared_logistic': lambda u: shared_rows[u],
            'adaptive': lambda u: adaptive_rows[u],
        }
        ctx['test_results'] = evaluate_models(models, stats, train, test)
        ctx['val_results'] = evaluate_models({'adaptive': lambda u: adaptive_rows[u]}, stats, train, val)
        ctx['tpw'] = tpw; ctx['spw'] = spw
        done.add('test'); _save_ctx(cache, done, ctx)

    # stage 10: safe exports, report, provenance, zip
    if stage('export'):
        stats = ctx['stats']; theta, b = ctx['theta'], ctx['b']; state = ctx['state']
        salt = os.urandom(32)
        deltas_export = {}
        for u, (delta, bu) in state.items():
            if stats['u_cnt'][u] >= 10:
                deltas_export[hashlib.sha256(salt + u.encode()).hexdigest()[:16]] = dict(
                    delta=[round(float(x), 6) for x in delta], b_u=round(bu, 6))
            if len(deltas_export) >= 5000:
                break
        coefficients = dict(schema=1, model_id=MODEL_ID, name=MODEL_NAME,
                            feature_schema=FEATURES, theta=[round(float(x), 6) for x in theta], intercept=round(b, 6),
                            selected=dict(lr_u=ctx['lr_u'], reg_u=ctx['reg_u'], criterion='validation logloss under predict-before-learn replay'),
                            update_rule='delta_u += lr_u * clip_norm((y - p) * x, 1) - lr_u * reg_u * delta_u; b_u += lr_u * (y - p); both clipped to [-10, 10]',
                            label_policy='rating >= 4 positive, rating <= 3 negative; unobserved items are sampled negatives for the shared prior only, never proven dislikes',
                            per_user_residuals=deltas_export,
                            status='research export; salted user keys; not promoted to the app')
        (output / 'adaptive-coefficients.json').write_text(json.dumps(coefficients, indent=2))
        np.savez_compressed(output / 'encoders.npz', cnn_E=ctx['cnn'].E,
                            cnn_W=np.concatenate([w.reshape(-1) for w in ctx['cnn'].W]), cnn_Wh=ctx['cnn'].Wh, cnn_bh=ctx['cnn'].bh,
                            gpt_tok=ctx['gpt'].tok, gpt_pos=ctx['gpt'].pos, gpt_head=ctx['gpt'].head,
                            Z_cnn=ctx['cnn'].embed(ctx['X_all']), Z_gpt=ctx['gpt'].embed(ctx['X_all']), Z_svd=ctx['Z_svd'])
        (output / 'tokenizer.json').write_text(json.dumps(ctx['tok'].vocab))
        (output / 'catalog-probes.json').write_text(json.dumps(ctx['probes'], indent=2))
        report = dict(run_id='adaptive-personalization-20261122',
                      runtime='local synthetic test' if local_test else 'Google Colab CPU via colab CLI (staged, checkpointed cells)',
                      seed=SEED,
                      model_card=dict(name=MODEL_NAME, model_id=MODEL_ID,
                                      classification=dict(
                                          task='binary preference classification plus ranking (NDCG/Recall@10) with log loss, Brier and calibration',
                                          family='shared logistic prior theta plus private per-user residual delta_u, online SGD with chronological predict-before-learn replay; feature/score fusion, not parameter averaging',
                                          encoders={'textcnn': ctx['cnn_report']['architecture'], 'mini_gpt': ctx['gpt_report']['architecture'],
                                                    'baseline': 'TF-IDF + truncated SVD (notebook 04 shared encoder)'},
                                          serving='local JSON coefficients per account; no hosted GPU service',
                                          status='research only; not promoted')),
                      environment=dict(python=sys.version.split()[0], numpy=np.__version__, platform=platform.platform()),
                      events=ctx['event_audit'],
                      counts=dict(events=len(ctx['events']), train=len(train), validation=len(val), test=len(test),
                                  users=len(stats['users']), items=len(stats['items'])),
                      corpus=ctx['corpus_audit'],
                      encoders=dict(textcnn=ctx['cnn_report'], mini_gpt=ctx['gpt_report'],
                                    svd=dict(dim=64, explained_variance=round(ctx['svd_var'], 6), vocabulary=ctx['svd_vocab']),
                                    agreement=ctx['agreement'], probes=ctx['probes']),
                      classifier=dict(features=FEATURES, theta=[round(float(x), 6) for x in theta], intercept=round(b, 6),
                                      validation=ctx['validation'], selected=ctx['best'],
                                      test_pointwise=dict(adaptive=ctx['tpw'], shared_only=ctx['spw']),
                                      validation_ranking=ctx['val_results'], test=ctx['test_results']),
                      parameters=dict(bpr=dict(dim=16, epochs=30, positive='rating >= 4'),
                                      shared_theta=dict(epochs=6, neg_per_user=5),
                                      adaptive=dict(lr_u=ctx['lr_u'], reg_u=ctx['reg_u'], half_life_user_days=30,
                                                    half_life_item_days=90, clip=10)),
                      seconds=round(time.time() - started, 2),
                      limitations=['Amazon IDs have no reviewed mapping to the app catalog; the CNN/GPT semantic channels are demonstrated on the metadata corpus and curated probes, not as features inside the Amazon replay.',
                                   'Features are as-of the train split (static within each split); the online replay is predict-before-learn on labels but not expanding-window on features.',
                                   'Corpus splits are title-group hash splits (snapshot), while the interaction split is chronological; score buckets are aggregate quality, not personal taste.',
                                   'Single fixed test measurement per model; bootstrap CIs are user-level only and no cross-model significance is claimed.',
                                   'No impression ledger or logged propensities exist, so no bandit or off-policy evaluation is possible.'])
        (output / 'report.json').write_text(json.dumps(report, indent=2))
        (output / 'environment.txt').write_text(subprocess.check_output([sys.executable, '-m', 'pip', 'freeze'], text=True))
        nb_hash = (root / 'notebook.sha256').read_text().strip() if (root / 'notebook.sha256').exists() else None
        provenance = dict(run_id=report['run_id'], notebook_sha256=nb_hash,
                          amazon_sources=ctx['event_audit'].get('sources'),
                          kaggle_sources=ctx['corpus_audit'].get('sources'),
                          catalog_sha256=hashlib.sha256((root / 'catalog-metadata.json').read_bytes()).hexdigest(),
                          experiment_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest())
        (output / 'provenance.json').write_text(json.dumps(provenance, indent=2))
        print(json.dumps(ctx['tpw'], indent=2)[:1500], flush=True)
        import zipfile
        with zipfile.ZipFile(root / 'results.zip', 'w', zipfile.ZIP_DEFLATED) as z:
            for file in output.iterdir():
                z.write(file, file.name)
        done.add('export'); _save_ctx(cache, done, ctx)
        ctx['report'] = report
    return ctx.get('report')


if __name__ == '__main__':
    run(Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/content/distran-adaptive'))
