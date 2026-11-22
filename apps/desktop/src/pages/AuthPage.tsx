import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Gamepad2,
  Film,
  Tv,
  Check,
  LoaderCircle,
  ArrowUpRight,
  ArrowLeft,
  LockKeyhole,
} from 'lucide-react';
import { useStore } from '../lib/context';
import { authenticate, createAccount, DEMO_PASSWORD, demoEnabled } from '../lib/store';
import type { Role } from '../lib/store';
import { Wordmark, Eyebrow, Artwork } from '../components/ui';
import { catalog, getWork } from '../lib/catalog';
import type { Medium } from '../lib/catalog';

export function AuthPage() {
  const { db, commit } = useStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function signIn(email: string, password: string) {
    setBusy(true);
    setError('');
    try {
      const next = await authenticate(db, email, password);
      commit(next);
      const account = next.accounts.find((a) => a.id === next.activeId)!;
      navigate(account.complete ? '/home' : '/setup');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-top">
        <Wordmark />
        <span className="auth-edition">
          A PLACE FOR WHAT STAYS WITH YOU <span>EST. 2026</span>
        </span>
      </div>
      <div className="auth-layout">
        <section className="auth-story">
          <div className="auth-story-image" />
          <div className="story-noise" />
          <span className="auth-story-label">
            <span />
            ONE LEDGER. EVERY FORMAT.
          </span>
          <div className="story-heading">
            <Eyebrow>YOUR CULTURAL MEMORY</Eyebrow>
            <h1>
              A game.
              <br />A film.
              <br />
              <span>A feeling.</span>
            </h1>
            <p>
              Some things stay with you.
              <br />
              Give them a place to live.
            </p>
          </div>
          <div className="auth-poster-stack">
            {['cyberpunk', 'dune', 'elden-ring'].map((id, i) => (
              <div key={id} style={{ transform: `rotate(${(i - 1) * 8}deg)` }}>
                <Artwork work={getWork(id)!} />
              </div>
            ))}
          </div>
          <div className="auth-story-footer">
            <span>LOG IT. LIST IT. LIVE IN IT.</span>
            <ArrowUpRight size={22} />
          </div>
        </section>
        <section className="auth-form-side">
          <div className="auth-intro">
            <span className="pill-label">
              DISTRAN / {mode === 'signup' ? 'A NEW CHAPTER' : 'COME ON IN'}
            </span>
            <h2>
              {mode === 'signup'
                ? 'Make room for your world.'
                : mode === 'forgot'
                  ? 'Find your way back.'
                  : 'Welcome back\nto Distran.'}
            </h2>
            <p>
              {mode === 'signup'
                ? 'One place for everything that makes you, you.'
                : mode === 'forgot'
                  ? 'Your cultural memory will be right here.'
                  : 'Games, film, television — one place to log it, list it, and connect the dots.'}
            </p>
            <div className="auth-format-tags">
              <span>
                <Gamepad2 size={12} />
                Games
              </span>
              <span>
                <Film size={12} />
                Film
              </span>
              <span>
                <Tv size={12} />
                Television
              </span>
              <span className="auth-soon">✧ Buddy, soon</span>
            </div>
          </div>
          <div className="auth-card">
            {mode === 'forgot' ? (
              <>
                <div className="forgot-icon">
                  <LockKeyhole size={26} />
                </div>
                <h3>This preview stays on your device.</h3>
                <p className="muted">
                  Email recovery is available once AuthKit is connected. For now, use one of the
                  test accounts below. Your existing profile stays saved.
                </p>
                <button className="button primary full-width" onClick={() => setMode('signin')}>
                  <ArrowLeft size={16} />
                  Back to sign in
                </button>
              </>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (mode === 'signin') {
                    await signIn(email, password);
                    return;
                  }
                  setBusy(true);
                  setError('');
                  try {
                    commit(await createAccount(db, email, password, name, role));
                    navigate('/setup');
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {mode === 'signup' && (
                  <>
                    <div className="role-choice" role="group" aria-label="Account type">
                      <button
                        type="button"
                        aria-pressed={role === 'user'}
                        className={role === 'user' ? 'selected' : ''}
                        onClick={() => setRole('user')}
                      >
                        I’m here to discover
                      </button>
                      <button
                        type="button"
                        aria-pressed={role === 'creator'}
                        className={role === 'creator' ? 'selected' : ''}
                        onClick={() => setRole('creator')}
                      >
                        I’m a creator
                      </button>
                    </div>
                    <label className="field">
                      {role === 'creator' ? 'Studio / creator name' : 'Your name'}
                      <input
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="What should we call you?"
                      />
                    </label>
                  </>
                )}
                <label className="field">
                  Email
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    required
                    placeholder="you@distran.test"
                  />
                </label>
                <div className="password-label">
                  <label htmlFor="password">PASSWORD</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError('');
                      }}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="password-input">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={mode === 'signup' ? 8 : 1}
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="button primary full-width auth-submit"
                  type="submit"
                  disabled={busy || !demoEnabled}
                >
                  {busy ? (
                    <LoaderCircle size={17} className="spin" />
                  ) : (
                    <>
                      {mode === 'signin' ? 'Sign in' : 'Create local account'}
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
                <button className="button secondary full-width" type="button" disabled>
                  Continue with a connected app
                  <LockKeyhole size={13} />
                </button>
                <p className="auth-toggle">
                  {mode === 'signin' ? 'New to Distran?' : 'Already in the room?'}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'signin' ? 'signup' : 'signin');
                      setError('');
                      setPassword('');
                    }}
                  >
                    {mode === 'signin' ? 'Create one' : 'Sign in'}
                  </button>
                </p>
              </form>
            )}
          </div>
          {demoEnabled ? (
            <div className="test-account-box">
              <div>
                <span className="status-dot" />
                <span>LOCAL PREVIEW</span>
                <span>Saved on this device</span>
              </div>
              <p>Take a look around. Your own little corner is ready.</p>
              <div className="demo-buttons">
                <button disabled={busy} onClick={() => signIn('user@distran.test', DEMO_PASSWORD)}>
                  Try as a user
                  <ArrowUpRight size={14} />
                </button>
                <button
                  disabled={busy}
                  onClick={() => signIn('creator@distran.test', DEMO_PASSWORD)}
                >
                  Try as a creator
                  <ArrowUpRight size={14} />
                </button>
              </div>
              <details>
                <summary>Test login details</summary>
                <p>
                  user@distran.test
                  <br />
                  creator@distran.test
                  <br />
                  Password: {DEMO_PASSWORD}
                </p>
                <small>
                  These accounts are local fixtures, not hosted accounts. No cross-device sync.
                </small>
              </details>
            </div>
          ) : (
            <p className="micro-copy">
              Hosted authentication is not configured. Ask your administrator to connect AuthKit.
            </p>
          )}
          <div className="auth-bottom">
            A LITTLE MORE CURIOUS. A LITTLE MORE YOU.<span>↗</span>
          </div>
        </section>
      </div>
      <footer className="auth-footer">
        <span>ONE CULTURAL MEMORY.</span>
        <span>MADE FOR THE THINGS YOU LOVE.</span>
      </footer>
    </div>
  );
}
export function OnboardingPage() {
  const { account, update } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(account?.name ?? '');
  const [handle, setHandle] = useState(account?.handle ?? '');
  const [bio, setBio] = useState(account?.bio ?? '');
  const [website, setWebsite] = useState('');
  const [interests, setInterests] = useState<Medium[]>(
    account?.interests ?? ['game', 'movie', 'tv'],
  );
  const [favorites, setFavorites] = useState(account?.favorites ?? []);
  const [error, setError] = useState('');
  if (!account) return null;
  function finish() {
    if (!account) return;
    try {
      if (!name.trim() || !/^\w{3,24}$/.test(handle))
        throw Error('Choose a name and a handle with 3–24 letters, numbers or underscores.');
      if (website && !/^https?:\/\//i.test(website))
        throw Error('Website links should start with https://.');
      update({
        ...account,
        name: name.trim(),
        handle,
        bio: bio.trim(),
        interests,
        favorites,
        website: website.trim(),
        complete: true,
      });
      navigate('/home');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function toggle(id: string) {
    const work = getWork(id)!;
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((i) => i !== id));
      return;
    }
    if (favorites.filter((i) => getWork(i)?.medium === work.medium).length >= 4) {
      setError('Four favourites per format. Make a little room first.');
      return;
    }
    setFavorites([...favorites, id]);
    setError('');
  }
  return (
    <div className="onboarding-page">
      <header>
        <Wordmark />
        <button className="text-link" onClick={finish}>
          Skip for now
          <ArrowRight size={14} />
        </button>
      </header>
      <div className="setup-progress">
        {['A little about you', 'Follow your curiosity', 'Your cornerstones'].map((label, i) => (
          <span key={label} className={i <= step ? 'active' : ''}>
            <b>{i < step ? <Check size={12} /> : i + 1}</b>
            {label}
          </span>
        ))}
      </div>
      <main className="setup-content">
        <Eyebrow>CHAPTER {String(step + 1).padStart(2, '0')} / 03</Eyebrow>
        <h1>
          {step === 0
            ? account.role === 'creator'
              ? 'Every world has a maker.'
              : 'Let’s make this your room.'
            : step === 1
              ? 'Where does your curiosity go?'
              : 'The ones that made you, you.'}
        </h1>
        <p className="setup-description">
          {step === 0
            ? 'A name, a few words, a place to begin. You can change these any time.'
            : step === 1
              ? 'Pick the formats you reach for. There are no wrong combinations.'
              : 'Choose up to four favourites per format. This is a starting point, never a box.'}
        </p>
        {step === 0 ? (
          <div className="setup-form">
            <label className="field">
              {account.role === 'creator' ? 'Creator / studio name' : 'Display name'}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                required
              />
            </label>
            <label className="field">
              Your handle
              <div className="handle-input">
                <span>@</span>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase())}
                  maxLength={24}
                />
              </div>
            </label>
            <label className="field">
              A little about your world
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={400}
                rows={3}
              />
            </label>
            {account.role === 'creator' && (
              <>
                <label className="field">
                  Website <span className="optional">optional</span>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://your-studio.com"
                  />
                </label>
                <p className="micro-copy">
                  Creator profiles are unverified in this preview. Claiming a work requires a
                  separate verification process.
                </p>
              </>
            )}
          </div>
        ) : step === 1 ? (
          <div className="interest-grid">
            {(
              [
                { id: 'game', name: 'Games', caption: 'Worlds to get lost in', icon: Gamepad2 },
                { id: 'movie', name: 'Film', caption: 'A life in two hours', icon: Film },
                { id: 'tv', name: 'Television', caption: 'Just one more episode', icon: Tv },
              ] as const
            ).map(({ id, name, caption, icon: Icon }) => (
              <button
                key={id}
                className={interests.includes(id) ? 'selected' : ''}
                aria-pressed={interests.includes(id)}
                onClick={() =>
                  setInterests(
                    interests.includes(id) ? interests.filter((i) => i !== id) : [...interests, id],
                  )
                }
              >
                <Icon size={27} />
                <h3>{name}</h3>
                <p>{caption}</p>
                {interests.includes(id) && <Check size={18} />}
              </button>
            ))}
          </div>
        ) : (
          <div className="favorite-picker">
            {catalog.map((work) => (
              <button
                key={work.id}
                onClick={() => toggle(work.id)}
                aria-pressed={favorites.includes(work.id)}
                className={favorites.includes(work.id) ? 'selected' : ''}
              >
                <Artwork work={work} />
                <span>{work.title}</span>
                {favorites.includes(work.id) && (
                  <b>
                    <Check size={14} />
                  </b>
                )}
              </button>
            ))}
          </div>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer className="setup-footer">
          {step > 0 ? (
            <button
              className="button secondary"
              onClick={() => {
                setStep(step - 1);
                setError('');
              }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            className="button primary"
            onClick={() => {
              if (step === 0 && (!name.trim() || !/^\w{3,24}$/.test(handle))) {
                setError('Choose a name and a handle with 3–24 letters, numbers or underscores.');
                return;
              }
              if (step === 2) finish();
              else {
                setStep(step + 1);
                setError('');
              }
            }}
          >
            {step === 2 ? 'Enter your room' : 'Continue'}
            <ArrowRight size={16} />
          </button>
        </footer>
      </main>
      <footer className="setup-footnote">YOUR TASTE IS A THREAD. LET’S SEE WHERE IT GOES.</footer>
    </div>
  );
}
