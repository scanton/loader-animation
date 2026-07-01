import { forEachGridPoint, DOT_MAX_RADIUS_RATIO } from './core/gridMath';
import { drawHeart } from './heartPath';
import { drawStampySource } from './stampyImage';

// Offscreen raster of Stampy that the halftone grid samples each frame — the
// same way a photo becomes a dot screen in print. Module-level singleton is
// safe because AnimationCanvas renders one animation at a time.
const SAMPLE_SIZE = 300;
let offscreen: HTMLCanvasElement | null = null;
let offscreenCtx: CanvasRenderingContext2D | null = null;

function getOffscreenCtx(): CanvasRenderingContext2D | null {
  if (!offscreen && typeof document !== 'undefined') {
    offscreen = document.createElement('canvas');
    offscreen.width = SAMPLE_SIZE;
    offscreen.height = SAMPLE_SIZE;
    offscreenCtx = offscreen.getContext('2d', { willReadFrequently: true });
  }
  return offscreenCtx;
}

export function drawStampyHalftoneFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  gridSpacing: number,
  outerDotColor: string
): void {
  ctx.clearRect(0, 0, width, height);

  const timeSec = time / 1000;

  // Gentle idle motion: breathing scale + a slow vertical bob. The bob makes
  // the silhouette travel across grid cells, which is what makes the halftone
  // sampling visibly "re-render" him dot by dot.
  const breath = 1 + Math.sin(timeSec * 0.55 * Math.PI * 2) * 0.03;
  const bob = Math.sin(timeSec * 0.35 * Math.PI * 2) * SAMPLE_SIZE * 0.04;

  const offCtx = getOffscreenCtx();
  if (!offCtx) return;
  offCtx.clearRect(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  drawStampySource(offCtx, SAMPLE_SIZE / 2, SAMPLE_SIZE / 2 + bob, SAMPLE_SIZE * 0.88 * breath);
  const { data: pixels } = offCtx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

  // Map the square sample region onto the canvas center.
  const targetSize = Math.min(width, height) * 0.94;
  const originX = width / 2 - targetSize / 2;
  const originY = height / 2 - targetSize / 2;

  const minR = 1;
  const maxR = gridSpacing * DOT_MAX_RADIUS_RATIO;
  const cx = width / 2;
  const cy = height / 2;

  forEachGridPoint(width, height, gridSpacing, (gx, gy) => {
    let alpha = 0;
    let red = 0, green = 0, blue = 0;

    const u = (gx - originX) / targetSize;
    const v = (gy - originY) / targetSize;
    if (u >= 0 && u < 1 && v >= 0 && v < 1) {
      const px = Math.floor(u * SAMPLE_SIZE);
      const py = Math.floor(v * SAMPLE_SIZE);
      const idx = (py * SAMPLE_SIZE + px) * 4;
      alpha = pixels[idx + 3] / 255;
      red = pixels[idx];
      green = pixels[idx + 1];
      blue = pixels[idx + 2];
      // Treat near-white as background in case the art has a flat white bg.
      if (red > 245 && green > 245 && blue > 245) alpha = 0;
    }

    if (alpha < 0.08) {
      // Faint background grid, same treatment as the other animations.
      ctx.beginPath();
      ctx.arc(gx, gy, minR, 0, Math.PI * 2);
      ctx.fillStyle = outerDotColor;
      ctx.fill();
      return;
    }

    // Shimmer: a slow radial wave modulates dot size so the halftone feels
    // alive even where the artwork is a flat fill.
    const dist = Math.hypot(gx - cx, gy - cy);
    const shimmer = 0.82 + 0.18 * Math.sin(dist * 0.045 - timeSec * 2.2);
    const r = Math.max(minR, (minR + (maxR - minR) * alpha) * shimmer);

    ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
    if (r >= 2) {
      // Heart-shaped dots — the signature pattern of the visible variants.
      drawHeart(ctx, gx, gy, r);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
