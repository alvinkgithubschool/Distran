import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  ArrowUpRight,
  ArrowLeft,
  LockKeyhole,
  Users,
  Globe2,
  ListMusic,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useStore } from '../lib/context';
import { getWork } from '../lib/catalog';
import {
  Artwork,
  PageHeader,
  Eyebrow,
  BuddyStrip,
  EmptyState,
  WorkRow,
  Modal,
} from '../components/ui';
import { ListEditor } from '../components/Editors';
export function ListsPage() {
  const { account } = useStore();
  const [creating, setCreating] = useState(false);
  if (!account) return null;
  return (
    <div className="lists-page page-pad">
      <PageHeader eyebrow="YOUR SHELF" title="Lists">
        <button className="button primary" onClick={() => setCreating(true)}>
          <Plus size={15} />
          New list
        </button>
      </PageHeader>
      <div className="lists-intro">
        <Eyebrow>ORDERED. COMBINED. YOURS.</Eyebrow>
        <h2>
          Every list,
          <br />
          <span>one shelf.</span>
        </h2>
        <p>
          A game next to a film. A world next to a feeling.
          <br />
          The connection is yours to make.
        </p>
        <span className="lists-intro-index">
          {String(account.lists.length).padStart(2, '0')}
          <small>COLLECTIONS</small>
        </span>
      </div>
      {account.lists.length ? (
        <div className="shelf-grid">
          {account.lists.map((list, index) => (
            <Link
              className={`shelf-card shelf-${index % 4} ${list.source === 'buddy' ? 'buddy-shelf' : ''}`}
              key={list.id}
              to={`/lists/${list.id}`}
            >
              <span className="shelf-index">
                {list.source === 'buddy' && (
                  <span className="recommendation-label buddy-label">
                    <Sparkles size={12} aria-hidden="true" /> Made with Buddy
                  </span>
                )}
                COLLECTION / {String(index + 1).padStart(2, '0')}
              </span>
              <div className="shelf-covers">
                {list.workIds
                  .slice(0, 4)
                  .map((id) => (getWork(id) ? <Artwork work={getWork(id)!} key={id} /> : null))}
                {!list.workIds.length && (
                  <span className="empty-shelf-art">
                    <Plus size={28} />
                  </span>
                )}
              </div>
              <div className="shelf-title">
                <h3>{list.title}</h3>
                <ArrowUpRight size={20} />
              </div>
              <p>{list.description || 'A collection waiting for its first connection.'}</p>
              <div className="shelf-meta">
                <span>{list.workIds.length} WORKS</span>
                <span>
                  {list.visibility === 'private' ? (
                    <LockKeyhole size={11} />
                  ) : list.visibility === 'friends' ? (
                    <Users size={11} />
                  ) : (
                    <Globe2 size={11} />
                  )}{' '}
                  {list.visibility === 'private'
                    ? 'ONLY YOU'
                    : list.visibility === 'friends'
                      ? 'FRIENDS'
                      : 'PUBLIC'}
                </span>
              </div>
            </Link>
          ))}
          <button className="new-shelf-card" onClick={() => setCreating(true)}>
            <span>
              <Plus size={27} />
            </span>
            <h3>A new way to connect the dots.</h3>
            <p>Make a list. Follow a feeling.</p>
          </button>
        </div>
      ) : (
        <EmptyState
          icon={<ListMusic size={28} />}
          heading="A blank shelf is a beginning."
          body="Collect the works that belong together. A medium is never a boundary."
          onClick={() => setCreating(true)}
          label="Make your first list"
        />
      )}
      <BuddyStrip />
      {creating && <ListEditor onClose={() => setCreating(false)} />}
    </div>
  );
}
export function ListDetailPage() {
  const { id } = useParams();
  const { account, update, notify } = useStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const list = account?.lists.find((l) => l.id === id);
  if (!account || !list)
    return (
      <EmptyState
        heading="This shelf isn’t here."
        body="It may have been removed, or belong to a different local account."
        to="/lists"
        label="Back to your lists"
      />
    );
  return (
    <div className="list-detail page-pad">
      <Link to="/lists" className="back-link">
        <ArrowLeft size={15} />
        YOUR SHELVES
      </Link>
      <div className="list-detail-heading">
        <div>
          <Eyebrow>
            {list.visibility.toUpperCase()} COLLECTION · {list.workIds.length} WORKS
          </Eyebrow>
          <h1>{list.title}</h1>
          {list.source === 'buddy' && (
            <span className="recommendation-label buddy-label">
              <Sparkles size={13} aria-hidden="true" /> Started with Buddy
            </span>
          )}
          <p>{list.description}</p>
        </div>
        <div className="header-actions">
          <button className="button secondary" onClick={() => setEditing(true)}>
            <Pencil size={15} />
            Edit list
          </button>
          <button
            className="icon-button bordered"
            aria-label="Delete list"
            onClick={() => setDeleting(true)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="list-detail-works">
        {list.workIds.length ? (
          list.workIds.map((workId, index) => {
            const work = getWork(workId);
            return work ? (
              <div className="numbered-work" key={work.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <WorkRow work={work} variant={list.source === 'buddy' ? 'buddy' : 'standard'} />
              </div>
            ) : null;
          })
        ) : (
          <EmptyState
            heading="The first connection is yours."
            body="Edit this list to find and add some works."
            onClick={() => setEditing(true)}
            label="Add a work"
          />
        )}
      </div>
      <p className="micro-copy">
        List visibility is saved as a preference. Sharing becomes available when the backend is
        connected.
      </p>
      {editing && <ListEditor shelf={list} onClose={() => setEditing(false)} />}
      {deleting && (
        <Modal
          title="Make room on your shelf?"
          subtitle="DELETE LIST"
          onClose={() => setDeleting(false)}
        >
          <p className="muted">
            “{list.title}” will be removed from this device. Your logged works stay in your ledger.
          </p>
          <div className="modal-footer">
            <button className="button secondary" onClick={() => setDeleting(false)}>
              Keep the list
            </button>
            <button
              className="button danger"
              onClick={() => {
                try {
                  update({ ...account, lists: account.lists.filter((l) => l.id !== id) });
                  notify('List removed.');
                  navigate('/lists');
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              Delete list
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
