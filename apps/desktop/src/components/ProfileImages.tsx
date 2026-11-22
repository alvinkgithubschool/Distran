import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

export async function resizeProfileImage(file: File, kind: 'avatar' | 'banner'): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw Error('Choose a JPEG, PNG or WebP image.');
  if (file.size > 8 * 1024 * 1024) throw Error('Choose an image smaller than 8 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const width = kind === 'avatar' ? 256 : 1200;
    const height = kind === 'avatar' ? 256 : 400;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw Error('Image editing is unavailable in this browser.');
    const scale = Math.max(width / bitmap.width, height / bitmap.height);
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(
      bitmap,
      (width - bitmap.width * scale) / 2,
      (height - bitmap.height * scale) / 2,
      bitmap.width * scale,
      bitmap.height * scale,
    );
    const data = canvas.toDataURL('image/jpeg', 0.78);
    if (data.length > 650000)
      throw Error('This image is too detailed to save locally. Try another image.');
    return data;
  } finally {
    bitmap.close();
  }
}
export function ProfileImages({
  avatar,
  banner,
  onChange,
  onBusy,
}: {
  avatar?: string;
  banner?: string;
  onChange: (kind: 'avatar' | 'banner', value: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <fieldset className="profile-image-fields" disabled={busy}>
      <legend>Your picture. Your atmosphere.</legend>
      {(['avatar', 'banner'] as const).map((kind) => {
        const value = kind === 'avatar' ? avatar : banner;
        return (
          <div className={`image-upload ${kind}`} key={kind}>
            {value ? <img src={value} alt={`${kind} preview`} /> : <ImagePlus size={24} />}
            <label className="button secondary">
              {kind === 'avatar' ? 'Profile picture' : 'Profile banner'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label={`Upload ${kind}`}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  setBusy(true);
                  onBusy(true);
                  setError('');
                  try {
                    onChange(kind, await resizeProfileImage(file, kind));
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                    onBusy(false);
                  }
                }}
              />
            </label>
            {value && (
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove ${kind}`}
                onClick={() => onChange(kind, '')}
              >
                <X size={16} />
              </button>
            )}
          </div>
        );
      })}
      <p className="micro-copy">
        JPEG, PNG or WebP · up to 8 MB · centered crop. Banner 3:1, picture square.
      </p>
      {busy && <p role="status">Preparing your image…</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
