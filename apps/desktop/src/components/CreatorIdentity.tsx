import { Fingerprint, Orbit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/context';
import { isProviderCreator, localDirectory, publicCreators } from '../lib/creators';

/** A page affordance, not verification or an ownership claim. */
export function CreatorPageMark() {
  return (
    <span className="creator-page-mark" title="Creator page on Distran" aria-hidden="true">
      <Orbit size={13} aria-hidden="true" />
    </span>
  );
}
export function CreatorBadge() {
  return (
    <span
      className="creator-badge"
      title="Local Distran member profile. Ownership is not verified."
    >
      <Fingerprint size={13} aria-hidden="true" /> On Distran
    </span>
  );
}
export function CreatorName({ id, name }: { id?: string; name: string }) {
  const { db } = useStore();
  const profile = publicCreators(db).find((p) => p.id === id);
  const named = localDirectory().filter((c) => c.name.toLowerCase() === name.toLowerCase());
  const target =
    profile?.id ??
    (id && isProviderCreator(id) ? id : named.length === 1 ? named[0].id : undefined);
  if (!target) return <span className="creator-name">{name}</span>;
  return (
    <Link
      className="creator-name"
      title={`Open ${name}’s creator page`}
      to={`/creators/${encodeURIComponent(target)}`}
    >
      <span>{name}</span>
      <CreatorPageMark />
      {profile && <CreatorBadge />}
    </Link>
  );
}
