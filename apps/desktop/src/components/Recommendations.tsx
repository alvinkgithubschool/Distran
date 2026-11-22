import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useStore } from '../lib/context';
import { recommend } from '../lib/recommendations';
import type { Medium } from '../lib/catalog';
import { SectionHeading, WorkCard } from './ui';

export function Recommendations() {
  const { account } = useStore();
  const [medium, setMedium] = useState<Medium | 'all'>('all');
  if (!account) return null;
  const picks = recommend(account, medium);
  return (
    <section className="home-section" aria-label="Personal recommendations">
      <span className="recommendation-label">For you · From your taste</span>
      <SectionHeading eyebrow="FOLLOW YOUR CURIOSITY" title="Your next connection." />
      <label>
        Explore{' '}
        <select
          aria-label="Recommendation format"
          value={medium}
          onChange={(event) => setMedium(event.target.value as Medium | 'all')}
        >
          <option value="all">Every format</option>
          <option value="game">Games</option>
          <option value="movie">Films</option>
          <option value="tv">Series</option>
        </select>
      </label>
      <div className="poster-grid home-posters">
        {picks.map(({ work, reason }, i) => (
          <div key={work.id}>
            <WorkCard work={work} index={i} />
            <p className="recommendation-reason">{reason}</p>
          </div>
        ))}
      </div>
      {!picks.length && <p>You’ve explored this collection. Try another format.</p>}
      <p className="recommendation-explainer">
        Based on your favourites and ratings.{' '}
        <Link to="/chat">Have a specific theme? Ask Buddy.</Link>
      </p>
    </section>
  );
}
