import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';
import type { ReactNode } from 'react';
import brand from './assets/brand.svg';

// Brand fonts matching the app (@fontsource/abel + @fontsource/dm-mono there;
// loaded here from Google Fonts once, keyed to this slide's id).
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Abel&family=DM+Mono:wght@400;500&display=swap';
const FONT_LINK_ID = 'osd-webfont-distran-ai-project';
if (typeof document !== 'undefined') {
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== FONT_HREF) link.href = FONT_HREF;
}

// Distran app design tokens (apps/desktop/src/styles/foundation.css)
export const design: DesignSystem = {
  palette: { bg: '#070708', text: '#f2efe8', accent: '#b7c96c' },
  fonts: { display: 'Abel, sans-serif', body: 'Abel, sans-serif' },
  typeScale: { hero: 150, body: 33 },
  radius: 16,
};

const panel = '#0e0e10';
const raised = '#151517';
const line = 'rgba(255,255,255,0.075)';
const muted = '#96948f';
const subtle = '#64645f';
const ink = '#f2efe8';
const green = '#b7c96c';
const amber = '#dfac68';
const mono = '"DM Mono", ui-monospace, Menlo, monospace';

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: 'var(--osd-font-body)',
} as const;

const Eyebrow = ({ children, color = subtle }: { children: ReactNode; color?: string }) => (
  <div
    style={{
      fontFamily: mono,
      fontSize: 22,
      letterSpacing: '0.19em',
      textTransform: 'uppercase',
      color,
    }}
  >
    {children}
  </div>
);

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
      padding: '84px 120px 64px',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Eyebrow>{kicker}</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 58,
        fontWeight: 400,
        letterSpacing: '-0.025em',
        lineHeight: 1.1,
        margin: '16px 0 0',
      }}
    >
      {title}
    </h2>
    <div style={{ width: 96, height: 3, background: 'var(--osd-accent)', margin: '26px 0 40px' }} />
    {children}
    <div
      style={{
        marginTop: 'auto',
        display: 'flex',
        justifyContent: 'flex-end',
        fontFamily: mono,
        fontSize: 21,
        color: subtle,
      }}
    >
      {page} / 20
    </div>
  </div>
);

// plain-language line under a technical slide title
const Plain = ({ children }: { children: ReactNode }) => (
  <p style={{ margin: '-24px 0 32px', fontSize: 27, color: muted, lineHeight: 1.45, maxWidth: 1500 }}>
    {children}
  </p>
);

// "why this matters" callout for method/results slides
const SoWhat = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      marginTop: 30,
      border: `1px solid ${line}`,
      borderLeft: `3px solid var(--osd-accent)`,
      borderRadius: 12,
      background: 'rgba(183,201,108,0.05)',
      padding: '18px 26px',
      fontSize: 25,
      lineHeight: 1.5,
      color: ink,
      maxWidth: 1680,
    }}
  >
    <span style={{ fontFamily: mono, fontSize: 19, letterSpacing: '0.16em', color: green, marginRight: 18 }}>
      WHY THIS MATTERS
    </span>
    {children}
  </div>
);

const Bullets = ({ items, size = 30, gap = 20 }: { items: ReactNode[]; size?: number; gap?: number }) => (
  <ul style={{ margin: 0, paddingLeft: 34, fontSize: size, lineHeight: 1.5, color: ink }}>
    {items.map((b, i) => (
      <li key={i} style={{ marginBottom: gap }}>
        {b}
      </li>
    ))}
  </ul>
);

const Formula = ({ children, size = 32 }: { children: ReactNode; size?: number }) => (
  <div
    style={{
      fontFamily: mono,
      fontSize: size,
      background: panel,
      border: `1px solid ${line}`,
      borderRadius: 12,
      padding: '20px 28px',
      color: ink,
      width: 'fit-content',
      lineHeight: 1.5,
    }}
  >
    {children}
  </div>
);

const Chip = ({ children, color = '#c9c7bd' }: { children: ReactNode; color?: string }) => (
  <span
    style={{
      fontFamily: mono,
      fontSize: 20,
      border: `1px solid ${line}`,
      borderRadius: 999,
      padding: '8px 16px',
      background: panel,
      color,
    }}
  >
    {children}
  </span>
);

const Table = ({
  cols,
  rows,
  rowH = 52,
  size = 25,
  highlightLast = false,
}: {
  cols: { label: string; w: number }[];
  rows: (string | ReactNode)[][];
  rowH?: number;
  size?: number;
  highlightLast?: boolean;
}) => (
  <div style={{ border: `1px solid ${line}`, borderRadius: 14, overflow: 'hidden', background: panel }}>
    <div style={{ display: 'flex', height: rowH, alignItems: 'center', background: raised }}>
      {cols.map((c, i) => (
        <div
          key={i}
          style={{
            width: c.w,
            fontFamily: mono,
            fontSize: 19,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: subtle,
            padding: '0 22px',
            whiteSpace: 'nowrap',
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
          background: highlightLast && ri === rows.length - 1 ? 'rgba(183,201,108,0.07)' : 'transparent',
          borderTop: `1px solid ${line}`,
          fontSize: size,
        }}
      >
        {r.map((cell, ci) => (
          <div
            key={ci}
            style={{
              width: cols[ci].w,
              padding: '0 22px',
              fontFamily: ci === 0 ? 'inherit' : mono,
              fontSize: ci === 0 ? size : size - 3,
              color: ci === 0 ? ink : muted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {cell}
          </div>
        ))}
      </div>
    ))}
  </div>
);

// Diagram primitives — labeled, app-styled
const DBox = ({
  x, y, w, h, label, sub, accent = false, num,
}: {
  x: number; y: number; w: number; h: number; label: string; sub?: string; accent?: boolean; num?: string;
}) => (
  <g>
    <rect
      x={x} y={y} width={w} height={h} rx={12}
      fill={accent ? 'rgba(183,201,108,0.10)' : panel}
      stroke={accent ? green : line}
      strokeWidth={accent ? 1.5 : 1}
    />
    {num && (
      <text x={x + 16} y={y + 26} fill={green} fontFamily={mono} fontSize={18}>
        {num}
      </text>
    )}
    <text
      x={x + w / 2}
      y={y + h / 2 - (sub ? 13 : 0)}
      textAnchor="middle"
      fill={ink}
      fontSize={24}
      fontWeight={400}
    >
      {label}
    </text>
    {sub && (
      <text x={x + w / 2} y={y + h / 2 + 20} textAnchor="middle" fill={muted} fontFamily={mono} fontSize={17}>
        {sub}
      </text>
    )}
  </g>
);

const DArrow = ({ x1, y1, x2, y2, label, labelDy = -12 }: { x1: number; y1: number; x2: number; y2: number; label?: string; labelDy?: number }) => (
  <g>
    <line x1={x1} y1={y1} x2={x2 - 12} y2={y2} stroke={subtle} strokeWidth={2} />
    <polygon points={`${x2},${y2} ${x2 - 11},${y2 - 6} ${x2 - 11},${y2 + 6}`} fill={subtle} />
    {label && (
      <text x={(x1 + x2) / 2} y={Math.min(y1, y2) + labelDy} textAnchor="middle" fill={muted} fontFamily={mono} fontSize={17}>
        {label}
      </text>
    )}
  </g>
);

const Caption = ({ children }: { children: ReactNode }) => (
  <div style={{ fontFamily: mono, fontSize: 20, color: subtle, lineHeight: 1.6 }}>{children}</div>
);

// ---------------------------------------------------------------- pages

const Cover: Page = () => (
  <div
    style={{
      ...fill,
      background:
        'radial-gradient(900px 620px at 82% 12%, rgba(183,201,108,0.10), transparent 62%), var(--osd-bg)',
      color: 'var(--osd-text)',
      padding: '0 140px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
      <img src={brand} width={64} height={64} style={{ borderRadius: 14 }} />
      <Eyebrow color={green}>AI unit · semester project</Eyebrow>
    </div>
    <h1
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 'var(--osd-size-hero)',
        fontWeight: 400,
        letterSpacing: '-0.03em',
        lineHeight: 1.02,
        margin: '40px 0 30px',
      }}
    >
      Distran
    </h1>
    <p style={{ fontSize: 40, color: muted, maxWidth: 1320, lineHeight: 1.35, letterSpacing: '-0.01em' }}>
      Adaptive cross-media recommendations — CNN and GPT-style content encoders plus an
      online adaptive preference classifier, trained on Colab and measured on heldout data.
    </p>
    <div style={{ display: 'flex', gap: 22, marginTop: 64 }}>
      {[
        ['169183', 'Hussein · introduction'],
        ['167602', 'Alvin · method & training'],
        ['190003', 'Issa · results & learnings'],
      ].map(([id, name]) => (
        <div
          key={id}
          style={{
            border: `1px solid ${line}`,
            borderRadius: 14,
            padding: '18px 26px',
            background: panel,
          }}
        >
          <div style={{ fontFamily: mono, fontSize: 21, color: green }}>{id}</div>
          <div style={{ fontSize: 27, marginTop: 6, color: ink }}>{name}</div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 48, fontFamily: mono, fontSize: 20, color: subtle }}>
      2026-11-22 · Google Colab CPU via colab CLI · NumPy 2.2.6 · 16 unit tests passing
    </div>
  </div>
);

const Agenda: Page = () => (
  <Shell kicker="Agenda" title="Three parts" page="02">
    <div style={{ display: 'flex', gap: 30, marginTop: 6 }}>
      {[
        ['01', 'Introduction & approach', 'The problem, how earlier runs led here, our reasoning, and the method in brief', 'Hussein'],
        ['02', 'Method & training', 'System, data, model, encoders, Colab training — and what we expected', 'Alvin'],
        ['03', 'Results & learnings', 'Heldout numbers vs expectations, what held up, what we learned', 'Issa'],
      ].map(([n, t, s, who]) => (
        <div
          key={n}
          style={{
            flex: 1,
            border: `1px solid ${line}`,
            borderTop: `3px solid var(--osd-accent)`,
            borderRadius: 14,
            padding: '34px 36px',
            background: panel,
          }}
        >
          <div style={{ fontFamily: mono, fontSize: 22, color: green }}>{n}</div>
          <div style={{ fontSize: 40, letterSpacing: '-0.02em', margin: '14px 0 10px' }}>{t}</div>
          <div style={{ fontSize: 25, color: muted, lineHeight: 1.45 }}>{s}</div>
          <div style={{ fontFamily: mono, fontSize: 19, color: subtle, marginTop: 22 }}>{who}</div>
        </div>
      ))}
    </div>
  </Shell>
);

const Problem: Page = () => (
  <Shell kicker="01 · Introduction" title="The problem: one taste profile, every format" page="03">
    <div style={{ display: 'flex', gap: 48 }}>
      <div style={{ flex: 1.25 }}>
        <Bullets
          size={30}
          gap={22}
          items={[
            <>Distran is a ledger for the works you love — <b>films, TV and games</b> side by side, with live TMDB/IGDB discovery.</>,
            <>The hard part is <b>recommendation</b>: what to show next, from one cross-media profile.</>,
            <>Constraints: cold users and cold items, and <b>no logged recommendation impressions</b> in the app — only favourites, ratings and lists.</>,
            <>Public metadata (TMDB, HowLongToBeat) has rich text but <b>no user preferences</b>; Amazon 5-core ratings are the available proxy interaction corpus.</>,
          ]}
        />
        <SoWhat>
          We need a model that learns “what does this user like” from very few explicit signals —
          and that can be evaluated honestly before it ever touches the app.
        </SoWhat>
      </div>
      <div style={{ width: 520 }}>
        <Eyebrow>App today</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
          {[
            ['12 curated works', 'bundled fallback catalog'],
            ['fixed weights', 'Home ranker (recommendations.ts)'],
            ['SVD v3', 'serving content encoder'],
            ['0 logged impressions', 'no exposure/propensity data'],
          ].map(([a, b]) => (
            <div
              key={a}
              style={{
                border: `1px solid ${line}`,
                borderRadius: 12,
                background: panel,
                padding: '16px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontFamily: mono, fontSize: 23, color: ink }}>{a}</span>
              <span style={{ fontFamily: mono, fontSize: 19, color: muted }}>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Shell>
);

const Progression: Page = () => (
  <Shell kicker="01 · Introduction" title="How we got here — four runs, each teaching one lesson" page="04">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[
        ['NB 01–02', 'Smoke test + overlap audit', 'Checked whether public Amazon 5-core data could stand in for app events: 19,615 users appear in both games and movies.', '→ a cross-media proxy corpus exists'],
        ['NB 03 · 11-16', 'Amazon BPR + SVD + popularity hybrid', 'Validation picked collaborative weight 0.0 — popularity beat BPR (NDCG@10 0.0184 vs 0.0105); BPR disabled in the app.', '→ on sparse data, popularity wins; collaborative needs more signal'],
        ['NB 04 · 11-16', 'Kaggle metadata: 3 score regressors + TF-IDF/SVD', 'All regressors beat train-mean on heldout title groups; SVD became the serving encoder (v2).', '→ aggregate scores are text-predictable, but not personal taste'],
        ['NB 05 · 11-22', 'This run: adaptive classifier + CNN/GPT encoders', 'Shared prior + per-user residual, chronological replay, test scored once; encoders benchmarked vs serving SVD.', '→ the experiment this deck presents'],
      ].map(([tag, title, res, lesson]) => (
        <div
          key={tag}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            border: `1px solid ${line}`,
            borderRadius: 14,
            background: panel,
            padding: '16px 28px',
          }}
        >
          <div style={{ width: 140, fontFamily: mono, fontSize: 19, color: green, flexShrink: 0 }}>{tag}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 27, letterSpacing: '-0.01em' }}>{title}</div>
            <div style={{ fontSize: 22, color: muted, marginTop: 4, lineHeight: 1.35 }}>{res}</div>
          </div>
          <div style={{ width: 440, fontFamily: mono, fontSize: 19, color: amber, lineHeight: 1.45, flexShrink: 0 }}>
            {lesson}
          </div>
        </div>
      ))}
    </div>
    <SoWhat>
      Each run removed an option: collaborative factorisation (NB 03), aggregate-score prediction as a
      stand-in for taste (NB 04). What remained was an <b>online per-user preference model</b> — evaluated, not assumed.
    </SoWhat>
  </Shell>
);

const WhyApproach: Page = () => (
  <Shell kicker="01 · Introduction" title="Why this approach — reasoning and method in brief" page="05">
    <div style={{ display: 'flex', gap: 48 }}>
      <div style={{ flex: 1.2 }}>
        <Bullets
          size={29}
          gap={18}
          items={[
            <>Lessons from NB 03/04: combine existing artifacts by <b>feature/score fusion</b>, never parameter averaging; don’t mistake aggregate scores for taste</>,
            <>Start with a <b>small online model</b>: 13 bounded features, shared prior θ + private per-user residual δᵤ — servable as JSON, updatable from each explicit rating</>,
            <>Benchmark the text encoder against <b>CNN and GPT-style transformers</b> trained from scratch in NumPy — the “advanced” architectures, gradient-checked</>,
            <>Evaluate before claiming: chronological split, validation-selected hyperparameters, test scored once</>,
          ]}
        />
      </div>
      <div style={{ width: 560 }}>
        <Eyebrow>The method in one line</Eyebrow>
        <div style={{ marginTop: 18 }}>
          <Formula size={30}>p(u,i,c) = σ( b + bᵤ + (θ + δᵤ) · x )</Formula>
        </div>
        <div style={{ marginTop: 22 }}>
          <Formula size={22}>δᵤ ← clip( δᵤ + η·clip‖(y−p)·x‖ − ηλ·δᵤ, ±10 )</Formula>
        </div>
        <Caption>
          online update after each labelled event, predict-before-learn; η, λ chosen on validation
        </Caption>
      </div>
    </div>
    <SoWhat>
      This is an <b>adaptive preference classifier (APC)</b>: one shared prior everyone contributes to,
      plus a small private adjustment per user — the same “adapt the strength of a preference signal per
      instance” idea as Ada-Pref (arXiv 2406.02764), applied per user instead of per trajectory pair.
    </SoWhat>
  </Shell>
);

const Baselines: Page = () => (
  <Shell kicker="01 · Introduction" title="Starting point: what already existed" page="06">
    <Table
      rowH={62}
      size={26}
      cols={[
        { label: 'component', w: 480 },
        { label: 'evidence', w: 620 },
        { label: 'role in this project', w: 580 },
      ]}
      rows={[
        ['TF-IDF + SVD encoder (v3)', 'serving content model, 32,952 docs', 'baseline encoder'],
        ['BPR collaborative (notebook 03)', 'validation chose weight 0.0', 'disabled — kept as benchmark'],
        ['3 aggregate-score regressors (04)', 'heldout MAE beats train-mean', 'offline baselines only'],
        ['Fixed-weight Home ranker', 'favourites + ratings + MMR, local', 'current rollback'],
      ]}
    />
    <SoWhat>
      Key insight carried from NB 04: <b>aggregate-score prediction is not personal taste</b> —
      the regressors cannot become a personal ranker, so they stay offline baselines.
    </SoWhat>
  </Shell>
);

const SystemDiagram: Page = () => (
  <Shell kicker="02 · Method" title="The proposed system, end to end" page="07">
    <Plain>
      Follow one recommendation: the live catalog proposes candidates, hard rules remove anything
      ineligible, the classifier scores what remains, and diversity reorders the final cards. Your
      ratings then flow back into your private profile — the loop that makes it adaptive.
    </Plain>
    <svg width={1680} height={470} viewBox="0 0 1680 470">
      <DBox x={10} y={40} w={240} h={96} label="Live catalog" sub="TMDB · IGDB · HLTB" num="1" />
      <DBox x={310} y={40} w={250} h={96} label="Candidates" sub="semantic + collab" num="2" />
      <DBox x={620} y={40} w={250} h={96} label="Hard filters" sub="format · seen · request" num="3" />
      <DBox x={930} y={40} w={270} h={96} label="Features x(u,i,c)" sub="13 bounded values" num="4" accent />
      <DBox x={1260} y={40} w={410} h={96} label="Classifier θ + δᵤ" sub="p = σ(b + bᵤ + (θ+δᵤ)·x)" num="5" accent />
      <DArrow x1={250} y1={88} x2={310} y2={88} />
      <DArrow x1={560} y1={88} x2={620} y2={88} />
      <DArrow x1={870} y1={88} x2={930} y2={88} />
      <DArrow x1={1200} y1={88} x2={1260} y2={88} />
      <DBox x={1260} y={260} w={410} h={96} label="MMR diversity" sub="ρ·score − (1−ρ)·max cos" num="6" />
      <DBox x={950} y={260} w={270} h={96} label="Home / Buddy" sub="cards shown" num="7" />
      <DBox x={600} y={260} w={310} h={96} label="Feedback events" sub="rating · favourite · dislike" num="8" />
      <DBox x={260} y={260} w={300} h={96} label="Private profile" sub="long-term + recent, decay" />
      <DArrow x1={1465} y1={136} x2={1465} y2={260} />
      <DArrow x1={1260} y1={308} x2={1220} y2={308} />
      <DArrow x1={950} y1={308} x2={910} y2={308} />
      <DArrow x1={600} y1={308} x2={560} y2={308} />
      <DArrow x1={410} y1={260} x2={410} y2={180} />
      <DArrow x1={410} y1={180} x2={1065} y2={180} />
      <DArrow x1={1065} y1={180} x2={1065} y2={136} label="as-of features" labelDy={34} />
      <text x={840} y={430} textAnchor="middle" fill={subtle} fontFamily={mono} fontSize={19}>
        learned weights reorder eligible candidates only — hard filters stay deterministic
      </text>
    </svg>
  </Shell>
);

const Data: Page = () => (
  <Shell kicker="02 · Method" title="Data and evaluation protocol" page="08">
    <Plain>Two datasets, two jobs: Amazon ratings simulate user events; Kaggle metadata trains the text encoders.</Plain>
    <div style={{ display: 'flex', gap: 36 }}>
      <div style={{ flex: 1 }}>
        <Eyebrow>Interactions — Amazon 5-core (app-event proxy)</Eyebrow>
        <div style={{ marginTop: 16 }}>
          <Table
            rowH={56}
            size={23}
            cols={[{ label: 'split', w: 250 }, { label: 'events', w: 180 }, { label: 'note', w: 330 }]}
            rows={[
              ['train  ≤ 60%', '39,600', '4.7k users · 24.4k items'],
              ['validation  60–80%', '13,204', 'select η, λ here'],
              ['test  > 80%', '13,195', 'scored exactly once'],
            ]}
          />
        </div>
        <div style={{ display: 'flex', height: 30, marginTop: 16, borderRadius: 8, overflow: 'hidden', border: `1px solid ${line}` }}>
          <div style={{ width: '60%', background: '#1c2416' }} />
          <div style={{ width: '20%', background: '#232a18' }} />
          <div style={{ width: '20%', background: '#2c351d' }} />
        </div>
        <div style={{ marginTop: 10 }}>
          <Caption>chronological global cutoffs · deterministic 1/128 user sample · salted pseudonyms</Caption>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <Eyebrow>Text corpus — Kaggle (encoder training)</Eyebrow>
        <div style={{ marginTop: 16 }}>
          <Table
            rowH={56}
            size={23}
            cols={[{ label: 'source', w: 280 }, { label: 'docs', w: 160 }, { label: 'scored', w: 320 }]}
            rows={[
              ['TMDB movies v2', '10,000', 'vote count ≥ 5'],
              ['HowLongToBeat v1', '10,000', '11,202 scored total'],
            ]}
          />
        </div>
        <div style={{ display: 'flex', height: 30, marginTop: 16, borderRadius: 8, overflow: 'hidden', border: `1px solid ${line}` }}>
          <div style={{ width: '60%', background: '#1c2416' }} />
          <div style={{ width: '20%', background: '#232a18' }} />
          <div style={{ width: '20%', background: '#2c351d' }} />
        </div>
        <div style={{ marginTop: 10 }}>
          <Caption>title-hash group split (0–5 / 6–7 / 8–9) · aggregate scores = quality, never taste</Caption>
        </div>
      </div>
    </div>
    <SoWhat>
      Leakage controls: vocabulary, SVD, BPR and feature stats are fit on train only; cold items/users get
      neutral vectors and are counted, not retrieved; SHA256 of every input recorded in provenance.json.
      Chronological splits mean “test” really is the future — we never peek.
    </SoWhat>
  </Shell>
);

const Model: Page = () => (
  <Shell kicker="02 · Method" title="The preference model: Distran APC-1" page="09">
    <Plain>
      A logistic classifier over 13 bounded features. It answers one question per candidate:
      “would this user rate this work 4+ stars?”
    </Plain>
    <div style={{ marginTop: 4 }}>
      <Formula size={36}>p(u,i,c) = σ( b + bᵤ + (θ + δᵤ) · x(u,i,c) )</Formula>
    </div>
    <div style={{ display: 'flex', gap: 44, marginTop: 28 }}>
      <div style={{ flex: 1.15 }}>
        <Eyebrow>13 bounded features x</Eyebrow>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
          {['item_pop_pct', 'item_quality', 'item_dom_game', 'item_dom_screen', 'item_recency_90d', 'user_activity', 'user_pos_rate', 'user_aff_game', 'user_aff_screen', 'user_recency_30d', 'aff×dom_game', 'aff×dom_screen', 'bpr_collab_pct'].map((f) => (
            <Chip key={f}>{f}</Chip>
          ))}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <Eyebrow>Online update, predict-before-learn</Eyebrow>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
          <Formula size={23}>δᵤ ← clip( δᵤ + η·clip‖(y−p)·x‖₁ − ηλ·δᵤ, ±10 )</Formula>
          <Formula size={23}>bᵤ ← clip( bᵤ + η·(y−p), ±10 )</Formula>
        </div>
        <Caption>y = 1 if rating ≥ 4 else 0 · unobserved items are sampled negatives for θ only, never proven dislikes</Caption>
      </div>
    </div>
    <SoWhat>
      Why an APC fits our goal: the shared prior θ learns from everyone, so <b>cold users still get sensible
      scores</b>; the private residual δᵤ adapts from just a few of <i>their own</i> ratings; the weights are
      interpretable (popularity, quality and affinity×domain dominate); and it serves as a small local JSON
      file — no GPU, updated online from explicit feedback only.
    </SoWhat>
  </Shell>
);

const CnnPage: Page = () => (
  <Shell kicker="02 · Method" title="Content encoder A — TextCNN" page="10">
    <Plain>
      Plain version: slide small windows over a work’s description; each window’s word pattern becomes a
      feature (“souls-like”, “space opera”); the net predicts the work’s public score bucket.
    </Plain>
    <svg width={1680} height={430} viewBox="0 0 1680 430">
      <DBox x={10} y={150} w={210} h={100} label="tokens" sub="48-token window" num="1" />
      <DBox x={280} y={150} w={220} h={100} label="embedding E" sub="24-d, learned" num="2" />
      <DBox x={560} y={20} w={310} h={86} label="conv1d  k=3 · 16 filters" num="3" />
      <DBox x={560} y={157} w={310} h={86} label="conv1d  k=4 · 16 filters" accent num="3" />
      <DBox x={560} y={294} w={310} h={86} label="conv1d  k=5 · 16 filters" num="3" />
      <DArrow x1={500} y1={200} x2={560} y2={63} />
      <DArrow x1={500} y1={200} x2={560} y2={200} />
      <DArrow x1={500} y1={200} x2={560} y2={337} />
      <DBox x={950} y={157} w={230} h={86} label="ReLU + max-pool" sub="over time" num="4" />
      <DArrow x1={870} y1={63} x2={950} y2={185} />
      <DArrow x1={870} y1={200} x2={950} y2={200} />
      <DArrow x1={870} y1={337} x2={950} y2={215} />
      <DBox x={1250} y={157} w={190} h={86} label="concat z" sub="48-d" num="5" />
      <DArrow x1={1180} y1={200} x2={1250} y2={200} />
      <DBox x={1510} y={150} w={160} h={100} label="linear head" sub="3 buckets" accent num="6" />
      <DArrow x1={1440} y1={200} x2={1510} y2={200} />
      <text x={10} y={415} fill={subtle} fontFamily={mono} fontSize={19}>
        cross-entropy on score bucket (low &lt;6 · mid 6–7.5 · high &gt;7.5) · Adam · 15 epochs · 196,851 params · pure NumPy
      </text>
    </svg>
    <SoWhat>
      Purpose: a from-scratch CNN benchmark for “can text predict a work’s public score?” — the classic
      Kim (2014) architecture, implemented and gradient-checked by hand so every step is inspectable.
    </SoWhat>
  </Shell>
);

const GptPage: Page = () => (
  <Shell kicker="02 · Method" title="Content encoder B — mini-GPT (decoder-only transformer)" page="11">
    <Plain>
      Plain version: read a work’s description left to right, predicting each next word; the internal
      representation that does this well is our content embedding. Same architecture family as GPT.
    </Plain>
    <svg width={1680} height={430} viewBox="0 0 1680 430">
      <DBox x={10} y={160} w={230} h={96} label="tokens + positions" sub="learned embeddings" num="1" />
      <DArrow x1={240} y1={208} x2={300} y2={208} />
      <DBox x={300} y={30} w={660} h={140} label="transformer block ×2 (pre-LN)" sub="causal MHA · 2 heads · d=48 → residual · FFN 96 GELU → residual" num="2" />
      <DBox x={300} y={240} w={660} h={100} label="final LayerNorm + head" sub="linear d → vocab, softmax" num="3" />
      <DArrow x1={630} y1={170} x2={630} y2={240} />
      <DArrow x1={960} y1={290} x2={1020} y2={290} />
      <DBox x={1020} y={242} w={230} h={96} label="next-token" sub="cross-entropy" accent num="4" />
      <DArrow x1={1250} y1={290} x2={1310} y2={290} />
      <DBox x={1310} y={242} w={360} h={96} label="loss" sub="shifted targets, causal mask t ≤ t′" num="5" />
      <text x={10} y={415} fill={subtle} fontFamily={mono} fontSize={19}>
        1,200 Adam steps · batch 16 · 808,128 params · pure NumPy · embeddings = mean-pooled hidden states · metric: val perplexity
      </text>
    </svg>
    <SoWhat>
      Purpose: a from-scratch GPT-style benchmark for “how well can a small model understand catalog text?”
      — measured by perplexity against a trivial unigram baseline, so the number means something.
    </SoWhat>
  </Shell>
);

const Training: Page = () => (
  <Shell kicker="02 · Method" title="Training: Colab CLI, pinned, staged, resumable" page="12">
    <div style={{ display: 'flex', gap: 44 }}>
      <div style={{ flex: 1.15 }}>
        <div
          style={{
            fontFamily: mono,
            fontSize: 22,
            lineHeight: 1.7,
            background: panel,
            border: `1px solid ${line}`,
            borderRadius: 14,
            padding: '24px 28px',
            color: '#c9c7bd',
          }}
        >
          <div><span style={{ color: green }}>colab</span> new -s distran-adaptive-20261122</div>
          <div><span style={{ color: green }}>colab</span> exec -s … 05_adaptive….ipynb</div>
          <div><span style={{ color: green }}>colab</span> download -s … results.zip</div>
          <div><span style={{ color: green }}>colab</span> stop -s distran-adaptive-20261122</div>
        </div>
        <div style={{ marginTop: 24 }}>
          <Bullets
            size={25}
            gap={12}
            items={[
              <>CPU runtime, `--timeout 3600`; pinned NumPy 2.2.6 / pandas 2.2.3 / scikit-learn 1.6.1 / kagglehub 0.4.3, verified in a fresh subprocess</>,
              <>10 checkpointed stages — interrupted cells resume from cache/</>,
            ]}
          />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <Eyebrow>Selection protocol</Eyebrow>
        <div style={{ marginTop: 16 }}>
          <Table
            rowH={50}
            size={24}
            cols={[{ label: 'step', w: 560 }]}
            rows={[
              ['fit vocab / SVD / BPR / features on train only'],
              ['train shared θ (SGD, 5 sampled negatives per user)'],
              ['grid η ∈ {0.05, 0.1} × λ ∈ {0, 0.01} → validation log loss'],
              ['selected η = 0.1, λ = 0 → test scored once'],
            ]}
          />
        </div>
        <div style={{ marginTop: 20 }}>
          <Caption>final measured pass: 187 s compute · NDCG/Recall@10 with 400-resample bootstrap CIs · log loss · Brier · 10-bin reliability</Caption>
        </div>
      </div>
    </div>
    <SoWhat>
      Reproducibility was a requirement, not a hope: pinned versions, input SHA256 hashes, a frozen
      environment and a notebook hash in provenance.json mean anyone can rerun and compare byte-for-byte.
    </SoWhat>
  </Shell>
);

const Expected: Page = () => (
  <Shell kicker="02 · Method" title="Expected results — hypotheses before looking at test" page="13">
    <Table
      rowH={66}
      size={25}
      cols={[
        { label: 'hypothesis', w: 560 },
        { label: 'reasoning', w: 780 },
        { label: 'verdict', w: 340 },
      ]}
      rows={[
        ['H1 · δᵤ improves pointwise fit vs shared-only', 'a few own ratings should calibrate per user', 'confirmed (p.15)'],
        ['H2 · δᵤ improves NDCG@10 ranking', 'cold items dominate a 24k-item catalog', 'not confirmed (p.16)'],
        ['H3 · mini-GPT perplexity ≪ unigram baseline', 'tiny causal LM ≫ bag-of-words on text', 'confirmed (p.14)'],
        ['H4 · TextCNN beats majority on score buckets', 'aggregate scores weakly text-predictable?', 'not confirmed (p.14)'],
        ['H5 · nothing promoted without app-side eval', 'no impression ledger in the app yet', 'held (p.17)'],
      ]}
    />
    <SoWhat>
      Pre-registered expectations keep the test read honest: hyperparameters were selected on validation
      only, and the test metrics on the next slides were read <b>after</b> that selection — never used to tune.
    </SoWhat>
  </Shell>
);

const EncodersResults: Page = () => (
  <Shell kicker="03 · Results" title="Encoder results vs their baselines" page="14">
    <Table
      rowH={64}
      size={26}
      cols={[
        { label: 'encoder', w: 400 },
        { label: 'task', w: 560 },
        { label: 'result', w: 360 },
        { label: 'baseline', w: 360 },
      ]}
      rows={[
        ['mini-GPT', 'next-token perplexity (val)', '34.68', '2,047.3 unigram'],
        ['TextCNN', '3-class score bucket (test)', 'acc 0.536 · F1 0.386', '0.598 majority'],
        ['TF-IDF + SVD', 'unsupervised 64-d embeddings', 'explained var 0.069', 'serving encoder v3'],
      ]}
    />
    <div style={{ display: 'flex', gap: 40, marginTop: 30 }}>
      <div style={{ flex: 1 }}>
        <Bullets
          size={26}
          gap={14}
          items={[
            <><b style={{ color: green }}>H3 confirmed:</b> the transformer LM cuts perplexity 59× vs unigram — real language structure learned</>,
            <><b style={{ color: amber }}>H4 not confirmed:</b> TextCNN does not beat majority; aggregate scores are weakly text-predictable</>,
            <>Encoders disagree geometrically: CNN↔GPT mean cosine 0.007; probe Jaccard vs serving SVD 0.10–0.32 → no drop-in replacement</>,
          ]}
        />
      </div>
      <div style={{ width: 520 }}>
        <Eyebrow>Probe — “cyberpunk” top-3 neighbours</Eyebrow>
        <div style={{ fontFamily: mono, fontSize: 21, color: muted, lineHeight: 1.8, marginTop: 14 }}>
          GPT: disco-elysium · elden-ring · edgerunners
          <br />
          SVD: disco-elysium · edgerunners · elden-ring
          <br />
          CNN: blade-runner · exit-8 · arrival
        </div>
      </div>
    </div>
    <SoWhat>
      Against expectation: the GPT-style model understands catalog text (H3), but no encoder beats the
      serving SVD as a recommender — so the encoders stay <b>benchmarks</b>, and NB 04’s lesson holds:
      text similarity is not relevance.
    </SoWhat>
  </Shell>
);

const PointwiseResults: Page = () => (
  <Shell kicker="03 · Results" title="Classifier pointwise — 13,195 test events" page="15">
    <Table
      rowH={66}
      size={27}
      highlightLast
      cols={[{ label: 'model', w: 620 }, { label: 'log loss ↓', w: 340 }, { label: 'brier ↓', w: 340 }, { label: 'vs expected', w: 380 }]}
      rows={[
        ['shared logistic only (δᵤ = 0)', '2.7292', '0.7093', '—'],
        ['adaptive (θ + online δᵤ, η = 0.1)', '1.7458', '0.5212', 'H1 confirmed'],
      ]}
    />
    <div style={{ marginTop: 30 }}>
      <Bullets
        size={27}
        gap={14}
        items={[
          <>Per-user residual cuts test log loss by <b style={{ color: green }}>36%</b> and Brier by <b style={{ color: green }}>26%</b> — real signal from a few ratings per user</>,
          <>Calibration caveat: observed positive rate stays 0.72–0.94 in every prediction bin (train→test base-rate shift) — scores rank well but are not calibrated probabilities</>,
        ]}
      />
    </div>
    <SoWhat>
      What this means: the per-user adjustment genuinely works at predicting “would they rate this ≥ 4?” —
      exactly what H1 claimed. But because the probabilities are miscalibrated, the app should use the
      score for <b>ranking</b>, never quote it as “80% chance you’ll love this”.
    </SoWhat>
  </Shell>
);

const RankingResults: Page = () => (
  <Shell kicker="03 · Results" title="Ranking — NDCG@10 / Recall@10 on heldout test" page="16">
    <Table
      rowH={56}
      size={25}
      highlightLast
      cols={[
        { label: 'model', w: 440 },
        { label: 'all', w: 310 },
        { label: 'game', w: 310 },
        { label: 'screen', w: 310 },
        { label: 'cross', w: 310 },
      ]}
      rows={[
        ['popularity', '0.000 / 0.000', '0.0161 / 0.0208', '0.000 / 0.000', '0.000 / 0.000'],
        ['BPR', '0.000 / 0.000', '0.000 / 0.000', '0.000 / 0.000', '0.000 / 0.000'],
        ['fixed heuristic linear', '0.000 / 0.000', '0.000 / 0.000', '0.000 / 0.000', '0.000 / 0.000'],
        ['shared logistic', '0.0010 / 0.0033', '0.0120 / 0.0417', '0.000 / 0.000', '0.000 / 0.000'],
        ['adaptive (ours)', '0.0010 / 0.0033', '0.0120 / 0.0417', '0.000 / 0.000', '0.000 / 0.000'],
      ]}
    />
    <div style={{ marginTop: 26 }}>
      <Bullets
        size={26}
        gap={12}
        items={[
          <><b style={{ color: amber }}>H2 not confirmed:</b> δᵤ gives no measurable NDCG gain — bootstrap CIs overlap everywhere; popularity still edges the small game cohort</>,
          <>Why: cold start dominates — 8,718 heldout positives are items absent from the train catalog, 849 relevant users have no train events, top-10 coverage of 24,390 items ≈ 0.05–8%</>,
        ]}
      />
    </div>
    <SoWhat>
      The honest reading: pointwise gains (p.15) do <b>not</b> automatically become top-10 ranking gains at
      this scale — cold items dominate retrieval, exactly as H2’s reasoning predicted. That is why nothing
      was promoted (H5 held).
    </SoWhat>
  </Shell>
);

const Learnings: Page = () => (
  <Shell kicker="03 · Results" title="What we learned" page="17">
    <div style={{ display: 'flex', gap: 36 }}>
      <div style={{ flex: 1 }}>
        <Eyebrow color={green}>What worked</Eyebrow>
        <div style={{ marginTop: 16 }}>
          <Bullets
            size={27}
            gap={16}
            items={[
              <>Shared prior + per-user residual is a sound, cheap preference head — big pointwise gain (H1), JSON-servable, online-updatable</>,
              <>GPT-style pretraining works even at d=48 in pure NumPy (H3, ppl 34.7 vs 2,047)</>,
              <>Staged + checkpointed Colab pipeline with SHA256 provenance made a long CPU run reproducible; 16 unit tests guard the update rules</>,
            ]}
          />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <Eyebrow color={amber}>What didn’t / limits</Eyebrow>
        <div style={{ marginTop: 16 }}>
          <Bullets
            size={27}
            gap={16}
            items={[
              <>No ranking gain at this scale (H2) — cold items dominate a 24k catalog; popularity remains competitive</>,
              <>TextCNN ≤ majority on score buckets (H4); encoders are not drop-in replacements for serving SVD</>,
              <>Probabilities miscalibrated across time; single fixed split, no significance claims; Amazon IDs ≠ app catalog IDs — no app-surface claim, nothing promoted (H5 held)</>,
            ]}
          />
        </div>
      </div>
    </div>
    <SoWhat>
      Net lesson for the project: <b>small + online + honestly evaluated beats big + static</b> — and a
      pointwise gain is not a recommendation-quality gain; each must be measured in its own metric.
    </SoWhat>
  </Shell>
);

const Conclusions: Page = () => (
  <Shell kicker="03 · Results" title="Conclusions and next steps" page="18">
    <div style={{ display: 'flex', gap: 44 }}>
      <div style={{ flex: 1.2 }}>
        <Bullets
          size={28}
          gap={16}
          items={[
            <>For a university-scale system: the adaptive linear head gave measurable pointwise gains at negligible cost — keep it as the preference head in a Phase A prototype</>,
            <>Next in the app: event/impression ledger with provenance → on-device adaptive scoring benchmarked against the fixed-weight ranker (the current rollback)</>,
            <>Then, only with data: chronological app evaluation (NDCG@k, calibration, diversity, per-cohort), LightFM/CatBoost challengers, logged exploration (bandit)</>,
            <>Encoder path: re-embed the catalog with a larger pretrained encoder and measure relevance before replacing SVD v3</>,
          ]}
        />
      </div>
      <div style={{ width: 560 }}>
        <Eyebrow>Evidence in the repo</Eyebrow>
        <div
          style={{
            fontFamily: mono,
            fontSize: 21,
            lineHeight: 1.8,
            background: panel,
            border: `1px solid ${line}`,
            borderRadius: 14,
            padding: '22px 26px',
            color: '#c9c7bd',
            marginTop: 16,
          }}
        >
          ml/notebooks/05_adaptive_personalization.ipynb
          <br />
          ml/notebooks/ADAPTIVE_PERSONALIZATION_RESULTS.md
          <br />
          ml/notebooks/results/adaptive/report.json
          <br />
          ml/adaptive_experiment.py · ml/tests/ (16 tests)
          <br />
          <span style={{ color: subtle }}>notebook SHA256 3dd1aad4…</span>
        </div>
        <div style={{ marginTop: 24, fontFamily: mono, fontSize: 20, color: subtle, lineHeight: 1.7 }}>
          169183 Hussein · 167602 Alvin · 190003 Issa
          <br />
          github.com/alvinkgithubschool/Distran
        </div>
      </div>
    </div>
  </Shell>
);

const Thanks: Page = () => (
  <div
    style={{
      ...fill,
      background:
        'radial-gradient(900px 620px at 50% 0%, rgba(183,201,108,0.10), transparent 62%), var(--osd-bg)',
      color: 'var(--osd-text)',
      padding: '0 140px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
    }}
  >
    <Eyebrow color={green}>Distran · AI unit semester project</Eyebrow>
    <h1
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 130,
        fontWeight: 400,
        letterSpacing: '-0.03em',
        lineHeight: 1.05,
        margin: '36px 0 28px',
      }}
    >
      Thank you —
      <br />
      any questions?
    </h1>
    <p style={{ fontSize: 34, color: muted, lineHeight: 1.4, maxWidth: 1300 }}>
      All code, notebooks, measured results and this deck are in the repo:
    </p>
    <div style={{ fontFamily: mono, fontSize: 26, color: green, marginTop: 18 }}>
      github.com/alvinkgithubschool/Distran
    </div>
    <div style={{ display: 'flex', gap: 22, marginTop: 56 }}>
      {[
        ['169183', 'Hussein'],
        ['167602', 'Alvin'],
        ['190003', 'Issa'],
      ].map(([id, name]) => (
        <div
          key={id}
          style={{ border: `1px solid ${line}`, borderRadius: 14, padding: '16px 24px', background: panel }}
        >
          <span style={{ fontFamily: mono, fontSize: 20, color: green }}>{id}</span>
          <span style={{ fontSize: 26, marginLeft: 14 }}>{name}</span>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 44, fontFamily: mono, fontSize: 20, color: subtle }}>20 / 20</div>
  </div>
);

const Sources: Page = () => (
  <Shell kicker="Appendix" title="Sources and references" page="20">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[
        ['Ada-Pref — Adaptive Preference Scaling for RLHF (per-instance preference strength; motivates our per-user δᵤ)', 'Hong et al., 2024', 'https://arxiv.org/abs/2406.02764'],
        ['Amazon Reviews 2023 — 5-core ratings (interaction corpus for NB 03/05)', 'Ni et al., 2023', 'https://amazon-reviews-2023.github.io/data_processing/5core.html'],
        ['TMDB popular movies 10k (movie metadata corpus)', 'Kaggle · balaka18', 'https://www.kaggle.com/datasets/balaka18/tmdb-top-10000-popular-movies-dataset'],
        ['Video game sales with ratings (game metadata, NB 04)', 'Kaggle · rush4ratio', 'https://www.kaggle.com/datasets/rush4ratio/video-game-sales-with-ratings'],
        ['HowLongToBeat snapshot 2025-11 (newer game metadata)', 'Kaggle · zaireali', 'https://www.kaggle.com/datasets/zaireali/howlongtobeat-games-scraper-2162025'],
        ['LightFM — hybrid metadata + collaborative recommender (baseline considered, deferred)', 'Kula, 2015', 'https://arxiv.org/abs/1507.08439'],
        ['LinUCB — contextual bandits (deferred until logged exposures exist)', 'Li et al., 2010', 'https://arxiv.org/abs/1003.0146'],
        ['Probability calibration guidance (reliability diagrams, log loss/Brier)', 'scikit-learn docs', 'https://scikit-learn.org/stable/modules/calibration.html'],
        ['TMDB API · IGDB API (live catalog providers in the app)', 'themoviedb.org · api.igdb.com', 'https://www.themoviedb.org/ · https://api.igdb.com/'],
        ['Distran repository — notebooks 03–05, results, tests, this deck', 'this project', 'https://github.com/alvinkgithubschool/Distran'],
      ].map(([label, who, url]) => (
        <div
          key={url}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 24,
            border: `1px solid ${line}`,
            borderRadius: 12,
            background: panel,
            padding: '15px 24px',
          }}
        >
          <div style={{ flex: 1, fontSize: 24, lineHeight: 1.35 }}>
            {label}
            <span style={{ color: subtle, fontSize: 20, marginLeft: 14 }}>{who}</span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{ fontFamily: mono, fontSize: 19, color: green, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            {url.length > 62 ? url.slice(0, 62) + '…' : url}
          </a>
        </div>
      ))}
    </div>
  </Shell>
);

export const meta: SlideMeta = {
  title: 'Distran — adaptive cross-media recommendations (AI unit project)',
  createdAt: '2026-11-22T17:51:52.893Z',
};

export const notes: (string | undefined)[] = [
  'Hussein: open with the app itself — Distran is one ledger across films, TV and games. Today we present the ML project behind making its recommendations adaptive: what we trained, how, and what the heldout numbers actually showed.',
  'Agenda: three parts. I cover the introduction and our reasoning; Alvin takes the method and training; Issa takes the results and what we learned.',
  'Hussein: the problem. Recommendations across formats from one profile. Two constraints shaped everything: no logged impressions in the app, and public metadata has no user preferences — so Amazon 5-core ratings are our proxy interaction corpus. The “why this matters” box is the takeaway: we need a model that learns from very few explicit signals and can be evaluated honestly first.',
  'Hussein: progression. This project is the fourth run. NB 01–02 showed a public cross-media proxy corpus exists. NB 03 showed popularity beats BPR on sparse data — validation literally picked collaborative weight zero. NB 04 showed aggregate scores are predictable from text but that is not personal taste. Each run removed an option, which is why this run is an online per-user preference model.',
  'Hussein: our reasoning, and the method in one line. We fuse features and scores, never average parameters. The model is deliberately small — 13 features, shared prior plus private per-user residual. Read the formula. It is an adaptive preference classifier: same per-instance adaptation idea as Ada-Pref in RLHF, applied per user.',
  'Hussein: the starting point. SVD v3 serves content vectors; BPR is disabled; the regressors are offline baselines; the fixed-weight ranker is the rollback. Key insight: aggregate-score prediction is not personal taste.',
  'Alvin: the system end to end, in plain words first. Catalog proposes candidates, hard rules remove ineligible ones, the classifier scores the rest, MMR diversifies the final cards, and feedback flows back into the private profile. Numbered boxes show the flow; the caption states the safety property: learned weights only reorder eligible candidates — hard filters stay deterministic.',
  'Alvin: data and protocol. Left: Amazon sample, chronological 60/20/20 split — test is genuinely the future. Right: 20k-document Kaggle corpus with a title-hash group split for the encoders. Leakage controls in the box: train-only fitting everywhere, cold items counted not retrieved, SHA256 provenance.',
  'Alvin: the model. It answers one question per candidate: would this user rate it 4+ stars? The 13 features as chips; the online update rule — predict before learning from each event, updates clipped, weights bounded. Why an APC fits us: cold users still get sensible scores from the shared prior, a few own ratings move the private residual, weights are interpretable, and it serves as local JSON with no GPU.',
  'Alvin: TextCNN in plain words — sliding windows over the description turn word patterns into features and predict the public score bucket. Walk the numbered diagram left to right. 196k parameters, pure NumPy, backward pass gradient-checked. It is a benchmark for whether text can predict aggregate scores at all.',
  'Alvin: mini-GPT in plain words — predict the next word of a description; the representation that does this well is our embedding. Two pre-LN blocks, causal attention, 808k params, 1,200 Adam steps, all in NumPy. Metric: validation perplexity against a trivial unigram baseline, so the number is interpretable.',
  'Alvin: training ran on a Colab CPU runtime through the CLI, pinned versions verified in a fresh subprocess, ten checkpointed stages so interrupted cells resume. Hyperparameters were selected on validation — eta 0.1, lambda 0 — and test was scored exactly once. 187 seconds of compute in the final pass.',
  'Alvin: before results, our pre-registered expectations — five hypotheses with reasoning and where each verdict lands. This keeps the test read honest: we never tuned against test.',
  'Issa: encoder results against baselines. H3 confirmed — the mini-GPT cuts perplexity from 2,047 to 34.7, real language structure. H4 not confirmed — the TextCNN does not beat majority on score buckets. And the encoders disagree with the serving SVD, so neither replaces it: text similarity is not relevance.',
  'Issa: pointwise classifier results. H1 confirmed: the per-user residual cuts log loss from 2.73 to 1.75 and Brier from 0.71 to 0.52 — a few ratings per user genuinely move the prediction. Caveat: probabilities are miscalibrated due to a base-rate shift, so use scores for ranking only, never quote them as chances.',
  'Issa: ranking results. H2 not confirmed: adaptive and shared logistic are identical to three decimals on NDCG@10 and popularity still edges the small game cohort. The reason is cold start — 8,718 unseen-item positives and 849 users with no history. The honest reading: pointwise gains do not automatically become top-10 gains at this scale, which is why nothing was promoted.',
  'Issa: what we learned, mapped to the hypotheses. The adaptive linear head is sound and cheap; the encoders learned but do not beat the serving SVD; nothing gets promoted without app-side evaluation. Net lesson: small, online, honestly evaluated beats big and static — and pointwise and ranking quality must each be measured in their own metric.',
  'Issa: conclusions and next steps. Keep the adaptive head as the Phase A prototype behind an event ledger, benchmarked against the fixed-weight ranker which remains the rollback. Bandits only once propensities exist. All evidence is in the repo — linked on the slide.',
  'All: thank you — happy to take questions. Everything shown is reproducible from the repo: the notebook hash, report.json and tests are linked on the previous slide, and full source links are next.',
  'Appendix: sources. Top reference is Ada-Pref, which inspired the per-user adaptation idea; then the datasets, the considered-but-deferred methods (LightFM, LinUCB), the calibration guidance, the live catalog providers, and the repository itself. Links are clickable in the live page.',
];

export default [
  Cover,
  Agenda,
  Problem,
  Progression,
  WhyApproach,
  Baselines,
  SystemDiagram,
  Data,
  Model,
  CnnPage,
  GptPage,
  Training,
  Expected,
  EncodersResults,
  PointwiseResults,
  RankingResults,
  Learnings,
  Conclusions,
  Thanks,
  Sources,
] satisfies Page[];
