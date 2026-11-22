import { CreatorBadge, CreatorPageMark } from '../components/CreatorIdentity';
export { CreatorBadge } from '../components/CreatorIdentity';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Fingerprint,
  Pencil,
  Search,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../lib/context';
import {
  creditedWorks,
  isProviderCreator,
  localDirectory,
  publicCreators,
  catalogCreator,
} from '../lib/creators';
import type { Creator, CreatorDetail, CreatorResult } from '../lib/creators';
import { fetchCreator, searchCreators } from '../lib/catalog-api';
import { getWork, knownWorks } from '../lib/catalog';
import {
  Avatar,
  EmptyState,
  Eyebrow,
  Modal,
  PageHeader,
  SectionHeading,
  WorkCard,
} from '../components/ui';

export function CreatorsPage() {
  const { db } = useStore();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const [scope, setScope] = useState<'all' | 'distran'>('all');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<CreatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setResult(null);
    setError('');
    setLoading(false);
    if (scope === 'distran' || query.trim().length < 2) return;
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      searchCreators(query, page, controller.signal)
        .then(setResult)
        .catch(() => {
          if (!controller.signal.aborted)
            setError(
              'Live creator search is unavailable. Showing matching creators from this device.',
            );
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, scope, page, attempt]);
  const matches = (value: string) => value.toLowerCase().includes(query.toLowerCase().trim());
  const accounts = publicCreators(db).filter((creator) =>
    matches(`${creator.name} ${creator.handle} ${creator.headline ?? ''}`),
  );
  const local = localDirectory().filter((creator) => matches(creator.name));
  const providerNames = new Set(result?.items.map((creator) => creator.name.toLowerCase()));
  const directory = [
    ...(result?.items ?? []),
    ...local.filter((creator) => !providerNames.has(creator.name.toLowerCase())),
  ];
  return (
    <div className="page-pad creators-page">
      <PageHeader eyebrow="THE PEOPLE BEHIND YOUR WORLDS" title="Find your people.">
        <Link to="/discover" className="text-link">
          Explore works <ArrowUpRight size={14} />
        </Link>
      </PageHeader>
      <p className="creator-intro">
        Follow a filmmaker. Find a studio. See where their worlds connect.
      </p>
      <div className="search-field">
        <Search size={21} />
        <input
          type="search"
          aria-label="Search creators"
          placeholder="Search a creator, studio or username…"
          value={query}
          maxLength={100}
          onChange={(e) => {
            setPage(1);
            setParams(e.target.value ? { q: e.target.value } : {}, { replace: true });
          }}
        />
      </div>
      <div className="filter-tabs creator-filter">
        {(['all', 'distran'] as const).map((value) => (
          <button
            key={value}
            className={scope === value ? 'active' : ''}
            onClick={() => {
              setScope(value);
              setPage(1);
            }}
          >
            {value === 'all' ? 'All creators' : 'On Distran'}
          </button>
        ))}
      </div>
      <SectionHeading eyebrow="A LITTLE CLOSER" title="Here on Distran" />
      <div className="creator-directory">
        {accounts.map((creator) => (
          <Link
            className="directory-card on-distran"
            to={`/creators/${encodeURIComponent(creator.id)}`}
            key={creator.id}
          >
            <Avatar image={creator.avatar} name={creator.name} size="large" />
            <div>
              <CreatorBadge />
              <h2>
                {creator.name} <CreatorPageMark />
              </h2>
              <p>@{creator.handle}</p>
              <span>{creator.headline || 'Independent stories. Unexpected worlds.'}</span>
            </div>
            <ArrowUpRight size={18} />
          </Link>
        ))}
      </div>
      {!accounts.length && (
        <p className="muted">No matching Distran profiles. Try another name or username.</p>
      )}
      {scope === 'all' && (
        <section className="creator-catalog">
          <SectionHeading
            eyebrow={result ? 'TMDB PEOPLE + IGDB COMPANIES' : 'FROM YOUR CATALOG'}
            title="Makers, across mediums"
          />
          {error && (
            <div className="catalog-notice" role="status">
              {error}
              <button className="text-link" onClick={() => setAttempt((n) => n + 1)}>
                Retry
              </button>
            </div>
          )}
          {result?.status === 'partial' && (
            <p className="catalog-notice">
              Some providers are unavailable. Showing available creators.
            </p>
          )}
          {loading && <p role="status">Finding the people behind the worlds…</p>}
          {!loading && (
            <div className="creator-directory">
              {directory.map((creator) => (
                <CreatorCard creator={creator} key={creator.id} />
              ))}
            </div>
          )}
          {!loading && !directory.length && (
            <EmptyState
              heading="Still looking for your people?"
              body="Try a different name or studio."
            />
          )}
          {result && (
            <div className="catalog-pagination">
              <button
                className="button secondary"
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>PAGE {page}</span>
              <button
                className="button secondary"
                disabled={!result.hasMore || page >= 50 || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next page
              </button>
            </div>
          )}
          <p className="micro-copy">
            The orbit icon opens a creator page. On Distran identifies a local member profile;
            neither proves verified ownership.
          </p>
        </section>
      )}
    </div>
  );
}
function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <Link className="directory-card" to={`/creators/${encodeURIComponent(creator.id)}`}>
      <Avatar image={creator.image} name={creator.name} size="large" />
      <div>
        <Eyebrow>{creator.kind}</Eyebrow>
        <h2>
          {creator.name} <CreatorPageMark />
        </h2>
        <span>{creator.provider?.toUpperCase() || 'CATALOG DIRECTORY'}</span>
      </div>
      <ArrowUpRight size={18} />
    </Link>
  );
}

export function CreatorPage() {
  const { id = '' } = useParams();
  const { db, account, update, notify } = useStore();
  const profile = publicCreators(db).find((creator) => creator.id === id);
  const own = profile?.id === account?.id;
  const [detail, setDetail] = useState<CreatorDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    setDetail(null);
    setError('');
    setLoading(false);
    if (!isProviderCreator(id)) return;
    const controller = new AbortController();
    setLoading(true);
    fetchCreator(id, controller.signal)
      .then(setDetail)
      .catch(() => {
        if (!controller.signal.aborted)
          setError('This creator could not be loaded. Please try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, attempt]);
  const creator = profile
    ? {
        id: profile.id,
        name: profile.name,
        image: profile.avatar,
        kind: 'Creator',
        bio: profile.bio,
      }
    : (detail?.creator ?? catalogCreator(id));
  if (loading && !creator)
    return (
      <div className="page-pad" role="status">
        Opening this creator’s room…
      </div>
    );
  if (error && !creator)
    return (
      <EmptyState
        heading="A connection out of reach."
        body={error}
        onClick={() => setAttempt((n) => n + 1)}
        label="Try again"
      />
    );
  if (!creator)
    return (
      <EmptyState
        heading="This creator page is unavailable."
        body="The profile may be private, or the creator has not joined this directory."
        to="/creators"
        label="Find creators"
      />
    );
  const works = profile ? [] : (detail?.works ?? creditedWorks(creator.id));
  const featured = (profile?.featuredWorks ?? []).map(getWork).filter((work) => !!work);
  const followKey = profile
    ? `profile:${profile.id}`
    : creator.provider
      ? creator.id
      : creator.name;
  const follows = account?.followed.includes(followKey);
  return (
    <article
      className={`creator-page ${profile ? 'is-member' : ''}`}
      style={{ '--creator-accent': profile?.accent || '#b7c96c' } as CSSProperties}
    >
      <div className="creator-cover">
        {profile?.banner && <img src={profile.banner} alt={`${creator.name}’s banner`} />}
        <div />
        <Link className="back-link" to="/creators">
          <ArrowLeft size={15} /> ALL CREATORS
        </Link>
        <span className="creator-cover-label">WORLDS BEGIN WITH PEOPLE.</span>
      </div>
      <div className="page-pad creator-content">
        {error && (
          <p className="catalog-notice" role="status">
            Provider details are unavailable. Showing cached catalog credits.{' '}
            <button className="text-link" onClick={() => setAttempt((n) => n + 1)}>
              Retry
            </button>
          </p>
        )}
        <header className="creator-identity">
          <Avatar image={creator.image} name={creator.name} size="large" />
          <div>
            {profile ? <CreatorBadge /> : <Eyebrow>{creator.kind} · DIRECTORY</Eyebrow>}
            <h1>
              {creator.name} <CreatorPageMark />
            </h1>
            {profile && <p>@{profile.handle}</p>}
          </div>
          {own ? (
            <button className="button secondary" onClick={() => setEditing(true)}>
              <Pencil size={14} /> Customize page
            </button>
          ) : (
            <button
              className={`button ${follows ? 'secondary' : 'primary'}`}
              onClick={() => {
                if (!account) return;
                try {
                  update({
                    ...account,
                    followedCreatorNames: {
                      ...account.followedCreatorNames,
                      [followKey]: creator.name,
                    },
                    followed: follows
                      ? account.followed.filter((value) => value !== followKey)
                      : [...account.followed, followKey],
                  });
                  notify(follows ? 'Removed from your orbit.' : 'Added to your orbit.');
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              {follows ? <Check size={14} /> : <Sparkles size={14} />}
              {follows ? 'Following' : 'Follow creator'}
            </button>
          )}
        </header>
        {profile?.headline && <h2 className="creator-headline">{profile.headline}</h2>}
        <p className="creator-biography">{creator.bio || 'Follow the work. Find a new thread.'}</p>
        {profile?.website && (
          <a className="text-link" href={profile.website} target="_blank" rel="noreferrer">
            Official website <ArrowUpRight size={14} />
          </a>
        )}
        {detail?.creator.sourceUrl && (
          <a className="text-link" href={detail.creator.sourceUrl} target="_blank" rel="noreferrer">
            View on {detail.creator.provider?.toUpperCase()} <ArrowUpRight size={14} />
          </a>
        )}
        {profile && (
          <section className="creator-portfolio">
            <SectionHeading eyebrow="SELECTED BY THE CREATOR" title="From this room" />
            <p className="muted">
              A personal selection of works and inspirations. Selection does not imply an ownership
              claim.
            </p>
            <div className="poster-grid">
              {featured.map((work) => (
                <WorkCard work={work} key={work.id} />
              ))}
            </div>
            {!featured.length && (
              <p className="muted">A new room, waiting for its first selections.</p>
            )}
          </section>
        )}
        {!profile && (
          <section className="creator-portfolio">
            <SectionHeading
              eyebrow="PROVIDER CREDITS / CATALOG CONNECTIONS"
              title="Follow the work."
            />
            <div className="poster-grid">
              {works.map((work) => (
                <WorkCard work={work} key={work.id} />
              ))}
            </div>
            {!works.length && (
              <p className="muted">
                No connected works loaded yet. Search the catalog to explore more.
              </p>
            )}
          </section>
        )}
        {own && profile && (
          <section className="creator-claims">
            <SectionHeading eyebrow="YOUR CREATOR DESK · ONLY YOU" title="Your credit claims">
              <Link to="/discover" className="button secondary">
                <Fingerprint size={15} /> Find a work to claim
              </Link>
            </SectionHeading>
            <p className="muted">
              Open any film, show or game and choose “Claim your credit”. These requests stay on
              this device until hosted verification is connected.
            </p>
            {(profile.claims ?? []).map((claim) => (
              <div className="claim-row" key={claim.id}>
                <div>
                  <Link to={`/title/${claim.workId}`}>
                    <h3>{getWork(claim.workId)?.title || 'Saved title'}</h3>
                  </Link>
                  <p>
                    {claim.credit} · {new Date(claim.date).toLocaleDateString()}
                  </p>
                  <a className="text-link" href={claim.evidence} target="_blank" rel="noreferrer">
                    Evidence <ArrowUpRight size={12} />
                  </a>
                </div>
                <span className="outline-label">Pending verification</span>
                <button
                  className="text-link"
                  onClick={() => {
                    try {
                      update({
                        ...profile,
                        claims: profile.claims?.filter((item) => item.id !== claim.id),
                      });
                      notify('Claim request withdrawn.');
                    } catch (e) {
                      notify((e as Error).message);
                    }
                  }}
                >
                  Withdraw
                </button>
              </div>
            ))}
          </section>
        )}
      </div>
      {editing && profile && <CreatorEditor onClose={() => setEditing(false)} />}
    </article>
  );
}
function CreatorEditor({ onClose }: { onClose: () => void }) {
  const { account, update, notify } = useStore();
  const [headline, setHeadline] = useState(account?.headline ?? '');
  const [accent, setAccent] = useState(account?.accent ?? '#b7c96c');
  const [featured, setFeatured] = useState(account?.featuredWorks ?? []);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  if (!account) return null;
  return (
    <Modal title="Make this room yours." subtitle="CREATOR PAGE" onClose={onClose}>
      <form
        className="editor-form"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            update({ ...account, headline: headline.trim(), accent, featuredWorks: featured });
            notify('Your creator page is refreshed.');
            onClose();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <Link className="text-link" to="/settings">
          Edit name, username, photo and banner <ArrowUpRight size={14} />
        </Link>
        <label className="field">
          Your headline
          <input
            maxLength={120}
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Independent stories. Unexpected worlds."
          />
        </label>
        <fieldset className="accent-picker">
          <legend>Your room’s accent</legend>
          {['#b7c96c', '#e5b17f', '#8bbfc9', '#c4a1dd', '#e5a3b2'].map((color) => (
            <button
              className="accent-swatch"
              key={color}
              type="button"
              style={{ background: color }}
              aria-label={`Accent ${color}`}
              aria-pressed={accent === color}
              onClick={() => setAccent(color)}
            >
              {accent === color && <Check size={19} />}
            </button>
          ))}
        </fieldset>
        <label className="field">
          Find a featured work
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <p className="muted">
          Select up to six inspirations or works, in selection order. Search Discover first to bring
          a live title into this picker.
        </p>
        <div className="featured-picker">
          {knownWorks()
            .filter((work) => work.title.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 30)
            .map((work) => (
              <button
                type="button"
                key={work.id}
                aria-pressed={featured.includes(work.id)}
                onClick={() => {
                  if (featured.includes(work.id))
                    setFeatured(featured.filter((id) => id !== work.id));
                  else if (featured.length < 6) {
                    setFeatured([...featured, work.id]);
                    setError('');
                  } else setError('Choose up to six featured works.');
                }}
              >
                {work.title}
                <span>
                  {featured.includes(work.id) ? `0${featured.indexOf(work.id) + 1} ✓` : '+'}
                </span>
              </button>
            ))}
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <footer className="modal-footer">
          <button className="button primary">
            Save creator page <Check size={15} />
          </button>
        </footer>
      </form>
    </Modal>
  );
}
