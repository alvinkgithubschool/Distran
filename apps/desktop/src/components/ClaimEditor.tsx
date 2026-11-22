import { useState } from 'react';
import { Check, Fingerprint } from 'lucide-react';
import { useStore } from '../lib/context';
import { requestClaim } from '../lib/store';
import type { Work } from '../lib/catalog';
import { Modal } from './ui';
export function ClaimEditor({ work, onClose }: { work: Work; onClose: () => void }) {
  const { account, update, notify } = useStore();
  const [credit, setCredit] = useState('');
  const [evidence, setEvidence] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  if (!account || account.role !== 'creator') return null;
  return (
    <Modal title={`Your part in ${work.title}`} subtitle="CLAIM A CREDIT" onClose={onClose}>
      <p className="muted">
        Tell us how you helped make this world. Claims are saved on this device as pending requests;
        ownership verification is not available in this preview.
      </p>
      <form
        className="editor-form"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            update(requestClaim(account, { workId: work.id, credit, evidence, note }));
            notify('Claim request saved. Pending verification.');
            onClose();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <label className="field">
          Your credited role
          <input
            required
            maxLength={100}
            value={credit}
            onChange={(e) => setCredit(e.target.value)}
            placeholder="Director, developer, producer…"
          />
        </label>
        <label className="field">
          Public evidence link
          <input
            type="url"
            required
            maxLength={1000}
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="https://official-site.com/credits"
          />
        </label>
        <label className="field">
          Anything else we should know?
          <textarea
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </label>
        <p className="claim-note">
          <Fingerprint size={17} />A request does not grant editing access or a verified ownership
          badge.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer className="modal-footer">
          <button className="button primary" type="submit">
            Save claim request <Check size={16} />
          </button>
        </footer>
      </form>
    </Modal>
  );
}
