import { CreatorPageMark } from './CreatorIdentity';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Compass,
  Library,
  MessagesSquare,
  UserRound,
  Settings,
  Plus,
  ArrowUpRight,
  Search,
  Bell,
  Gamepad2,
  Film,
  Tv,
  ChevronDown,
  Sparkles,
  CircleHelp,
} from 'lucide-react';
import { Wordmark, Avatar, Eyebrow, Modal, Artwork } from './ui';
import { useStore } from '../lib/context';
import { catalog, getWork, mediumNames } from '../lib/catalog';
import type { Medium } from '../lib/catalog';
const nav = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/discover', label: 'Discover', icon: Compass },
  { path: '/lists', label: 'Your lists', icon: Library },
  { path: '/chat', label: 'Buddy & friends', icon: MessagesSquare },
  { path: '/profile', label: 'Your profile', icon: UserRound },
];
export function AppShell() {
  const { account, openLog } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [formatOpen, setFormatOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [quickLog, setQuickLog] = useState(false);
  const [query, setQuery] = useState('');
  const current =
    nav.find((n) => location.pathname.startsWith(n.path))?.label ??
    (location.pathname.startsWith('/settings')
      ? 'Settings'
      : location.pathname.startsWith('/creators')
        ? 'Creators'
        : 'The work');
  useEffect(() => {
    function shortcut(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/discover');
        setTimeout(() => document.getElementById('catalog-search')?.focus(), 100);
      }
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [navigate]);
  if (!account) return null;
  return (
    <div className="app-layout">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <Wordmark />
        <button className="format-switch" onClick={() => setFormatOpen(true)}>
          <span className="format-dot" />
          Every format
          <ChevronDown size={14} />
        </button>
        <Eyebrow>YOUR SPACE</Eyebrow>
        <nav className="main-nav">
          {nav.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path}>
              <Icon size={19} strokeWidth={1.4} />
              <span>{label}</span>
              {path === '/chat' && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-rule" />
        <div className="sidebar-label">
          <Eyebrow>ON YOUR SHELF</Eyebrow>
          <Link to="/lists" aria-label="Manage your lists">
            <Plus size={14} />
          </Link>
        </div>
        <div className="sidebar-lists">
          {account.lists.slice(0, 3).map((list, index) => (
            <Link to={`/lists/${list.id}`} key={list.id}>
              <span className={`list-dot dot-${index}`} />
              <span>{list.title}</span>
            </Link>
          ))}
        </div>
        <button
          className="new-log-button"
          onClick={() => {
            setQuery('');
            setQuickLog(true);
          }}
        >
          <Plus size={17} />
          Log something<kbd>＋</kbd>
        </button>
        <div className="sidebar-bottom">
          <button className="sidebar-help" onClick={() => setHelpOpen(true)}>
            <CircleHelp size={16} />A little orientation
            <ArrowUpRight size={12} />
          </button>
          <Link className="sidebar-profile" to="/profile">
            <Avatar image={account.avatar} name={account.name} />
            <div>
              <strong>{account.name}</strong>
              <small>@{account.handle}</small>
            </div>
            <Settings size={16} />
          </Link>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            Your cultural memory<span>/</span>
            <strong>{current}</strong>
          </div>
          <div className="topbar-right">
            <span className="preview-label">
              <span />
              LOCAL PREVIEW
            </span>
            <button
              className="command-search"
              onClick={() => navigate('/discover')}
              aria-label="Search catalog"
            >
              <Search size={15} />
              <span>Find a work, a world, a feeling</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="icon-button"
              aria-label="Notifications"
              onClick={() => setActivityOpen(true)}
            >
              <Bell size={18} />
            </button>
            <Link to="/settings" className="icon-button" aria-label="Open settings">
              <Settings size={18} />
            </Link>
          </div>
        </header>
        <main id="main-content" key={location.pathname} className="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>DISTRAN / CULTURAL MEMORY</span>
          <span>ONE LEDGER. EVERY FORMAT.</span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Main navigation">
        {nav.map(({ path, label, icon: Icon }) => (
          <NavLink to={path} key={path} aria-label={label}>
            <Icon size={21} strokeWidth={1.4} />
            <span>{label === 'Buddy & friends' ? 'Friends' : label.replace('Your ', '')}</span>
          </NavLink>
        ))}
      </nav>
      {formatOpen && (
        <Modal
          title="Every format. One room."
          subtitle="FOLLOW YOUR CURIOSITY"
          onClose={() => setFormatOpen(false)}
        >
          <p className="muted">The medium changes. Your taste comes with you.</p>
          <div className="format-dialog-grid">
            {(
              [
                { id: 'game', name: 'Games', icon: Gamepad2, color: '#b5c75c' },
                { id: 'movie', name: 'Movies', icon: Film, color: '#e8ad54' },
                { id: 'tv', name: 'Television', icon: Tv, color: '#73bdc7' },
              ] as const
            ).map(({ id, name, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => {
                  navigate(`/discover?medium=${id}`);
                  setFormatOpen(false);
                }}
              >
                <Icon color={color} />
                <h3>{name}</h3>
                <small>{catalog.filter((w) => w.medium === id).length} WORKS TO EXPLORE</small>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
          <button
            className="button primary full-width"
            onClick={() => {
              navigate('/discover');
              setFormatOpen(false);
            }}
          >
            Explore everything
            <Compass size={16} />
          </button>
          <p className="micro-copy">Music, books and social are coming in the next chapter.</p>
        </Modal>
      )}
      {activityOpen && (
        <Modal
          title="The room is quiet."
          subtitle="YOUR NOTIFICATIONS"
          onClose={() => setActivityOpen(false)}
        >
          <div className="empty-state">
            <Bell size={32} />
            <h3>Nothing new just yet.</h3>
            <p>
              When live activity is connected, updates from your people and the creators you follow
              will arrive here.
            </p>
          </div>
        </Modal>
      )}
      {helpOpen && (
        <Modal
          title="A place for what stays with you."
          subtitle="WELCOME TO DISTRAN"
          onClose={() => setHelpOpen(false)}
        >
          <div className="help-steps">
            <p>
              <span>01</span>Find a film, game or series in Discover.
            </p>
            <p>
              <span>02</span>Log it. Leave a rating or keep a thought.
            </p>
            <p>
              <span>03</span>Make a list that crosses formats.
            </p>
            <p>
              <span>04</span>Give your favourites a place in your Top 4.
            </p>
          </div>
          <p className="micro-copy">
            This preview saves to this device. Live catalogs, messages and hosted authentication are
            still being connected.
          </p>
        </Modal>
      )}
      {quickLog && (
        <Modal
          title="What stayed with you?"
          subtitle="ADD TO YOUR LEDGER"
          onClose={() => setQuickLog(false)}
        >
          <label className="field">
            Find a work
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="A film, a game, a series…"
            />
          </label>
          <div className="quick-log-list">
            {catalog
              .filter((w) => w.title.toLowerCase().includes(query.toLowerCase()))
              .map((work) => (
                <button
                  key={work.id}
                  onClick={() => {
                    setQuickLog(false);
                    openLog(work.id);
                  }}
                >
                  <Artwork work={work} />
                  <span>
                    {work.title}
                    <small>
                      {mediumNames[work.medium]} · {work.year}
                    </small>
                  </span>
                  <Plus size={17} />
                </button>
              ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
export function OrbitPanel() {
  const { account } = useStore();
  return (
    <aside className="orbit-panel">
      <div className="orbit-heading">
        <Eyebrow>IN YOUR ORBIT</Eyebrow>
        <span className="status-dot" />
      </div>
      <h2>A thread worth following.</h2>
      <p className="orbit-description">
        Sometimes the next thing you love is a little outside the familiar.
      </p>
      <Link className="orbit-feature" to="/title/arrival">
        <Artwork work={getWork('arrival')!} />
        <span className="orbit-feature-copy">
          <span className="tiny-tag">A DIFFERENT FREQUENCY</span>
          <strong>Arrival</strong>
          <small>For the worlds you get lost in.</small>
          <span className="orbit-arrow">
            <ArrowUpRight size={18} />
          </span>
        </span>
      </Link>
      <div className="orbit-note">
        <Sparkles size={15} />
        <p>
          Handpicked for this preview.
          <br />
          <span>Find personal picks on Home or ask Buddy.</span>
        </p>
      </div>
      <div className="orbit-rule" />
      <div className="sidebar-label">
        <Eyebrow>CREATORS TO KEEP CLOSE</Eyebrow>
      </div>
      {['cyberpunk', 'edgerunners', 'dune']
        .flatMap((id) => getWork(id)?.creators?.slice(0, 1) ?? [])
        .map((creator, i) => (
          <Link
            className="creator-mini"
            key={creator.id}
            to={`/creators/${encodeURIComponent(creator.id)}`}
          >
            <span className={`creator-mark creator-${i}`}>
              {creator.name
                .split(' ')
                .map((s) => s[0])
                .slice(0, 2)
                .join('')}
            </span>
            <div>
              <h3>
                {creator.name} <CreatorPageMark />
              </h3>
              <p>{creator.role?.toUpperCase() || 'CREATOR'}</p>
            </div>
            <ArrowUpRight size={13} />
          </Link>
        ))}
      <div className="orbit-rule" />
      <div className="orbit-ledger">
        <Eyebrow>YOUR NEXT CHAPTER</Eyebrow>
        <h3>
          {account?.logs.length
            ? 'Every log adds a little more you.'
            : 'Your story starts with a single work.'}
        </h3>
        <Link to="/profile">
          Open your ledger
          <ArrowUpRight size={13} />
        </Link>
      </div>
      <div className="orbit-signature">
        Follow the thread.<span>See where it takes you.</span>
      </div>
    </aside>
  );
}
export function ActiveFormat({
  value,
  onChange,
}: {
  value: Medium | 'all';
  onChange: (medium: Medium | 'all') => void;
}) {
  return (
    <div className="filter-tabs" role="group" aria-label="Filter by format">
      {(['all', 'game', 'movie', 'tv'] as const).map((m) => (
        <button
          key={m}
          className={value === m ? 'active' : ''}
          aria-pressed={value === m}
          onClick={() => onChange(m)}
        >
          {m === 'all'
            ? 'Everything'
            : m === 'game'
              ? 'Games'
              : m === 'movie'
                ? 'Films'
                : 'Television'}
        </button>
      ))}
    </div>
  );
}
