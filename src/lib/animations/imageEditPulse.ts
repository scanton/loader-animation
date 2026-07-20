import { heartSDF } from './core/heartMath';
import { forEachGridPoint, DOT_MAX_RADIUS_RATIO } from './core/gridMath';
import { getImageAsset, imageAssetFailed } from './stampyImage';

// "Image Edit" loading effect: the image being edited sits blurred underneath
// a sparse grid of warm-white shimmering dots, while heart-shaped pulse rings
// radiate outward from the center through the grid — matching the look of the
// mobile app's editing overlay.
//
// Demo images cycle between the card cover and inside spread with a crossfade.
// Each is referenced by basename; .png is tried first, then .jpg.

const IMAGE_BASES = ['/card-cover', '/card-inside'];
const EXTENSIONS = ['.png', '.jpg'];

const CYCLE_SEC = 8;    // how long each image is shown
const FADE_SEC = 0.9;   // crossfade duration at the end of each cycle

// Heart pulse rings, in SDF units from the heart surface (same approach as
// the Beating Heart ripples — iso-lines of the SDF stay heart-shaped).
const RING_PERIOD_SEC = 1.9;
const RING_SPEED = 1.1;    // SDF units/sec outward
const RING_LIFE_SEC = 3.2;
const HEART_SCALE_FACTOR = 0.22; // of min(width, height)

function prand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Resolve the first extension of a base name that has actually loaded.
function resolveImage(base: string): HTMLImageElement | null {
  for (const ext of EXTENSIONS) {
    const img = getImageAsset(base + ext);
    if (img) return img;
  }
  return null;
}

function allCandidatesFailed(base: string): boolean {
  return EXTENSIONS.every(ext => imageAssetFailed(base + ext));
}

// --- Blurred-image cache ---------------------------------------------------
// Blurring at 60fps is expensive; instead each image is blurred ONCE per
// canvas size into an offscreen canvas, then composited cheaply every frame.
const blurCache = new Map<string, HTMLCanvasElement>();

function getBlurredImage(base: string, width: number, height: number): HTMLCanvasElement | null {
  const img = resolveImage(base);
  if (!img) return null;

  const key = `${base}|${width}x${height}`;
  const cached = blurCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Cover-fit with overscan so the blur doesn't fade at the edges.
  const overscan = 1.12;
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight) * overscan;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.filter = 'blur(18px)';
  ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);

  blurCache.set(key, canvas);
  return canvas;
}

function drawFallbackBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#fda4af');
  grad.addColorStop(0.5, '#fcd9a8');
  grad.addColorStop(1, '#f9a8d4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

// Accumulated ring boost at a grid point, 0–1.
function ringBoostAt(sdf: number, timeSec: number): number {
  const currentIdx = Math.floor(timeSec / RING_PERIOD_SEC);
  let boost = 0;
  for (let k = currentIdx; k >= Math.max(0, currentIdx - 3); k--) {
    const ageSec = timeSec - k * RING_PERIOD_SEC;
    if (ageSec < 0 || ageSec > RING_LIFE_SEC) continue;
    const ringPos = ageSec * RING_SPEED;
    const dist = sdf - ringPos;
    const sigma = 0.12 + ageSec * 0.1; // ring widens as it travels
    const fade = Math.pow(1 - ageSec / RING_LIFE_SEC, 1.3);
    boost += Math.exp(-(dist * dist) / (sigma * sigma)) * fade;
  }
  return Math.min(1, boost);
}

export function drawImageEditPulseFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  gridSpacing: number
): void {
  const timeSec = time / 1000;

  // --- Blurred image background with slow crossfade between the two demos ---
  const cycleIdx = Math.floor(timeSec / CYCLE_SEC);
  const currentBase = IMAGE_BASES[cycleIdx % IMAGE_BASES.length];
  const nextBase = IMAGE_BASES[(cycleIdx + 1) % IMAGE_BASES.length];
  const cycleT = timeSec % CYCLE_SEC;

  const current = getBlurredImage(currentBase, width, height);
  if (current) {
    ctx.drawImage(current, 0, 0);
  } else if (allCandidatesFailed(currentBase)) {
    drawFallbackBackground(ctx, width, height);
  } else {
    // Still loading — keep the fallback so the effect never renders on black.
    drawFallbackBackground(ctx, width, height);
  }

  const fadeStart = CYCLE_SEC - FADE_SEC;
  if (cycleT > fadeStart) {
    const next = getBlurredImage(nextBase, width, height);
    if (next) {
      ctx.globalAlpha = (cycleT - fadeStart) / FADE_SEC;
      ctx.drawImage(next, 0, 0);
      ctx.globalAlpha = 1;
    }
  }

  // Soft dark veil so the warm-white dots stay visible over bright artwork.
  ctx.fillStyle = 'rgba(30, 15, 20, 0.28)';
  ctx.fillRect(0, 0, width, height);

  // --- Heart-shaped pulse through the dot grid ---
  const cx = width / 2;
  const cy = height / 2;
  const heartScale = Math.min(width, height) * HEART_SCALE_FACTOR;
  const maxR = gridSpacing * DOT_MAX_RADIUS_RATIO;
  const baseR = Math.min(1.6, maxR * 0.55);

  forEachGridPoint(width, height, gridSpacing, (gx, gy) => {
    const sdf = heartSDF(gx, gy, cx, cy, heartScale);
    const boost = ringBoostAt(Math.max(0, sdf), timeSec);

    // Per-dot shimmer — stable per position, slowly drifting in time — gives
    // the grid the uneven "sheen" of the reference overlay.
    const seed = prand(gx * 13.37 + gy * 7.77);
    const shimmer = 0.5 + 0.5 * Math.sin(timeSec * 1.5 + seed * Math.PI * 2);

    const r = baseR + (maxR - baseR) * boost;
    const alpha = Math.min(1, 0.26 + shimmer * 0.14 + boost * 0.6);

    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 247, 238, ${alpha.toFixed(3)})`;
    ctx.fill();
  });
}
