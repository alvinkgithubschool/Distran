import { CreatorName } from '../components/CreatorIdentity';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ClaimEditor } from '../components/ClaimEditor';
import { usePosterPalette } from '../lib/use-poster-palette';

import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Plus,
  Star,
  Bookmark,
  Check,
  ListPlus,
  Heart,
  Clock3,
} from 'lucide-react';
import { useLiveWork } from '../lib/use-catalog';
import { useStore } from '../lib/context';
import { getWork, mediumNames, cover } from '../lib/catalog';
import { addLog, toggleFavorite, uniqueId } from '../lib/store';
import {
  Artwork,
  Eyebrow,
  SectionHeading,
  WorkCard,
  EmptyState,
  Modal,
  accentStyle,
} from '../components/ui';
export function TitlePage() {
  const { id } = useParams();
  const { work, loading, error, cache, retry } = useLiveWork(id ?? '');
  const { account, update, openLog, notify } = useStore();
  const palette = usePosterPalette(work);
  const [claimOpen, setClaimOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  if (!work && loading)
    return (
      <div className="page-pad catalog-loading" role="status">
        Opening this world…
      </div>
    );
  if (!work && error)
    return (
      <EmptyState
        heading="This world is temporarily out of reach."
        body={error}
        onClick={retry}
        label="Try again"
      />
    );
  if (!work || !account)
    return (
      <EmptyState
        heading="This page is still a little out of reach."
        body="Find a work in the preview catalog."
        to="/discover"
        label="Back to Discover"
      />
    );
  const isFavorite = account.favorites.includes(work.id);
  const planned = account.logs.find((log) => log.workId === work.id && log.status === 'planned');
  const logs = account.logs.filter((log) => log.workId === work.id);
  const providerRelated = work.related.map(getWork).filter((w) => w !== undefined);
  const editorialRelated = providerRelated.length === 0;
  const related = editorialRelated
    ? (work.editorialRelated ?? []).map(getWork).filter((w) => w !== undefined)
    : providerRelated;
  function wantTo() {
    if (!account || !work) return;
    try {
      update(
        planned
          ? { ...account, logs: account.logs.filter((l) => l.id !== planned.id) }
          : addLog(account, {
              id: uniqueId(),
              workId: work.id,
              rating: 0,
              note: '',
              status: 'planned',
              visibility: 'private',
              date: new Date().toISOString(),
            }),
      );
      notify(planned ? 'Removed from Up next.' : 'Saved for your next chapter.');
    } catch (e) {
      notify((e as Error).message);
    }
  }
  return (
    <article
      className="title-page"
      style={{ ...accentStyle(work.color), '--poster-tone': palette } as CSSProperties}
    >
      <div
        className="title-ambient"
        style={{ backgroundImage: work.image ? `url(${cover(work)})` : undefined }}
      />
      <div className="title-main">
        {error && (
          <div className="catalog-notice" role="status">
            <span>{error} Showing saved title metadata.</span>
            <button className="text-link" onClick={retry}>
              Retry
            </button>
          </div>
        )}
        {cache === 'stale' && (
          <p className="catalog-notice">Showing cached metadata while the provider recovers.</p>
        )}
        <Link className="back-link" to="/discover">
          <ArrowLeft size={15} />
          BACK TO THE WORLDS
        </Link>
        <div className="title-hero">
          <Artwork work={work} className="title-poster" />
          <div className="title-copy">
            <span className="title-format">
              <span />
              {mediumNames[work.medium]} · {work.year || 'TBA'}
            </span>
            <h1>{work.title}</h1>
            <div className="maker-link">
              {work.creatorRole || (work.medium === 'game' ? 'Studio' : 'Director')} ·{' '}
              <span className="maker-names">
                {(work.creators?.length
                  ? work.creators.slice(0, 3)
                  : work.maker.split(',').map((name) => ({ id: name.trim(), name: name.trim() }))
                ).map((creator, index) => (
                  <span key={creator.id}>
                    {index > 0 && ', '}
                    <CreatorName id={creator.id} name={creator.name} />
                  </span>
                ))}
              </span>
            </div>
            <div className="title-tags">
              {work.tags.map((tag) => (
                <Link key={tag} to={`/discover?q=${encodeURIComponent(tag)}&scope=curated`}>
                  {tag}
                </Link>
              ))}
            </div>
            <div className="title-score">
              <span>
                <Star size={15} fill="currentColor" />
                {work.rating}
              </span>
              <small>
                {work.provider ? `${work.provider.toUpperCase()} SCORE` : 'PREVIEW RATING'}
              </small>
              <span className="title-score-divider" />
              <Clock3 size={14} />
              <p>{work.duration}</p>
            </div>
            <div className="title-actions">
              <button className="button primary" onClick={() => openLog(work.id)}>
                <Plus size={17} />
                Log this{' '}
                {work.medium === 'game' ? 'game' : work.medium === 'movie' ? 'film' : 'series'}
              </button>
              <button className={`button secondary ${planned ? 'saved' : ''}`} onClick={wantTo}>
                {planned ? <Check size={16} /> : <Bookmark size={16} />}{' '}
                {planned ? 'On your horizon' : 'Want to'}
              </button>
              <button
                className="icon-button bordered"
                aria-label="Add to list"
                onClick={() => setListOpen(true)}
              >
                <ListPlus size={19} />
              </button>
              <button
                className={`icon-button bordered ${isFavorite ? 'favorited' : ''}`}
                aria-label={isFavorite ? 'Remove from Top 4' : 'Add to Top 4'}
                aria-pressed={isFavorite}
                onClick={() => {
                  try {
                    update(toggleFavorite(account, work.id));
                    notify(isFavorite ? 'Removed from your Top 4.' : 'One of your cornerstones.');
                  } catch (e) {
                    notify((e as Error).message);
                  }
                }}
              >
                <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
        {account.role === 'creator' && (
          <div className="title-claim">
            <span>HAD A HAND IN THIS WORLD?</span>
            {account.claims?.some((claim) => claim.workId === work.id) ? (
              <Link className="button secondary" to={`/creators/${encodeURIComponent(account.id)}`}>
                Claim pending · View request
              </Link>
            ) : (
              <button className="button secondary" onClick={() => setClaimOpen(true)}>
                Claim your credit <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        )}
        <div className="title-info-grid">
          <section className="title-story">
            <Eyebrow>THE WORLD WITHIN</Eyebrow>
            <h2>
              {work.medium === 'game'
                ? 'Somewhere worth getting lost.'
                : 'A story worth staying for.'}
            </h2>
            <p>{work.description}</p>
            <button
              className="text-link"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
            >
              {expanded ? 'Less detail' : 'Behind the work'}
              <ArrowUpRight size={13} />
            </button>
            {expanded && (
              <div className="work-facts">
                <p>
                  <span>{(work.creatorRole || 'Creator').toUpperCase()}</span>
                  {work.creators?.length
                    ? work.creators.map((c) => <CreatorName key={c.id} id={c.id} name={c.name} />)
                    : work.maker}
                </p>
                <p>
                  <span>
                    {work.provider === 'tmdb' ? 'PRODUCTION COMPANIES' : 'PUBLISHER / DISTRIBUTOR'}
                  </span>
                  {work.publisher}
                </p>
                <p>
                  <span>RELEASE YEAR</span>
                  {work.year || 'TBA'}
                </p>
                <p>
                  <span>CATALOG</span>
                  {work.provider
                    ? `Metadata from ${work.provider.toUpperCase()}.`
                    : 'Curated local preview; descriptions are editorial summaries.'}
                </p>
                {work.platforms?.length ? (
                  <p>
                    <span>PLATFORMS</span>
                    {work.platforms.join(' · ')}
                  </p>
                ) : null}
                {work.franchises?.length ? (
                  <p>
                    <span>SERIES / COLLECTIONS</span>
                    {work.franchises.join(' · ')}
                  </p>
                ) : null}
                {work.credits?.map((credit, index) => (
                  <p key={`${credit.name}-${index}`}>
                    <span>{credit.role.toUpperCase()}</span>
                    <CreatorName id={credit.id} name={credit.name} />
                  </p>
                ))}
              </div>
            )}
          </section>
          <aside className="title-memory">
            <Eyebrow>YOUR TIME WITH IT</Eyebrow>
            {logs.length ? (
              <>
                <h3>
                  {logs.length} moment{logs.length === 1 ? '' : 's'} in your ledger.
                </h3>
                {logs.slice(0, 2).map((log) => (
                  <button
                    key={log.id}
                    onClick={() => openLog(work.id, log.id)}
                    className="memory-log"
                  >
                    <span>
                      {log.status === 'planned'
                        ? 'On the horizon'
                        : new Date(log.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                    </span>
                    <strong>
                      {log.rating > 0 ? `${log.rating} / 5` : 'Unrated'}
                      <ArrowUpRight size={13} />
                    </strong>
                    {log.note && <p>{log.note}</p>}
                  </button>
                ))}
              </>
            ) : (
              <>
                <h3>You haven’t crossed paths. Yet.</h3>
                <p>When you do, keep a little of the experience here.</p>
                <button className="text-link" onClick={() => openLog(work.id)}>
                  MAKE A FIRST MEMORY
                  <Plus size={13} />
                </button>
              </>
            )}
          </aside>
        </div>
        <section className="title-related">
          <SectionHeading
            eyebrow="THE STORY DOESN’T END HERE"
            title="Follow the thread."
            to="/discover"
            label="Keep exploring"
          />
          <span className="recommendation-label">
            Related works ·{' '}
            {editorialRelated
              ? 'Editorial connections'
              : work.provider?.toUpperCase() || 'Editorial'}
          </span>
          <p className="related-note">
            {!editorialRelated && work.provider
              ? work.relatedLabel
              : work.id === 'cyberpunk' || work.id === 'edgerunners'
                ? 'A shared universe, and a few curated paths beyond it.'
                : 'Curated connections through atmosphere, creators and ideas.'}
          </p>
          <div className="poster-grid">
            {related.map((w) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </div>
        </section>
      </div>
      {claimOpen && <ClaimEditor work={work} onClose={() => setClaimOpen(false)} />}
      {listOpen && (
        <Modal
          title="Find a place on your shelf."
          subtitle="ADD TO A LIST"
          onClose={() => setListOpen(false)}
        >
          {account.lists.length ? (
            <div className="add-to-lists">
              {account.lists.map((list) => {
                const has = list.workIds.includes(work.id);
                return (
                  <button
                    key={list.id}
                    aria-pressed={has}
                    onClick={() => {
                      try {
                        update({
                          ...account,
                          lists: account.lists.map((l) =>
                            l.id === list.id
                              ? {
                                  ...l,
                                  workIds: has
                                    ? l.workIds.filter((w) => w !== work.id)
                                    : [...l.workIds, work.id],
                                }
                              : l,
                          ),
                        });
                        notify(has ? 'Removed from the list.' : 'Added to the list.');
                      } catch (e) {
                        notify((e as Error).message);
                      }
                    }}
                  >
                    <span>
                      <strong>{list.title}</strong>
                      <small>{list.workIds.length} WORKS</small>
                    </span>
                    {has ? <Check size={18} /> : <Plus size={18} />}
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState
              heading="Your first shelf is waiting."
              body="Make a list, then bring this work into it."
              to="/lists"
              label="Create a list"
            />
          )}
        </Modal>
      )}
    </article>
  );
}
export function PartnerRoom() {
  const { openLog } = useStore();
  return (
    <article className="partner-room">
      <img src="/artwork/dune-room.png" alt="Dune atmospheric artwork from the supplied design" />
      <div className="partner-shade" />
      <header>
        <Link to="/home" className="button glass">
          <ArrowLeft size={15} />
          Back to your room
        </Link>
        <span className="tiny-tag">A WORLD WORTH ENTERING</span>
      </header>
      <div className="partner-copy">
        <Eyebrow>THE DESERT REMEMBERS.</Eyebrow>
        <h1>
          Some worlds
          <br />
          leave their
          <br />
          <em>mark.</em>
        </h1>
        <p>
          Enter the universe of Dune. Follow its makers, trace its ideas, and find the next story
          beyond the sand.
        </p>
        <div>
          <Link to="/title/dune" className="button primary">
            Enter the world
            <ArrowUpRight size={17} />
          </Link>
          <button className="button glass" onClick={() => openLog('dune')}>
            <Plus size={16} />
            Log the film
          </button>
        </div>
        <span className="partner-caption">DUNE: PART TWO / DENIS VILLENEUVE / 2024</span>
      </div>
    </article>
  );
}
