import { useEffect, useState } from 'react';
import { cover } from './catalog';
import type { Work } from './catalog';
const palettes = new Map<string, string>();
export function usePosterPalette(work?: Work) {
  const src = work ? cover(work) : '';
  const fallback = work?.color || '#b7c96c';
  const [palette, setPalette] = useState<{ src: string; color: string } | null>(null);
  useEffect(() => {
    if (!src) return;
    if (palettes.has(src)) {
      setPalette({ src, color: palettes.get(src)! });
      return;
    }
    let active = true;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.referrerPolicy = 'no-referrer';
    image.onload = () => {
      if (!active) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 32;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;
        context.drawImage(image, 0, 0, 32, 32);
        const pixels = context.getImageData(0, 0, 32, 32).data;
        const buckets = new Map<
          string,
          { score: number; r: number; g: number; b: number; count: number }
        >();
        for (let i = 0; i < pixels.length; i += 4) {
          const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
          const high = Math.max(r, g, b),
            low = Math.min(r, g, b);
          if (high < 38 || low > 225 || high - low < 18) continue;
          const key = `${r >> 5}:${g >> 5}:${b >> 5}`;
          const bucket = buckets.get(key) || { score: 0, r: 0, g: 0, b: 0, count: 0 };
          bucket.score += 1 + (high - low) / 128;
          bucket.r += r;
          bucket.g += g;
          bucket.b += b;
          bucket.count++;
          buckets.set(key, bucket);
        }
        const winner = [...buckets.values()].sort((a, b) => b.score - a.score)[0];
        const color = winner
          ? `rgb(${Math.round(winner.r / winner.count)}, ${Math.round(winner.g / winner.count)}, ${Math.round(winner.b / winner.count)})`
          : fallback;
        if (palettes.size >= 100) palettes.delete(palettes.keys().next().value!);
        palettes.set(src, color);
        setPalette({ src, color });
      } catch {
        /* Cross-origin or undecodable images retain the catalog color. */
      }
    };
    image.src = src;
    return () => {
      active = false;
      image.onload = null;
      image.onerror = null;
    };
  }, [src, fallback]);
  return palette?.src === src ? palette.color : fallback;
}
