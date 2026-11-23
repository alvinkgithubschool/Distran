import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';
import brand from './assets/brand.svg';

// Same theming as the v1 deck (light mode, app fonts), plus animation keyframes
// borrowed from the open-slide demo style: staggered rise/fade reveals, pop-in
// nodes, marching-ants flow lines, flying dots, sliding windows, pulsing dots.
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Abel&family=DM+Mono:wght@400;500&display=swap';
const FONT_LINK_ID = 'osd-webfont-distran-ai-project-v2';
const STYLE_ID = 'osd-style-distran-ai-project-v2';
const STYLE_CSS = `
@keyframes v2rise { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
@keyframes v2fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes v2pop { 0% { opacity: 0; transform: scale(0.5); } 70% { opacity: 1; transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
@keyframes v2growx { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes v2march { to { stroke-dashoffset: -32; } }
@keyframes v2fly { 0% { transform: translate(var(--sx), var(--sy)); opacity: 0; } 12% { opacity: 1; } 78% { opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)); opacity: 1; } }
@keyframes v2pulse { 0%, 100% { opacity: 0.25; transform: scale(0.75); } 50% { opacity: 1; transform: scale(1.2); } }
@keyframes v2slide { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(var(--dx, 320px)); } }
@keyframes v2blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes v2spin { to { transform: rotate(360deg); } }
@keyframes v2growy { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes v2orbit { from { transform: rotate(0deg) translateX(var(--r, 160px)) rotate(0deg); } to { transform: rotate(360deg) translateX(var(--r, 160px)) rotate(-360deg); } }
`;
if (typeof document !== 'undefined') {
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== FONT_HREF) link.href = FONT_HREF;
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = STYLE_CSS;
    document.head.appendChild(s);
  }
}

export const design: DesignSystem = {
  palette: { bg: '#f6f5ef', text: '#1b1b16', accent: '#5e7d1e' },
  fonts: { display: 'Abel, sans-serif', body: 'Abel, sans-serif' },
  typeScale: { hero: 140, body: 33 },
  radius: 16,
};

// tokens (same light theme as v1)
const panel = '#ffffff';
const raised = '#ecebe2';
const line = 'rgba(25,25,18,0.12)';
const muted = '#5b594f';
const subtle = '#8f8d82';
const ink = '#1b1b16';
const green = '#5e7d1e';
const amber = '#a8741c';
const mono = '"DM Mono", ui-monospace, Menlo, monospace';

const fill = { width: '100%', height: '100%', fontFamily: 'var(--osd-font-body)' } as const;

// animation shorthand: entrance reveals settle into the final layout (fill both)
const rise = (delay: number, dur = 0.7): CSSProperties => ({
  animation: `v2rise ${dur}s cubic-bezier(0.3,0.7,0.3,1) ${delay}s both`,
});
const fade = (delay: number, dur = 0.6): CSSProperties => ({
  animation: `v2fade ${dur}s ease ${delay}s both`,
});
const pop = (delay: number, dur = 0.55): CSSProperties => ({
  animation: `v2pop ${dur}s cubic-bezier(0.3,0.7,0.3,1) ${delay}s both`,
});
const growx = (delay: number, dur = 0.9): CSSProperties => ({
  transformOrigin: 'left center',
  animation: `v2growx ${dur}s cubic-bezier(0.3,0.7,0.3,1) ${delay}s both`,
});
const growy = (delay: number, dur = 0.9): CSSProperties => ({
  transformOrigin: 'bottom center',
  animation: `v2growy ${dur}s cubic-bezier(0.3,0.7,0.3,1) ${delay}s both`,
});
// infinite, subtle loops for the live view
const march: CSSProperties = {
  strokeDasharray: '7 9',
  animation: 'v2march 1.1s linear infinite',
};
const pulse = (delay = 0): CSSProperties => ({
  animation: `v2pulse 2.2s ease-in-out ${delay}s infinite`,
});
const fly = (sx: number, sy: number, tx: number, ty: number, delay: number, dur = 3.2): CSSProperties => ({
  ['--sx' as never]: `${sx}px`,
  ['--sy' as never]: `${sy}px`,
  ['--tx' as never]: `${tx}px`,
  ['--ty' as never]: `${ty}px`,
  animation: `v2fly ${dur}s cubic-bezier(0.45,0,0.35,1) ${delay}s infinite`,
});

// demo-style card shell: brand row, kicker, big headline, footnote + page number
const Shell = ({
  section,
  kicker,
  headline,
  page,
  footnote,
  children,
}: {
  section: string;
  kicker: string;
  headline: ReactNode;
  page: string;
  footnote?: string;
  children: ReactNode;
}) => (
  <div style={{ ...fill, background: 'var(--osd-bg)', color: 'var(--osd-text)', padding: '44px 64px' }}>
    <div
      style={{
        background: panel,
        border: `1px solid ${line}`,
        borderRadius: 24,
        height: '100%',
        padding: '44px 64px 36px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={brand} width={30} height={30} style={{ borderRadius: 7 }} />
          <span style={{ fontSize: 26 }}>Distran</span>
          <span style={{ fontFamily: mono, fontSize: 19, color: subtle, marginLeft: 6 }}>AI unit project</span>
        </div>
        <div style={{ fontFamily: mono, fontSize: 19, letterSpacing: '0.18em', color: subtle }}>{section}</div>
      </div>
      <div
        style={{
          fontFamily: mono,
          fontSize: 21,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: green,
          marginTop: 40,
        }}
      >
        {kicker}
      </div>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 62,
          fontWeight: 400,
          letterSpacing: '-0.025em',
          lineHeight: 1.08,
          margin: '14px 0 0',
          maxWidth: 1500,
        }}
      >
        {headline}
      </h2>
      <div style={{ flex: 1, marginTop: 34, minHeight: 0 }}>{children}</div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderTop: `1px solid ${line}`,
          paddingTop: 16,
          fontFamily: mono,
          fontSize: 18,
          color: subtle,
        }}
      >
        <span style={{ maxWidth: 1400 }}>{footnote}</span>
        <span>
          {page} / 19
        </span>
      </div>
    </div>
  </div>
);

const Bullets = ({ items, size = 28, gap = 18 }: { items: ReactNode[]; size?: number; gap?: number }) => (
  <ul style={{ margin: 0, paddingLeft: 32, fontSize: size, lineHeight: 1.5, color: ink }}>
    {items.map((b, i) => (
      <li key={i} style={{ marginBottom: gap }}>
        {b}
      </li>
    ))}
  </ul>
);

const Formula = ({ children, size = 30 }: { children: ReactNode; size?: number }) => (
  <div
    style={{
      fontFamily: mono,
      fontSize: size,
      background: raised,
      border: `1px solid ${line}`,
      borderRadius: 12,
      padding: '18px 26px',
      color: ink,
      width: 'fit-content',
      lineHeight: 1.5,
    }}
  >
    {children}
  </div>
);

const Chip = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      fontFamily: mono,
      fontSize: 19,
      border: `1px solid ${line}`,
      borderRadius: 999,
      padding: '7px 15px',
      background: panel,
      color: '#45433b',
    }}
  >
    {children}
  </span>
);

const Table = ({
  cols,
  rows,
  rowH = 56,
  size = 24,
}: {
  cols: { label: string; w: number }[];
  rows: (string | ReactNode)[][];
  rowH?: number;
  size?: number;
}) => (
  <div style={{ border: `1px solid ${line}`, borderRadius: 14, overflow: 'hidden', background: panel }}>
    <div style={{ display: 'flex', height: rowH, alignItems: 'center', background: raised }}>
      {cols.map((c, i) => (
        <div
          key={i}
          style={{
            width: c.w,
            fontFamily: mono,
            fontSize: 18,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: subtle,
            padding: '0 20px',
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
        style={{ display: 'flex', height: rowH, alignItems: 'center', borderTop: `1px solid ${line}`, fontSize: size }}
      >
        {r.map((cell, ci) => (
          <div
            key={ci}
            style={{
              width: cols[ci].w,
              padding: '0 20px',
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

// SVG box for animated diagrams
const AB = ({
  x, y, w, h, label, sub, accent = false, num, style,
}: {
  x: number; y: number; w: number; h: number; label: string; sub?: string; accent?: boolean; num?: string; style?: CSSProperties;
}) => (
  <g style={style}>
    <rect
      x={x} y={y} width={w} height={h} rx={14}
      fill={accent ? 'rgba(94,125,30,0.10)' : panel}
      stroke={accent ? green : line}
      strokeWidth={accent ? 1.6 : 1.2}
    />
    {num && (
      <text x={x + 16} y={y + 27} fill={green} fontFamily={mono} fontSize={18}>
        {num}
      </text>
    )}
    <text x={x + w / 2} y={y + h / 2 - (sub ? 12 : 0)} textAnchor="middle" fill={ink} fontSize={23}>
      {label}
    </text>
    {sub && (
      <text x={x + w / 2} y={y + h / 2 + 20} textAnchor="middle" fill={muted} fontFamily={mono} fontSize={16}>
        {sub}
      </text>
    )}
  </g>
);

const ALine = ({ x1, y1, x2, y2, style, flow = false }: { x1: number; y1: number; x2: number; y2: number; style?: CSSProperties; flow?: boolean }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={subtle} strokeWidth={2} style={{ ...style, ...(flow ? march : {}) }} />
);

const AArrowHead = ({ x, y, angle, style }: { x: number; y: number; angle: number; style?: CSSProperties }) => (
  <polygon
    points="0,0 -12,-6 -12,6"
    fill={subtle}
    transform={`translate(${x},${y}) rotate(${angle})`}
    style={style}
  />
);

// ---------------------------------------------------------------- 1 cover

const Cover: Page = () => (
  <div style={{ ...fill, background: 'var(--osd-bg)', color: 'var(--osd-text)', padding: '44px 64px' }}>
    <div
      style={{
        background:
          'radial-gradient(1000px 640px at 85% 0%, rgba(94,125,30,0.13), transparent 60%), var(--osd-bg)',
        border: `1px solid ${line}`,
        borderRadius: 24,
        height: '100%',
        padding: '64px 72px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src={brand} width={56} height={56} style={{ borderRadius: 13 }} />
        <span style={{ fontFamily: mono, fontSize: 21, letterSpacing: '0.2em', textTransform: 'uppercase', color: green }}>
          AI unit · semester project
        </span>
      </div>
      <h1
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 'var(--osd-size-hero)',
          fontWeight: 400,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          margin: '44px 0 28px',
        }}
      >
        Distran
      </h1>
      <p style={{ fontSize: 38, color: muted, maxWidth: 1340, lineHeight: 1.35 }}>
        A recommendation system that learns your taste from a few ratings — and grows with you.
        Trained on Colab, measured on heldout data, explained without the jargon.
      </p>
      <div style={{ display: 'flex', gap: 20, marginTop: 56 }}>
        {[
          ['169183', 'Hussein · introduction'],
          ['167602', 'Alvin · method & training'],
          ['190003', 'Issa · results & learnings'],
        ].map(([id, name]) => (
          <div key={id} style={{ border: `1px solid ${line}`, borderRadius: 14, padding: '16px 24px', background: panel }}>
            <div style={{ fontFamily: mono, fontSize: 20, color: green }}>{id}</div>
            <div style={{ fontSize: 25, marginTop: 5 }}>{name}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 44, fontFamily: mono, fontSize: 19, color: subtle }}>
        Google Colab CPU via colab CLI · NumPy 2.2.6 · 16 unit tests passing · 19 slides
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------- 2-3 goal

const GoalExplain: Page = () => (
  <Shell section="01 · INTRODUCTION" kicker="The goal" headline="Discovery that learns your habits, preferences and patterns — and grows with you." page="02" footnote="Distran is a ledger for films, TV and games side by side, with live TMDB/IGDB catalog search.">
    <div style={{ display: 'flex', gap: 56 }}>
      <div style={{ flex: 1.15, ...rise(0.15) }}>
        <Bullets
          size={29}
          gap={20}
          items={[
            <>Today the app ranks picks with <b>fixed weights</b> — same formula for everyone, forever.</>,
            <>The ambition: a system that notices <b>what you rate, favourite and finish</b>, picks up the patterns, and surfaces things <b>no one else would have shown you</b>.</>,
            <>Hard constraints: very few ratings per user, brand-new works arriving daily (cold start), and <b>no logged recommendation impressions</b> in the app yet.</>,
            <>So the model must learn from <b>explicit feedback only</b>, adapt per user, and be evaluated honestly before it touches the app.</>,
          ]}
        />
      </div>
      <div style={{ width: 520, ...rise(0.35) }}>
        <div style={{ fontFamily: mono, fontSize: 19, letterSpacing: '0.16em', color: subtle }}>WHAT “GROWS WITH YOU” MEANS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {[
            ['few signals', 'learns from just a handful of your ratings'],
            ['your patterns', 'affinity for games vs screen, recency, activity'],
            ['keeps adapting', 'every rating updates your private profile'],
          ].map(([a, b]) => (
            <div key={a} style={{ border: `1px solid ${line}`, borderRadius: 12, background: panel, padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: mono, fontSize: 21, color: ink }}>{a}</span>
              <span style={{ fontFamily: mono, fontSize: 18, color: muted, textAlign: 'right', maxWidth: 300 }}>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Shell>
);

// animated: rating events fly into a profile ring that fills up
const GoalAnim: Page = () => {
  const cx = 840;
  const cy = 260;
  const r = 150;
  const spokes = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return { deg, tx: cx + r * Math.cos(rad), ty: cy + r * Math.sin(rad) };
  });
  const starts = [
    [cx - 620, cy - 200], [cx - 640, cy + 40], [cx - 560, cy + 220], [cx + 640, cy - 160],
    [cx + 600, cy + 60], [cx + 560, cy + 230], [cx - 200, cy - 260], [cx + 220, cy + 270],
  ];
  return (
    <Shell section="01 · INTRODUCTION" kicker="The goal, animated" headline="Each rating you give lands in your profile — the more you rate, the sharper it gets." page="03" footnote="Schematic of the private per-user profile: long-term + recent signals with decay.">
      <svg width={1680} height={470} viewBox="0 0 1680 470">
        {/* orbiting dashed ring */}
        <circle cx={cx} cy={cy} r={r + 34} fill="none" stroke={line} strokeWidth={1.4} strokeDasharray="4 10" style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'v2spin 40s linear infinite' }} />
        {/* accumulated pips */}
        {spokes.map((s, i) => (
          <circle key={i} cx={s.tx} cy={s.ty} r={11} fill={i % 2 ? green : amber} style={pop(0.3 + i * 0.18)} />
        ))}
        {/* incoming events */}
        {starts.map((s, i) => {
          const t = spokes[i % spokes.length];
          return (
            <circle key={`f${i}`} r={7} fill={green} style={fly(s[0], s[1], t.tx, t.ty, 0.4 + i * 0.35, 3.6)} />
          );
        })}
        {/* core */}
        <circle cx={cx} cy={cy} r={86} fill="rgba(94,125,30,0.10)" stroke={green} strokeWidth={1.6} style={pop(0.1)} />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={30} fill={ink}>your</text>
        <text x={cx} y={cy + 26} textAnchor="middle" fontSize={30} fill={ink}>profile</text>
        {/* labels */}
        <g style={rise(1.4)} fontFamily={mono} fontSize={19} fill={muted}>
          <text x={60} y={80}>rating events</text>
          <text x={60} y={106} fill={subtle}>★ · favourite · finished</text>
          <text x={1180} y={430}>accumulated taste signals</text>
          <text x={1180} y={456} fill={subtle}>long-term + recent, decayed</text>
        </g>
        <g style={fade(0.9)}>
          <line x1={170} y1={88} x2={cx - 190} y2={cy - 60} stroke={subtle} strokeWidth={1.6} strokeDasharray="5 8" style={march} />
          <line x1={1170} y1={424} x2={cx + r + 40} y2={cy + 70} stroke={subtle} strokeWidth={1.6} strokeDasharray="5 8" style={march} />
        </g>
      </svg>
    </Shell>
  );
};

// ---------------------------------------------------------------- 4-5 where we started

const StartedExplain: Page = () => (
  <Shell section="01 · INTRODUCTION" kicker="Where we started" headline="We started with a classic recommender on a large public Amazon dataset." page="04" footnote="Amazon Reviews 5-core: 66k events · 4.7k sampled users · 24.4k games and films · chronological split.">
    <div style={{ ...rise(0.15) }}>
      <Bullets
        size={28}
        gap={18}
        items={[
          <><b>First attempt (notebook 03):</b> BPR — Bayesian Personalized Ranking, a matrix-factorisation recommender — plus popularity, on the Amazon 5-core dataset. Result: on validation, <b>plain popularity beat the learned model</b> (NDCG@10 0.0184 vs 0.0105), so collaborative weight was set to 0. Lesson: with sparse ratings, “most popular” is a tough baseline.</>,
          <><b>Second attempt (notebook 04):</b> predict a work’s <i>public</i> score from its text — TF-IDF (Term Frequency–Inverse Document Frequency) + SVD (Singular Value Decomposition) over TMDB/HowLongToBeat metadata. It worked (beats a mean baseline on heldout titles) — but that predicts <b>what everyone thinks, not what you like</b>.</>,
          <><b>So the next step:</b> a model that learns <b>your</b> taste from <b>your own</b> ratings — the subject of this deck (notebook 05).</>,
        ]}
      />
    </div>
  </Shell>
);

// animated: timeline of iterations, dot marching through, lessons popping
const StartedAnim: Page = () => {
  const y = 250;
  const nodes = [
    { x: 120, tag: 'NB 01–02', t: 'Amazon data audit', s: 'cross-media proxy corpus' },
    { x: 500, tag: 'NB 03', t: 'BPR recommender', s: 'popularity wins on sparse data' },
    { x: 880, tag: 'NB 04', t: 'text → public score', s: 'not the same as personal taste' },
    { x: 1260, tag: 'NB 05', t: 'adaptive classifier', s: 'this project', accent: true },
  ];
  return (
    <Shell section="01 · INTRODUCTION" kicker="Where we started, animated" headline="Three experiments, three lessons — each one ruled out an approach." page="05" footnote="Same deterministic user sample across runs, so cohorts are directly comparable.">
      <svg width={1680} height={470} viewBox="0 0 1680 470">
        <line x1={80} y1={y} x2={1600} y2={y} stroke={line} strokeWidth={3} />
        <line x1={80} y1={y} x2={1600} y2={y} stroke={green} strokeWidth={3} style={{ ...march, animationDuration: '2.2s' }} />
        {/* travelling dot */}
        <circle r={9} fill={green} style={fly(80, y, 1600, y, 0.2, 7)} />
        {nodes.map((n, i) => (
          <g key={n.tag}>
            <circle cx={n.x} cy={y} r={16} fill={n.accent ? green : panel} stroke={green} strokeWidth={2} style={pop(0.25 + i * 0.3)} />
            <g style={rise(0.35 + i * 0.3)}>
              <rect x={n.x - 150} y={y - 150} width={300} height={104} rx={14} fill={n.accent ? 'rgba(94,125,30,0.10)' : panel} stroke={n.accent ? green : line} strokeWidth={1.4} />
              <text x={n.x - 134} y={y - 118} fontFamily={mono} fontSize={18} fill={green}>{n.tag}</text>
              <text x={n.x} y={y - 84} textAnchor="middle" fontSize={23} fill={ink}>{n.t}</text>
              <text x={n.x} y={y - 58} textAnchor="middle" fontFamily={mono} fontSize={16} fill={muted}>{n.s}</text>
            </g>
            <g style={rise(0.5 + i * 0.3)}>
              <rect x={n.x - 150} y={y + 40} width={300} height={64} rx={12} fill={raised} stroke={line} />
              <text x={n.x} y={y + 66} textAnchor="middle" fontFamily={mono} fontSize={17} fill={amber}>→ lesson {i + 1}</text>
              <text x={n.x} y={y + 90} textAnchor="middle" fontSize={17} fill={muted}>
                {['proxy corpus exists', 'popularity > BPR here', 'public score ≠ taste', 'learn the user'][i]}
              </text>
            </g>
            <line x1={n.x} y1={y - 46} x2={n.x} y2={y - 16} stroke={subtle} strokeWidth={1.6} style={fade(0.3 + i * 0.3)} />
            <line x1={n.x} y1={y + 16} x2={n.x} y2={y + 40} stroke={subtle} strokeWidth={1.6} style={fade(0.3 + i * 0.3)} />
          </g>
        ))}
      </svg>
    </Shell>
  );
};

// ---------------------------------------------------------------- 6-7 why this approach

const WhyExplain: Page = () => (
  <Shell section="01 · INTRODUCTION" kicker="Why this approach" headline="A small online model that everyone shares — plus a private tweak that is yours alone." page="06" footnote="Idea borrowed from Ada-Pref (arXiv 2406.02764): adapt the strength of each preference signal per instance — here, per user.">
    <div style={{ display: 'flex', gap: 56 }}>
      <div style={{ flex: 1.2, ...rise(0.15) }}>
        <Bullets
          size={28}
          gap={18}
          items={[
            <>Goal: discovery that grows with you. Constraints: few ratings per user, cold items, no logged impressions — so the model must adapt from <b>explicit feedback only</b>.</>,
            <>Choice: an <b>APC — adaptive preference classifier</b>. One shared prior θ learned from all users, plus a private per-user residual δᵤ updated from each of your ratings: <Formula size={24}>p = σ( b + bᵤ + (θ + δᵤ) · x )</Formula></>,
            <>Why it fits: cold users still get sensible scores from θ; a few of your ratings move δᵤ; weights stay interpretable; it serves as a small local JSON file — <b>no GPU needed</b>.</>,
            <>Alongside it, we benchmark <b>CNN and GPT-style text encoders</b> to check whether “bigger” text models actually help — with full names on the next slides.</>,
          ]}
        />
      </div>
      <div style={{ width: 500, ...rise(0.4) }}>
        <div style={{ fontFamily: mono, fontSize: 19, letterSpacing: '0.16em', color: subtle }}>WHY NOT THE ALTERNATIVES</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {[
            ['parameter averaging', 'incompatible artifacts — ruled out'],
            ['LightFM / CatBoost', 'need more interaction data first'],
            ['contextual bandits', 'need logged exposures first'],
            ['big two-tower nets', 'no measured need at this scale'],
          ].map(([a, b]) => (
            <div key={a} style={{ border: `1px solid ${line}`, borderRadius: 12, background: panel, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 23 }}>{a}</span>
              <span style={{ fontFamily: mono, fontSize: 17, color: muted, textAlign: 'right' }}>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Shell>
);

// animated: pipeline with a pulse travelling the flow and looping back
const WhyAnim: Page = () => {
  const y1 = 130;
  const y2 = 330;
  return (
    <Shell section="01 · INTRODUCTION" kicker="Why this approach, animated" headline="The system in one loop: candidates in, scored cards out, your feedback back in." page="07" footnote="Learned weights only reorder what hard filters allow — format, already-seen and request rules stay deterministic.">
      <svg width={1680} height={470} viewBox="0 0 1680 470">
        <AB x={20} y={y1} w={220} h={92} label="Live catalog" sub="TMDB · IGDB · HLTB" num="1" style={rise(0.1)} />
        <AB x={300} y={y1} w={220} h={92} label="Candidates" sub="semantic retrieval" num="2" style={rise(0.25)} />
        <AB x={580} y={y1} w={220} h={92} label="Hard filters" sub="format · seen" num="3" style={rise(0.4)} />
        <AB x={860} y={y1} w={240} h={92} label="Features x" sub="13 bounded values" num="4" style={rise(0.55)} accent />
        <AB x={1160} y={y1} w={240} h={92} label="APC θ + δᵤ" sub="score p" num="5" style={rise(0.7)} accent />
        <AB x={1440} y={y1} w={220} h={92} label="MMR reorder" sub="diversity" num="6" style={rise(0.85)} />
        <AB x={1440} y={y2} w={220} h={92} label="Your cards" sub="Home / Buddy" num="7" style={rise(1.0)} />
        <AB x={1160} y={y2} w={240} h={92} label="Your ratings" sub="explicit feedback" num="8" style={rise(1.1)} />
        <AB x={860} y={y2} w={240} h={92} label="Private profile" sub="δᵤ updates online" style={rise(1.2)} accent />
        {/* connectors */}
        <ALine x1={240} y1={y1 + 46} x2={300} y2={y1 + 46} style={fade(0.3)} flow />
        <ALine x1={520} y1={y1 + 46} x2={580} y2={y1 + 46} style={fade(0.45)} flow />
        <ALine x1={800} y1={y1 + 46} x2={860} y2={y1 + 46} style={fade(0.6)} flow />
        <ALine x1={1100} y1={y1 + 46} x2={1160} y2={y1 + 46} style={fade(0.75)} flow />
        <ALine x1={1400} y1={y1 + 46} x2={1440} y2={y1 + 46} style={fade(0.9)} flow />
        <ALine x1={1550} y1={y1 + 92} x2={1550} y2={y2} style={fade(1.05)} flow />
        <ALine x1={1440} y1={y2 + 46} x2={1400} y2={y2 + 46} style={fade(1.15)} flow />
        <ALine x1={1160} y1={y2 + 46} x2={1100} y2={y2 + 46} style={fade(1.25)} flow />
        <ALine x1={860} y1={y2 + 46} x2={980} y2={y2 + 46} style={fade(1.35)} />
        <ALine x1={980} y1={y2 + 46} x2={980} y2={y1 + 92} style={fade(1.45)} flow />
        <text x={1010} y={y1 + 122} fontFamily={mono} fontSize={16} fill={muted} style={fade(1.6)}>as-of features</text>
        {/* travelling pulse along the top row */}
        <circle r={8} fill={green} style={fly(240, y1 + 46, 1660, y1 + 46, 0.6, 4.5)} />
        <circle r={8} fill={amber} style={fly(1550, y2 + 46, 980, y2 + 46, 2.2, 4.5)} />
      </svg>
    </Shell>
  );
};

// ---------------------------------------------------------------- 8-9 model

const ModelExplain: Page = () => (
  <Shell section="02 · METHOD" kicker="The model" headline="Distran APC-1: would you rate this 4+ stars? Yes/no, learned from your own history." page="08" footnote="APC = adaptive preference classifier · logistic regression over 13 bounded features · trained online, predict-before-learn.">
    <div style={{ display: 'flex', gap: 56 }}>
      <div style={{ flex: 1.2, ...rise(0.15) }}>
        <div style={{ ...rise(0.2) }}>
          <Formula size={30}>p(u,i,c) = σ( b + bᵤ + (θ + δᵤ) · x(u,i,c) )</Formula>
        </div>
        <div style={{ marginTop: 22, ...rise(0.35) }}>
          <Bullets
            size={26}
            gap={14}
            items={[
              <><b>θ (shared prior):</b> what “users like this” generally — learned from everyone, so new users start sensible.</>,
              <><b>δᵤ (your residual):</b> what makes <i>you</i> different — updated after each of your ratings: <Formula size={20}>δᵤ += η·(y − p)·x, clipped</Formula></>,
              <>x = 13 bounded features: popularity, quality, domain, recency, your activity, your game/screen affinity, affinity×domain, collaborative percentile.</>,
            ]}
          />
        </div>
      </div>
      <div style={{ width: 500, ...rise(0.45) }}>
        <div style={{ fontFamily: mono, fontSize: 19, letterSpacing: '0.16em', color: subtle }}>THE 13 FEATURES</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 14 }}>
          {['item_pop_pct', 'item_quality', 'item_dom_game', 'item_dom_screen', 'item_recency_90d', 'user_activity', 'user_pos_rate', 'user_aff_game', 'user_aff_screen', 'user_recency_30d', 'aff×dom_game', 'aff×dom_screen', 'bpr_collab_pct'].map((f) => (
            <Chip key={f}>{f}</Chip>
          ))}
        </div>
        <div style={{ marginTop: 18, fontFamily: mono, fontSize: 18, color: subtle, lineHeight: 1.6 }}>
          y = 1 if rating ≥ 4 else 0 · unseen items are never treated as dislikes
        </div>
      </div>
    </div>
  </Shell>
);

// animated: update loop orbiting the model core
const ModelAnim: Page = () => (
  <Shell section="02 · METHOD" kicker="The model, animated" headline="Predict first, learn after — every rating nudges your private δᵤ." page="09" footnote="Update rule: δᵤ ← clip(δᵤ + η·clip‖(y−p)·x‖₁ − ηλ·δᵤ, ±10) · η=0.1, λ=0 selected on validation.">
    <svg width={1680} height={470} viewBox="0 0 1680 470">
      <circle cx={500} cy={235} r={170} fill="none" stroke={line} strokeWidth={1.6} strokeDasharray="5 9" style={{ transformOrigin: '500px 235px', animation: 'v2spin 24s linear infinite' }} />
      <circle cx={500} cy={235} r={95} fill="rgba(94,125,30,0.10)" stroke={green} strokeWidth={1.6} style={pop(0.1)} />
      <text x={500} y={228} textAnchor="middle" fontSize={26} fill={ink}>θ + δᵤ</text>
      <text x={500} y={258} textAnchor="middle" fontFamily={mono} fontSize={17} fill={muted}>your scoring weights</text>
      {/* orbiting event */}
      <g style={{ transformOrigin: '500px 235px', animation: 'v2orbit 6s linear infinite', ['--r' as never]: '170px' }}>
        <circle r={10} fill={green} />
      </g>
      {/* stages around the loop */}
      {[
        { a: 'candidate work x', x: 500, y: 20 },
        { a: 'predict p (before seeing label)', x: 820, y: 120 },
        { a: 'you rate it: y', x: 820, y: 350 },
        { a: 'update δᵤ, bᵤ (clipped)', x: 500, y: 450 },
        { a: 'better next prediction', x: 180, y: 350 },
      ].map((s, i) => (
        <g key={s.a} style={rise(0.3 + i * 0.25)}>
          <rect x={s.x - 150} y={s.y - 24} width={300} height={48} rx={12} fill={panel} stroke={line} />
          <text x={s.x} y={s.y + 6} textAnchor="middle" fontFamily={mono} fontSize={17} fill={ink}>{s.a}</text>
        </g>
      ))}
      {/* right side: delta bar growing */}
      <g style={rise(1.6)}>
        <text x={1050} y={120} fontFamily={mono} fontSize={19} fill={subtle}>YOUR PRIVATE ADJUSTMENT δᵤ</text>
        <rect x={1050} y={140} width={560} height={34} rx={8} fill={raised} stroke={line} />
        <rect x={1050} y={140} width={560} height={34} rx={8} fill={green} style={growx(1.7, 1.6)} />
        <text x={1050} y={210} fontFamily={mono} fontSize={17} fill={muted}>grows with each rating you give</text>
        <rect x={1050} y={250} width={560} height={120} rx={14} fill={panel} stroke={line} />
        <text x={1070} y={290} fontFamily={mono} fontSize={18} fill={ink}>weights stay interpretable:</text>
        <text x={1070} y={322} fontFamily={mono} fontSize={17} fill={muted}>popularity, quality and affinity×domain</text>
        <text x={1070} y={348} fontFamily={mono} fontSize={17} fill={muted}>carry the largest learned weights</text>
      </g>
    </svg>
  </Shell>
);

// ---------------------------------------------------------------- 10-11 encoders

const EncodersExplain: Page = () => (
  <Shell section="02 · METHOD" kicker="The text encoders" headline="Three ways to turn a description into numbers — each checked against a baseline." page="10" footnote="All trained from scratch in pure NumPy on a 20,000-document Kaggle corpus (TMDB movies + HowLongToBeat games), title-hash split.">
    <div style={{ ...rise(0.15) }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[
          ['TF-IDF + SVD', 'Term Frequency–Inverse Document Frequency + Singular Value Decomposition', 'turns text into 64-d vectors — the app’s serving encoder (v3)'],
          ['TextCNN', 'CNN — Convolutional Neural Network over word embeddings (Kim 2014)', 'benchmark: can text predict a work’s public score bucket?'],
          ['mini-GPT', 'GPT — Generative Pre-trained Transformer, decoder-only, next-token', 'benchmark: how well can a small model understand catalog text?'],
        ].map(([tag, full, role]) => (
          <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 28, border: `1px solid ${line}`, borderRadius: 14, background: panel, padding: '20px 28px' }}>
            <div style={{ width: 220, fontFamily: mono, fontSize: 24, color: green, flexShrink: 0 }}>{tag}</div>
            <div style={{ flex: 1, fontSize: 24, color: muted, lineHeight: 1.35 }}>{full}</div>
            <div style={{ width: 560, fontSize: 23, color: ink, lineHeight: 1.35, flexShrink: 0 }}>{role}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 26 }}>
        <Bullets
          size={26}
          gap={12}
          items={[
            <>Both neural encoders are implemented by hand in NumPy and <b>gradient-checked</b> — every step inspectable, no black box.</>,
            <>They are <b>benchmarks</b>: we only replace the serving encoder if a challenger beats it on relevance, not on vibes.</>,
          ]}
        />
      </div>
    </div>
  </Shell>
);

// animated: conv window sliding over tokens + next-word typing
const EncodersAnim: Page = () => (
  <Shell section="02 · METHOD" kicker="The text encoders, animated" headline="TextCNN slides a window over words; mini-GPT predicts the next word." page="11" footnote="TextCNN: conv1d k=3/4/5 ×16 filters → ReLU → max-pool → linear head (196,851 params). mini-GPT: 2 pre-LN blocks, d=48, 2 heads (808,128 params), 1,200 Adam steps.">
    <svg width={1680} height={470} viewBox="0 0 1680 470">
      {/* left: CNN sliding window */}
      <g style={rise(0.15)}>
        <text x={40} y={50} fontFamily={mono} fontSize={20} fill={green}>TextCNN — convolution window</text>
        {['a', 'souls-like', 'action', 'rpg', 'with', 'a', 'bleak', 'world'].map((w, i) => (
          <g key={i} style={rise(0.3 + i * 0.08)}>
            <rect x={40 + i * 180} y={80} width={168} height={56} rx={10} fill={panel} stroke={line} />
            <text x={40 + i * 180 + 84} y={115} textAnchor="middle" fontSize={21} fill={ink}>{w}</text>
          </g>
        ))}
        <rect x={40} y={72} width={3 * 180 - 12} height={72} rx={12} fill="none" stroke={green} strokeWidth={2.4} style={{ ['--dx' as never]: `${5 * 180}px`, animation: 'v2slide 5s ease-in-out infinite' }} />
        <text x={40} y={190} fontFamily={mono} fontSize={17} fill={muted}>window k=3 slides → patterns become features → ReLU → max-pool → score bucket</text>
        <AB x={40} y={220} w={300} h={70} label="conv1d ×3 widths" sub="16 filters each" num="1" style={rise(0.9)} />
        <ALine x1={340} y1={255} x2={380} y2={255} style={fade(1.0)} flow />
        <AB x={380} y={220} w={260} h={70} label="max-pool" sub="over time" num="2" style={rise(1.05)} />
        <ALine x1={640} y1={255} x2={680} y2={255} style={fade(1.15)} flow />
        <AB x={680} y={220} w={260} h={70} label="3-class head" sub="low / mid / high score" num="3" style={rise(1.2)} accent />
      </g>
      {/* right: GPT next-token */}
      <g style={rise(0.3)}>
        <text x={1060} y={50} fontFamily={mono} fontSize={20} fill={green}>mini-GPT — next-token prediction</text>
        <rect x={1060} y={80} width={580} height={120} rx={14} fill={panel} stroke={line} />
        {['a', 'bleak', 'space', 'opera', 'about'].map((w, i) => (
          <text key={i} x={1084 + i * 108} y={145} fontSize={24} fill={i < 4 ? ink : muted} style={fade(0.6 + i * 0.5)}>{w}</text>
        ))}
        <text x={1084 + 4 * 108} y={145} fontSize={24} fill={green} style={fade(2.8)}>a</text>
        <rect x={1084 + 4 * 108 + 22} y={122} width={3} height={30} fill={green} style={{ animation: 'v2blink 1s steps(1) infinite' }} />
        <text x={1060} y={240} fontFamily={mono} fontSize={17} fill={muted}>predicts each next word → the hidden state that does this</text>
        <text x={1060} y={264} fontFamily={mono} fontSize={17} fill={muted}>well is our content embedding (mean-pooled)</text>
        <AB x={1060} y={300} w={270} h={70} label="transformer ×2" sub="causal attention" num="1" style={rise(1.0)} />
        <ALine x1={1330} y1={335} x2={1370} y2={335} style={fade(1.1)} flow />
        <AB x={1370} y={300} w={270} h={70} label="val perplexity" sub="lower = better" num="2" style={rise(1.2)} accent />
        <circle cx={1660} cy={335} r={9} fill={green} style={pulse(0.4)} />
      </g>
    </svg>
  </Shell>
);

// ---------------------------------------------------------------- 12-13 training

const TrainingExplain: Page = () => (
  <Shell section="02 · METHOD" kicker="Training & evaluation" headline="Trained on a Colab CPU, tuned on validation, and the test set was read exactly once." page="12" footnote="colab CLI · pinned NumPy 2.2.6 / pandas 2.2.3 / scikit-learn 1.6.1 / kagglehub 0.4.3 · 10 checkpointed stages · 187 s final pass · SHA256 provenance.">
    <div style={{ display: 'flex', gap: 56 }}>
      <div style={{ flex: 1.1, ...rise(0.15) }}>
        <Bullets
          size={27}
          gap={16}
          items={[
            <><b>Data:</b> Amazon 5-core events, split <b>chronologically</b> 60 / 20 / 20 — the test really is the future. 39,600 train · 13,204 validation · 13,195 test events.</>,
            <><b>Protocol:</b> everything (vocabulary, SVD, BPR, feature stats) fit on train only; grid over η ∈ {'{0.05, 0.1}'} × λ ∈ {'{0, 0.01}'} picked on <b>validation log loss</b> (η=0.1, λ=0); test scored once.</>,
            <><b>Hypotheses before the test read:</b> H1 per-user tweak improves rating prediction · H2 it improves top-10 ranking · H3 mini-GPT ≪ unigram perplexity · H4 TextCNN beats majority · H5 nothing promoted without app-side eval.</>,
          ]}
        />
      </div>
      <div style={{ width: 540, ...rise(0.4) }}>
        <div style={{ fontFamily: mono, fontSize: 19, letterSpacing: '0.16em', color: subtle }}>COLAB CLI</div>
        <div style={{ fontFamily: mono, fontSize: 21, lineHeight: 1.75, background: panel, border: `1px solid ${line}`, borderRadius: 14, padding: '20px 26px', color: '#3c3a33', marginTop: 14 }}>
          <div><span style={{ color: green }}>colab</span> new -s distran-adaptive-run</div>
          <div><span style={{ color: green }}>colab</span> exec -s … 05_adaptive….ipynb</div>
          <div><span style={{ color: green }}>colab</span> download -s … results.zip</div>
          <div><span style={{ color: green }}>colab</span> stop -s distran-adaptive-run</div>
        </div>
      </div>
    </div>
  </Shell>
);

// animated: split bars grow, stages step, test locked
const TrainingAnim: Page = () => (
  <Shell section="02 · METHOD" kicker="Training & evaluation, animated" headline="Chronological split: train on the past, tune on the middle, read the future once." page="13" footnote="Group split for encoders: title-hash buckets 0–5 / 6–7 / 8–9. Metrics: NDCG@10, Recall@10, log loss, Brier, reliability, bootstrap CIs.">
    <svg width={1680} height={470} viewBox="0 0 1680 470">
      {/* split bar */}
      <g style={rise(0.15)}>
        <text x={40} y={60} fontFamily={mono} fontSize={20} fill={subtle}>AMAZON EVENTS, IN TIME ORDER</text>
        <rect x={40} y={80} width={1600} height={64} rx={10} fill={raised} stroke={line} />
        <rect x={40} y={80} width={960} height={64} rx={10} fill="#c9d69a" style={growx(0.3, 1.0)} />
        <rect x={1000} y={80} width={320} height={64} fill="#dfe7c4" style={growx(0.8, 0.8)} />
        <rect x={1320} y={80} width={320} height={64} rx={10} fill="#eef3dd" style={growx(1.3, 0.8)} />
        <text x={520} y={120} textAnchor="middle" fontSize={22} fill={ink}>train 39,600</text>
        <text x={1160} y={120} textAnchor="middle" fontSize={22} fill={ink}>valid 13,204</text>
        <text x={1480} y={120} textAnchor="middle" fontSize={22} fill={ink}>test 13,195</text>
        <g style={pop(2.0)}>
          <rect x={1400} y={160} width={180} height={44} rx={10} fill={panel} stroke={green} strokeWidth={1.6} />
          <text x={1490} y={188} textAnchor="middle" fontFamily={mono} fontSize={17} fill={green}>🔒 read once</text>
        </g>
      </g>
      {/* stages */}
      {[
        ['fit vocab/SVD/BPR', 40], ['train θ (SGD)', 400], ['grid η × λ on valid', 760],
        ['pick η=0.1 λ=0', 1120], ['score test once', 1480],
      ].map(([label, x], i) => (
        <g key={label as string}>
          <AB x={x} y={280} w={220} h={76} label={label as string} style={rise(0.4 + i * 0.35)} accent={i === 4} />
          {i < 4 && <ALine x1={x + 220} y1={318} x2={x + 400 - 20} y2={318} style={fade(0.6 + i * 0.35)} flow />}
        </g>
      ))}
      <text x={40} y={430} fontFamily={mono} fontSize={18} fill={subtle} style={fade(2.2)}>
        leakage controls: train-only fitting · cold items counted, not retrieved · SHA256 of every input in provenance.json
      </text>
    </svg>
  </Shell>
);

// ---------------------------------------------------------------- 14-15 results

const ResultsExplain: Page = () => (
  <Shell section="03 · RESULTS" kicker="Results vs expectations" headline="Two of five hypotheses confirmed — the honest scoreboard." page="14" footnote="Test: 13,195 heldout events · 303 evaluated users · NDCG@10 = Normalized Discounted Cumulative Gain at list length 10.">
    <div style={{ ...rise(0.15) }}>
      <Table
        rowH={72}
        size={25}
        cols={[
          { label: 'hypothesis', w: 520 },
          { label: 'expected', w: 560 },
          { label: 'actual (heldout test)', w: 600 },
        ]}
        rows={[
          ['H1 · δᵤ improves rating prediction', 'a few own ratings help', 'CONFIRMED — log loss 2.729 → 1.746 (−36%)'],
          ['H2 · δᵤ improves top-10 ranking', 'maybe, cold items dominate', 'NOT CONFIRMED — NDCG@10 a tie'],
          ['H3 · mini-GPT ≪ unigram perplexity', 'yes, real language model', 'CONFIRMED — 2,047 → 34.7 (59×)'],
          ['H4 · TextCNN beats majority', 'unsure', 'NOT CONFIRMED — acc 0.536 vs 0.598 majority'],
          ['H5 · promote only with app-side eval', 'hold', 'HELD — nothing promoted to the app'],
        ]}
      />
      <div style={{ marginTop: 22, fontSize: 25, color: muted, lineHeight: 1.5 }}>
        What this means: the per-user tweak genuinely improves “would you rate this ≥ 4?” predictions — but at 24k-item scale,
        cold items dominate top-10 retrieval, so ranking didn’t move. Popularity still edges the small game cohort (0.0161 vs 0.0120 NDCG@10).
      </div>
    </div>
  </Shell>
);

// animated: bars comparing baseline vs ours
const ResultsAnim: Page = () => (
  <Shell section="03 · RESULTS" kicker="Results, animated" headline="Prediction got 36% better; ranking didn’t move — and we say so." page="15" footnote="Bars drawn to scale within each metric (lower is better). Single fixed split, no significance claims; bootstrap CIs overlap on all ranking rows.">
    <svg width={1680} height={470} viewBox="0 0 1680 470">
      {/* log loss */}
      <g style={rise(0.15)}>
        <text x={40} y={56} fontFamily={mono} fontSize={20} fill={subtle}>TEST LOG LOSS (13,195 events) ↓</text>
        <text x={40} y={100} fontSize={22} fill={muted}>shared only</text>
        <rect x={240} y={80} width={2.7292 * 300} height={40} rx={8} fill={raised} stroke={line} />
        <text x={240} y={107} fontFamily={mono} fontSize={19} fill={subtle} style={{ animation: 'none' }}> </text>
        <text x={250 + 2.7292 * 300} y={107} fontFamily={mono} fontSize={19} fill={muted}>2.729</text>
        <text x={40} y={160} fontSize={22} fill={ink}>adaptive</text>
        <rect x={240} y={140} width={1.7458 * 300} height={40} rx={8} fill={green} style={growx(0.4, 1.2)} />
        <text x={250 + 1.7458 * 300} y={167} fontFamily={mono} fontSize={19} fill={green}>1.746 (−36%)</text>
      </g>
      {/* perplexity */}
      <g style={rise(0.5)}>
        <text x={40} y={250} fontFamily={mono} fontSize={20} fill={subtle}>MINI-GPT VAL PERPLEXITY ↓</text>
        <text x={40} y={294} fontSize={22} fill={muted}>unigram</text>
        <rect x={240} y={274} width={1200} height={40} rx={8} fill={raised} stroke={line} />
        <text x={1455} y={301} fontFamily={mono} fontSize={19} fill={muted}>2,047</text>
        <text x={40} y={354} fontSize={22} fill={ink}>mini-GPT</text>
        <rect x={240} y={334} width={20} height={40} rx={8} fill={green} style={growx(0.9, 1.0)} />
        <text x={275} y={361} fontFamily={mono} fontSize={19} fill={green}>34.7 (59× better)</text>
      </g>
      {/* NDCG tie */}
      <g style={rise(0.85)}>
        <text x={40} y={440} fontFamily={mono} fontSize={20} fill={subtle}>NDCG@10, ALL COHORT — shared vs adaptive</text>
        <rect x={760} y={418} width={4} height={44} fill={subtle} style={growx(1.2, 0.8)} />
        <rect x={770} y={418} width={4} height={44} fill={green} style={growx(1.3, 0.8)} />
        <text x={790} y={446} fontFamily={mono} fontSize={19} fill={amber}>0.0010 vs 0.0010 — a tie (H2 not confirmed)</text>
      </g>
      <circle cx={1560} cy={110} r={10} fill={green} style={pulse(0.2)} />
      <circle cx={1560} cy={304} r={10} fill={green} style={pulse(0.6)} />
      <circle cx={1560} cy={440} r={10} fill={amber} style={pulse(1.0)} />
    </svg>
  </Shell>
);

// ---------------------------------------------------------------- 16-17 learnings

const Learnings: Page = () => (
  <Shell section="03 · RESULTS" kicker="Learnings & next steps" headline="Small, online and honestly evaluated beat big and static — at this scale." page="16" footnote="Pointwise gain ≠ ranking gain: each must be measured in its own metric. Full report: ml/notebooks/results/adaptive/report.json.">
    <div style={{ display: 'flex', gap: 48 }}>
      <div style={{ flex: 1, ...rise(0.15) }}>
        <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: '0.16em', color: green }}>WHAT WORKED</div>
        <div style={{ marginTop: 14 }}>
          <Bullets
            size={26}
            gap={14}
            items={[
              <>Per-user residual δᵤ: −36% log loss on heldout events — real signal from a few ratings</>,
              <>mini-GPT in pure NumPy: perplexity 34.7 vs 2,047 unigram — language structure is learnable even at d=48</>,
              <>Reproducible Colab pipeline: pinned versions, checkpointed stages, SHA256 provenance, 16 unit tests</>,
            ]}
          />
        </div>
      </div>
      <div style={{ flex: 1, ...rise(0.35) }}>
        <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: '0.16em', color: amber }}>WHAT DIDN’T / LIMITS</div>
        <div style={{ marginTop: 14 }}>
          <Bullets
            size={26}
            gap={14}
            items={[
              <>No top-10 gain at 24k items — 8,718 heldout positives are unseen items; popularity stays competitive</>,
              <>TextCNN ≤ majority on score buckets; encoders don’t replace the serving SVD (probe Jaccard 0.10–0.32)</>,
              <>Probabilities miscalibrated across time (base-rate shift) — rank with scores, don’t quote them as chances</>,
            ]}
          />
        </div>
      </div>
    </div>
    <div style={{ marginTop: 26, border: `1px solid ${line}`, borderLeft: `3px solid var(--osd-accent)`, borderRadius: 12, background: 'rgba(94,125,30,0.07)', padding: '18px 26px', fontSize: 25, lineHeight: 1.5, ...rise(0.55) }}>
      <b>Next:</b> add an event/impression ledger in the app → run the APC on-device, benchmarked against today’s fixed-weight
      ranker (the rollback) → only then consider LightFM/CatBoost challengers and logged exploration (bandits).
    </div>
  </Shell>
);

// animated: promotion gate — hypotheses badges pop in, gate stays shut for promotion
const GateAnim: Page = () => (
  <Shell section="03 · RESULTS" kicker="Learnings, animated" headline="Evidence first: the gate to the app stays shut until an app-side eval opens it." page="17" footnote="H5 held: Amazon IDs ≠ app catalog IDs, no impression ledger — so no artifact was promoted; the fixed-weight ranker remains live.">
    <svg width={1680} height={470} viewBox="0 0 1680 470">
      {/* pipeline toward gate */}
      <AB x={40} y={180} w={260} h={90} label="research model" sub="APC-1 artifacts" num="1" style={rise(0.2)} />
      <ALine x1={300} y1={225} x2={520} y2={225} style={fade(0.4)} flow />
      <AB x={520} y={180} w={300} h={90} label="heldout evaluation" sub="this project" num="2" style={rise(0.45)} accent />
      <ALine x1={820} y1={225} x2={1040} y2={225} style={fade(0.7)} flow />
      {/* gate */}
      <g style={rise(0.9)}>
        <rect x={1040} y={120} width={26} height={210} rx={6} fill={amber} />
        <rect x={1066} y={120} width={26} height={210} rx={6} fill={amber} />
        <rect x={1040} y={110} width={52} height={220} rx={8} fill="none" stroke={amber} strokeWidth={2} strokeDasharray="8 8" />
        <text x={1066} y={360} textAnchor="middle" fontFamily={mono} fontSize={17} fill={amber}>gate: app-side eval</text>
      </g>
      <ALine x1={1092} y1={225} x2={1260} y2={225} style={fade(1.1)} flow />
      <AB x={1260} y={180} w={300} h={90} label="the app" sub="fixed ranker stays live" num="3" style={rise(1.1)} />
      <circle r={8} fill={amber} style={fly(300, 225, 1040, 225, 0.8, 3.5)} />
      {/* verdict badges */}
      {[
        ['H1 ✓', 40, true], ['H3 ✓', 230, true], ['H2 ✗', 420, false], ['H4 ✗', 610, false], ['H5 held', 800, false],
      ].map(([b, x, ok], i) => (
        <g key={b as string} style={pop(1.2 + i * 0.22)}>
          <rect x={x as number} y={410} width={150} height={46} rx={10} fill={panel} stroke={ok ? green : line} strokeWidth={1.6} />
          <text x={(x as number) + 75} y={439} textAnchor="middle" fontFamily={mono} fontSize={18} fill={ok ? green : muted}>{b}</text>
        </g>
      ))}
      <text x={1010} y={410} fontFamily={mono} fontSize={18} fill={muted} style={fade(1.6)}>verdicts from the heldout test</text>
    </svg>
  </Shell>
);

// ---------------------------------------------------------------- 18-19 close

const Thanks: Page = () => (
  <div style={{ ...fill, background: 'var(--osd-bg)', color: 'var(--osd-text)', padding: '44px 64px' }}>
    <div
      style={{
        background: 'radial-gradient(900px 600px at 50% 0%, rgba(94,125,30,0.13), transparent 60%), var(--osd-bg)',
        border: `1px solid ${line}`,
        borderRadius: 24,
        height: '100%',
        padding: '64px 72px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ fontFamily: mono, fontSize: 21, letterSpacing: '0.2em', textTransform: 'uppercase', color: green }}>
        Distran · AI unit semester project
      </div>
      <h1 style={{ fontFamily: 'var(--osd-font-display)', fontSize: 120, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '36px 0 26px' }}>
        Thank you —<br />any questions?
      </h1>
      <p style={{ fontSize: 32, color: muted, lineHeight: 1.4 }}>
        All code, notebooks, measured results and both decks are in the repo:
      </p>
      <div style={{ fontFamily: mono, fontSize: 25, color: green, marginTop: 16 }}>github.com/alvinkgithubschool/Distran</div>
      <div style={{ display: 'flex', gap: 20, marginTop: 52 }}>
        {[['169183', 'Hussein'], ['167602', 'Alvin'], ['190003', 'Issa']].map(([id, name]) => (
          <div key={id} style={{ border: `1px solid ${line}`, borderRadius: 14, padding: '15px 24px', background: panel }}>
            <span style={{ fontFamily: mono, fontSize: 19, color: green }}>{id}</span>
            <span style={{ fontSize: 25, marginLeft: 14 }}>{name}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 40, fontFamily: mono, fontSize: 18, color: subtle }}>19 / 19</div>
    </div>
  </div>
);

const Sources: Page = () => (
  <Shell kicker="Appendix" section="SOURCES" headline="Sources and references" page="19" footnote="Links are clickable in the live page; full URLs shown here.">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center', height: '100%' }}>
      {[
        ['Ada-Pref — Adaptive Preference Scaling for RLHF (per-instance preference strength; motivates per-user δᵤ)', 'Hong et al.', 'https://arxiv.org/abs/2406.02764'],
        ['Amazon Reviews — 5-core ratings release (interaction corpus)', 'Ni et al.', 'https://amazon-reviews-2023.github.io/data_processing/5core.html'],
        ['TMDB popular movies 10k (movie metadata corpus)', 'Kaggle · balaka18', 'https://www.kaggle.com/datasets/balaka18/tmdb-top-10000-popular-movies-dataset'],
        ['Video game sales with ratings (game metadata)', 'Kaggle · rush4ratio', 'https://www.kaggle.com/datasets/rush4ratio/video-game-sales-with-ratings'],
        ['HowLongToBeat snapshot (newer game metadata)', 'Kaggle · zaireali', 'https://www.kaggle.com/datasets/zaireali/howlongtobeat-games-scraper-2162025'],
        ['LightFM — hybrid recommender (considered, deferred)', 'Kula', 'https://arxiv.org/abs/1507.08439'],
        ['LinUCB — contextual bandits (deferred until logged exposures)', 'Li et al.', 'https://arxiv.org/abs/1003.0146'],
        ['Probability calibration guidance (log loss / Brier / reliability)', 'scikit-learn docs', 'https://scikit-learn.org/stable/modules/calibration.html'],
        ['TMDB API · IGDB API (live catalog providers)', 'themoviedb.org · api.igdb.com', 'https://www.themoviedb.org/ · https://api.igdb.com/'],
        ['Distran repository — notebooks 03–05, results, tests, decks', 'this project', 'https://github.com/alvinkgithubschool/Distran'],
      ].map(([label, who, url]) => (
        <div key={url} style={{ display: 'flex', alignItems: 'baseline', gap: 24, border: `1px solid ${line}`, borderRadius: 12, background: panel, padding: '9px 22px' }}>
          <div style={{ flex: 1, fontSize: 22, lineHeight: 1.3 }}>
            {label}
            <span style={{ color: subtle, fontSize: 18, marginLeft: 14 }}>{who}</span>
          </div>
          <a href={url} target="_blank" rel="noreferrer" style={{ fontFamily: mono, fontSize: 17, color: green, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            {url.length > 62 ? url.slice(0, 62) + '…' : url}
          </a>
        </div>
      ))}
    </div>
  </Shell>
);

export const meta: SlideMeta = {
  title: 'Distran — adaptive recommendations, v2 (plain-language + animated diagrams)',
  createdAt: '2026-11-23T10:00:00.000Z',
};

export const notes: (string | undefined)[] = [
  'Hussein: Distran is a ledger across films, TV and games. This deck is the plain-language version of our ML project: what we built, why, and what the heldout numbers said.',
  'Hussein: the goal. Today the app ranks with fixed weights — same for everyone. We want discovery that learns your habits and patterns and grows with you, from just a few explicit signals.',
  'Hussein: watch the animation — every rating you give lands in your private profile, and the profile sharpens. That loop is the whole idea of this project.',
  'Hussein: where we started. Notebook 03: a classic BPR recommender on a large Amazon dataset — popularity actually beat it on validation, so we disabled it. Notebook 04: predicting public scores from text worked, but that is what everyone thinks, not what you like. So notebook 05 learns your taste from your own ratings.',
  'Hussein: the timeline. Three experiments, three lessons: a proxy corpus exists; popularity beats BPR on sparse data; public score is not personal taste. Each ruled out an approach and pointed to the next.',
  'Hussein: why this approach. A small online model — shared prior plus your private tweak, an adaptive preference classifier — fits the constraints: few ratings, cold items, no logged impressions. Idea borrowed from Ada-Pref. The alternatives were ruled out for concrete reasons, listed on the right.',
  'Hussein: the system in one loop. Candidates come from the live catalog, hard filters remove ineligible works, the classifier scores, diversity reorders, and your ratings feed back into your profile. Learned weights only reorder what the rules allow.',
  'Alvin: the model in one formula. It answers: would you rate this 4+ stars? Theta is what users generally like; delta is what makes you different, updated from each of your ratings. Thirteen bounded features, all named on the right.',
  'Alvin: the update loop, animated. Predict before seeing the label, then nudge delta with the error, clipped. Over time your private adjustment grows — and the weights stay interpretable.',
  'Alvin: the encoders, with full names. TF-IDF plus SVD is the serving encoder; TextCNN and mini-GPT are from-scratch NumPy benchmarks, gradient-checked, each measured against a trivial baseline so the numbers mean something.',
  'Alvin: the two encoder animations. Left: a convolution window sliding over description words, pooling to a score bucket. Right: the mini-GPT predicting each next word — the representation that does this well is the embedding.',
  'Alvin: training and evaluation protocol. Chronological 60/20/20 split — test is genuinely the future. Everything fit on train only, hyperparameters picked on validation, test read once. Five hypotheses registered before the test read.',
  'Alvin: the animated split. Train on the past, tune on the middle, and the test is locked until the final read.',
  'Issa: the scoreboard. H1 confirmed — log loss down 36%. H3 confirmed — perplexity down 59×. H2 and H4 not confirmed — ranking didn’t move and TextCNN didn’t beat majority. H5 held — nothing promoted.',
  'Issa: the bars. Prediction error shrinks a third; the language model collapses perplexity; ranking is a literal tie. We report the misses as clearly as the wins.',
  'Issa: learnings. Small, online, honestly evaluated beat big and static at this scale. Pointwise gains are not ranking gains. Next: an event ledger in the app, then on-device adaptive scoring benchmarked against today’s ranker.',
  'Issa: the gate. Research artifacts flow through heldout evaluation; the gate to the app — an app-side evaluation — stays shut, so the fixed-weight ranker remains live. The hypothesis badges show the verdicts.',
  'All: thank you — happy to take questions. Everything is reproducible from the repo, and the sources are next.',
  'Appendix: sources — the Ada-Pref paper that inspired per-user adaptation, the datasets, the deferred alternatives, calibration guidance, the live catalog providers, and the repo itself. Links clickable in the live page.',
];

export default [
  Cover,
  GoalExplain,
  GoalAnim,
  StartedExplain,
  StartedAnim,
  WhyExplain,
  WhyAnim,
  ModelExplain,
  ModelAnim,
  EncodersExplain,
  EncodersAnim,
  TrainingExplain,
  TrainingAnim,
  ResultsExplain,
  ResultsAnim,
  Learnings,
  GateAnim,
  Thanks,
  Sources,
] satisfies Page[];
