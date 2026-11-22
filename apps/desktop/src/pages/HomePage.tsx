import { Recommendations } from '../components/Recommendations';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, Clock3, Sparkles } from 'lucide-react';
import { useStore } from '../lib/context';
import { getWork } from '../lib/catalog';
import {
  Artwork,
  Avatar,
  BuddyStrip,
  Eyebrow,
  SectionHeading,
  WorkCard,
  EmptyState,
} from '../components/ui';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { OrbitPanel } from '../components/AppShell';

export function HomePage() {
  const { account } = useStore();
  const [tab, setTab] = useState<'you' | 'upcoming'>('you');
  if (!account) return null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const planned = account.logs.filter((l) => l.status === 'planned');
  return (
    <div className="page-with-orbit">
      <div className="feed">
        <header className="home-heading">
          <div>
            <Eyebrow>YOUR FEED / YOUR FREQUENCY</Eyebrow>
            <h1>
              {greeting}, {account.name.split(' ')[0]}
              <span className="greeting-dot">.</span>
            </h1>
            <p>There’s a whole world between the things you love.</p>
          </div>
          <Link to="/profile" aria-label="Open your profile">
            <Avatar image={account.avatar} name={account.name} />
          </Link>
        </header>
        <div className="home-tabs">
          <button className={tab === 'you' ? 'active' : ''} onClick={() => setTab('you')}>
            For you<span>01</span>
          </button>
          <button className={tab === 'upcoming' ? 'active' : ''} onClick={() => setTab('upcoming')}>
            Up next<span>{String(planned.length).padStart(2, '0')}</span>
          </button>
          <span className="home-tabs-right">
            FOLLOW THE THREAD <ArrowUpRight size={12} />
          </span>
        </div>
        {tab === 'you' ? (
          <>
            <span className="recommendation-label">Editorial spotlight</span>
            <FeaturedCarousel />
            <Recommendations />
            <div className="room-ticker">
              <span className="ticker-mark">↗</span>
              <p>
                <strong>Your taste doesn’t stay in one lane.</strong>
                <span>Neither should your next discovery.</span>
              </p>
              <Link to="/discover" aria-label="Explore every format">
                <ArrowRight size={17} />
              </Link>
            </div>
            <section className="home-section">
              <SectionHeading
                eyebrow="A LITTLE OUTSIDE THE FAMILIAR"
                title="Stay for the atmosphere."
                to="/discover"
                label="Keep exploring"
              />
              <div className="poster-grid home-posters">
                {['cyberpunk', 'dune', 'elden-ring', 'blade-runner'].map((id, i) => (
                  <WorkCard key={id} work={getWork(id)!} index={i} />
                ))}
              </div>
            </section>
            <section className="home-section">
              <SectionHeading
                eyebrow="ORDERED. COMBINED. YOURS."
                title="A feeling, across formats."
                to="/lists"
                label="Your shelves"
              />
              {account.lists[0] ? (
                <Link to={`/lists/${account.lists[0].id}`} className="featured-list">
                  <div className="featured-list-copy">
                    <span className="tiny-tag">YOUR CROSS-MEDIA COLLECTION</span>
                    <h3>{account.lists[0].title}</h3>
                    <p>{account.lists[0].description}</p>
                    <span className="text-link">
                      {account.lists[0].workIds.length} WORKS · OPEN THE LIST
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                  <div className="list-art-stack">
                    {account.lists[0].workIds
                      .slice(0, 3)
                      .map((id) => (getWork(id) ? <Artwork key={id} work={getWork(id)!} /> : null))}
                  </div>
                </Link>
              ) : (
                <EmptyState
                  heading="Everything belongs together."
                  body="Start a collection with a game, a film, a feeling."
                  to="/lists"
                  label="Create a list"
                />
              )}
            </section>
            <BuddyStrip />
            <section className="home-section">
              <SectionHeading
                eyebrow="A CHANGE OF PACE"
                title="A different kind of world."
                to="/discover?medium=movie"
                label="Explore film"
              />
              <div className="editorial-card">
                <img
                  src="/artwork/dune-room.png"
                  alt="Dune desert artwork from the design reference"
                  loading="lazy"
                />
                <div>
                  <Eyebrow>THE WORLD IS THE STORY</Eyebrow>
                  <h3>
                    Some worlds don’t end
                    <br />
                    when the credits do.
                  </h3>
                  <p>Follow a filmmaker. Find a different perspective.</p>
                  <Link className="button glass" to="/room/dune">
                    Step into the room
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <div className="up-next-intro">
              <Clock3 size={25} />
              <Eyebrow>YOUR NEXT CHAPTER</Eyebrow>
              <h2>
                The things you’re
                <br />
                looking forward to.
              </h2>
              <p>A place for the worlds you haven’t entered. Yet.</p>
            </div>
            {planned.length ? (
              <div className="poster-grid">
                {planned.map((log) => (
                  <WorkCard key={log.id} work={getWork(log.workId)!} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Clock3 size={27} />}
                heading="A little anticipation looks good here."
                body="Mark a work as “Want to” and it will be waiting for you in this room."
                to="/discover"
                label="Find your next thing"
              />
            )}
            <BuddyStrip />
          </>
        )}
        <div className="end-note">
          <Sparkles size={15} />
          <p>Curiosity looks good on you.</p>
          <span>YOU’RE RIGHT WHERE YOU SHOULD BE.</span>
        </div>
      </div>
      <OrbitPanel />
    </div>
  );
}
