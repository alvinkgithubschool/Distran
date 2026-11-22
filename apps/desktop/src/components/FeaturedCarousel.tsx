import { CreatorName } from './CreatorIdentity';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, Plus, Star } from 'lucide-react';
import { cover, getWork, mediumNames } from '../lib/catalog';
import { useStore } from '../lib/context';
const slides = [
  {
    id: 'it-takes-two',
    caption: 'BETTER TOGETHER',
    copy: 'A little chaos. A little wonder. A whole world made for two.',
    image: '/artwork/it-takes-two-hero.jpg',
  },
  {
    id: 'dune',
    caption: 'SOME WORLDS LEAVE THEIR MARK',
    copy: 'Across the sand, a story about power, prophecy and the people caught between.',
    image: '',
  },
  {
    id: 'severance',
    caption: 'SOMETHING BENEATH THE SURFACE',
    copy: 'One life inside. Another outside. Follow a thread you won’t want to let go.',
    image: '',
  },
];
export function FeaturedCarousel() {
  const { openLog } = useStore();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => {
      if (media.matches) setPlaying(false);
    };
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);
  useEffect(() => {
    if (!playing || hovered || focused) return;
    const timer = setInterval(() => {
      if (!document.hidden && !document.querySelector('dialog[open]'))
        setIndex((value) => (value + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [playing, hovered, focused, index]);
  const slide = slides[index];
  const work = getWork(slide.id)!;
  const go = (value: number) => {
    setIndex((value + slides.length) % slides.length);
    setPlaying(false);
  };
  return (
    <section
      className="feature-hero"
      aria-roledescription="carousel"
      aria-label="Featured recommendations"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div
        className="feature-image"
        key={work.id}
        style={{ backgroundImage: `url(${slide.image || cover(work)})` }}
      />
      <div className="feature-overlay" />
      <span className="feature-index">THE SPOTLIGHT / {String(index + 1).padStart(3, '0')}</span>
      <div className="feature-copy" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
        <span className="feature-tag">
          <span />
          FEATURED · {slide.caption}
        </span>
        <h2>{work.title}</h2>
        <p>{slide.copy}</p>
        <div className="feature-meta">
          <span>
            {mediumNames[work.medium].toUpperCase()} · {work.year}
          </span>
          <span>
            <Star size={12} fill="currentColor" /> {work.rating}
          </span>
          <span>
            {work.creators?.[0] ? (
              <CreatorName id={work.creators[0].id} name={work.creators[0].name} />
            ) : (
              work.maker
            )}
          </span>
        </div>
        <div className="feature-actions">
          <button className="button primary" onClick={() => openLog(work.id)}>
            <Plus size={16} />
            Log it
          </button>
          <Link className="button glass" to={`/title/${work.id}`}>
            Enter the world <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
      <div className="spotlight-controls">
        <button
          className="icon-button"
          aria-label="Previous recommendation"
          onClick={() => go(index - 1)}
        >
          <ArrowLeft size={17} />
        </button>
        <div className="spotlight-dots">
          {slides.map((slide, position) => (
            <button
              key={slide.id}
              aria-label={`Show ${getWork(slide.id)!.title}`}
              aria-current={index === position ? 'true' : undefined}
              onClick={() => go(position)}
            >
              <span />
            </button>
          ))}
        </div>
        <button
          className="icon-button"
          aria-label="Next recommendation"
          onClick={() => go(index + 1)}
        >
          <ArrowRight size={17} />
        </button>
        <button
          className="icon-button"
          aria-label={playing ? 'Pause recommendations' : 'Play recommendations'}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
      </div>
    </section>
  );
}
