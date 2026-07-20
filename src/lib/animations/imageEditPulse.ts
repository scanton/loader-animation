import { heartSDF, smoothstep } from './core/heartMath';
import { forEachGridPoint, DOT_MAX_RADIUS_RATIO } from './core/gridMath';
import { getImageAsset } from './stampyImage';

// "Image Edit" loading effect: the image being edited sits blurred underneath
// a sparse grid of warm-white shimmering dots, while heart-shaped pulse rings
// radiate outward from the center through the grid — matching the look of the
// mobile app's editing overlay.
//
// The demo image follows the canvas orientation: the portrait card cover for
// portrait canvases, the landscape inside spread otherwise. Each is referenced
// by basename; .png is tried first, then .jpg.

const COVER_BASE = '/card-cover';   // portrait art, shown when width < height
const INSIDE_BASE = '/card-inside'; // landscape art, shown when width >= height
const EXTENSIONS = ['.png', '.jpg'];

// Heart pulse rings. Each ring is an actual heart OUTLINE whose scale grows
// over its lifetime — unlike SDF iso-lines (which round off into circles with
// distance), this keeps the ring a crisp heart shape all the way out.
// Each beat is a double pulse ("lub-dub"): two rings born a beat-fraction
// apart, the second slightly softer, then a rest until the next beat.
const RING_PERIOD_SEC = 2.4;         // one full heartbeat per period
const DOUBLE_PULSE_GAP_SEC = 0.41;   // delay between the "lub" and the "dub"
const DOUBLE_PULSE_SOFTNESS = 0.85;  // second ring's relative strength
const RING_START_SCALE = 24;         // px half-width at birth
const RING_GROWTH_PX_PER_SEC = 150;  // how fast the heart outline expands
const RING_LIFE_SEC = 3.6;
const RING_WIDTH_PX = 13;            // gaussian half-width of the outline band

// [birth offset within the beat, relative strength]
const PULSE_OFFSETS: Array<[number, number]> = [
  [0, 1],
  [DOUBLE_PULSE_GAP_SEC, DOUBLE_PULSE_SOFTNESS],
];

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
  ctx.filter = 'blur(7px)';
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

// Accumulated ring boost at a grid point, 0–1. For each live ring, the point's
// signed distance to a heart outline at the ring's current scale is converted
// to pixels, then run through a gaussian band around that outline.
function ringBoostAt(gx: number, gy: number, cx: number, cy: number, timeSec: number): number {
  const currentIdx = Math.floor(timeSec / RING_PERIOD_SEC);
  let boost = 0;
  for (let k = currentIdx; k >= Math.max(0, currentIdx - 3); k--) {
    // Two rings per beat: the "lub" at the beat start, the "dub" just after.
    for (const [offsetSec, strength] of PULSE_OFFSETS) {
      const ageSec = timeSec - (k * RING_PERIOD_SEC + offsetSec);
      if (ageSec < 0 || ageSec > RING_LIFE_SEC) continue;
      const ringScale = RING_START_SCALE + ageSec * RING_GROWTH_PX_PER_SEC;
      // heartSDF is normalized by scale, so sdf * scale ≈ pixel distance.
      const distPx = heartSDF(gx, gy, cx, cy, ringScale) * ringScale;
      // Hold near-full strength for most of the journey (so the ring is still
      // clearly visible when it reaches the border), then release quickly.
      const ageFrac = ageSec / RING_LIFE_SEC;
      const fade = (1 - 0.2 * ageFrac) * (1 - smoothstep(0.72, 1, ageFrac));
      boost += Math.exp(-(distPx * distPx) / (RING_WIDTH_PX * RING_WIDTH_PX)) * fade * strength;
    }
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

  // --- Blurred image background, chosen by canvas orientation ---
  const currentBase = width < height ? COVER_BASE : INSIDE_BASE;

  const current = getBlurredImage(currentBase, width, height);
  if (current) {
    ctx.drawImage(current, 0, 0);
  } else {
    // Still loading (or missing) — draw the fallback so the effect never
    // renders on black.
    drawFallbackBackground(ctx, width, height);
  }

  // Soft dark veil so the warm-white dots stay visible over bright artwork.
  ctx.fillStyle = 'rgba(30, 15, 20, 0.28)';
  ctx.fillRect(0, 0, width, height);

  // --- Heart-shaped pulse through the dot grid ---
  const cx = width / 2;
  const cy = height / 2;
  const maxR = gridSpacing * DOT_MAX_RADIUS_RATIO;
  const baseR = Math.min(1.6, maxR * 0.55);

  forEachGridPoint(width, height, gridSpacing, (gx, gy) => {
    const boost = ringBoostAt(gx, gy, cx, cy, timeSec);

    // Per-dot shimmer — stable per position, slowly drifting in time — gives
    // the grid the uneven "sheen" of the reference overlay.
    const seed = prand(gx * 13.37 + gy * 7.77);
    const shimmer = 0.5 + 0.5 * Math.sin(timeSec * 1.5 + seed * Math.PI * 2);

    const r = baseR + (maxR - baseR) * boost;
    const alpha = Math.min(1, 0.26 + shimmer * 0.14 + boost * 0.74);

    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 247, 238, ${alpha.toFixed(3)})`;
    ctx.fill();
  });
}
