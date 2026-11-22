import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#0c1222', text: '#eef2ff', accent: '#fbbf24' },
  fonts: {
    display: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    body: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  typeScale: { hero: 150, body: 34 },
  radius: 14,
};

const muted = '#8b94ad';
const panel = 'rgba(255,255,255,0.045)';
const rule = 'rgba(255,255,255,0.14)';
const mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const green = '#34d399';
const red = '#f87171';

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: 'var(--osd-font-body)',
} as const;

const Shell = ({
  kicker,
  title,
  page,
  children,
}: {
  kicker: string;
  title: string;
  page: string;
  children: ReactNode;
}) => (
  <div
    style={{
      ...fill,
      background: 'var(--osd-bg)',
      color: 'var(--osd-text)',
      padding: '88px 120px 72px',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div style={{ fontSize: 24, color: 'var(--osd-accent)', letterSpacing: '0.22em', fontWeight: 700 }}>
      {kicker}
    </div>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 62,
        fontWeight: 800,
        margin: '18px 0 0',
        lineHeight: 1.1,
      }}
    >
      {title}
    </h2>
    <div style={{ width: 110, height: 4, background: 'var(--osd-accent)', margin: '26px 0 36px' }} />
    {children}
    <div
      style={{
        marginTop: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 21,
        color: muted,
        borderTop: `1px solid ${rule}`,
        paddingTop: 18,
      }}
    >
      <span>Distran · Adaptive cross-media recommendations · AI Unit semester project</span>
      <span>{page}</span>
    </div>
  </div>
);

const Bullets = ({ items, size = 33, gap = 22 }: { items: ReactNode[]; size?: number; gap?: number }) => (
  <ul style={{ margin: 0, paddingLeft: 40, fontSize: size, lineHeight: 1.45 }}>
    {items.map((b, i) => (
      <li key={i} style={{ marginBottom: gap }}>
        {b}
      </li>
    ))}
  </ul>
);

const Formula = ({ children, size = 34 }: { children: ReactNode; size?: number }) => (
  <div
    style={{
      fontFamily: mono,
      fontSize: size,
      background: panel,
      border: `1px solid ${rule}`,
      borderRadius: 'var(--osd-radius)',
      padding: '22px 32px',
      color: '#fde68a',
      width: 'fit-content',
    }}
  >
    {children}
  </div>
);

type Col = { label: string; w: number };
const Table = ({
  cols,
  rows,
  rowH = 50,
  size = 26,
  highlightLast = false,
}: {
  cols: Col[];
  rows: (string | ReactNode)[][];
  rowH?: number;
  size?: number;
  highlightLast?: boolean;
}) => (
  <div style={{ border: `1px solid ${rule}`, borderRadius: 'var(--osd-radius)', overflow: 'hidden' }}>
    <div style={{ display: 'flex', background: panel, height: rowH, alignItems: 'center' }}>
      {cols.map((c, i) => (
        <div
          key={i}
          style={{
            width: c.w,
            fontSize: size - 3,
            fontWeight: 700,
            color: muted,
            padding: '0 20px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {c.label}
        </div>
      ))}
    </div>
    {rows.map((r, ri) => (
      <div
        key={ri}
        style={{
          display: 'flex',
          height: rowH,
          alignItems: 'center',
          background: highlightLast && ri === rows.length - 1 ? 'rgba(251,191,36,0.10)' : 'transparent',
          borderTop: `1px solid ${rule}`,
          fontSize: size,
        }}
      >
        {r.map((cell, ci) => (
          <div key={ci} style={{ width: cols[ci].w, padding: '0 20px', fontFamily: ci === 0 ? 'inherit' : mono, fontSize: ci === 0 ? size : size - 2 }}>
            {cell}
          </div>
        ))}
      </div>
    ))}
  </div>
);

const Box = ({
  x, y, w, h, label, sub, accent = false, size = 24,
}: {
  x: number; y: number; w: number; h: number; label: string; sub?: string; accent?: boolean; size?: number;
}) => (
  <g>
    <rect
      x={x} y={y} width={w} height={h} rx={10}
      fill={accent ? 'rgba(251,191,36,0.16)' : panel}
      stroke={accent ? 'var(--osd-accent)' : rule}
      strokeWidth={accent ? 2 : 1}
    />
    <text x={x + w / 2} y={y + h / 2 - (sub ? 12 : 0)} textAnchor="middle" fill={accent ? '#fde68a' : '#eef2ff'} fontSize={size} fontWeight={700}>
      {label}
    </text>
    {sub && (
      <text x={x + w / 2} y={y + h / 2 + 22} textAnchor="middle" fill={muted} fontSize={size - 6}>
        {sub}
      </text>
    )}
  </g>
);

const Arrow = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <g>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={muted} strokeWidth={2.5} />
    <polygon
      points={`${x2},${y2} ${x2 - 10},${y2 - 6} ${x2 - 10},${y2 + 6}`}
      fill={muted}
      transform={y1 === y2 ? undefined : `rotate(90 ${x2} ${y2})`}
    />
  </g>
);

// ---------------------------------------------------------------- pages

const Cover: Page = () => (
  <div
    style={{
      ...fill,
      background: 'radial-gradient(1200px 700px at 75% 20%, rgba(251,191,36,0.14), transparent 60%), var(--osd-bg)',
      color: 'var(--osd-text)',
      padding: '0 160px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <div style={{ fontSize: 27, color: 'var(--osd-accent)', letterSpacing: '0.28em', fontWeight: 700 }}>
      AI UNIT · SEMESTER PROJECT
    </div>
    <h1
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 'var(--osd-size-hero)',
        fontWeight: 900,
        lineHeight: 1.03,
        margin: '36px 0 28px',
        maxWidth: 1500,
      }}
    >
      Distran: adaptive cross-media recommendations
    </h1>
    <p style={{ fontSize: 38, color: muted, maxWidth: 1300, lineHeight: 1.4 }}>
      Training a shared-prior online classifier with CNN and GPT-style content encoders —
      executed on Colab, measured on heldout data.
    </p>
    <div style={{ display: 'flex', gap: 28, marginTop: 72 }}>
      {[
        ['169183', 'Hussein'],
        ['167602', 'Alvin'],
        ['190003', 'Issa'],
      ].map(([id, name]) => (
        <div
          key={id}
          style={{
            border: `1px solid ${rule}`,
            borderRadius: 'var(--osd-radius)',
            padding: '20px 34px',
            background: panel,
          }}
        >
          <div style={{ fontFamily: mono, fontSize: 24, color: 'var(--osd-accent)' }}>{id}</div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 6 }}>{name}</div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 56, fontSize: 24, color: muted }}>2026-11-22 · Google Colab CPU via the colab CLI · NumPy 2.2.6</div>
  </div>
);

const Agenda: Page = () => (
  <Shell kicker="AGENDA" title="Three parts" page="02">
    <div style={{ display: 'flex', gap: 36, marginTop: 8 }}>
      {[
        ['01', 'Introduction', 'Why we chose this problem and this approach'],
        ['02', 'Methodology', 'Data, model, encoders and how we trained on Colab'],
        ['03', 'Results & conclusions', 'What the heldout numbers came up to, and what we make of them'],
      ].map(([n, t, s], i) => (
        <div
          key={n}
          style={{
            flex: 1,
            border: `1px solid ${rule}`,
            borderTop: `4px solid var(--osd-accent)`,
            borderRadius: 'var(--osd-radius)',
            padding: '36px 40px',
            background: panel,
          }}
        >
          <div style={{ fontFamily: mono, fontSize: 26, color: 'var(--osd-accent)' }}>{n}</div>
          <div style={{ fontSize: 44, fontWeight: 800, margin: '14px 0 12px' }}>{t}</div>
          <div style={{ fontSize: 27, color: muted, lineHeight: 1.45 }}>{s}</div>
        </div>
      ))}
    </div>
  </Shell>
);

const Problem: Page = () => (
  <Shell kicker="INTRODUCTION" title="Why we chose this problem" page="03">
    <Bullets
      size={32}
      gap={20}
      items={[
        <>Distran recommends across <b>films, TV and games</b> from one taste profile — cross-media, not single-domain.</>,
        <>The hard part is <b>personalisation</b>: cold users, cold items, and no logged recommendation impressions in the app.</>,
        <>Aggregate data exists (TMDB, HowLongToBeat, Amazon 5-core) but contains <b>no user-level preferences</b> — we needed a proxy interaction corpus.</>,
        <>We wanted an <b>explainable, incrementally updatable</b> model — not a black-box reranker — because the app already ranks locally with fixed weights.</>,
      ]}
    />
  </Shell>
);

const WhyApproach: Page = () => (
  <Shell kicker="INTRODUCTION" title="Why this approach" page="04">
    <div style={{ display: 'flex', gap: 48 }}>
      <div style={{ flex: 1 }}>
        <Bullets
          size={29}
          gap={16}
          items={[
            <>The repo already had four incompatible artifacts (SVD encoder, Ridge regressors, BPR, hosted LLM) → combine by <b>feature/score fusion, not parameter averaging</b></>,
            <>Start small: a <b>13-feature logistic classifier</b> with a shared prior + per-user residual, servable as JSON, updatable online</>,
            <>Benchmark the semantic encoder against <b>CNN and transformer (GPT-style)</b> encoders trained from scratch</>,
            <>Evaluate before claiming: chronological split, validation-selected hyperparameters, test touched once</>,
          ]}
        />
      </div>
      <div style={{ width: 620 }}>
        <div style={{ fontSize: 24, color: muted, marginBottom: 14, fontWeight: 700, letterSpacing: '0.1em' }}>
          WHAT ALREADY EXISTED (BASELINES)
        </div>
        <Table
          rowH={46}
          size={23}
          cols={[{ label: 'component', w: 330 }, { label: 'status', w: 290 }]}
          rows={[
            ['TF-IDF + SVD encoder (v3)', 'serving content model'],
            ['BPR collaborative (notebook 03)', 'val chose weight 0.0 — disabled'],
            ['3 aggregate-score regressors (04)', 'offline baselines only'],
            ['Fixed-weight Home ranker', 'current rollback'],
          ]}
        />
      </div>
    </div>
  </Shell>
);

const SystemDiagram: Page = () => (
  <Shell kicker="METHODOLOGY" title="Proposed system (Phase C executed offline)" page="05">
    <svg width={1680} height={470} viewBox="0 0 1680 470" style={{ marginTop: 4 }}>
      <Box x={20} y={60} w={250} h={90} label="Live catalog" sub="TMDB · IGDB · HLTB" />
      <Box x={330} y={60} w={250} h={90} label="Candidate retrieval" sub="semantic + collab" />
      <Box x={640} y={60} w={250} h={90} label="Hard filters" sub="format · seen · Buddy" />
      <Box x={950} y={60} w={280} h={90} label="13 preference features" sub="x(u,i,c)" accent />
      <Box x={1290} y={60} w={370} h={90} label="Shared θ + per-user δ_u" sub="p = σ(b + b_u + (θ+δ_u)·x)" accent />
      <Arrow x1={270} y1={105} x2={330} y2={105} />
      <Arrow x1={580} y1={105} x2={640} y2={105} />
      <Arrow x1={890} y1={105} x2={950} y2={105} />
      <Arrow x1={1230} y1={105} x2={1290} y2={105} />
      <Box x={1290} y={230} w={370} h={90} label="MMR diversity" sub="ρ·score − (1−ρ)·max cos" />
      <Box x={1000} y={230} w={250} h={90} label="Home / Buddy cards" />
      <Box x={690} y={230} w={270} h={90} label="Feedback + exposure events" sub="replayed predict-before-learn" />
      <Box x={330} y={230} w={320} h={90} label="Private taste profile" sub="long-term + recent, half-life decay" />
      <Arrow x1={1475} y1={150} x2={1475} y2={230} />
      <Arrow x1={1290} y1={275} x2={1250} y2={275} />
      <Arrow x1={1000} y1={275} x2={960} y2={275} />
      <Arrow x1={690} y1={275} x2={650} y2={275} />
      <Arrow x1={490} y1={230} x2={490} y2={150} />
      <Arrow x1={490} y1={150} x2={640} y2={150} />
      <text x={845} y={330} textAnchor="middle" fill={muted} fontSize={21}>
        learned weights can never relax hard filters — they only reorder eligible candidates
      </text>
    </svg>
  </Shell>
);

const Data: Page = () => (
  <Shell kicker="METHODOLOGY" title="Data and leakage controls" page="06">
    <div style={{ display: 'flex', gap: 40 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 24, color: muted, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>
          INTERACTIONS — AMAZON 5-CORE (PROXY FOR APP EVENTS)
        </div>
        <Table
          rowH={44}
          size={23}
          cols={[{ label: 'set', w: 250 }, { label: 'events', w: 170 }, { label: 'users', w: 150 }, { label: 'items', w: 150 }]}
          rows={[
            ['train (≤60% time)', '39,600', '4,718', '24,390'],
            ['validation (60–80%)', '13,204', '—', '—'],
            ['test (>80% time)', '13,195', '—', '—'],
          ]}
        />
        <div style={{ fontSize: 23, color: muted, marginTop: 14, lineHeight: 1.45 }}>
          65,999 sampled events · deterministic 1/128 user sample (SHA256 of source id) · per-run salt pseudonyms · chronological global cutoffs
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 24, color: muted, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>
          TEXT CORPUS — KAGGLE (ENCODERS)
        </div>
        <Table
          rowH={44}
          size={23}
          cols={[{ label: 'source', w: 300 }, { label: 'docs', w: 160 }, { label: 'scored', w: 150 }]}
          rows={[
            ['TMDB popular movies v2', '10,000', 'vote ≥ 5'],
            ['HowLongToBeat v1 (sampled)', '10,000', '11,202 total'],
          ]}
        />
        <div style={{ fontSize: 23, color: muted, marginTop: 14, lineHeight: 1.45 }}>
          title-group hash split (buckets 0–5/6–7/8–9) · scores = aggregate quality, never personal taste
        </div>
      </div>
    </div>
    <div style={{ marginTop: 34 }}>
      <Bullets
        size={27}
        gap={12}
        items={[
          <>Train-only vocabulary, IDF, SVD, BPR and feature statistics; validation/test get neutral cold-start vectors</>,
          <>Cold heldout items (8,718 positives) are counted, never treated as retrievable; 849 relevant users have no train events</>,
          <>Input SHA256 for every source file recorded in provenance.json</>,
        ]}
      />
    </div>
  </Shell>
);

const Model: Page = () => (
  <Shell kicker="METHODOLOGY" title="The adaptive preference classifier (distran-apc-v1)" page="07">
    <div style={{ fontSize: 26, color: muted, marginBottom: 18 }}>probability that user u likes item i in context c</div>
    <Formula size={40}>
      p(u,i,c) = σ( b + bᵤ + (θ + δᵤ) · x(u,i,c) )
    </Formula>
    <div style={{ display: 'flex', gap: 40, marginTop: 30 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 24, color: muted, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>
          13 BOUNDED FEATURES x
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {['item_pop_pct', 'item_quality', 'item_dom_game', 'item_dom_screen', 'item_recency_90d', 'user_activity', 'user_pos_rate', 'user_aff_game', 'user_aff_screen', 'user_recency_30d', 'aff×dom_game', 'aff×dom_screen', 'bpr_collab_pct'].map((f) => (
            <span
              key={f}
              style={{
                fontFamily: mono,
                fontSize: 21,
                border: `1px solid ${rule}`,
                borderRadius: 999,
                padding: '7px 16px',
                background: panel,
                color: '#c7d2fe',
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
      <div style={{ width: 640 }}>
        <div style={{ fontSize: 24, color: muted, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>
          ONLINE UPDATE (PREDICT-BEFORE-LEARN)
        </div>
        <Formula size={24}>
          δᵤ ← clip(δᵤ + η·clip‖(y−p)·x‖ + ηλδᵤ, ±10)
        </Formula>
        <Formula size={24}>
          bᵤ ← clip(bᵤ + η·(y−p), ±10)   ·  y = 1 if rating ≥ 4
        </Formula>
        <div style={{ fontSize: 23, color: muted, marginTop: 14, lineHeight: 1.45 }}>
          shared θ trained by SGD (5 sampled unobserved negatives/user); δᵤ learned by chronological replay; η, λ chosen on validation log loss; labels: rating ≥ 4 positive, ≤ 3 negative — unobserved ≠ dislike
        </div>
      </div>
    </div>
  </Shell>
);

const CnnPage: Page = () => (
  <Shell kicker="METHODOLOGY" title="Content encoder 1 — TextCNN (pure NumPy)" page="08">
    <svg width={1680} height={400} viewBox="0 0 1680 400">
      <Box x={20} y={140} w={200} h={110} label="tokens x" sub="48-token window" />
      <Box x={290} y={140} w={220} h={110} label="embedding E" sub="24-d, learned" />
      <Box x={580} y={40} w={300} h={80} label="conv1d k=3, 16 filters" />
      <Box x={580} y={150} w={300} h={80} label="conv1d k=4, 16 filters" accent />
      <Box x={580} y={260} w={300} h={80} label="conv1d k=5, 16 filters" />
      <Arrow x1={510} y1={195} x2={580} y2={80} />
      <Arrow x1={510} y1={195} x2={580} y2={190} />
      <Arrow x1={510} y1={195} x2={580} y2={300} />
      <Box x={950} y={150} w={220} h={90} label="ReLU + max-pool" sub="over time" />
      <Arrow x1={880} y1={80} x2={950} y2={180} />
      <Arrow x1={880} y1={190} x2={950} y2={195} />
      <Arrow x1={880} y1={300} x2={950} y2={210} />
      <Box x={1240} y={150} w={180} h={90} label="concat z" sub="48-d" />
      <Arrow x1={1170} y1={195} x2={1240} y2={195} />
      <Box x={1490} y={140} w={170} h={110} label="linear head" sub="3 score buckets" accent />
      <Arrow x1={1420} y1={195} x2={1490} y2={195} />
      <text x={20} y={370} fill={muted} fontSize={22}>
        loss = cross-entropy on aggregate score bucket (low &lt;6, mid 6–7.5, high &gt;7.5) · Adam · 15 epochs · 196,851 params · backward pass verified against numerical gradients
      </text>
    </svg>
  </Shell>
);

const GptPage: Page = () => (
  <Shell kicker="METHODOLOGY" title="Content encoder 2 — mini-GPT (decoder-only transformer)" page="09">
    <svg width={1680} height={430} viewBox="0 0 1680 430">
      <Box x={20} y={170} w={230} h={90} label="tokens + pos" sub="learned embeddings" />
      <Arrow x1={250} y1={215} x2={320} y2={215} />
      <Box x={320} y={60} w={640} h={130} label="block ×2 (pre-LN)" sub="MHA causal (2 heads, d=48) → residual · FFN ff=96 (GELU) → residual" />
      <Box x={320} y={240} w={640} h={130} label="final LayerNorm" sub="then linear head d → vocab" />
      <Arrow x1={640} y1={190} x2={640} y2={240} />
      <Arrow x1={960} y1={305} x2={1030} y2={305} />
      <Box x={1030} y={250} w={240} h={110} label="softmax" sub="next token" accent />
      <Arrow x1={1270} y1={305} x2={1340} y2={305} />
      <Box x={1340} y={250} w={320} h={110} label="cross-entropy loss" sub="shifted targets" />
      <text x={20} y={415} fill={muted} fontSize={22}>
        causal mask: position t only attends to ≤ t · trained 1,200 steps, batch 16, Adam · 808,128 params · embeddings = mean-pooled hidden states · NumPy only
      </text>
    </svg>
  </Shell>
);

const Training: Page = () => (
  <Shell kicker="METHODOLOGY" title="How we trained — Colab CLI, pinned, staged, resumed" page="10">
    <div style={{ display: 'flex', gap: 44 }}>
      <div style={{ flex: 1.2 }}>
        <div
          style={{
            fontFamily: mono,
            fontSize: 23,
            lineHeight: 1.65,
            background: panel,
            border: `1px solid ${rule}`,
            borderRadius: 'var(--osd-radius)',
            padding: '26px 30px',
            color: '#c7d2fe',
          }}
        >
          <div><span style={{ color: 'var(--osd-accent)' }}>colab</span> new -s distran-adaptive-20261122</div>
          <div><span style={{ color: 'var(--osd-accent)' }}>colab</span> exec -s … -f ml/notebooks/05_adaptive_personalization.ipynb --timeout 3600</div>
          <div><span style={{ color: 'var(--osd-accent)' }}>colab</span> download -s … /content/distran-adaptive/results.zip …</div>
          <div><span style={{ color: 'var(--osd-accent)' }}>colab</span> stop -s distran-adaptive-20261122</div>
        </div>
        <Bullets
          size={26}
          gap={12}
          items={[
            <>CPU runtime, pinned NumPy 2.2.6 / pandas 2.2.3 / scikit-learn 1.6.1 / kagglehub 0.4.3, verified in a fresh subprocess</>,
            <>10 checkpointed stages (download → parse → corpus → CNN → GPT → SVD → BPR stats → θ → validation grid → test → export) so interrupted cells resume</>,
          ]}
        />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 24, color: muted, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>
          SELECTION PROTOCOL
        </div>
        <Table
          rowH={46}
          size={24}
          cols={[{ label: 'step', w: 430 }]}
          rows={[
            ['fit vocabulary / SVD / BPR / features on train only'],
            ['train shared θ on train (SGD + sampled negatives)'],
            ['grid η ∈ {0.05, 0.1} × λ ∈ {0, 0.01} → validation log loss'],
            ['selected η=0.1, λ=0.0 → test scored exactly once'],
          ]}
        />
        <div style={{ fontSize: 23, color: muted, marginTop: 16, lineHeight: 1.45 }}>
          final measured pass: 187 s compute · ranking metrics: NDCG/Recall@10, user-level bootstrap CIs (400)
        </div>
      </div>
    </div>
  </Shell>
);

const EncodersResults: Page = () => (
  <Shell kicker="RESULTS" title="Neural encoders vs baselines" page="11">
    <Table
      rowH={58}
      size={27}
      cols={[
        { label: 'encoder', w: 420 },
        { label: 'task', w: 560 },
        { label: 'result', w: 300 },
        { label: 'baseline', w: 300 },
      ]}
      rows={[
        ['mini-GPT (transformer LM)', 'next-token perplexity on val docs', '34.68', '2,047.3 (unigram)'],
        ['TextCNN', '3-class aggregate-score bucket, test', 'acc 0.536 · F1 0.386', '0.598 (majority)'],
        ['TF-IDF + SVD 64-d', 'unsupervised embeddings', 'explained var 0.069', 'serving encoder (v3)'],
      ]}
    />
    <div style={{ display: 'flex', gap: 40, marginTop: 34 }}>
      <div style={{ flex: 1 }}>
        <Bullets
          size={27}
          gap={12}
          items={[
            <>GPT-style LM learns the corpus: <b style={{ color: green }}>59× lower perplexity</b> than a unigram model</>,
            <>TextCNN does <b style={{ color: red }}>not</b> beat majority on score buckets — aggregate scores are weakly predictable from text alone</>,
            <>Encoder geometries disagree: CNN↔GPT mean cosine 0.007; top-3 probe Jaccard vs serving SVD only 0.10–0.32</>,
          ]}
        />
      </div>
      <div style={{ width: 560, fontSize: 24, color: muted, lineHeight: 1.5 }}>
        <div style={{ fontWeight: 700, color: 'var(--osd-text)', marginBottom: 10 }}>probe: “cyberpunk” top-3 neighbors</div>
        GPT: disco-elysium, elden-ring, edgerunners · SVD: disco-elysium, edgerunners, elden-ring · CNN: blade-runner, exit-8, arrival
      </div>
    </div>
  </Shell>
);

const PointwiseResults: Page = () => (
  <Shell kicker="RESULTS" title="Preference classifier — pointwise (13,195 test events)" page="12">
    <Table
      rowH={62}
      size={29}
      highlightLast
      cols={[{ label: 'model', w: 560 }, { label: 'log loss ↓', w: 340 }, { label: 'Brier ↓', w: 340 }, { label: 'note', w: 440 }]}
      rows={[
        ['shared logistic only (δᵤ = 0)', '2.7292', '0.7093', 'prior trained on train'],
        ['adaptive (θ + online δᵤ, η=0.1)', '1.7458', '0.5212', 'predict-before-learn replay'],
      ]}
    />
    <div style={{ marginTop: 34 }}>
      <Bullets
        size={28}
        gap={14}
        items={[
          <>The per-user residual cuts test log loss by <b style={{ color: green }}>36%</b> and Brier by <b style={{ color: green }}>26%</b> vs the shared prior — real pointwise signal from a handful of ratings per user</>,
          <>Calibration is <b style={{ color: red }}>not</b> trustworthy: observed positive rate stays 0.72–0.94 in every prediction bin (train→test base-rate shift) — scores rank, but are not “80% chance you’ll love this”</>,
        ]}
      />
    </div>
  </Shell>
);

const RankingResults: Page = () => (
  <Shell kicker="RESULTS" title="Ranking — NDCG@10 / Recall@10 on heldout test" page="13">
    <Table
      rowH={54}
      size={26}
      highlightLast
      cols={[
        { label: 'model', w: 460 },
        { label: 'all', w: 300 },
        { label: 'game', w: 300 },
        { label: 'screen', w: 300 },
        { label: 'game→screen', w: 320 },
      ]}
      rows={[
        ['popularity', '0.000 / 0.000', '0.0161 / 0.0208', '0.000 / 0.000', '0.000 / 0.000'],
        ['BPR collaborative', '0.000 / 0.000', '0.000 / 0.000', '0.000 / 0.000', '0.000 / 0.000'],
        ['fixed heuristic linear', '0.000 / 0.000', '0.000 / 0.000', '0.000 / 0.000', '0.000 / 0.000'],
        ['shared logistic', '0.0010 / 0.0033', '0.0120 / 0.0417', '0.000 / 0.000', '0.000 / 0.000'],
        ['adaptive (ours)', '0.0010 / 0.0033', '0.0120 / 0.0417', '0.000 / 0.000', '0.000 / 0.000'],
      ]}
    />
    <div style={{ marginTop: 30 }}>
      <Bullets
        size={27}
        gap={12}
        items={[
          <>No measurable ranking gain from δᵤ on this sample — CIs overlap everywhere; popularity still edges the game cohort (0.0161 vs 0.0120)</>,
          <>Retrieval is cold-start dominated: 8,718 heldout positives are items absent from the train catalog; 849 relevant users have no train events; coverage of a 24,390-item catalog at top-10 ≈ 0.05–8%</>,
        ]}
      />
    </div>
  </Shell>
);

const Conclusions: Page = () => (
  <Shell kicker="CONCLUSIONS" title="What we conclude" page="14">
    <div style={{ display: 'flex', gap: 40 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: green, marginBottom: 16 }}>WHAT WORKED</div>
        <Bullets
          size={28}
          gap={14}
          items={[
            <>Shared prior + per-user residual is a sound, cheap preference head: big pointwise gain, JSON-servable, online-updatable</>,
            <>GPT-style pretraining on catalog text works even at d=48 in pure NumPy (ppl 34.7 vs 2,047)</>,
            <>The staged Colab-CLI pipeline with checkpoints + provenance made a long CPU run reproducible</>,
          ]}
        />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: red, marginBottom: 16 }}>WHAT DIDN’T / LIMITS</div>
        <Bullets
          size={28}
          gap={14}
          items={[
            <>No NDCG gain over popularity/shared prior on 1/128 sample with 24k items — cold items dominate</>,
            <>TextCNN score head ≤ majority baseline; encoders not drop-in replacements for the serving SVD</>,
            <>Probabilities miscalibrated across time (base-rate shift); single fixed split, no significance claims</>,
            <>Amazon IDs are not app catalog IDs — no app-surface quality claim; nothing promoted</>,
          ]}
        />
      </div>
    </div>
  </Shell>
);

const Future: Page = () => (
  <Shell kicker="NEXT" title="Future work and where the evidence lives" page="15">
    <div style={{ display: 'flex', gap: 44 }}>
      <div style={{ flex: 1 }}>
        <Bullets
          size={28}
          gap={14}
          items={[
            <>Phase A in the app: event/impression ledger with provenance → local adaptive classifier scored on-device, benchmarked against the fixed-weight ranker</>,
            <>Chronological app evaluation: NDCG/Recall@k, calibration (reliability + log loss), diversity, coverage, per-cohort</>,
            <>Only then: LightFM/CatBoost challengers, and a logged exploration slot (contextual bandit) once propensities exist</>,
            <>Encoder: re-embed catalog with a larger pretrained encoder (e.g. E5) and measure relevance before replacing SVD v3</>,
          ]}
        />
      </div>
      <div style={{ width: 640 }}>
        <div style={{ fontSize: 24, color: muted, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>
          REPRODUCE / READ
        </div>
        <div
          style={{
            fontFamily: mono,
            fontSize: 22,
            lineHeight: 1.7,
            background: panel,
            border: `1px solid ${rule}`,
            borderRadius: 'var(--osd-radius)',
            padding: '24px 28px',
            color: '#c7d2fe',
          }}
        >
          <div>ml/notebooks/05_adaptive_personalization.ipynb</div>
          <div>ml/notebooks/ADAPTIVE_PERSONALIZATION_RESULTS.md</div>
          <div>ml/notebooks/results/adaptive/report.json</div>
          <div>ml/adaptive_experiment.py · ml/tests/test_adaptive.py</div>
          <div style={{ marginTop: 10, color: muted }}>notebook SHA256 3dd1aad4… · 16 unit tests OK</div>
        </div>
        <div style={{ marginTop: 26, fontSize: 25, color: muted }}>
          Presenters — 169183 Hussein (introduction) · 167602 Alvin (methodology) · 190003 Issa (results)
        </div>
      </div>
    </div>
  </Shell>
);

export const meta: SlideMeta = {
  title: 'Distran — adaptive cross-media recommendations (AI unit project)',
  createdAt: '2026-11-22T17:51:52.893Z',
};

export const notes: (string | undefined)[] = [
  'Hussein: welcome. One-line pitch — Distran recommends films, TV and games from one taste profile; today we show the ML we built and measured for that. Introduce the three of us with student IDs.',
  'Agenda: introduction (why this problem and approach), methodology (data, model, encoders, Colab training), results and conclusions. Alvin takes methodology, Issa takes results.',
  'Hussein: the problem. Cross-media means one profile spans movies and games; the app had no impression ledger, and public metadata has no user preferences, so we used Amazon 5-core as a proxy interaction corpus.',
  'Hussein: why this approach. Four existing artifacts could not be merged by averaging parameters — different feature spaces. So: feature/score fusion, a small online-updatable linear model first, and CNN/GPT encoders as benchmarks. Note BPR was already disabled (validation weight 0.0 in notebook 03).',
  'Alvin: the system diagram. Hard filters stay deterministic; the learned layer only reorders eligible candidates. The feedback loop is replayed predict-before-learn — we never train on the label before scoring it.',
  'Alvin: data. 66k sampled Amazon events with a chronological 60/80 split; 20k Kaggle text docs for the encoders. Emphasise leakage controls: train-only vocab/BPR/features, salted pseudonyms, cold items counted not retrieved, SHA256 provenance.',
  'Alvin: the model. Read the formula aloud: sigmoid of intercept plus user intercept plus (shared theta plus private delta) dot 13 bounded features. The update rule on the right is what runs online; clips keep one bad event from moving the profile.',
  'Alvin: TextCNN. Conv windows 3/4/5 over learned embeddings, ReLU, max-over-time pooling, linear head on three aggregate-score buckets. Pure NumPy, Adam, gradient-checked against numerical gradients. 196k params.',
  'Alvin: mini-GPT. Two pre-LN blocks with causal multi-head attention and a GELU FFN, trained next-token. Also pure NumPy. Its pooled hidden states are the text embeddings. 808k params, 1,200 steps.',
  'Alvin: training. Colab CLI, CPU, pinned versions verified in a fresh subprocess; ten checkpointed stages so an interrupted cell resumes; hyperparameters chosen on validation, test scored once. 187 s for the final measured pass.',
  'Issa: encoder results. The GPT-style LM cuts perplexity from 2,047 to 34.7 — real learning. Honest negative: the TextCNN does not beat the majority baseline on score buckets, and encoders disagree with the serving SVD geometry.',
  'Issa: pointwise. The per-user residual cuts log loss 2.73 → 1.75 and Brier 0.71 → 0.52. Caveat: reliability table shows a base-rate shift, so probabilities are ranking scores, not calibrated chances.',
  'Issa: ranking. NDCG@10 identical for shared and adaptive to three decimals; popularity still best on the small game cohort. Cold items dominate: 8,718 unseen-item positives, 849 users with no history.',
  'Issa: conclusions. What worked: the shared-prior-plus-residual head, NumPy GPT pretraining, reproducible staged pipeline. Limits: no ranking gain at this scale, no calibration, no app-surface claim — nothing promoted.',
  'Issa: future work and where the evidence lives. Phase A is the event ledger plus on-device adaptive scoring; bandits only after propensities exist. All numbers reproducible from the notebook and report.json in the repo.',
];

export default [
  Cover,
  Agenda,
  Problem,
  WhyApproach,
  SystemDiagram,
  Data,
  Model,
  CnnPage,
  GptPage,
  Training,
  EncodersResults,
  PointwiseResults,
  RankingResults,
  Conclusions,
  Future,
] satisfies Page[];
