import { CreatorName } from './CreatorIdentity';
import { useEffect, useRef } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { ArrowUpRight, Star, X, Plus, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cover, mediumNames } from '../lib/catalog';
import type { Work } from '../lib/catalog';

export const accentStyle = (color: string) => ({ '--work-accent': color }) as CSSProperties;
export function Wordmark() {
  return (
    <Link className="wordmark" to="/home" aria-label="Distran home">
      <span className="brand-symbol">
        d<span>✳</span>
      </span>
      <span>
        DISTRAN<small>ONE CULTURAL MEMORY</small>
      </span>
    </Link>
  );
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}
export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
      </div>
      <div className="header-actions">{children}</div>
    </header>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  to,
  label = 'See all',
  children,
}: {
  eyebrow?: string;
  title: string;
  to?: string;
  label?: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2>{title}</h2>
      </div>
      {to && (
        <Link className="text-link" to={to}>
          {label}
          <ArrowUpRight size={13} />
        </Link>
      )}
      {children}
    </div>
  );
}
export function Artwork({ work, className = '' }: { work: Work; className?: string }) {
  return (
    <div className={`artwork ${className}`} style={accentStyle(work.color)}>
      <span className="artwork-fallback" aria-hidden="true">
        {work.title}
      </span>
      {work.image && (
        <img
          decoding="async"
          referrerPolicy="no-referrer"
          src={cover(work)}
          alt=""
          loading="lazy"
          onError={(e) => {
            if (
              work.fallbackImage &&
              !e.currentTarget.src.endsWith('/artwork/' + work.fallbackImage)
            ) {
              e.currentTarget.src = '/artwork/' + work.fallbackImage;
            } else e.currentTarget.style.opacity = '0';
          }}
        />
      )}
    </div>
  );
}
export function WorkCard({
  work,
  index,
  compact = false,
  variant = 'standard',
}: {
  work: Work;
  index?: number;
  compact?: boolean;
  variant?: 'standard' | 'buddy';
}) {
  return (
    <div
      className={`work-card ${compact ? 'compact' : ''} ${variant === 'buddy' ? 'buddy-work-card' : ''}`}
      data-recommendation-source={variant}
      style={accentStyle(work.color)}
    >
      <Link className="work-card-main" to={`/title/${work.id}`}>
        <div className="work-cover">
          {variant === 'buddy' && (
            <span className="buddy-pick-mark">
              <Sparkles size={12} aria-hidden="true" /> Buddy pick
            </span>
          )}
          <Artwork work={work} />
          {index !== undefined && (
            <span className="rank-number">{String(index + 1).padStart(2, '0')}</span>
          )}
          <span className="cover-arrow">
            <ArrowUpRight size={18} />
          </span>
          <span className="cover-format">{mediumNames[work.medium]}</span>
        </div>
        <div className="work-caption">
          <h3>{work.title}</h3>
          <div>
            <span>{work.year || 'TBA'}</span>
            <span className="rating">
              <Star size={10} fill="currentColor" />
              {work.rating}
            </span>
          </div>
        </div>
      </Link>
      {work.creators?.[0] && (
        <div className="work-card-creator">
          <span className="creator-role">
            {work.creatorRole || (work.medium === 'game' ? 'Studio' : 'Director')}
          </span>
          <CreatorName id={work.creators[0].id} name={work.creators[0].name} />
        </div>
      )}
    </div>
  );
}
export function WorkRow({
  work,
  children,
  variant = 'standard',
}: {
  work: Work;
  children?: ReactNode;
  variant?: 'standard' | 'buddy';
}) {
  return (
    <div
      className={`work-row ${variant === 'buddy' ? 'buddy-work-row' : ''}`}
      data-recommendation-source={variant}
    >
      <Link to={`/title/${work.id}`}>
        <Artwork work={work} />
      </Link>
      <div className="work-row-info">
        <Link to={`/title/${work.id}`}>
          <h3>{work.title}</h3>
        </Link>
        <p>
          {mediumNames[work.medium]} <span>·</span> {work.year || 'TBA'}
        </p>
        {work.creators?.length ? (
          work.creators.slice(0, 2).map((c) => <CreatorName key={c.id} id={c.id} name={c.name} />)
        ) : (
          <span>{work.maker}</span>
        )}
        {variant === 'buddy' && (
          <span className="recommendation-label buddy-label">
            <Sparkles size={12} aria-hidden="true" /> Buddy list
          </span>
        )}
      </div>
      {children ?? (
        <Link to={`/title/${work.id}`} aria-label={`Open ${work.title}`} className="icon-button">
          <ArrowUpRight size={18} />
        </Link>
      )}
    </div>
  );
}
export function BuddyStrip() {
  return (
    <Link to="/chat" className="buddy-strip">
      <span className="buddy-orb">✧</span>
      <div>
        <Eyebrow>Buddy · follow a feeling</Eyebrow>
        <p>Find thematic picks and make a list.</p>
      </div>
      <span className="soon-tag">ASK BUDDY</span>
    </Link>
  );
}
export function EmptyState({
  icon,
  heading,
  body,
  to,
  label,
  onClick,
}: {
  icon?: ReactNode;
  heading: string;
  body: string;
  to?: string;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon ?? <Plus size={28} />}</div>
      <h2>{heading}</h2>
      <p>{body}</p>
      {to && (
        <Link className="button primary" to={to}>
          {label}
          <ArrowRight size={16} />
        </Link>
      )}
      {onClick && (
        <button className="button primary" onClick={onClick}>
          {label}
        </button>
      )}
    </div>
  );
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-inner">
        <header className="modal-header">
          <div>
            <Eyebrow>{subtitle ?? 'YOUR CULTURAL MEMORY'}</Eyebrow>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
export function Avatar({
  name,
  size = 'normal',
  image,
}: {
  image?: string;
  name: string;
  size?: 'normal' | 'large' | 'small';
}) {
  return (
    <span className={`avatar ${size}`} aria-hidden="true">
      {name.charAt(0).toUpperCase()}
      {image && (
        <img
          src={image}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      )}
    </span>
  );
}
