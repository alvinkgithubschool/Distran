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
@keyframes v2slide3 { 0%, 20% { transform: translateX(0); } 32%, 54% { transform: translateX(136px); } 66%, 90% { transform: translateX(272px); } 100% { transform: translateX(0); } }
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
const TOTAL = 25;

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
          marginTop: 36,
        }}
      >
        {kicker}
      </div>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 60,
          fontWeight: 400,
          letterSpacing: '-0.025em',
          lineHeight: 1.08,
          margin: '14px 0 0',
          maxWidth: 1540,
        }}
      >
        {headline}
      </h2>
      <div style={{ flex: 1, marginTop: 32, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>{children}</div>
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
          {page} / {TOTAL}
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
      padding: '16px 24px',
      color: ink,
      width: 'fit-content',
      lineHeight: 1.45,
    }}
  >
    {children}
  </div>
);

const Chip = ({ children, hot = false }: { children: ReactNode; hot?: boolean }) => (
  <span
    style={{
      fontFamily: mono,
      fontSize: 18,
      border: `1px solid ${hot ? green : line}`,
      borderRadius: 999,
      padding: '6px 14px',
      background: hot ? 'rgba(94,125,30,0.07)' : panel,
      color: hot ? green : '#45433b',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
);

// wrapping table: cells grow vertically instead of clipping text
const WTable = ({
  cols,
  rows,
  rowH = 56,
  size = 23,
}: {
  cols: { label: string; w: number }[];
  rows: ReactNode[][];
  rowH?: number;
  size?: number;
}) => (
  <div style={{ border: `1px solid ${line}`, borderRadius: 14, overflow: 'hidden', background: panel, width: 1600 }}>
    <div style={{ display: 'flex', background: raised }}>
      {cols.map((c, i) => (
        <div
          key={i}
          style={{
            boxSizing: 'border-box',
            width: c.w,
            padding: '13px 20px',
            fontFamily: mono,
            fontSize: 16,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: subtle,
            lineHeight: 1.3,
          }}
        >
          {c.label}
        </div>
      ))}
    </div>
    {rows.map((r, ri) => (
      <div key={ri} style={{ display: 'flex', borderTop: `1px solid ${line}`, minHeight: rowH }}>
        {r.map((cell, ci) => (
          <div
            key={ci}
            style={{
              boxSizing: 'border-box',
              width: cols[ci].w,
              padding: '11px 20px',
              display: 'flex',
              alignItems: 'center',
              fontSize: ci === 0 ? size : size - 2,
              color: ci === 0 ? ink : muted,
              lineHeight: 1.3,
            }}
          >
            <div style={{ width: '100%' }}>{cell}</div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

const Legend = ({ items }: { items: [string, string][] }) => (
  <div style={{ display: 'flex', gap: 14 }}>
    {items.map(([k, v]) => (
      <div
        key={k}
        style={{
          border: `1px solid ${line}`,
          borderRadius: 12,
          background: panel,
          padding: '12px 18px',
          minWidth: 200,
        }}
      >
        <div style={{ fontFamily: mono, fontSize: 15, letterSpacing: '0.12em', color: subtle, textTransform: 'uppercase' }}>
          {k}
        </div>
        <div style={{ fontSize: 21, color: ink, marginTop: 4 }}>{v}</div>
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
      <text x={x + 15} y={y + 25} fill={green} fontFamily={mono} fontSize={17}>
        {num}
      </text>
    )}
    <text x={x + w / 2} y={y + h / 2 - (sub ? 10 : 0) + (num ? 4 : 0)} textAnchor="middle" fill={ink} fontSize={22}>
      {label}
    </text>
    {sub && (
      <text x={x + w / 2} y={y + h / 2 + 22} textAnchor="middle" fill={muted} fontFamily={mono} fontSize={15}>
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

// horizontal arrow with head: the workhorse of every diagram on this deck
const ATo = ({
  x1, y1, x2, y2, delay = 0,
}: { x1: number; y1: number; x2: number; y2: number; delay?: number }) => {
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const gap = 9;
  const ex = x2 - gap * Math.cos((angle * Math.PI) / 180);
  const ey = y2 - gap * Math.sin((angle * Math.PI) / 180);
  return (
    <g style={fade(delay)}>
      <ALine x1={x1} y1={y1} x2={ex} y2={ey} flow />
      <AArrowHead x={ex} y={ey} angle={angle} />
    </g>
  );
};

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
        Google Colab CPU via colab CLI · NumPy 2.2.6 · 16 unit tests passing · 25 slides
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
          gap={22}
          items={[
            <><b>Today</b> the app ranks picks with fixed weights — the same formula for everyone, forever.</>,
            <><b>The ambition:</b> a system that notices what you rate, favourite and finish, picks up the pattern, and surfaces things <i>no one else would have shown you</i>.</>,
            <><b>Hard constraints:</b> very few ratings per person, brand-new works arriving daily (cold start), and no logged impressions in the app yet.</>,
            <><b>So the model</b> learns from explicit feedback only, adapts per user, and is evaluated honestly before it touches the app.</>,
          ]}
        />
      </div>
      <div style={{ width: 540, ...rise(0.35) }}>
        <div style={{ fontFamily: mono, fontSize: 19, letterSpacing: '0.16em', color: subtle }}>WHAT “GROWS WITH YOU” MEANS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
          {[
            ['few signals', 'learns from a handful of your ratings'],
            ['your patterns', 'games vs screen, recency, activity'],
            ['keeps adapting', 'every rating updates your private profile'],
          ].map(([a, b]) => (
            <div key={a} style={{ border: `1px solid ${line}`, borderRadius: 12, background: panel, padding: '16px 22px' }}>
              <div style={{ fontFamily: mono, fontSize: 21, color: green }}>{a}</div>
              <div style={{ fontSize: 22, color: muted, marginTop: 6, lineHeight: 1.35 }}>{b}</div>
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
  const cy = 290;
  const r = 164;
  const spokes = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return { deg, tx: cx + r * Math.cos(rad), ty: cy + r * Math.sin(rad) };
  });
  const starts = [
    [200, 76], [130, 300], [270, 414], [1500, 250],
    [1524, 396], [1400, 496], [640, 58], [1060, 540],
  ];
  return (
    <Shell section="01 · INTRODUCTION" kicker="The goal, animated" headline="Each rating you give lands in your profile — the more you rate, the sharper it gets." page="03" footnote="Schematic of the private per-user profile: long-term + recent signals with decay.">
      <svg width={1680} height={583} viewBox="0 0 1680 583" style={{ display: 'block' }}>
        <circle cx={cx} cy={cy} r={r + 38} fill="none" stroke={line} strokeWidth={1.4} strokeDasharray="4 10" style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'v2spin 40s linear infinite' }} />
        {spokes.map((sp, i) => (
          <circle key={i} cx={sp.tx} cy={sp.ty} r={11} fill={i % 2 ? green : amber} style={pop(0.3 + i * 0.18)} />
        ))}
        {starts.map((st, i) => {
          const t = spokes[i % spokes.length];
          return (
            <circle key={`f${i}`} r={7} fill={green} style={fly(st[0], st[1], t.tx, t.ty, 0.4 + i * 0.35, 3.6)} />
          );
        })}
        <circle cx={cx} cy={cy} r={100} fill="#eef3dd" stroke={green} strokeWidth={1.6} style={pop(0.1)} />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={30} fill={ink}>your</text>
        <text x={cx} y={cy + 30} textAnchor="middle" fontSize={30} fill={ink}>profile</text>
        <g style={fade(0.9)}>
          <line x1={470} y1={496} x2={726} y2={418} stroke={subtle} strokeWidth={1.8} strokeDasharray="5 8" style={march} />
          <AArrowHead x={726} y={418} angle={-17} />
          <line x1={1210} y1={108} x2={962} y2={186} stroke={subtle} strokeWidth={1.8} strokeDasharray="5 8" style={march} />
          <AArrowHead x={962} y={186} angle={160} />
        </g>
        <g style={rise(1.4)} fontFamily={mono} fontSize={19} fill={muted}>
          <rect x={22} y={440} width={444} height={104} rx={18} fill={panel} stroke={line} strokeWidth={1.2} />
          <text x={48} y={490}>rating events</text>
          <text x={48} y={518} fill={subtle} fontSize={18}>★ · favourite · finished</text>
          <rect x={1204} y={54} width={452} height={104} rx={18} fill={panel} stroke={line} strokeWidth={1.2} />
          <text x={1230} y={104}>accumulated taste signals</text>
          <text x={1230} y={132} fill={subtle} fontSize={18}>long-term + recent, decayed</text>
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
        gap={20}
        items={[
          <><b>First attempt:</b> BPR (Bayesian Personalized Ranking) — a matrix-factorisation recommender — plus popularity, on the Amazon 5-core dataset. On validation, <b>plain popularity beat the learned model</b> (NDCG@10 0.0184 vs 0.0105), so collaborative weight was set to 0.</>,
          <><b>Second attempt:</b> predict a work’s <i>public</i> score from its text — TF-IDF (Term Frequency–Inverse Document Frequency) + SVD (Singular Value Decomposition) over TMDB and HowLongToBeat metadata. It worked — but it predicts <b>what everyone thinks, not what you like</b>.</>,
          <><b>So the next step:</b> a model that learns <b>your</b> taste from <b>your own</b> ratings — the subject of this deck.</>,
        ]}
      />
    </div>
  </Shell>
);

// animated: timeline of iterations, dot marching through, lessons popping
const StartedAnim: Page = () => {
  const y = 310;
  const nodes = [
    { x: 190, tag: 'NB 01–02', t: 'Amazon data audit', s: 'cross-media proxy corpus' },
    { x: 570, tag: 'NB 03', t: 'BPR recommender', s: 'popularity wins on sparse data' },
    { x: 950, tag: 'NB 04', t: 'text → public score', s: 'not the same as personal taste' },
    { x: 1330, tag: 'NB 05', t: 'adaptive classifier', s: 'this project', accent: true },
  ];
  return (
    <Shell section="01 · INTRODUCTION" kicker="Where we started, animated" headline="Three experiments, three lessons — each one ruled out an approach." page="05" footnote="NB = notebook number in ml/notebooks. The same deterministic user sample is used across runs, so cohorts stay comparable.">
      <svg width={1680} height={583} viewBox="0 0 1680 583" style={{ display: 'block' }}>
        <line x1={50} y1={y} x2={1630} y2={y} stroke={line} strokeWidth={3} />
        <line x1={50} y1={y} x2={1630} y2={y} stroke={green} strokeWidth={3} style={{ ...march, animationDuration: '2.2s' }} />
        <circle r={9} fill={green} style={fly(50, y, 1630, y, 0.2, 7)} />
        {nodes.map((n, i) => (
          <g key={n.tag}>
            <circle cx={n.x} cy={y} r={16} fill={n.accent ? green : panel} stroke={green} strokeWidth={2} style={pop(0.25 + i * 0.3)} />
            <g style={rise(0.35 + i * 0.3)}>
              <rect x={n.x - 152} y={y - 190} width={304} height={122} rx={14} fill={n.accent ? 'rgba(94,125,30,0.10)' : panel} stroke={n.accent ? green : line} strokeWidth={1.4} />
              <text x={n.x - 132} y={y - 156} fontFamily={mono} fontSize={17} fill={green}>{n.tag}</text>
              <text x={n.x} y={y - 116} textAnchor="middle" fontSize={23} fill={ink}>{n.t}</text>
              <text x={n.x} y={y - 88} textAnchor="middle" fontFamily={mono} fontSize={15} fill={muted}>{n.s}</text>
            </g>
            <g style={rise(0.5 + i * 0.3)}>
              <rect x={n.x - 152} y={y + 56} width={304} height={104} rx={12} fill={raised} stroke={line} />
              <text x={n.x} y={y + 88} textAnchor="middle" fontFamily={mono} fontSize={16} fill={amber}>→ lesson {i + 1}</text>
              <text x={n.x} y={y + 116} textAnchor="middle" fontSize={18} fill={muted}>
                {['proxy corpus exists', 'popularity > BPR here', 'public score ≠ taste', 'learn the user'][i]}
              </text>
              <text x={n.x} y={y + 142} textAnchor="middle" fontFamily={mono} fontSize={14} fill={subtle}>
                {['so we can train on it', 'so collaborative weight → 0', 'so predict your rating', 'the model in this deck'][i]}
              </text>
            </g>
            <line x1={n.x} y1={y - 68} x2={n.x} y2={y - 17} stroke={subtle} strokeWidth={1.6} style={fade(0.3 + i * 0.3)} />
            <line x1={n.x} y1={y + 17} x2={n.x} y2={y + 56} stroke={subtle} strokeWidth={1.6} style={fade(0.3 + i * 0.3)} />
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
          size={27}
          gap={18}
          items={[
            <><b>The target</b> is discovery that grows with you — from a handful of ratings, on works that do not exist in any training set.</>,
            <><b>The choice:</b> an APC — adaptive preference classifier. One shared prior θ learned from everyone, plus a private residual δᵤ updated from each of your ratings: <Formula size={23}>p = σ( b + bᵤ + (θ + δᵤ) · x )</Formula></>,
            <><b>Why it fits:</b> a new user is sensible from θ; a few ratings move δᵤ; the weights stay readable; and it ships as a small local file — <b>no GPU</b>.</>,
            <><b>Alongside it:</b> two from-scratch neural encoders (CNN and GPT style) as challengers, to test whether bigger text models actually help.</>,
          ]}
        />
      </div>
      <div style={{ width: 520, ...rise(0.4) }}>
        <div style={{ fontFamily: mono, fontSize: 19, letterSpacing: '0.16em', color: subtle }}>WHY NOT THE ALTERNATIVES</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {[
            ['parameter averaging', 'incompatible artifacts — ruled out'],
            ['LightFM / CatBoost', 'need more interaction data first'],
            ['contextual bandits', 'need logged exposures first'],
            ['big two-tower nets', 'no measured need at this scale'],
          ].map(([a, b]) => (
            <div key={a} style={{ border: `1px solid ${line}`, borderRadius: 12, background: panel, padding: '14px 20px' }}>
              <div style={{ fontSize: 23 }}>{a}</div>
              <div style={{ fontFamily: mono, fontSize: 16, color: muted, marginTop: 5 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Shell>
);

// animated: single spine of stages plus one clear return path for feedback
const PipelineAnim: Page = () => {
  const y = 100;
  const h = 96;
  const w = 187;
  const gap = 20;
  const x0 = 22;
  const xs = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => x0 + i * (w + gap));
  const cy = y + h / 2;
  const c4 = xs[3] + w / 2;
  const c7 = xs[7] + w / 2;
  return (
    <Shell section="01 · INTRODUCTION" kicker="Why this approach, animated" headline="One loop: candidates in, scored cards out, your ratings back into the features." page="07" footnote="Learned weights only reorder what hard filters allow — format, already-seen and request rules stay deterministic.">
      <svg width={1680} height={583} viewBox="0 0 1680 583" style={{ display: 'block' }}>
        <AB x={xs[0]} y={y} w={w} h={h} label="Live catalog" sub="TMDB · IGDB" num="1" style={rise(0.1)} />
        <AB x={xs[1]} y={y} w={w} h={h} label="Candidates" sub="content match" num="2" style={rise(0.2)} />
        <AB x={xs[2]} y={y} w={w} h={h} label="Hard filters" sub="format · seen" num="3" style={rise(0.3)} />
        <AB x={xs[3]} y={y} w={w} h={h} label="Features x" sub="13 values" num="4" style={rise(0.4)} accent />
        <AB x={xs[4]} y={y} w={w} h={h} label="APC score" sub="p ∈ 0…1" num="5" style={rise(0.5)} accent />
        <AB x={xs[5]} y={y} w={w} h={h} label="MMR reorder" sub="diversity" num="6" style={rise(0.6)} />
        <AB x={xs[6]} y={y} w={w} h={h} label="Your cards" sub="Home · For you" num="7" style={rise(0.7)} />
        <AB x={xs[7]} y={y} w={w} h={h} label="Your ratings" sub="explicit only" num="8" style={rise(0.8)} />
        {xs.slice(0, 7).map((x, i) => (
          <ATo key={i} x1={x + w + 2} y1={cy} x2={xs[i + 1] - 2} y2={cy} delay={0.35 + i * 0.08} />
        ))}
        <g style={rise(1.2)}>
          <rect x={840} y={300} width={540} height={72} rx={12} fill={panel} stroke={line} />
          <text x={1110} y={330} textAnchor="middle" fontFamily={mono} fontSize={16} fill={green}>δᵤ updated online</text>
          <text x={1110} y={356} textAnchor="middle" fontSize={18} fill={muted}>next visit scores with a sharper profile</text>
        </g>
        <g style={fade(1.1)}>
          <polyline
            points={`${c7},${y + h} ${c7},420 ${c4},420 ${c4},${y + h + 2}`}
            fill="none" stroke={green} strokeWidth={2} style={march}
          />
          <AArrowHead x={c4} y={y + h + 2} angle={-90} />
          <text x={c4 + 24} y={452} fontFamily={mono} fontSize={16} fill={muted}>feedback loop</text>
        </g>
        <circle r={8} fill={green} style={fly(xs[0] + 24, y - 28, xs[7] + w - 24, y - 28, 0.6, 5)} />
        <circle r={7} fill={amber} style={fly(c7, 420, c4, 420, 2.4, 4.5)} />
        <g style={rise(1.6)}>
          <rect x={22} y={500} width={760} height={72} rx={12} fill="rgba(94,125,30,0.07)" stroke={line} />
          <text x={46} y={530} fontFamily={mono} fontSize={16} fill={green}>what the model may change</text>
          <text x={46} y={556} fontSize={18} fill={muted}>the order of eligible cards</text>
          <rect x={806} y={500} width={852} height={72} rx={12} fill="rgba(168,116,28,0.07)" stroke={line} />
          <text x={830} y={530} fontFamily={mono} fontSize={16} fill={amber}>what it may never change</text>
          <text x={830} y={556} fontSize={18} fill={muted}>eligibility · already-seen rules · your data leaving the device</text>
        </g>
      </svg>
    </Shell>
  );
};

// ---------------------------------------------------------------- 8 what we chose

const ChoiceExplain: Page = () => (
  <Shell section="02 · METHOD" kicker="What we chose to do" headline="One narrow question, answered per person, before we ever look at the answer." page="08" footnote="A classifier that only ever sees 13 bounded numbers per work — no free text at scoring time, no profile leaving the device.">
    <div style={{ display: 'flex', gap: 56 }}>
      <div style={{ flex: 1.2, ...rise(0.15) }}>
        <Bullets
          size={26}
          gap={20}
          items={[
            <><b>Ask one narrow question:</b> “would you rate this 4 stars or more?” A star score is noisy and sparse; a yes/no at 4+ is a decision the app can act on, and <i>every</i> rating you give labels one example for free.</>,
            <><b>Keep it per-user and small:</b> one model shared by everyone, plus a private offset that only your own ratings move. New user? The shared part still works.</>,
            <><b>Predict before learning:</b> the score you saw was produced <i>before</i> your rating existed, then the error drives the update — never the reverse.</>,
            <><b>Prove it off-line first:</b> chronological split, five hypotheses written down before the test read, and the test read exactly once.</>,
          ]}
        />
      </div>
      <div style={{ width: 500, ...rise(0.4) }}>
        <div style={{ fontFamily: mono, fontSize: 19, letterSpacing: '0.16em', color: subtle }}>ONE RATING = ONE LABEL</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
          {[
            ['★★★★☆', 'rated 4 → y = 1', 'counts as “yes, I would watch or play this”'],
            ['★★☆☆☆', 'rated 2 → y = 0', 'counts as “no”, and only because you said so'],
          ].map(([stars, label, note]) => (
            <div key={label} style={{ border: `1px solid ${line}`, borderRadius: 12, background: panel, padding: '16px 20px' }}>
              <div style={{ fontSize: 26, color: amber, letterSpacing: '0.08em' }}>{stars}</div>
              <div style={{ fontFamily: mono, fontSize: 19, color: green, marginTop: 6 }}>{label}</div>
              <div style={{ fontSize: 19, color: muted, marginTop: 6, lineHeight: 1.35 }}>{note}</div>
            </div>
          ))}
          <div style={{ fontFamily: mono, fontSize: 17, color: subtle, lineHeight: 1.5 }}>
            not rated ≠ disliked · unseen works are never treated as negatives
          </div>
        </div>
      </div>
    </div>
  </Shell>
);

// ---------------------------------------------------------------- 9 how it is a classifier

const ClassifierExplain: Page = () => (
  <Shell section="02 · METHOD" kicker="How it becomes a classifier" headline="Your history becomes 13 numbers, the numbers become a probability, the probability becomes an order." page="09" footnote="Same four steps every time — which is exactly why the model can be read, debugged, unit-tested and shipped as a tiny file.">
    <div style={{ ...rise(0.15) }}>
      <div style={{ display: 'flex', gap: 20 }}>
        {[
          ['1', 'your history', 'what you rated, favourited, finished'],
          ['2', 'one row of numbers', '13 bounded features per candidate work'],
          ['3', 'weighted sum', 'shared weights + your private offset'],
          ['4', 'squash to 0…1', 'the sigmoid turns the sum into a probability'],
        ].map(([n, t, s]) => (
          <div key={n} style={{ width: 380, border: `1px solid ${line}`, borderRadius: 14, background: panel, padding: '18px 22px' }}>
            <div style={{ fontFamily: mono, fontSize: 17, color: green }}>{n}</div>
            <div style={{ fontSize: 24, marginTop: 6 }}>{t}</div>
            <div style={{ fontFamily: mono, fontSize: 16, color: muted, marginTop: 8, lineHeight: 1.45 }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 26 }}>
        <div style={{ fontFamily: mono, fontSize: 18, letterSpacing: '0.16em', color: subtle, marginBottom: 12 }}>
          THE THREE OUTPUTS, AND WHAT EACH ONE IS GOOD FOR
        </div>
        <WTable
          rowH={62}
          size={22}
          cols={[
            { label: 'output', w: 300 },
            { label: 'what it is', w: 470 },
            { label: 'how we measure it', w: 420 },
            { label: 'how the app uses it', w: 410 },
          ]}
          rows={[
            ['p — probability', 'how likely you are to rate this 4+', 'log loss, Brier score, reliability curve', 'orders cards; never shown as a number'],
            ['ŷ — decision', 'yes or no, using a 0.5 cut-off', 'accuracy, precision / recall', 'reported for honesty, not used to hide cards'],
            ['ranking', 'the order of the eligible cards', 'NDCG@10 = Normalized Discounted Cumulative Gain, Recall@10', 'this is what you actually see in For you'],
          ]}
        />
      </div>
      <div style={{ marginTop: 18, fontSize: 23, color: muted, lineHeight: 1.45 }}>
        That is the whole reason for the next few slides: a probability can be <i>scored</i>, a decision can be
        <i> checked</i>, and an order can be <i>compared</i> against today’s fixed weights.
      </div>
    </div>
  </Shell>
);

// animated: rating events → features → weighted sum → probability scale → order
const ClassifierAnim: Page = () => {
  const scaleX = 990;
  const scaleW = 650;
  const p = 0.78;
  const cut = 0.5;
  return (
    <Shell section="02 · METHOD" kicker="The classifier, animated" headline="Your ratings become features, the features become a probability, the probability becomes an order." page="10" footnote="Illustrative numbers. δᵤ ← clip(δᵤ + η·(y − p)·x, ±10) with η = 0.1, λ = 0 chosen on validation log loss.">
      <svg width={1680} height={583} viewBox="0 0 1680 583" style={{ display: 'block' }}>
        <text x={30} y={54} fontFamily={mono} fontSize={18} fill={subtle}>YOUR HISTORY</text>
        {[
          ['★★★★★', 'Dune', 94],
          ['favourite', 'Disco Elysium', 184],
          ['finished', 'Arrival', 274],
        ].map(([a, b, y], i) => (
          <g key={a as string} style={rise(0.15 + i * 0.15)}>
            <rect x={30} y={y as number} width={270} height={76} rx={12} fill={panel} stroke={line} />
            <text x={50} y={(y as number) + 32} fontSize={19} fill={amber}>{a}</text>
            <text x={50} y={(y as number) + 60} fontSize={19} fill={muted}>{b}</text>
          </g>
        ))}
        <ATo x1={304} y1={242} x2={340} y2={242} delay={0.5} />
        <AB x={344} y={196} w={250} h={92} label="13 features x" sub="each bounded 0…1" num="1" style={rise(0.55)} />
        <ATo x1={598} y1={242} x2={636} y2={242} delay={0.7} />
        <AB x={640} y={196} w={280} h={92} label="θ + δᵤ" sub="shared + yours" num="2" style={rise(0.75)} accent />
        <ATo x1={924} y1={242} x2={962} y2={242} delay={0.9} />

        <text x={scaleX} y={54} fontFamily={mono} fontSize={18} fill={subtle}>PROBABILITY YOU RATE IT 4+</text>
        <rect x={scaleX} y={210} width={scaleW} height={34} rx={17} fill={raised} stroke={line} />
        <rect x={scaleX} y={210} width={scaleW * p} height={34} rx={17} fill={green} style={growx(1.0, 1.4)} />
        <g style={fade(1.4)}>
          <line x1={scaleX + scaleW * cut} y1={190} x2={scaleX + scaleW * cut} y2={262} stroke={amber} strokeWidth={2.4} strokeDasharray="6 6" />
          <text x={scaleX + scaleW * cut} y={180} textAnchor="middle" fontFamily={mono} fontSize={16} fill={amber}>cut-off 0.5</text>
          <text x={scaleX + scaleW * p} y={294} textAnchor="middle" fontFamily={mono} fontSize={26} fill={green}>p = 0.78</text>
          <text x={scaleX} y={294} fontFamily={mono} fontSize={17} fill={subtle}>0</text>
          <text x={scaleX + scaleW} y={294} textAnchor="end" fontFamily={mono} fontSize={17} fill={subtle}>1</text>
        </g>
        <g style={rise(1.7)}>
          <rect x={30} y={392} width={500} height={140} rx={14} fill={panel} stroke={line} />
          <text x={54} y={428} fontFamily={mono} fontSize={17} fill={green}>what you see</text>
          <text x={54} y={462} fontSize={20} fill={muted}>the same eligible cards,</text>
          <text x={54} y={494} fontSize={20} fill={muted}>in a different order</text>
          <rect x={570} y={392} width={500} height={140} rx={14} fill={panel} stroke={line} />
          <text x={594} y={428} fontFamily={mono} fontSize={17} fill={green}>why you can check it</text>
          <text x={594} y={462} fontSize={20} fill={muted}>each score is a sum of</text>
          <text x={594} y={494} fontSize={20} fill={muted}>13 readable numbers</text>
          <rect x={1110} y={392} width={500} height={140} rx={14} fill={panel} stroke={line} />
          <text x={1134} y={428} fontFamily={mono} fontSize={17} fill={green}>what improves it</text>
          <text x={1134} y={462} fontSize={20} fill={muted}>each rating nudges δᵤ</text>
          <text x={1134} y={494} fontSize={20} fill={muted}>and is used next time</text>
        </g>
        <text x={30} y={572} fontFamily={mono} fontSize={17} fill={subtle} style={fade(2.0)}>
          p is a probability, so it can be scored — that is what makes the evaluation on the later slides possible
        </text>
      </svg>
    </Shell>
  );
};

// ---------------------------------------------------------------- 11 the formula, symbol by symbol

const FormulaSymbols: Page = () => (
  <Shell section="02 · METHOD" kicker="The model in one formula" headline="Distran APC-1" page="11" footnote="APC = adaptive preference classifier · logistic regression over 13 bounded features, trained online · predict-before-learn.">
    <div style={{ ...rise(0.15) }}>
      <Formula size={30}>p(u,i,c) = σ( b + bᵤ + (θ + δᵤ) · x(u,i,c) )</Formula>
      <div style={{ marginTop: 26 }}>
        <WTable
          rowH={38}
          size={20}
          cols={[
            { label: 'symbol', w: 210 },
            { label: 'name', w: 290 },
            { label: 'what it actually means', w: 640 },
            { label: 'example', w: 460 },
          ]}
          rows={[
            ['p(u,i,c)', 'the prediction', 'probability that you rate this work 4 or more, given user, work and context', '0.78'],
            ['σ', 'sigmoid', 'squashes any number into 0…1 so it can be read as a probability', 'σ(1.25) ≈ 0.78'],
            ['b', 'global bias', 'the overall tendency to rate things highly', '≈ −0.4'],
            ['bᵤ', 'your bias', 'whether you are a generous or a harsh rater', '+0.3 · generous'],
            ['θ', 'shared weights', 'what the average user likes — learned from everyone', 'popularity +0.6'],
            ['δᵤ', 'your residual', 'what makes you different; updated after each rating', '+0.9 · story-driven games'],
            ['x(u,i,c)', 'feature vector', '13 numbers describing the work, you, and the fit', 'each bounded 0…1'],
            ['y', 'the label', '1 if you rated 4 or more, otherwise 0', 'y = 1'],
            ['η, λ', 'learning rate, penalty', 'how far one rating moves δᵤ, and how hard we shrink it back', 'η = 0.1, λ = 0'],
          ]}
        />
      </div>
      <div style={{ marginTop: 26, fontFamily: mono, fontSize: 19, color: muted, lineHeight: 1.4 }}>
        update rule: δᵤ ← clip(δᵤ + η·(y − p)·x, ±10) — the error <b>(y − p)</b> sets the size and the direction
      </div>
    </div>
  </Shell>
);

// ---------------------------------------------------------------- 12 the features

const FeaturesExplain: Page = () => (
  <Shell section="02 · METHOD" kicker="The inputs" headline="Thirteen numbers per candidate — nothing else reaches the model." page="12" footnote="Features are bounded and computed as-of the event time, so the model never sees the future it is being scored on.">
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, ...rise(0.15) }}>
      {[
        ['about the work', ['item_pop_pct', 'item_quality', 'item_recency_90d'], 'how widely people have rated it, how well it scores, and how new it is.'],
        ['about the format', ['item_dom_game', 'item_dom_screen'], 'is this a game, or a film or series — the one split the app itself makes.'],
        ['about you', ['user_activity', 'user_pos_rate', 'user_recency_30d', 'user_aff_game', 'user_aff_screen'], 'how much you rate, how kind you are, how recently you were active, and which side you lean to.'],
        ['about the fit', ['aff×dom_game', 'aff×dom_screen', 'bpr_collab_pct'], 'your affinity multiplied by the format, plus a collaborative percentile from similar users — the only signal that comes from other people.'],
      ].map(([title, chips, blurb], i) => (
        <div key={title as string} style={{ width: 789, border: `1px solid ${line}`, borderRadius: 16, background: panel, padding: '22px 26px', ...rise(0.2 + i * 0.12) }}>
          <div style={{ fontFamily: mono, fontSize: 19, color: green, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{title as string}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 14 }}>
            {(chips as string[]).map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
          </div>
          <div style={{ fontSize: 21, color: muted, marginTop: 14, lineHeight: 1.4 }}>{blurb as string}</div>
        </div>
      ))}
    </div>
  </Shell>
);

// animated: predict, then learn from the error, then predict better
const ModelAnim: Page = () => {
  const y = 40;
  const h = 96;
  const w = 380;
  const xs = [30, 430, 830, 1230];
  const cy = y + h / 2;
  return (
    <Shell section="02 · METHOD" kicker="The model, animated" headline="Predict, then learn — every rating moves your private δᵤ by its own error." page="13" footnote="Clipping keeps a single rating from taking over: one ★ can move δᵤ, but it can never rewrite your profile.">
      <svg width={1680} height={583} viewBox="0 0 1680 583" style={{ display: 'block' }}>
        <AB x={xs[0]} y={y} w={w} h={h} label="candidate work x" sub="13 numbers, 0…1" num="1" style={rise(0.1)} />
        <AB x={xs[1]} y={y} w={w} h={h} label="predict p" sub="before you rate it" num="2" style={rise(0.25)} accent />
        <AB x={xs[2]} y={y} w={w} h={h} label="you rate it: y" sub="1 if ★★★★ or more" num="3" style={rise(0.4)} />
        <AB x={xs[3]} y={y} w={w} h={h} label="update δᵤ, bᵤ" sub="clipped, online" num="4" style={rise(0.55)} />
        <ATo x1={xs[0] + w + 4} y1={cy} x2={xs[1] - 4} y2={cy} delay={0.5} />
        <ATo x1={xs[1] + w + 4} y1={cy} x2={xs[2] - 4} y2={cy} delay={0.65} />
        <ATo x1={xs[2] + w + 4} y1={cy} x2={xs[3] - 4} y2={cy} delay={0.8} />
        <g style={fade(1.1)}>
          <polyline
            points={`${xs[3] + w / 2},${y + h} ${xs[3] + w / 2},208 ${xs[1] + w / 2},208 ${xs[1] + w / 2},${y + h + 2}`}
            fill="none" stroke={green} strokeWidth={2} style={march}
          />
          <AArrowHead x={xs[1] + w / 2} y={y + h + 2} angle={-90} />
          <rect x={xs[1] + w / 2 + 40} y={186} width={320} height={40} rx={10} fill={panel} stroke={line} />
          <text x={xs[1] + w / 2 + 200} y={212} textAnchor="middle" fontFamily={mono} fontSize={16} fill={green}>
            better next prediction
          </text>
        </g>
        <g style={rise(1.3)}>
          <rect x={30} y={266} width={790} height={300} rx={14} fill={panel} stroke={line} />
          <text x={54} y={304} fontFamily={mono} fontSize={17} fill={subtle}>YOUR PRIVATE ADJUSTMENT δᵤ — ONE WEIGHT PER FEATURE</text>
          <line x1={70} y1={430} x2={782} y2={430} stroke={line} strokeWidth={2} />
          {[-10, -5, 0, 5, 10].map((tick, i) => {
            const tx = 70 + i * 178;
            return (
              <g key={tick}>
                <line x1={tx} y1={422} x2={tx} y2={438} stroke={subtle} strokeWidth={1.6} />
                <text x={tx} y={466} textAnchor="middle" fontFamily={mono} fontSize={15} fill={subtle}>{tick > 0 ? `+${tick}` : tick}</text>
              </g>
            );
          })}
          <rect x={426} y={416} width={124} height={28} rx={7} fill={green} style={{ transformOrigin: '426px 430px', animation: 'v2growx 1.8s cubic-bezier(0.3,0.7,0.3,1) 1.5s both' }} />
          <text x={54} y={510} fontSize={20} fill={muted}>each rating nudges the weights toward what you actually rate</text>
          <text x={54} y={542} fontFamily={mono} fontSize={16} fill={subtle}>clipped to ±10 per feature, so one bad rating cannot dominate</text>
        </g>
        <g style={rise(1.5)}>
          <rect x={850} y={266} width={800} height={300} rx={14} fill={panel} stroke={line} />
          <text x={874} y={304} fontFamily={mono} fontSize={17} fill={subtle}>WHY IT BEHAVES LIKE THIS</text>
          {[
            ['shared prior θ', 'a new user is sensible before rating anything'],
            ['private δᵤ', 'a few ratings are enough to become personal'],
            ['readable weights', 'you can name the three features that moved the score'],
          ].map(([a, b], i) => (
            <g key={a}>
              <text x={874} y={360 + i * 62} fontFamily={mono} fontSize={17} fill={green}>{a}</text>
              <text x={874} y={390 + i * 62} fontSize={19} fill={muted}>{b}</text>
            </g>
          ))}
        </g>
      </svg>
    </Shell>
  );
};

// ---------------------------------------------------------------- 14-15 encoders

const EncodersExplain: Page = () => (
  <Shell section="02 · METHOD" kicker="The text encoders" headline="Three ways to turn a description into numbers — each one checked against a baseline." page="14" footnote="All trained from scratch in pure NumPy on a 20,000-document Kaggle corpus (TMDB movies + HowLongToBeat games), title-hash split.">
    <div style={{ ...rise(0.15) }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {[
          ['TF-IDF + SVD', 'Term Frequency–Inverse Document Frequency + Singular Value Decomposition', 'turns text into 64-dimension vectors — the encoder the app actually uses'],
          ['TextCNN', 'Convolutional Neural Network over word embeddings (Kim, 2014)', 'benchmark: can text predict how well a work will be scored?'],
          ['mini-GPT', 'Generative Pre-trained Transformer — decoder-only, next-token prediction', 'benchmark: how much of catalog text does a small model actually understand?'],
        ].map(([tag, full, role]) => (
          <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 28, border: `1px solid ${line}`, borderRadius: 14, background: panel, padding: '20px 28px' }}>
            <div style={{ width: 210, fontFamily: mono, fontSize: 24, color: green, flexShrink: 0 }}>{tag}</div>
            <div style={{ flex: 1, fontSize: 24, color: muted, lineHeight: 1.35 }}>{full}</div>
            <div style={{ width: 560, fontSize: 22, color: ink, lineHeight: 1.35, flexShrink: 0 }}>{role}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 26 }}>
        <Bullets
          size={25}
          gap={12}
          items={[
            <>Both neural encoders are written by hand in NumPy and <b>gradient-checked</b> — every step inspectable, no black box.</>,
            <>They are <b>benchmarks</b>: we only replace the serving encoder if a challenger beats it on relevance, not on vibes.</>,
          ]}
        />
      </div>
    </div>
  </Shell>
);

// animated: conv window sliding over tokens + next-word typing
const EncodersAnim: Page = () => {
  const tok = ['a', 'souls-like', 'action', 'rpg', 'with', 'a'];
  const tx0 = 30;
  const pitch = 136;
  return (
    <Shell section="02 · METHOD" kicker="The text encoders, animated" headline="TextCNN slides a window over words; mini-GPT predicts the next one." page="15" footnote="TextCNN: conv1d k=3/4/5 ×16 filters → ReLU → max-pool → linear head (196,851 params). mini-GPT: 2 pre-LN blocks, d=48, 2 heads (808,128 params), 1,200 Adam steps.">
      <svg width={1680} height={583} viewBox="0 0 1680 583" style={{ display: 'block' }}>
        <line x1={858} y1={20} x2={858} y2={576} stroke={line} strokeWidth={1.6} />

        <g style={rise(0.15)}>
          <text x={30} y={48} fontFamily={mono} fontSize={18} fill={green}>TextCNN — CONVOLUTION WINDOW</text>
          {tok.map((wd, i) => (
            <g key={i} style={rise(0.3 + i * 0.08)}>
              <rect x={tx0 + i * pitch} y={84} width={124} height={58} rx={10} fill={panel} stroke={line} />
              <text x={tx0 + i * pitch + 62} y={120} textAnchor="middle" fontSize={19} fill={ink}>{wd}</text>
            </g>
          ))}
          <rect
            x={tx0 - 6} y={76} width={3 * pitch - 4} height={74} rx={12}
            fill="rgba(94,125,30,0.13)" stroke={green} strokeWidth={2.2}
            style={{ animation: 'v2slide3 6s cubic-bezier(0.5,0,0.4,1) infinite' }}
          />
          <text x={30} y={200} fontFamily={mono} fontSize={16} fill={muted}>a 3-word window slides along the description — short phrases become features</text>
          <AB x={30} y={228} w={250} h={88} label="conv1d ×3 widths" sub="16 filters each" num="1" style={rise(0.9)} />
          <ATo x1={284} y1={272} x2={316} y2={272} delay={1.0} />
          <AB x={320} y={228} w={230} h={88} label="max-pool" sub="over positions" num="2" style={rise(1.05)} />
          <ATo x1={554} y1={272} x2={586} y2={272} delay={1.15} />
          <AB x={590} y={228} w={240} h={88} label="3-class head" sub="low / mid / high score" num="3" style={rise(1.2)} accent />
          <text x={30} y={372} fontFamily={mono} fontSize={16} fill={subtle}>3 score buckets — a fair fight against “always pick the biggest bucket”</text>
          <g style={rise(1.4)}>
            <rect x={30} y={398} width={800} height={92} rx={12} fill={raised} stroke={line} />
            <text x={50} y={430} fontFamily={mono} fontSize={16} fill={subtle}>MEASURED</text>
            <text x={50} y={462} fontFamily={mono} fontSize={17} fill={muted}>accuracy 0.536 · macro-F1 0.386 · majority baseline 0.598</text>
            <text x={50} y={486} fontFamily={mono} fontSize={16} fill={amber}>→ H4 not confirmed</text>
          </g>
        </g>

        <g style={rise(0.3)}>
          <text x={890} y={48} fontFamily={mono} fontSize={18} fill={green}>mini-GPT — NEXT-TOKEN PREDICTION</text>
          <rect x={890} y={84} width={760} height={124} rx={14} fill={panel} stroke={line} />
          {['a', 'bleak', 'space', 'opera', 'about'].map((wd, i) => (
            <text key={i} x={916 + i * 118} y={152} fontSize={22} fill={i < 4 ? ink : muted} style={fade(0.6 + i * 0.4)}>{wd}</text>
          ))}
          <text x={916 + 5 * 118} y={152} fontSize={22} fill={green} style={fade(2.6)}>a</text>
          <rect x={916 + 5 * 118 + 22} y={128} width={3} height={32} fill={green} style={{ animation: 'v2blink 1s steps(1) infinite' }} />
          <text x={890} y={248} fontFamily={mono} fontSize={16} fill={muted}>the model predicts each next word — the representation that does this well</text>
          <text x={890} y={274} fontFamily={mono} fontSize={16} fill={muted}>is the content embedding we reuse (mean-pooled hidden state)</text>
          <AB x={890} y={302} w={330} h={88} label="transformer ×2 blocks" sub="causal attention, d = 48" num="1" style={rise(1.0)} />
          <ATo x1={1224} y1={346} x2={1252} y2={346} delay={1.1} />
          <AB x={1256} y={302} w={394} h={88} label="validation perplexity" sub="lower = better" num="2" style={rise(1.2)} accent />
          <g style={rise(1.4)}>
            <rect x={890} y={430} width={760} height={92} rx={12} fill={raised} stroke={line} />
            <text x={910} y={462} fontFamily={mono} fontSize={16} fill={subtle}>MEASURED</text>
            <text x={910} y={494} fontFamily={mono} fontSize={17} fill={muted}>perplexity 34.7 vs 2,047 for a unigram model — 59× lower</text>
            <text x={910} y={516} fontFamily={mono} fontSize={16} fill={green}>→ H3 confirmed</text>
          </g>
        </g>
      </svg>
    </Shell>
  );
};

// ---------------------------------------------------------------- 16-17 training

const TrainingExplain: Page = () => (
  <Shell section="02 · METHOD" kicker="Training & evaluation" headline="Trained on a Colab CPU, tuned on validation, and the test set read exactly once." page="16" footnote="colab CLI · pinned NumPy 2.2.6 / pandas 2.2.3 / scikit-learn 1.6.1 / kagglehub 0.4.3 · 10 checkpointed stages · 187 s final pass · SHA256 provenance.">
    <div style={{ display: 'flex', gap: 56 }}>
      <div style={{ flex: 1.1, ...rise(0.15) }}>
        <Bullets
          size={26}
          gap={18}
          items={[
            <><b>Data:</b> Amazon 5-core events, split <b>chronologically</b> 60 / 20 / 20 — the test really is the future. 39,600 train · 13,204 validation · 13,195 test events.</>,
            <><b>Protocol:</b> vocabulary, SVD, BPR and feature statistics are fit on train only; the grid over η ∈ {'{0.05, 0.1}'} × λ ∈ {'{0, 0.01}'} is picked on <b>validation log loss</b> (η = 0.1, λ = 0); the test is scored once.</>,
            <><b>Hypotheses first:</b> H1 the per-user tweak improves prediction · H2 it improves top-10 ranking · H3 mini-GPT ≪ unigram perplexity · H4 TextCNN beats majority · H5 nothing is promoted without an app-side evaluation.</>,
          ]}
        />
      </div>
      <div style={{ width: 520, ...rise(0.4) }}>
        <div style={{ fontFamily: mono, fontSize: 19, letterSpacing: '0.16em', color: subtle }}>COLAB CLI</div>
        <div style={{ fontFamily: mono, fontSize: 20, lineHeight: 1.8, background: panel, border: `1px solid ${line}`, borderRadius: 14, padding: '20px 26px', color: '#3c3a33', marginTop: 14 }}>
          <div><span style={{ color: green }}>colab</span> new -s distran-adaptive-run</div>
          <div><span style={{ color: green }}>colab</span> exec -s … 05_adaptive.ipynb</div>
          <div><span style={{ color: green }}>colab</span> download -s … results.zip</div>
          <div><span style={{ color: green }}>colab</span> stop -s distran-adaptive-run</div>
        </div>
        <div style={{ marginTop: 20, fontFamily: mono, fontSize: 17, color: subtle, lineHeight: 1.6 }}>
          same notebook, same seed, same pins → same numbers
        </div>
      </div>
    </div>
  </Shell>
);

// animated: split bars grow, stages step, test locked
const TrainingAnim: Page = () => (
  <Shell section="02 · METHOD" kicker="Training & evaluation, animated" headline="Train on the past, tune on the middle, read the future once." page="17" footnote="Group split for encoders: title-hash buckets 0–5 / 6–7 / 8–9. Metrics: NDCG@10, Recall@10, log loss, Brier, reliability, bootstrap CIs.">
    <svg width={1680} height={583} viewBox="0 0 1680 583" style={{ display: 'block' }}>
      <g style={rise(0.15)}>
        <text x={30} y={54} fontFamily={mono} fontSize={18} fill={subtle}>AMAZON EVENTS, IN TIME ORDER</text>
        <rect x={30} y={80} width={1620} height={70} rx={10} fill={raised} stroke={line} />
        <rect x={30} y={80} width={972} height={70} rx={10} fill="#c9d69a" style={growx(0.3, 1.0)} />
        <rect x={1006} y={80} width={324} height={70} fill="#dfe7c4" style={growx(0.8, 0.8)} />
        <rect x={1334} y={80} width={316} height={70} rx={10} fill="#eef3dd" style={growx(1.3, 0.8)} />
        <text x={516} y={123} textAnchor="middle" fontSize={22} fill={ink}>train 39,600</text>
        <text x={1168} y={123} textAnchor="middle" fontSize={22} fill={ink}>valid 13,204</text>
        <text x={1492} y={123} textAnchor="middle" fontSize={22} fill={ink}>test 13,195</text>
        <text x={516} y={176} textAnchor="middle" fontFamily={mono} fontSize={16} fill={subtle}>fit everything here</text>
        <text x={1168} y={176} textAnchor="middle" fontFamily={mono} fontSize={16} fill={subtle}>choose η and λ here</text>
        <g style={pop(2.0)}>
          <rect x={1400} y={166} width={250} height={48} rx={10} fill={panel} stroke={green} strokeWidth={1.6} />
          <text x={1525} y={197} textAnchor="middle" fontFamily={mono} fontSize={17} fill={green}>read once</text>
        </g>
      </g>
      {[
        ['fit vocab / SVD / BPR', 30], ['train θ (SGD)', 350], ['grid η × λ on valid', 670],
        ['pick η=0.1 λ=0', 990], ['score test once', 1310],
      ].map(([label, x], i) => (
        <g key={label as string}>
          <AB x={x as number} y={296} w={220} h={92} label={label as string} style={rise(0.4 + i * 0.3)} accent={i === 4} />
          {i < 4 && <ATo x1={(x as number) + 224} y1={342} x2={(x as number) + 316} y2={342} delay={0.55 + i * 0.3} />}
        </g>
      ))}
      <g style={fade(2.2)}>
        <rect x={30} y={440} width={1620} height={72} rx={12} fill="rgba(94,125,30,0.07)" stroke={line} />
        <text x={54} y={470} fontFamily={mono} fontSize={16} fill={green}>leakage controls</text>
        <text x={54} y={496} fontSize={18} fill={muted}>train-only fitting · cold items counted, not retrieved · SHA256 of every input kept in provenance.json</text>
      </g>
    </svg>
  </Shell>
);

// ---------------------------------------------------------------- 18 predictions

const Predictions: Page = () => (
  <Shell section="03 · RESULTS" kicker="Predictions" headline="Five questions written down before the test was read — so the numbers could not be chosen after the fact." page="18" footnote="Registered in the notebook before the final pass. The test split was scored once; nothing was refit on it.">
    <div style={{ ...rise(0.15) }}>
      <WTable
        rowH={66}
        size={22}
        cols={[
          { label: 'hypothesis', w: 470 },
          { label: 'what we predicted would happen', w: 590 },
          { label: 'how we agreed to judge it', w: 540 },
        ]}
        rows={[
          ['H1 · your private tweak helps prediction', 'clearly better than the shared-only model', 'lower log loss and Brier on validation, then on test'],
          ['H2 · it also improves the top 10', 'a better order, not just a better number', 'NDCG@10 (Normalized Discounted Cumulative Gain) and Recall@10'],
          ['H3 · mini-GPT beats a unigram model', 'perplexity far below 2,047', 'validation perplexity on title-hash heldout groups'],
          ['H4 · TextCNN beats the majority class', 'accuracy above 0.598', 'accuracy and macro-F1 against the majority baseline'],
          ['H5 · nothing gets promoted', 'no artifact reaches the app on this evidence', 'needs an app-side evaluation that did not exist yet'],
        ]}
      />
      <div style={{ marginTop: 24, display: 'flex', gap: 20 }}>
        {[
          ['why register first', 'a hypothesis written after the numbers is a story, not a test'],
          ['why one read', 'the test is the future — using it twice quietly turns it into training data'],
          ['what counts as a miss', 'a direction we got wrong, reported as plainly as a win'],
        ].map(([a, b]) => (
          <div key={a} style={{ width: 520, border: `1px solid ${line}`, borderRadius: 12, background: panel, padding: '16px 22px' }}>
            <div style={{ fontFamily: mono, fontSize: 17, color: green }}>{a}</div>
            <div style={{ fontSize: 20, color: muted, marginTop: 6, lineHeight: 1.35 }}>{b}</div>
          </div>
        ))}
      </div>
    </div>
  </Shell>
);

// ---------------------------------------------------------------- 19 actual outcomes

const ResultsExplain: Page = () => (
  <Shell section="03 · RESULTS" kicker="What actually happened" headline="Two of five confirmed — and the misses are as useful as the wins." page="19" footnote="Test: 13,195 heldout events · 303 evaluated users · single fixed split, no significance claims; bootstrap intervals overlap on every ranking row.">
    <div style={{ ...rise(0.15) }}>
      <WTable
        rowH={64}
        size={22}
        cols={[
          { label: 'hypothesis', w: 440 },
          { label: 'predicted', w: 360 },
          { label: 'actual, on heldout test', w: 470 },
          { label: 'verdict', w: 330 },
        ]}
        rows={[
          ['H1 · private tweak helps prediction', 'clearly better', 'log loss 2.729 → 1.746 · Brier 0.709 → 0.521', 'CONFIRMED · −36% error'],
          ['H2 · improves the top 10', 'a better order', 'NDCG@10 0.0010 vs 0.0010 — a tie', 'NOT CONFIRMED'],
          ['H3 · mini-GPT beats unigram', 'far below 2,047', '34.7 valence perplexity, 59× lower', 'CONFIRMED · 59×'],
          ['H4 · TextCNN beats majority', 'accuracy > 0.598', '0.536 accuracy · 0.386 macro-F1', 'NOT CONFIRMED'],
          ['H5 · nothing promoted', 'no promotion', 'no artifact promoted; fixed ranker live', 'HELD'],
        ]}
      />
      <div style={{ marginTop: 22, fontSize: 24, color: muted, lineHeight: 1.45 }}>
        Read it as one sentence: <b>the model learned what you like, but not yet in which order to show it.</b>{' '}
        Prediction quality moved a third; the top-10 list did not move at all — because at 24,000 items,
        8,718 of the heldout positives are works the model had never seen, and popularity is still a strong
        answer for those.
      </div>
    </div>
  </Shell>
);

// animated: three panels, bars to scale, verdict chips
const ResultsAnim: Page = () => (
  <Shell section="03 · RESULTS" kicker="Results, animated" headline="Error down a third, perplexity down 59×, ranking unchanged." page="20" footnote="Bars drawn to scale inside each panel (lower is better). Single fixed split, no significance claims. Log loss = −log p(y) · perplexity = exp(mean log loss).">
    <svg width={1680} height={583} viewBox="0 0 1680 583" style={{ display: 'block' }}>
      <g style={rise(0.15)}>
        <rect x={30} y={20} width={510} height={556} rx={16} fill={panel} stroke={line} />
        <text x={58} y={66} fontFamily={mono} fontSize={17} fill={subtle}>PREDICTION ERROR — LOG LOSS ↓</text>
        <text x={58} y={130} fontSize={20} fill={muted}>shared only</text>
        <rect x={58} y={146} width={330 * (2.7292 / 2.8)} height={44} rx={8} fill={raised} stroke={line} />
        <text x={58 + 330 * (2.7292 / 2.8) + 14} y={175} fontFamily={mono} fontSize={18} fill={muted}>2.729</text>
        <text x={58} y={250} fontSize={20} fill={ink}>with your δᵤ</text>
        <rect x={58} y={266} width={330 * (1.7458 / 2.8)} height={44} rx={8} fill={green} style={growx(0.5, 1.2)} />
        <text x={58 + 330 * (1.7458 / 2.8) + 14} y={295} fontFamily={mono} fontSize={18} fill={green}>1.746</text>
        <text x={58} y={340} fontFamily={mono} fontSize={15} fill={subtle}>13,195 heldout events, both models</text>
        <g style={pop(1.4)}>
          <rect x={58} y={366} width={220} height={52} rx={10} fill="rgba(94,125,30,0.10)" stroke={green} />
          <text x={168} y={399} textAnchor="middle" fontFamily={mono} fontSize={18} fill={green}>−36% error</text>
        </g>
        <text x={58} y={452} fontSize={19} fill={muted}>H1 confirmed — the private tweak earns its place.</text>
        <text x={58} y={490} fontFamily={mono} fontSize={16} fill={subtle}>Brier score 0.709 → 0.521 on the same split</text>
      </g>
      <g style={rise(0.35)}>
        <rect x={570} y={20} width={510} height={556} rx={16} fill={panel} stroke={line} />
        <text x={598} y={66} fontFamily={mono} fontSize={17} fill={subtle}>LANGUAGE MODEL — PERPLEXITY ↓</text>
        <text x={598} y={130} fontSize={20} fill={muted}>unigram model</text>
        <rect x={598} y={146} width={330} height={44} rx={8} fill={raised} stroke={line} />
        <text x={763} y={175} textAnchor="middle" fontFamily={mono} fontSize={18} fill={muted}>2,047</text>
        <text x={598} y={250} fontSize={20} fill={ink}>mini-GPT</text>
        <rect x={598} y={266} width={10} height={44} rx={5} fill={green} style={growx(0.7, 1.0)} />
        <text x={626} y={295} fontFamily={mono} fontSize={18} fill={green}>34.7</text>
        <text x={598} y={340} fontFamily={mono} fontSize={15} fill={subtle}>bar drawn to the same scale — it really is that short</text>
        <g style={pop(1.6)}>
          <rect x={598} y={366} width={220} height={52} rx={10} fill="rgba(94,125,30,0.10)" stroke={green} />
          <text x={708} y={399} textAnchor="middle" fontFamily={mono} fontSize={18} fill={green}>59× lower</text>
        </g>
        <text x={598} y={452} fontSize={19} fill={muted}>H3 confirmed — small, but it learned language.</text>
        <text x={598} y={490} fontFamily={mono} fontSize={16} fill={subtle}>808,128 parameters, 1,200 Adam steps, pure NumPy</text>
      </g>
      <g style={rise(0.55)}>
        <rect x={1110} y={20} width={540} height={556} rx={16} fill={panel} stroke={line} />
        <text x={1138} y={66} fontFamily={mono} fontSize={17} fill={subtle}>TOP-10 RANKING — NDCG@10 ↑</text>
        <text x={1138} y={130} fontSize={20} fill={muted}>shared only</text>
        <rect x={1138} y={146} width={10} height={44} rx={5} fill={raised} stroke={line} />
        <text x={1166} y={175} fontFamily={mono} fontSize={18} fill={muted}>0.0010</text>
        <text x={1138} y={250} fontSize={20} fill={ink}>with your δᵤ</text>
        <rect x={1138} y={266} width={10} height={44} rx={5} fill={green} />
        <text x={1166} y={295} fontFamily={mono} fontSize={18} fill={green}>0.0010</text>
        <text x={1138} y={340} fontFamily={mono} fontSize={15} fill={subtle}>identical values — both lists are effectively cold</text>
        <g style={pop(1.8)}>
          <rect x={1138} y={366} width={260} height={52} rx={10} fill="rgba(168,116,28,0.10)" stroke={amber} />
          <text x={1268} y={399} textAnchor="middle" fontFamily={mono} fontSize={18} fill={amber}>a tie</text>
        </g>
        <text x={1138} y={452} fontSize={19} fill={muted}>H2 not confirmed — the order did not move.</text>
        <text x={1138} y={490} fontFamily={mono} fontSize={16} fill={subtle}>games cohort: popularity 0.0161 still ahead of 0.0120</text>
      </g>
    </svg>
  </Shell>
);

// ---------------------------------------------------------------- 21 does it fit what the app needs

const FitsNeeds: Page = () => (
  <Shell section="03 · RESULTS" kicker="Does it fit what the app needs" headline="Four of five product needs are met; the one that is not is the one users notice." page="21" footnote="Content delivery unchanged: the app still indexes TMDB/IGDB and serves its 64-dimension vectors; the classifier only reorders eligible cards.">
    <div style={{ ...rise(0.15) }}>
      <WTable
        rowH={62}
        size={22}
        cols={[
          { label: 'what the app needs', w: 380 },
          { label: 'what we measured', w: 500 },
          { label: 'fits?', w: 230 },
          { label: 'what that means to ship', w: 490 },
        ]}
        rows={[
          ['a prediction better than guessing', 'log loss 2.729 → 1.746 · Brier 0.709 → 0.521', 'met', 'adaptive scores can rank candidates behind a flag'],
          ['learns from a handful of ratings', 'δᵤ moves measurably within the first events of a user', 'met', 'update on-device after each rating, no batch job'],
          ['works on brand-new works', '8,718 heldout positives are cold items — all scorable', 'met', 'content features mean no cold dead-end in the catalog'],
          ['reorders the top 10', 'NDCG@10 a tie at 24k items', 'not yet', 'popularity and fixed weights stay live in For you'],
          ['runs where the app runs', '187 s research pass · milliseconds at serve time', 'met', '13 weights, 13 features, no GPU, nothing leaves the device'],
        ]}
      />
      <div style={{ marginTop: 22, display: 'flex', gap: 20 }}>
        <div style={{ flex: 1, border: `1px solid ${line}`, borderLeft: `3px solid ${green}`, borderRadius: 12, background: 'rgba(94,125,30,0.07)', padding: '16px 24px' }}>
          <div style={{ fontFamily: mono, fontSize: 17, color: green }}>content delivery today</div>
          <div style={{ fontSize: 21, color: muted, marginTop: 6, lineHeight: 1.4 }}>
            Home → For you → Your next connection still runs locally: favourites build a profile, hard filters
            protect eligibility, MMR spreads the list, curated cards fill gaps.
          </div>
        </div>
        <div style={{ flex: 1, border: `1px solid ${line}`, borderLeft: `3px solid ${amber}`, borderRadius: 12, background: 'rgba(168,116,28,0.07)', padding: '16px 24px' }}>
          <div style={{ fontFamily: mono, fontSize: 17, color: amber }}>the missing piece for ranking</div>
          <div style={{ fontSize: 21, color: muted, marginTop: 6, lineHeight: 1.4 }}>
            Ranking needs to know what was <i>shown</i>, not only what was rated. No impression ledger exists yet,
            so a ranking gain cannot be measured in the app.
          </div>
        </div>
      </div>
    </div>
  </Shell>
);

// ---------------------------------------------------------------- 22 learnings

const Learnings: Page = () => (
  <Shell section="03 · RESULTS" kicker="Learnings & next steps" headline="Small, online and honestly evaluated beat big and static — at this scale." page="22" footnote="Pointwise gain ≠ ranking gain: each has to be measured in its own metric. Full report: ml/notebooks/results/adaptive/report.json.">
    <div style={{ display: 'flex', gap: 48 }}>
      <div style={{ flex: 1, ...rise(0.15) }}>
        <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: '0.16em', color: green }}>WHAT WORKED</div>
        <div style={{ marginTop: 14 }}>
          <Bullets
            size={25}
            gap={14}
            items={[
              <>Per-user residual δᵤ: −36% log loss on heldout events — real signal from a few ratings</>,
              <>mini-GPT in pure NumPy: perplexity 34.7 vs 2,047 unigram — language structure is learnable at d = 48</>,
              <>Reproducible Colab pipeline: pinned versions, checkpointed stages, SHA256 provenance, 16 unit tests</>,
            ]}
          />
        </div>
      </div>
      <div style={{ flex: 1, ...rise(0.35) }}>
        <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: '0.16em', color: amber }}>WHAT DIDN’T / LIMITS</div>
        <div style={{ marginTop: 14 }}>
          <Bullets
            size={25}
            gap={14}
            items={[
              <>No top-10 gain at 24k items — heldout positives are mostly unseen works; popularity stays competitive</>,
              <>TextCNN ≤ majority on score buckets; encoders do not replace the serving SVD (probe Jaccard 0.10–0.32)</>,
              <>Probabilities miscalibrated across time (base-rate shift) — rank with scores, don’t quote them as chances</>,
            ]}
          />
        </div>
      </div>
    </div>
    <div style={{ marginTop: 26, border: `1px solid ${line}`, borderLeft: `3px solid var(--osd-accent)`, borderRadius: 12, background: 'rgba(94,125,30,0.07)', padding: '18px 26px', fontSize: 24, lineHeight: 1.45, ...rise(0.55) }}>
      <b>Next:</b> add an event and impression ledger in the app → run the APC on-device, benchmarked against today’s
      fixed-weight ranker (which stays as the rollback) → only then consider LightFM / CatBoost challengers and
      logged exploration (bandits).
    </div>
  </Shell>
);

// animated: promotion gate — verdicts pop in, the gate stays shut
const GateAnim: Page = () => (
  <Shell section="03 · RESULTS" kicker="Learning, animated" headline="Evidence first: the gate to the app stays shut until an app-side evaluation opens it." page="23" footnote="H5 held: Amazon IDs ≠ app catalog IDs and there is no impression ledger — so no artifact was promoted and the fixed-weight ranker remains live.">
    <svg width={1680} height={583} viewBox="0 0 1680 583" style={{ display: 'block' }}>
      <g transform="translate(0,-86)">
      <AB x={60} y={240} w={300} h={104} label="research model" sub="APC-1 artifacts" num="1" style={rise(0.2)} />
      <ATo x1={364} y1={292} x2={430} y2={292} delay={0.4} />
      <AB x={434} y={240} w={320} h={104} label="heldout evaluation" sub="this project" num="2" style={rise(0.45)} accent />
      <ATo x1={758} y1={292} x2={812} y2={292} delay={0.6} />

      <g style={rise(0.9)}>
        <rect x={834} y={196} width={12} height={200} rx={6} fill={amber} />
        <rect x={906} y={196} width={12} height={200} rx={6} fill={amber} />
        <rect x={816} y={282} width={120} height={14} rx={7} fill={amber} />
        <rect x={854} y={314} width={44} height={38} rx={8} fill={panel} stroke={amber} strokeWidth={2} />
        <path d="M864 314 v-10 a12 12 0 0 1 24 0 v10" fill="none" stroke={amber} strokeWidth={2.4} />
        <text x={876} y={188} textAnchor="middle" fontFamily={mono} fontSize={15} fill={muted}>shut</text>
        <text x={876} y={424} textAnchor="middle" fontFamily={mono} fontSize={16} fill={amber}>closed until an app-side evaluation</text>
      </g>
      <ATo x1={922} y1={292} x2={986} y2={292} delay={1.1} />
      <AB x={990} y={240} w={310} h={104} label="the app" sub="fixed ranker stays live" num="3" style={rise(1.1)} />
      <circle r={8} fill={amber} style={fly(370, 292, 826, 292, 0.8, 3.6)} />

      <g style={rise(1.5)}>
        <rect x={1340} y={196} width={310} height={200} rx={14} fill={panel} stroke={line} />
        <text x={1364} y={232} fontFamily={mono} fontSize={16} fill={subtle}>WHAT WOULD OPEN IT</text>
        <text x={1364} y={268} fontSize={19} fill={muted}>an app-side evaluation</text>
        <text x={1364} y={298} fontSize={19} fill={muted}>with logged impressions</text>
        <text x={1364} y={328} fontSize={19} fill={muted}>on the real catalog ids</text>
        <text x={1364} y={364} fontFamily={mono} fontSize={16} fill={amber}>not measured yet</text>
      </g>

      <text x={60} y={452} fontFamily={mono} fontSize={17} fill={subtle} style={fade(1.4)}>VERDICTS FROM THE HELDOUT TEST</text>
      {[
        ['H1 ✓', 60, true], ['H3 ✓', 260, true], ['H2 ✗', 460, false], ['H4 ✗', 660, false], ['H5 held', 860, false],
      ].map(([b, x, ok], i) => (
        <g key={b as string} style={pop(1.2 + i * 0.2)}>
          <rect x={x as number} y={472} width={180} height={52} rx={10} fill={panel} stroke={ok ? green : line} strokeWidth={1.6} />
          <text x={(x as number) + 90} y={505} textAnchor="middle" fontFamily={mono} fontSize={18} fill={ok ? green : muted}>{b}</text>
        </g>
      ))}
      <text x={60} y={562} fontFamily={mono} fontSize={16} fill={subtle} style={fade(2.0)}>two confirmed, two missed, one held — the gate stays shut, and that is the honest outcome.</text>
      </g>
    </svg>
  </Shell>
);

// ---------------------------------------------------------------- 24-25 close

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
      <h1 style={{ fontFamily: 'var(--osd-font-display)', fontSize: 118, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '36px 0 26px' }}>
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
      <div style={{ marginTop: 40, fontFamily: mono, fontSize: 18, color: subtle }}>24 / {TOTAL}</div>
    </div>
  </div>
);

const Sources: Page = () => (
  <Shell kicker="Appendix" section="SOURCES" headline="Sources and references" page="25" footnote="Links are clickable in the live page; full URLs shown here.">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center', height: '100%' }}>
      {[
        ['Ada-Pref — per-instance preference strength', 'Hong et al.', 'https://arxiv.org/abs/2406.02764'],
        ['Amazon Reviews 5-core — interaction corpus', 'Ni et al.', 'https://amazon-reviews-2023.github.io/data_processing/5core.html'],
        ['TMDB popular movies 10k — movie metadata', 'Kaggle · balaka18', 'https://www.kaggle.com/datasets/balaka18/tmdb-top-10000-popular-movies-dataset'],
        ['Video game sales with ratings — game metadata', 'Kaggle · rush4ratio', 'https://www.kaggle.com/datasets/rush4ratio/video-game-sales-with-ratings'],
        ['HowLongToBeat snapshot — newer games', 'Kaggle · zaireali', 'https://www.kaggle.com/datasets/zaireali/howlongtobeat-games-scraper-2162025'],
        ['LightFM — hybrid recommender (deferred)', 'Kula', 'https://arxiv.org/abs/1507.08439'],
        ['LinUCB — contextual bandits (deferred)', 'Li et al.', 'https://arxiv.org/abs/1003.0146'],
        ['Calibration guidance — log loss / Brier', 'scikit-learn docs', 'https://scikit-learn.org/stable/modules/calibration.html'],
        ['TMDB API · IGDB API — live catalog', 'themoviedb.org · api.igdb.com', 'https://www.themoviedb.org/ · https://api.igdb.com/'],
        ['Distran repository — notebooks, results, decks', 'this project', 'https://github.com/alvinkgithubschool/Distran'],
      ].map(([label, who, url]) => (
        <div key={url} style={{ display: 'flex', alignItems: 'baseline', gap: 24, border: `1px solid ${line}`, borderRadius: 12, background: panel, padding: '9px 22px' }}>
          <div style={{ flex: 1, fontSize: 21, lineHeight: 1.3 }}>
            {label}
            <span style={{ color: subtle, fontSize: 18, marginLeft: 14 }}>{who}</span>
          </div>
          <a href={url} target="_blank" rel="noreferrer" style={{ fontFamily: mono, fontSize: 16, color: green, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            {url.replace(/^https?:\/\//, '')}
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
  'Hussein: where we started. A classic BPR recommender on a large Amazon dataset — popularity beat it, so we set collaborative weight to 0. Then predicting public score from text worked but that is what everyone thinks, not what you like. So we learn your taste from your own ratings.',
  'Hussein: the timeline. Three experiments, three lessons: a proxy corpus exists; popularity beats BPR on sparse data; public score is not personal taste. Each ruled out an approach and pointed to the next.',
  'Hussein: why this approach. A small online model — shared prior plus your private tweak, an adaptive preference classifier — fits the constraints: few ratings, cold items, no logged impressions. Idea borrowed from Ada-Pref. The alternatives are ruled out for concrete reasons on the right.',
  'Hussein: the system in one loop. Candidates come from the live catalog, hard filters remove ineligible works, the classifier scores, diversity reorders, and your ratings feed back into your features. Note the two lines at the bottom: the model may change only the order of eligible cards.',
  'Hussein: what we chose to do. One narrow question — would you rate this 4 or more? — asked per person, predicted before we learn, and proved off-line before it touches the app. On the right: one rating is one label, and not rated is never treated as disliked.',
  'Hussein: how it becomes a classifier. Your history becomes 13 numbers, the numbers become a weighted sum, the sigmoid squashes it into a probability, and the probability becomes an order. The table is the key idea: three different outputs, each with its own way of being measured.',
  'Hussein: the animation walks the same four steps, and the three cards at the bottom answer the obvious questions — what you see, why you can check it, and what improves it.',
  'Alvin: the formula, symbol by symbol. Read the table left to right: the prediction, the squashing function, the two biases, the shared weights, your private residual, the feature vector, the label, and the two tuning knobs. The update line underneath is where the learning happens.',
  'Alvin: the 13 features. Four groups — the work, the format, you, and the fit between you and the work. Every one is bounded, and every one is computed as of the event time so the model never sees the future.',
  'Alvin: the model in motion. Predict first, then the truth arrives, then the error moves your weights, and the next prediction is better. The left panel is the clipping that keeps one rating from dominating; the right panel explains why a new user is still sensible.',
  'Alvin: the encoders, with full names. Term Frequency–Inverse Document Frequency plus Singular Value Decomposition is the serving encoder; the CNN and the mini-GPT are from-scratch NumPy benchmarks, gradient-checked, each measured against a trivial baseline so the numbers mean something.',
  'Alvin: the two encoder animations. Left: a three-word window sliding over a description, pooling to a score bucket. Right: the mini-GPT predicting each next word — the representation that does this well is the embedding. Both panels carry their measured results.',
  'Alvin: training and evaluation protocol. Chronological 60/20/20 split, so the test is genuinely the future. Everything fit on train only, hyperparameters chosen on validation, test read once, five hypotheses registered before that read.',
  'Alvin: the animated split. Train on the past, tune on the middle, and the test stays locked until the final read.',
  'Issa: the predictions. Five questions, written down before the test read, each with the way we agreed to judge it — which is what stops us choosing the story after seeing the numbers.',
  'Issa: the actual outcomes. H1 confirmed, −36% error. H3 confirmed, 59× lower perplexity. H2 and H4 not confirmed. H5 held. One sentence: the model learned what you like, but not yet in which order to show it.',
  'Issa: the bars. Prediction error drops a third, the language model collapses perplexity, and ranking is a literal tie — the middle panel’s short bar is honest, not a drawing error.',
  'Issa: does it fit what the app needs. Four of five needs met: better-than-guessing prediction, learning from few ratings, working on brand-new works, and running locally without a GPU. The one that is not met — reordering the top 10 — is the one users notice, and it needs an impression ledger.',
  'Issa: learnings. Small, online, honestly evaluated beat big and static at this scale. Pointwise gains are not ranking gains. Next: an event and impression ledger, then on-device adaptive scoring benchmarked against today’s ranker.',
  'Issa: the gate. Research artifacts flow through heldout evaluation; the gate to the app — an app-side evaluation — stays shut, so the fixed-weight ranker remains live. The cards on the right say exactly what would open it.',
  'All: thank you — happy to take questions. Everything is reproducible from the repo, and the sources are next.',
  'Appendix: sources — the Ada-Pref paper that inspired per-user adaptation, the datasets, the deferred alternatives, calibration guidance, the live catalog providers, and the repo itself.',
];

export default [
  Cover,
  GoalExplain,
  GoalAnim,
  StartedExplain,
  StartedAnim,
  WhyExplain,
  PipelineAnim,
  ChoiceExplain,
  ClassifierExplain,
  ClassifierAnim,
  FormulaSymbols,
  FeaturesExplain,
  ModelAnim,
  EncodersExplain,
  EncodersAnim,
  TrainingExplain,
  TrainingAnim,
  Predictions,
  ResultsExplain,
  ResultsAnim,
  FitsNeeds,
  Learnings,
  GateAnim,
  Thanks,
  Sources,
] satisfies Page[];
