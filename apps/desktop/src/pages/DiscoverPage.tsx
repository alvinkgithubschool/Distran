import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Gamepad2,
  Film,
  Tv,
  Music2,
  BookOpen,
  AudioLines,
  ArrowUpRight,
  X,
  Check,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import { useStore } from '../lib/context';
import { catalog, searchCatalog } from '../lib/catalog';
import type { Medium } from '../lib/catalog';
import {
  PageHeader,
  Eyebrow,
  SectionHeading,
  WorkCard,
  BuddyStrip,
  EmptyState,
} from '../components/ui';
import { useLiveSearch } from '../lib/use-catalog';
import { ActiveFormat } from '../components/AppShell';

export function DiscoverPage() {
  const { account, update, notify } = useStore();
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState('curated');
  const query = params.get('q') ?? params.get('creator') ?? '';
  const raw = params.get('medium');
  const medium: Medium | 'all' = raw === 'game' || raw === 'movie' || raw === 'tv' ? raw : 'all';
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const curated = params.has('creator') || params.get('scope') === 'curated';
  const live = useLiveSearch(query, medium, page, retry, !curated);
  const usingLive = !!live.result;
  const filtered = live.result?.items ?? searchCatalog(query, medium);
  const results =
    sort === 'year'
      ? [...filtered].sort((a, b) => b.year - a.year)
      : sort === 'title'
        ? [...filtered].sort((a, b) => a.title.localeCompare(b.title))
        : filtered;
  const setQuery = (value: string) => {
    setPage(1);
    const next = new URLSearchParams(params);
    next.delete('creator');
    next.delete('scope');
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next, { replace: true });
  };
  const setMedium = (value: Medium | 'all') => {
    setPage(1);
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete('medium');
    else next.set('medium', value);
    setParams(next);
  };
  const formats = [
    {
      id: 'game',
      title: 'Games',
      sub: 'WORLDS TO GET LOST IN',
      icon: Gamepad2,
      className: 'green',
    },
    { id: 'movie', title: 'Movies', sub: 'STORIES THAT STAY', icon: Film, className: 'amber' },
    { id: 'tv', title: 'Television', sub: 'JUST ONE MORE EPISODE', icon: Tv, className: 'cyan' },
  ] as const;
  return (
    <div className="discover-page page-pad">
      <PageHeader eyebrow="FOLLOW YOUR CURIOSITY" title="Discover">
        <Link className="button secondary" to="/creators">
          Find creators <ArrowUpRight size={14} />
        </Link>
        <span className="outline-label">
          A WORLD BEYOND YOUR OWN
          <ArrowUpRight size={12} />
        </span>
      </PageHeader>
      <div className="discover-intro">
        <p>
          Find your next obsession.
          <br />
          <span>Or something you didn’t know you were looking for.</span>
        </p>
        <span className="discovery-coordinate">DSTRN / EXPLORE.001</span>
      </div>
      <div className="search-field">
        <Search size={21} />
        <input
          id="catalog-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a title, a maker, a feeling…"
          autoComplete="off"
          aria-label="Search media"
        />
        {query ? (
          <button className="icon-button" onClick={() => setQuery('')} aria-label="Clear search">
            <X size={17} />
          </button>
        ) : (
          <kbd>⌘ K</kbd>
        )}
      </div>
      <div className="search-meta">
        <span>
          {usingLive
            ? `LIVE CATALOG · ${Object.keys(live.result!.providers)
                .map((p) => p.toUpperCase())
                .join(' + ')}`
            : live.loading
              ? 'SEARCHING LIVE CATALOG…'
              : `PREVIEW COLLECTION · ${catalog.length} WORKS`}
        </span>
        <span>GAMES / FILM / TELEVISION</span>
      </div>
      {!query && medium === 'all' && (
        <>
          <section className="discover-formats">
            <SectionHeading eyebrow="THE MEDIUM IS JUST THE BEGINNING" title="Browse by format" />
            <div className="format-grid">
              {formats.map(({ id, title, sub, icon: Icon, className }) => (
                <button
                  className={`format-card ${className}`}
                  key={id}
                  onClick={() => setMedium(id)}
                >
                  <div>
                    <Icon size={26} strokeWidth={1.4} />
                    <ArrowUpRight size={17} />
                  </div>
                  <h3>{title}</h3>
                  <span>{sub}</span>
                  <b>{String(catalog.filter((w) => w.medium === id).length).padStart(2, '0')}</b>
                </button>
              ))}
            </div>
            <div className="coming-formats">
              {[
                { title: 'Music', icon: Music2 },
                { title: 'Books', icon: BookOpen },
                { title: 'Social', icon: AudioLines },
              ].map(({ title, icon: Icon }) => (
                <button disabled key={title}>
                  <Icon size={17} />
                  {title}
                  <span>NEXT CHAPTER</span>
                </button>
              ))}
            </div>
          </section>
          <section className="mood-section">
            <Eyebrow>OR START WITH A FEELING</Eyebrow>
            <div className="mood-chips">
              {[
                'Cyberpunk',
                'Exploration',
                'Co-op',
                'Mystery',
                'Atmospheric',
                'World-building',
              ].map((mood) => (
                <button
                  key={mood}
                  onClick={() => {
                    setPage(1);
                    setParams({ q: mood, scope: 'curated' });
                  }}
                >
                  {mood}
                  <ArrowUpRight size={12} />
                </button>
              ))}
            </div>
          </section>
        </>
      )}
      {(live.error || live.result?.status === 'partial') && (
        <div className="catalog-notice" role="status">
          <span>
            {live.error
              ? 'Live catalog unavailable. Showing the local preview collection.'
              : `Some providers are unavailable (${live.result!.errors.map((e) => e.provider.toUpperCase()).join(', ')}). Showing available results.`}
          </span>
          <button className="text-link" onClick={() => setRetry((v) => v + 1)}>
            Retry
          </button>
        </div>
      )}
      {live.result && Object.values(live.result.providers).some((p) => p.cache === 'stale') && (
        <p className="catalog-notice" role="status">
          Showing cached provider data while the service recovers.
        </p>
      )}
      <section className="catalog-results" aria-busy={live.loading}>
        <div className="results-toolbar">
          <ActiveFormat value={medium} onChange={setMedium} />
          <label className="sort-control">
            <SlidersHorizontal size={14} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort catalog"
            >
              <option value="curated">Curated order</option>
              <option value="year">Newest first</option>
              <option value="title">A–Z</option>
            </select>
          </label>
        </div>
        <span className="recommendation-label">
          {usingLive ? 'Catalog results · TMDB / IGDB' : 'Editorial collection · Provider metadata'}
        </span>
        <SectionHeading
          eyebrow={
            query
              ? `${results.length} THREAD${results.length === 1 ? '' : 'S'} FOUND`
              : 'A FEW PLACES TO BEGIN'
          }
          title={
            query
              ? `Following “${query}”`
              : medium === 'all'
                ? 'Find a world worth entering.'
                : medium === 'game'
                  ? 'Your next world awaits.'
                  : medium === 'movie'
                    ? 'Stay until the credits.'
                    : 'One more episode.'
          }
        >
          {(query || medium !== 'all') && (
            <button
              className="text-link"
              onClick={() => {
                setPage(1);
                setParams({});
              }}
            >
              Reset filters
              <X size={13} />
            </button>
          )}
        </SectionHeading>
        {live.loading ? (
          <div className="catalog-loading" role="status">
            <span className="spin">◌</span> Finding your next world…
          </div>
        ) : results.length ? (
          <div className="poster-grid catalog-grid">
            {results.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Search size={30} />}
            heading="A thread we haven’t found. Yet."
            body={
              usingLive
                ? 'No matching titles on this page. Try a different title or format.'
                : 'This preview has a small, curated catalog. Try a title, creator or mood like “cyberpunk”.'
            }
            onClick={() => {
              setPage(1);
              setParams({});
            }}
            label="Explore everything"
          />
        )}
        {usingLive && (
          <div className="catalog-pagination">
            <button
              className="button secondary"
              disabled={page === 1 || live.loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span>PAGE {page}</span>
            <button
              className="button secondary"
              disabled={!live.result?.hasMore || page >= 50 || live.loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next page
            </button>
          </div>
        )}
        {usingLive && (
          <p className="micro-copy catalog-attribution">
            Movie and TV metadata: TMDB. Games: IGDB / Twitch. Provider scores are normalized to 5
            stars. Sort applies to this page. Creator and mood browsing remains curated; live search
            matches titles.
          </p>
        )}
      </section>
      <BuddyStrip />
      <section className="creators-section">
        <SectionHeading eyebrow="THE PEOPLE BEHIND THE WORLDS" title="Creators to keep close." />
        <div className="creator-grid">
          {[
            { name: 'CD PROJEKT RED', type: 'GAME STUDIO', letter: 'C', className: 'amber' },
            { name: 'Studio Trigger', type: 'ANIMATION STUDIO', letter: 'S', className: 'red' },
            { name: 'Denis Villeneuve', type: 'FILMMAKER', letter: 'D', className: 'sand' },
            { name: 'Hazelight Studios', type: 'GAME STUDIO', letter: 'H', className: 'green' },
          ].map((creator) => {
            const follows = account?.followed.includes(creator.name);
            return (
              <div className={`creator-card ${creator.className}`} key={creator.name}>
                <Link
                  to={`/creators/${encodeURIComponent(creator.name)}`}
                  className="creator-profile-link"
                >
                  <span className="creator-avatar">{creator.letter}</span>
                  <h3>{creator.name}</h3>
                  <Eyebrow>{creator.type}</Eyebrow>
                </Link>
                <button
                  className={`button ${follows ? 'secondary' : 'ghost'}`}
                  onClick={() => {
                    if (!account) return;
                    try {
                      update({
                        ...account,
                        followed: follows
                          ? account.followed.filter((c) => c !== creator.name)
                          : [...account.followed, creator.name],
                      });
                      notify(follows ? 'Removed from your orbit.' : 'Added to your orbit.');
                    } catch (e) {
                      notify((e as Error).message);
                    }
                  }}
                >
                  {follows ? <Check size={13} /> : <Plus size={13} />}{' '}
                  {follows ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
