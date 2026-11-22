import { useState } from 'react';
import { Check, Plus, Star, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Modal, Artwork } from './ui';
import { useStore } from '../lib/context';
import { getWork, knownWorks, mediumNames } from '../lib/catalog';
import { addLog, uniqueId, validateLog, validateShelf } from '../lib/store';
import type { Log, Shelf } from '../lib/store';

export function LogEditor() {
  const { account, update, notify, logTarget, closeLog } = useStore();
  const existing = account?.logs.find((log) => log.id === logTarget?.logId);
  const work = getWork(logTarget?.workId ?? '');
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [note, setNote] = useState(existing?.note ?? '');
  const [status, setStatus] = useState<Log['status']>(existing?.status ?? 'completed');
  const [visibility, setVisibility] = useState<Log['visibility']>(
    existing?.visibility ?? 'private',
  );
  const [date, setDate] = useState(
    existing?.date.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  );
  const [error, setError] = useState('');
  if (!account || !work) return null;
  function save(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!account || !work) return;
    try {
      const log: Log = {
        id: existing?.id ?? uniqueId(),
        workId: work.id,
        rating,
        note: note.trim(),
        status,
        visibility,
        date,
      };
      validateLog(log);
      update(
        existing
          ? { ...account, logs: account.logs.map((item) => (item.id === log.id ? log : item)) }
          : addLog(account, log),
      );
      notify(existing ? 'Your log has been updated.' : 'Added to your cultural memory.');
      closeLog();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Modal
      title={existing ? 'A moment, revisited.' : 'Make it part of your story.'}
      subtitle="LOG A WORK"
      onClose={closeLog}
    >
      <form onSubmit={save} className="editor-form">
        <div className="log-title">
          <Artwork work={work} />
          <div>
            <h3>{work.title}</h3>
            <p>
              {mediumNames[work.medium]} · {work.year || 'TBA'}
            </p>
            <small>{work.maker}</small>
          </div>
        </div>
        <fieldset>
          <legend>Your time with it</legend>
          <div className="segmented">
            {(['completed', 'active', 'planned', 'dropped'] as const).map((s) => (
              <button
                type="button"
                key={s}
                className={status === s ? 'selected' : ''}
                onClick={() => setStatus(s)}
              >
                {s === 'completed'
                  ? 'Finished'
                  : s === 'active'
                    ? 'In progress'
                    : s === 'planned'
                      ? 'Want to'
                      : 'Stopped'}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="rating-editor">
          <div>
            <label htmlFor="rating">How did it stay with you?</label>
            <div className="star-buttons">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  aria-label={`Rate ${n} stars`}
                  aria-pressed={rating === n}
                  onClick={() => setRating(rating === n ? 0 : n)}
                  key={n}
                >
                  <Star size={27} fill={rating >= n ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <select
            id="rating"
            aria-label="Precise rating"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            <option value={0}>Unrated</option>
            {Array.from({ length: 10 }, (_, i) => (i + 1) / 2).map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        </div>
        <label className="field">
          A thought to keep <span className="optional">optional</span>
          <textarea
            placeholder="A feeling, a favourite moment, something you don’t want to forget…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={4000}
            rows={4}
          />
        </label>
        <div className="form-grid">
          <label className="field">
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="field">
            Who can see this?
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Log['visibility'])}
            >
              <option value="private">Only me</option>
              <option value="friends">Friends</option>
              <option value="public">Everyone</option>
            </select>
          </label>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer className="modal-footer">
          {existing && (
            <button
              type="button"
              className="button danger ghost"
              onClick={() => {
                try {
                  update({ ...account, logs: account.logs.filter((l) => l.id !== existing.id) });
                  notify('Log removed.');
                  closeLog();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <Trash2 size={16} />
              Delete log
            </button>
          )}
          <button className="button primary" type="submit">
            <Plus size={17} />
            {existing ? 'Save changes' : 'Save to my ledger'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
export function ListEditor({ shelf, onClose }: { shelf?: Shelf; onClose: () => void }) {
  const { account, update, notify } = useStore();
  const [title, setTitle] = useState(shelf?.title ?? '');
  const [description, setDescription] = useState(shelf?.description ?? '');
  const [visibility, setVisibility] = useState<Shelf['visibility']>(shelf?.visibility ?? 'private');
  const [ids, setIds] = useState(shelf?.workIds ?? []);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  if (!account) return null;
  function move(index: number, direction: number) {
    const next = [...ids];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setIds(next);
  }
  return (
    <Modal
      title={shelf ? 'Give it a new order.' : 'A list of your own.'}
      subtitle="ACROSS FORMATS. AROUND A FEELING."
      onClose={onClose}
    >
      <form
        className="editor-form"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const next: Shelf = {
              ...shelf,
              id: shelf?.id ?? uniqueId(),
              title: title.trim(),
              description: description.trim(),
              visibility,
              workIds: ids,
            };
            validateShelf(next);
            update({
              ...account,
              lists: shelf
                ? account.lists.map((l) => (l.id === shelf.id ? next : l))
                : [next, ...account.lists],
            });
            notify(shelf ? 'List updated.' : 'A new shelf, all yours.');
            onClose();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <label className="field">
          Name your list
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Something like a feeling…"
            maxLength={100}
            required
            autoFocus
          />
        </label>
        <label className="field">
          What holds it together?
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A universe, an atmosphere, a weekend together."
            maxLength={1000}
            rows={2}
          />
        </label>
        <label className="field">
          Visibility
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Shelf['visibility'])}
          >
            <option value="private">Only me</option>
            <option value="friends">Friends</option>
            <option value="public">Everyone</option>
          </select>
        </label>
        {ids.length > 0 && (
          <div className="list-order">
            {ids.map((id, index) => {
              const work = getWork(id)!;
              return (
                <div key={id}>
                  <span className="mono">{index + 1}</span>
                  <span>{work.title}</span>
                  <button
                    type="button"
                    className="icon-button"
                    disabled={index === 0}
                    aria-label={`Move ${work.title} up`}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    disabled={index === ids.length - 1}
                    aria-label={`Move ${work.title} down`}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Remove ${work.title}`}
                    onClick={() => setIds(ids.filter((i) => i !== id))}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <label className="field">
          Find something for this list
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles…"
          />
        </label>
        <div className="list-picker">
          {knownWorks()
            .filter((w) => w.title.toLowerCase().includes(query.toLowerCase()))
            .map((w) => (
              <button
                type="button"
                key={w.id}
                aria-pressed={ids.includes(w.id)}
                className={ids.includes(w.id) ? 'selected' : ''}
                onClick={() =>
                  setIds(ids.includes(w.id) ? ids.filter((id) => id !== w.id) : [...ids, w.id])
                }
              >
                <Artwork work={w} />
                <span>
                  {w.title}
                  <small>{mediumNames[w.medium]}</small>
                </span>
                {ids.includes(w.id) ? <Check size={16} /> : <Plus size={16} />}
              </button>
            ))}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer className="modal-footer">
          <button className="button primary" type="submit">
            {shelf ? 'Save list' : 'Create list'}
            <Check size={16} />
          </button>
        </footer>
      </form>
    </Modal>
  );
}
