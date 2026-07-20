// Loads Stampy mascot artwork assets once each, shared by the Stampy
// animations. Web-only (uses Image/document).
//
// Until an asset loads — or if it's missing — drawImageAsset falls back to
// the parametric heart in the brand red, so the animations always render.

import { drawHeart } from './heartPath';

interface Asset {
  img: HTMLImageElement;
  status: 'loading' | 'ready' | 'failed';
}

const assets = new Map<string, Asset>();

function getAsset(url: string, recolorFill?: string): Asset | null {
  if (typeof window === 'undefined') return null;
  const key = recolorFill ? `${url}#fill=${recolorFill}` : url;
  let asset = assets.get(key);
  if (!asset) {
    const img = new Image();
    const entry: Asset = { img, status: 'loading' };
    img.onload = () => { entry.status = 'ready'; };
    img.onerror = () => { entry.status = 'failed'; };
    if (recolorFill) {
      // Fetch the SVG source and swap its black fills for the requested color
      // (e.g. the theme background) so the art reads as outline-only.
      fetch(url)
        .then(res => res.text())
        .then(svg => {
          const recolored = svg.replaceAll('fill="#000000"', `fill="${recolorFill}"`);
          img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(recolored)}`;
        })
        .catch(() => { entry.status = 'failed'; });
    } else {
      img.src = url;
    }
    assets.set(key, entry);
    asset = entry;
  }
  return asset;
}

// Returns the loaded image element for an asset, or null while it's still
// loading / if it failed. For callers that need custom drawing (cover-fit,
// filters) rather than the square-fit drawImageAsset below.
export function getImageAsset(url: string): HTMLImageElement | null {
  const asset = getAsset(url);
  return asset?.status === 'ready' ? asset.img : null;
}

// True once the asset has definitively failed to load (e.g. missing file).
export function imageAssetFailed(url: string): boolean {
  return getAsset(url)?.status === 'failed';
}

// Draws an image asset centered at (cx, cy) in a size×size box (all Stampy
// assets have a square viewBox, so forcing square is correct — and it also
// sidesteps SVGs reporting no intrinsic size). Falls back to a red heart.
// Pass recolorFill to replace the SVG's black fills with another color.
export function drawImageAsset(
  ctx: CanvasRenderingContext2D,
  url: string,
  cx: number,
  cy: number,
  size: number,
  recolorFill?: string
): void {
  const asset = getAsset(url, recolorFill);

  if (asset?.status === 'ready') {
    ctx.drawImage(asset.img, cx - size / 2, cy - size / 2, size, size);
    return;
  }

  ctx.fillStyle = '#e9293f';
  drawHeart(ctx, cx, cy, size * 0.42);
  ctx.fill();
}

// Back-compat wrapper for the original PNG-based animations.
export function drawStampySource(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  drawImageAsset(ctx, '/stampy.png', cx, cy, size);
}
