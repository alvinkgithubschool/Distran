import { CreatorBadge, CreatorPageMark } from '../components/CreatorIdentity';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  ArrowUpRight,
  Pencil,
  Plus,
  Star,
  Check,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  LockKeyhole,
} from 'lucide-react';
import { useStore } from '../lib/context';
import { catalog, getWork, mediumNames } from '../lib/catalog';
import type { Medium } from '../lib/catalog';
import {
  Avatar,
  Eyebrow,
  SectionHeading,
  WorkCard,
  Artwork,
  Modal,
  EmptyState,
} from '../components/ui';
export function ProfilePage() {
  const { account, openLog, db } = useStore();
  const [tab, setTab] = useState('cornerstones');
  const [editFavorites, setEditFavorites] = useState(false);
  const [favoriteMedium, setFavoriteMedium] = useState<Medium>('game');
  if (!account) return null;
  return (
    <div className="profile-page page-pad">
      {account.banner && (
        <div className="profile-banner">
          <img src={account.banner} alt="Your profile banner" />
        </div>
      )}
      <header className="profile-top">
        <Eyebrow>YOUR SHELF / YOUR STORY</Eyebrow>
        <Link className="icon-button bordered" to="/settings" aria-label="Profile settings">
          <Settings size={19} />
        </Link>
      </header>
      <div className={`profile-identity ${account.role === 'creator' ? 'creator-member' : ''}`}>
        <Avatar image={account.avatar} name={account.name} size="large" />
        <div>
          <div className="profile-name">
            <h1>
              {account.name} {account.role === 'creator' && <CreatorPageMark />}
            </h1>
            {account.role === 'creator' && <CreatorBadge />}
          </div>
          <p className="handle">@{account.handle}</p>
        </div>
        <Link to="/settings" className="button secondary">
          <Pencil size={13} />
          Edit profile
        </Link>
      </div>
      {account.role === 'creator' && (
        <Link
          className="button secondary creator-room-link"
          to={`/creators/${encodeURIComponent(account.id)}`}
        >
          Open your creator page <ArrowUpRight size={15} />
        </Link>
      )}
      <p className="profile-bio">{account.bio || 'A place for the things that make you, you.'}</p>
      {account.website && <p className="profile-website">{account.website}</p>}
      <div className="profile-stats">
        <button onClick={() => setTab('ledger')}>
          <strong>{String(account.logs.length).padStart(2, '0')}</strong>
          <span>LOGGED</span>
        </button>
        <button onClick={() => setTab('lists')}>
          <strong>{String(account.lists.length).padStart(2, '0')}</strong>
          <span>COLLECTIONS</span>
        </button>
        <div>
          <strong>{String(account.followed.length).padStart(2, '0')}</strong>
          <span>IN YOUR ORBIT</span>
        </div>
        <div>
          <strong>
            {String(account.logs.filter((l) => l.status === 'planned').length).padStart(2, '0')}
          </strong>
          <span>ON THE HORIZON</span>
        </div>
      </div>
      <div className="profile-tabs filter-tabs">
        {[
          { id: 'cornerstones', name: 'Your Top 4' },
          { id: 'ledger', name: 'The ledger' },
          { id: 'lists', name: 'Your collections' },
        ].map((t) => (
          <button className={tab === t.id ? 'active' : ''} key={t.id} onClick={() => setTab(t.id)}>
            {t.name}
          </button>
        ))}
      </div>
      {tab === 'cornerstones' ? (
        <>
          <div className="profile-section-intro">
            <Eyebrow>THE ONES THAT MADE YOU, YOU.</Eyebrow>
            <p>Four corners. A whole world.</p>
          </div>
          {(['game', 'movie', 'tv'] as const).map((medium) => {
            const works = account.favorites.map(getWork).filter((w) => w?.medium === medium);
            return (
              <section className="favorites-section" key={medium}>
                <SectionHeading
                  title={medium === 'game' ? 'Games' : medium === 'movie' ? 'Film' : 'Television'}
                >
                  <button
                    className="text-link"
                    onClick={() => {
                      setFavoriteMedium(medium);
                      setEditFavorites(true);
                    }}
                  >
                    MAKE IT YOURS
                    <Pencil size={12} />
                  </button>
                </SectionHeading>
                <div className="poster-grid favorites-grid">
                  {works.map((w, i) => (
                    <WorkCard key={w!.id} work={w!} index={i} />
                  ))}
                  {Array.from({ length: 4 - works.length }, (_, i) => (
                    <button
                      className="empty-favorite"
                      key={i}
                      onClick={() => {
                        setFavoriteMedium(medium);
                        setEditFavorites(true);
                      }}
                      aria-label={`Add a ${mediumNames[medium]} favorite`}
                    >
                      <Plus size={23} />
                      <span>YOUR NEXT FAVOURITE</span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
          <section className="profile-creators">
            <SectionHeading eyebrow="THE PEOPLE WHO MAKE YOUR WORLDS" title="In your orbit" />
            <div className="creator-pills">
              {account.followed.map((key, i) => {
                const id = key.startsWith('profile:') ? key.slice(8) : key;
                const creator = db.accounts.find((person) => person.id === id);
                const name = creator?.name ?? account.followedCreatorNames?.[key] ?? key;
                return (
                  <Link key={key} to={`/creators/${encodeURIComponent(id)}`}>
                    <span className={`creator-dot creator-${i % 3}`}>{name.charAt(0)}</span>
                    {name}
                    <ArrowUpRight size={12} />
                  </Link>
                );
              })}
              {!account.followed.length && (
                <Link to="/discover">
                  Find your people
                  <ArrowUpRight size={12} />
                </Link>
              )}
            </div>
          </section>
        </>
      ) : tab === 'ledger' ? (
        <section className="ledger-section">
          <SectionHeading eyebrow="LITTLE MOMENTS, KEPT" title="Your cultural memory" />
          {account.logs.length ? (
            <div className="ledger-list">
              {account.logs.map((log) => {
                const work = getWork(log.workId);
                return work ? (
                  <article key={log.id}>
                    <Link to={`/title/${work.id}`}>
                      <Artwork work={work} />
                    </Link>
                    <div>
                      <Eyebrow>
                        {new Date(log.date).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}{' '}
                        · {log.status === 'planned' ? 'WANT TO' : log.status.toUpperCase()}
                      </Eyebrow>
                      <Link to={`/title/${work.id}`}>
                        <h3>{work.title}</h3>
                      </Link>
                      <p>{log.note || 'Some moments don’t need words.'}</p>
                      <span className="ledger-rating">
                        {log.rating > 0 ? (
                          <>
                            <Star size={12} fill="currentColor" />
                            {log.rating} / 5
                          </>
                        ) : (
                          'UNRATED'
                        )}
                        <small>
                          <LockKeyhole size={10} />
                          {log.visibility}
                        </small>
                      </span>
                    </div>
                    <button
                      className="icon-button"
                      aria-label={`Edit log for ${work.title}`}
                      onClick={() => openLog(work.id, log.id)}
                    >
                      <Pencil size={16} />
                    </button>
                  </article>
                ) : null;
              })}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen size={28} />}
              heading="A memory waiting to happen."
              body="Log a work you love. Leave a thought, a rating, a little part of you."
              to="/discover"
              label="Find something to log"
            />
          )}
        </section>
      ) : (
        <section className="profile-lists">
          <SectionHeading
            eyebrow="DIFFERENT WORKS. A SHARED FEELING."
            title="Your collections"
            to="/lists"
          />
          {account.lists.map((list) => (
            <Link className="profile-list-row" to={`/lists/${list.id}`} key={list.id}>
              <span>
                <h3>{list.title}</h3>
                <small>
                  {list.workIds.length} WORKS · {list.visibility.toUpperCase()}
                </small>
              </span>
              <ArrowUpRight size={18} />
            </Link>
          ))}
          {!account.lists.length && (
            <EmptyState
              heading="Find your first connection."
              body="A shelf for the things that belong together."
              to="/lists"
              label="Create a collection"
            />
          )}
        </section>
      )}
      {editFavorites && (
        <FavoriteEditor medium={favoriteMedium} onClose={() => setEditFavorites(false)} />
      )}
    </div>
  );
}
function FavoriteEditor({ medium, onClose }: { medium: Medium; onClose: () => void }) {
  const { account, update, notify } = useStore();
  const [ids, setIds] = useState(
    account?.favorites.filter((id) => getWork(id)?.medium === medium) ?? [],
  );
  const [error, setError] = useState('');
  if (!account) return null;
  function toggle(id: string) {
    if (ids.includes(id)) {
      setIds(ids.filter((i) => i !== id));
      setError('');
    } else if (ids.length < 4) {
      setIds([...ids, id]);
      setError('');
    } else setError('Four favourites, in your order. Remove one to make room.');
  }
  return (
    <Modal
      title="Four corners of your world."
      subtitle={`YOUR ${mediumNames[medium].toUpperCase()} TOP 4`}
      onClose={onClose}
    >
      <p className="muted">The order is part of the story. Choose up to four.</p>
      <div className="favorite-order">
        {ids.map((id, index) => (
          <div key={id}>
            <span>{index + 1}</span>
            <strong>{getWork(id)!.title}</strong>
            <button
              className="icon-button"
              aria-label={`Move ${getWork(id)!.title} earlier`}
              disabled={index === 0}
              onClick={() => {
                const next = [...ids];
                [next[index], next[index - 1]] = [next[index - 1], next[index]];
                setIds(next);
              }}
            >
              <ArrowLeft size={15} />
            </button>
            <button
              className="icon-button"
              aria-label={`Move ${getWork(id)!.title} later`}
              disabled={index === ids.length - 1}
              onClick={() => {
                const next = [...ids];
                [next[index], next[index + 1]] = [next[index + 1], next[index]];
                setIds(next);
              }}
            >
              <ArrowRight size={15} />
            </button>
          </div>
        ))}
      </div>
      <div className="favorite-picker modal-favorites">
        {catalog
          .filter((w) => w.medium === medium)
          .map((w) => (
            <button
              key={w.id}
              className={ids.includes(w.id) ? 'selected' : ''}
              aria-pressed={ids.includes(w.id)}
              onClick={() => toggle(w.id)}
            >
              <Artwork work={w} />
              <span>{w.title}</span>
              {ids.includes(w.id) && (
                <b>
                  <Check size={13} />
                </b>
              )}
            </button>
          ))}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <footer className="modal-footer">
        <button
          className="button primary"
          onClick={() => {
            try {
              update({
                ...account,
                favorites: [
                  ...account.favorites.filter((id) => getWork(id)?.medium !== medium),
                  ...ids,
                ],
              });
              notify('Your cornerstones, in your order.');
              onClose();
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          Save your Top 4<Check size={15} />
        </button>
      </footer>
    </Modal>
  );
}
