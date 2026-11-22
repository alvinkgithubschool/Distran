import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Shield,
  Link2,
  Download,
  LogOut,
  Pencil,
  Check,
  LockKeyhole,
  Trash2,
  Copy,
} from 'lucide-react';
import { ProfileImages } from '../components/ProfileImages';
import { useStore } from '../lib/context';
import { Avatar, PageHeader, Eyebrow, Modal } from '../components/ui';
export function SettingsPage() {
  const { account, db, commit, update, notify } = useStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState(account?.name ?? '');
  const [handle, setHandle] = useState(account?.handle ?? '');
  const [bio, setBio] = useState(account?.bio ?? '');
  const [website, setWebsite] = useState(account?.website ?? '');
  const [avatar, setAvatar] = useState(account?.avatar ?? '');
  const [banner, setBanner] = useState(account?.banner ?? '');
  const [imageBusy, setImageBusy] = useState(false);
  const [error, setError] = useState('');
  const exportRef = useRef<HTMLTextAreaElement>(null);
  if (!account) return null;
  const exportData = JSON.stringify(
    {
      name: account.name,
      handle: account.handle,
      bio: account.bio,
      role: account.role,
      website: account.website,
      avatar: account.avatar,
      banner: account.banner,
      accent: account.accent,
      headline: account.headline,
      claims: account.claims,
      featuredWorks: account.featuredWorks,
      favorites: account.favorites,
      logs: account.logs,
      lists: account.lists,
      messages: account.messages,
      followed: account.followed,
      followedCreatorNames: account.followedCreatorNames,
      settings: account.settings,
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  );
  function toggle(key: 'privateProfile' | 'notifications') {
    if (!account) return;
    try {
      update({ ...account, settings: { ...account.settings, [key]: !account.settings[key] } });
    } catch (e) {
      notify((e as Error).message);
    }
  }
  return (
    <div className="settings-page page-pad">
      <Link to="/profile" className="back-link">
        <ArrowLeft size={15} />
        YOUR ROOM
      </Link>
      <PageHeader eyebrow="MAKE YOURSELF AT HOME" title="Settings" />
      <div className="settings-profile">
        <Avatar image={account.avatar} name={account.name} size="large" />
        <div>
          <h2>{account.name}</h2>
          <p>{account.email}</p>
          <span className="outline-label">
            {account.role === 'creator' ? 'CREATOR · ON DISTRAN' : 'LOCAL PREVIEW ACCOUNT'}
          </span>
        </div>
        <button className="button secondary" onClick={() => setEditing(true)}>
          <Pencil size={14} />
          Edit profile
        </button>
      </div>
      <section className="settings-group">
        <SectionTitle icon={<Shield size={17} />} label="Your space, your rules" />
        <div className="setting-row">
          <div>
            <h3>Private profile</h3>
            <p>
              {account.role === 'creator'
                ? 'Hide your creator page from other accounts on this device.'
                : 'A little room of your own. Saved as a preference for future sharing.'}
            </p>
          </div>
          <button
            role="switch"
            aria-checked={account.settings.privateProfile}
            aria-label="Private profile"
            className={`toggle ${account.settings.privateProfile ? 'on' : ''}`}
            onClick={() => toggle('privateProfile')}
          >
            <span />
          </button>
        </div>
        <div className="setting-row">
          <div>
            <h3>Stay in the loop</h3>
            <p>Save your notification preference. Live notifications are not enabled yet.</p>
          </div>
          <button
            role="switch"
            aria-checked={account.settings.notifications}
            aria-label="Notification preference"
            className={`toggle ${account.settings.notifications ? 'on' : ''}`}
            onClick={() => toggle('notifications')}
          >
            <span />
          </button>
        </div>
      </section>
      <section className="settings-group">
        <SectionTitle icon={<Link2 size={17} />} label="Your other shelves" />
        <p className="settings-group-description">
          Bring your worlds together. Connections are coming in a future chapter.
        </p>
        <div className="connections-grid">
          {[
            { name: 'Letterboxd', caption: 'Your film diary', symbol: '●●●' },
            { name: 'IMDb', caption: 'Your watchlist', symbol: 'IMDb' },
            { name: 'Backloggd', caption: 'Your game collection', symbol: 'b.' },
            { name: 'Steam', caption: 'Your game library', symbol: '↗' },
            { name: 'Xbox', caption: 'Your game library', symbol: 'X' },
            { name: 'PlayStation', caption: 'Your game library', symbol: '△' },
            { name: 'Spotify', caption: 'Your listening world', symbol: '≋' },
            { name: 'Apple Music', caption: 'Your music library', symbol: '♫' },
          ].map((provider) => (
            <button disabled key={provider.name} className="connection-card">
              <span className="connection-symbol">{provider.symbol}</span>
              <span>
                <strong>{provider.name}</strong>
                <small>{provider.caption}</small>
              </span>
              <LockKeyhole size={13} />
            </button>
          ))}
        </div>
      </section>
      <section className="settings-group">
        <SectionTitle icon={<Download size={17} />} label="Your memory belongs to you" />
        <button className="setting-row row-button" onClick={() => setExporting(true)}>
          <span>
            <h3>View and copy your data</h3>
            <p>Your profile, logs, lists and local messages. All in one place.</p>
          </span>
          <ArrowUpRight size={18} />
        </button>
        <button className="setting-row row-button danger-text" onClick={() => setDeleting(true)}>
          <span>
            <h3>Delete this local account</h3>
            <p>Remove this account and its saved data from this device.</p>
          </span>
          <Trash2 size={17} />
        </button>
      </section>
      <section className="settings-group about-group">
        <Eyebrow>A NOTE ABOUT THIS ROOM</Eyebrow>
        <p>
          Distran is a school project about cultural memory. This Tauri preview uses a curated local
          catalog plus live TMDB and IGDB search, and saves on this device. Hosted sign-in,
          messaging and account sync are still being connected. Home recommendations and Buddy are
          available as a local preview.
        </p>
        <p className="micro-copy">
          Artwork from the supplied Figma designs, Steam and TMDB. This product uses the TMDB API
          image service but is not endorsed or certified by TMDB. Images belong to their respective
          rights holders. Preview ratings are illustrative, not live community ratings.
        </p>
        <span>DISTRAN 0.2 / TAURI 2 / ONE LEDGER. EVERY FORMAT.</span>
      </section>
      <button
        className="button secondary sign-out"
        onClick={() => {
          try {
            commit({ ...db, activeId: null });
            navigate('/');
          } catch (e) {
            notify((e as Error).message);
          }
        }}
      >
        <LogOut size={16} />
        Sign out<span>Your memories stay saved.</span>
      </button>
      {editing && (
        <Modal
          title="A little more you."
          subtitle="EDIT YOUR PROFILE"
          onClose={() => setEditing(false)}
        >
          <form
            className="editor-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim() || !/^\w{3,24}$/.test(handle)) {
                setError('Choose a name and a handle with 3–24 letters, numbers or underscores.');
                return;
              }
              try {
                if (website && !/^https?:\/\//i.test(website)) {
                  setError('Website links should start with https://.');
                  return;
                }
                update({
                  ...account,
                  name: name.trim(),
                  handle,
                  bio: bio.trim(),
                  website: website.trim(),
                  avatar,
                  banner,
                });
                setEditing(false);
                notify('Your room, refreshed.');
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <ProfileImages
              avatar={avatar}
              banner={banner}
              onBusy={setImageBusy}
              onChange={(kind, value) => (kind === 'avatar' ? setAvatar(value) : setBanner(value))}
            />
            <label className="field">
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                required
              />
            </label>
            <label className="field">
              Handle
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase())}
                maxLength={24}
              />
            </label>
            <label className="field">
              A little about your world
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={400}
                rows={4}
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {account.role === 'creator' && (
              <label className="field">
                Studio website
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://your-studio.com"
                />
              </label>
            )}
            <footer className="modal-footer">
              <button className="button primary" type="submit" disabled={imageBusy}>
                Save profile
                <Check size={15} />
              </button>
            </footer>
          </form>
        </Modal>
      )}
      {exporting && (
        <Modal
          title="A little archive of you."
          subtitle="YOUR DATA / JSON"
          onClose={() => setExporting(false)}
        >
          <p className="muted">Only this account’s data. No passwords or authentication details.</p>
          <textarea
            className="export-data"
            readOnly
            ref={exportRef}
            value={exportData}
            aria-label="Your account data export"
            rows={13}
          />
          <footer className="modal-footer">
            <button
              className="button primary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(exportData);
                  notify('Your archive is copied.');
                } catch {
                  exportRef.current?.focus();
                  exportRef.current?.select();
                  notify('Your archive is selected. Press Command+C or Ctrl+C to copy.');
                }
              }}
            >
              <Copy size={15} />
              Copy archive
            </button>
          </footer>
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Close this little room?"
          subtitle="DELETE LOCAL ACCOUNT"
          onClose={() => setDeleting(false)}
        >
          <p className="muted">
            This removes {account.email}, its logs, lists and messages from this device. This cannot
            be undone.
          </p>
          <footer className="modal-footer">
            <button className="button secondary" onClick={() => setDeleting(false)}>
              Keep my room
            </button>
            <button
              className="button danger"
              onClick={() => {
                try {
                  commit({
                    ...db,
                    activeId: null,
                    accounts: db.accounts.filter((a) => a.id !== account.id),
                  });
                  navigate('/');
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              Delete my local account
            </button>
          </footer>
        </Modal>
      )}
    </div>
  );
}
function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <h2 className="settings-section-title">
      {icon}
      {label}
    </h2>
  );
}
