import { useEffect, useRef, useState } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/context';
import { uniqueId, validateShelf } from '../lib/store';
import type { Medium } from '../lib/catalog';
import { askBuddy } from '../lib/buddy-api';
import type { BuddyContext, BuddyResult, BuddyTurn } from '../lib/buddy-api';
import { WorkCard } from './ui';

type Exchange = { id: string; question: string; reply: string };
export function BuddyPanel() {
  const { account, update, notify } = useStore();
  const [prompt, setPrompt] = useState('');
  const [refinement, setRefinement] = useState('');
  const [mode, setMode] = useState<'recommendations' | 'chat'>('chat');
  const [medium, setMedium] = useState<Medium | 'all'>('all');
  const [minutes, setMinutes] = useState('');
  const [includeSeen, setIncludeSeen] = useState(false);
  const [context, setContext] = useState<BuddyContext>();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [result, setResult] = useState<BuddyResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('Your next connection');
  const [saved, setSaved] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const controller = useRef<AbortController | null>(null);
  const lastRequest = useRef('');
  const latest = useRef<HTMLDivElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  if (!account) return null;
  function reset() {
    controller.current?.abort();
    setBusy(false);
    setPrompt('');
    setRefinement('');
    setContext(undefined);
    setExchanges([]);
    setResult(null);
    setSelected([]);
    setSaved(null);
    setError('');
    setMedium('all');
    setMinutes('');
  }
  async function submit() {
    if (!account) return;
    const question =
      prompt.trim() || (refinement.trim() ? context?.theme || lastRequest.current : '');
    if (!question) return;
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setBusy(true);
    setError('');
    const history: BuddyTurn[] = exchanges
      .flatMap((turn) => [
        { role: 'user' as const, content: turn.question.slice(0, 2000) },
        { role: 'assistant' as const, content: turn.reply.slice(0, 2000) },
      ])
      .slice(-6);
    try {
      const next = await askBuddy(
        {
          mode,
          prompt: question.slice(0, 2000),
          refinement: refinement.trim(),
          medium,
          max_minutes: minutes ? Number(minutes) : null,
          exclude_ids: includeSeen
            ? []
            : [...new Set([...account.favorites, ...account.logs.map((log) => log.workId)])].slice(
                -500,
              ),
          ...(context ? { context } : {}),
          history,
        },
        current.signal,
      );
      if (current.signal.aborted) return;
      const asked = [question, refinement.trim()].filter(Boolean).join(' · ');
      setExchanges((turns) =>
        [...turns, { id: uniqueId(), question: asked, reply: next.reply }].slice(-10),
      );
      setResult(next);
      setContext(next.context);
      setSelected(next.items.map((pick) => pick.work.id));
      setSaved(null);
      if (next.medium) setMedium(next.medium);
      if (next.context) setMinutes(next.context.max_minutes?.toString() ?? '');
      lastRequest.current = next.context?.theme || asked;
      if (mode === 'chat') {
        setPrompt('');
        setRefinement('');
      }
      setTimeout(() => latest.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
    } catch (e) {
      if (!current.signal.aborted) setError((e as Error).message);
    } finally {
      if (!current.signal.aborted) setBusy(false);
    }
  }
  return (
    <section className="buddy-panel" aria-label="Buddy recommendations">
      <div className="buddy-heading">
        <span className="recommendation-label buddy-label">
          <Sparkles size={14} aria-hidden="true" /> Buddy · Made for your request
        </span>
        {exchanges.length > 0 && (
          <button type="button" className="text-link" onClick={reset}>
            <RotateCcw size={13} /> New conversation
          </button>
        )}
      </div>
      <h2>Follow a feeling with Buddy.</h2>
      <p>
        Talk about a mood, a theme, or something you love. I’ll find catalog picks you can explore
        and save.
      </p>
      {!exchanges.length && (
        <div className="buddy-examples" aria-label="Try a request">
          {[
            'Cyberpunk stories across formats',
            'Hopeful science fiction',
            'Mysteries with a strange atmosphere',
          ].map((example) => (
            <button
              className="button secondary"
              type="button"
              key={example}
              onClick={() => setPrompt(example)}
            >
              {example}
            </button>
          ))}
        </div>
      )}
      <div className="buddy-transcript" aria-label="Your conversation with Buddy">
        {exchanges.map((turn, index) => (
          <div className="buddy-exchange" key={turn.id}>
            <p className="buddy-user-message">
              <span>You</span>
              {turn.question}
            </p>
            <div className="buddy-answer" ref={index === exchanges.length - 1 ? latest : undefined}>
              <span className="recommendation-label buddy-label">
                <Sparkles size={13} aria-hidden="true" />
                {index === exchanges.length - 1 && result?.degraded
                  ? 'Buddy · Catalog fallback'
                  : 'Buddy'}
              </span>
              <p className="buddy-response-copy">{turn.reply}</p>
            </div>
          </div>
        ))}
      </div>
      {result && (
        <div className="buddy-results" aria-live="polite">
          {result.degraded && (
            <p className="micro-copy">
              The free model is unavailable or its answer couldn’t be verified. These are catalog
              fallback results.
            </p>
          )}
          {result.items.length > 0 && (
            <>
              <span className="recommendation-label buddy-label">
                <Sparkles size={13} aria-hidden="true" />
                Buddy picks · {result.items.length} catalog matches
              </span>
              <div className="poster-grid buddy-picks">
                {result.items.map(({ work, reason, evidence }) => (
                  <div key={work.id}>
                    <WorkCard work={work} variant="buddy" />
                    <p>{reason}</p>
                    <details>
                      <summary>Catalog evidence</summary>
                      <p>{evidence}</p>
                    </details>
                    <label className="buddy-selection">
                      <input
                        type="checkbox"
                        checked={selected.includes(work.id)}
                        aria-label={`Include ${work.title} in list`}
                        disabled={busy || !!saved}
                        onChange={(event) =>
                          setSelected((ids) =>
                            event.target.checked
                              ? [...ids, work.id]
                              : ids.filter((id) => id !== work.id),
                          )
                        }
                      />{' '}
                      Include in list
                    </label>
                  </div>
                ))}
              </div>
              <div className="buddy-save">
                <label>
                  List name
                  <input value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
                </label>
                <p className="micro-copy">
                  {selected.length} picks selected. Saved privately on this device.
                </p>
                <button
                  className="button primary"
                  type="button"
                  disabled={busy || !!saved || !selected.length || !title.trim()}
                  onClick={() => {
                    const shelf = {
                      id: uniqueId(),
                      title: title.trim(),
                      description: lastRequest.current.slice(0, 1000),
                      visibility: 'private' as const,
                      source: 'buddy' as const,
                      workIds: result.items
                        .filter((pick) => selected.includes(pick.work.id))
                        .map((pick) => pick.work.id),
                    };
                    try {
                      validateShelf(shelf);
                      update({ ...account, lists: [...account.lists, shelf] });
                      setSaved(shelf.id);
                      notify('Buddy list saved on this device.');
                    } catch (e) {
                      notify((e as Error).message);
                    }
                  }}
                >
                  Save list
                </button>
                {saved && <Link to={`/lists/${saved}`}>Open saved list</Link>}
              </div>
            </>
          )}
          {(result.discovery || result.catalog_size !== undefined) && (
            <p className="micro-copy">
              {result.discovery?.scope === 'live_catalog'
                ? `Searched ${result.discovery.providers.map((p) => p.toUpperCase()).join(' + ')} · ${result.discovery.candidate_count} catalog candidates considered.`
                : result.discovery?.scope === 'conversation'
                  ? 'Using the catalog context from this conversation.'
                  : 'Using cached catalog matches. Live catalog search is unavailable for this turn.'}
              {!!result.discovery?.errors.length && ' Some provider searches were unavailable.'}
            </p>
          )}
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <fieldset disabled={busy} className="buddy-fields">
          <label>
            {exchanges.length ? 'Your next message' : 'What are you looking for?'}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={2000}
              placeholder={
                exchanges.length
                  ? 'More hopeful, games only, or tell me why one fits…'
                  : 'Eerie stories about isolation, or something like Cyberpunk…'
              }
            />
          </label>
          <details className="buddy-options">
            <summary>Formats and preferences</summary>
            <div className="buddy-controls">
              <label>
                Response style
                <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
                  <option value="chat">Chat & recommendations</option>
                  <option value="recommendations">List only</option>
                </select>
              </label>
              <label>
                Format
                <select value={medium} onChange={(e) => setMedium(e.target.value as typeof medium)}>
                  <option value="all">Every format</option>
                  <option value="game">Games</option>
                  <option value="movie">Films</option>
                  <option value="tv">Series</option>
                </select>
              </label>
              <label>
                Maximum minutes
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="Optional · verified durations only"
                />
              </label>
            </div>
            <label>
              Refine your request
              <input
                value={refinement}
                onChange={(e) => setRefinement(e.target.value)}
                maxLength={500}
                placeholder="More hopeful, or games only…"
              />
            </label>
            <label className="buddy-selection">
              <input
                type="checkbox"
                checked={includeSeen}
                onChange={(e) => setIncludeSeen(e.target.checked)}
              />{' '}
              Include favourites and logged titles
            </label>
          </details>
          <p className="micro-copy">
            Your recent Buddy messages and public catalog text go to free AI providers. Notes and
            account details stay here. Unknown durations are excluded when a time limit is set.
          </p>
          <button
            className="button primary"
            type="submit"
            disabled={busy || (!prompt.trim() && !refinement.trim())}
          >
            {busy ? 'Finding connections…' : exchanges.length ? 'Send to Buddy' : 'Ask Buddy'}
          </button>
        </fieldset>
      </form>
      {busy && (
        <p role="status" className="buddy-progress">
          Checking catalog matches and preparing your reply…
        </p>
      )}
      {error && <p role="alert">{error} Your last results are still available.</p>}
    </section>
  );
}
