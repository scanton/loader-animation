import { forEachGridPoint, DOT_MAX_RADIUS_RATIO } from './core/gridMath';
import { drawHeart } from './heartPath';
import { drawImageAsset } from './stampyImage';

// Halftone rendering of the real Stampy artwork (public/Stampy_Red.svg).
// The art is rasterized to an offscreen canvas each frame, then sampled into
// the signature heart-dot grid. Near-black pixels (eyes, mouth) are rendered
// as negative space — the face reads through the *gaps* in the dots, which is
// far crisper at halftone resolution than trying to draw dark dots.
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

export function drawStampySvgHalftoneFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  gridSpacing: number,
  outerDotColor: string
): void {
  ctx.clearRect(0, 0, width, height);

  const timeSec = time / 1000;

  // Gentle idle motion — enough that the grid visibly re-renders him, small
  // enough that the face stays readable.
  const breath = 1 + Math.sin(timeSec * 0.55 * Math.PI * 2) * 0.025;
  const bob = Math.sin(timeSec * 0.35 * Math.PI * 2) * SAMPLE_SIZE * 0.025;

  const offCtx = getOffscreenCtx();
  if (!offCtx) return;
  offCtx.clearRect(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  drawImageAsset(offCtx, '/Stampy_Red.svg', SAMPLE_SIZE / 2, SAMPLE_SIZE / 2 + bob, SAMPLE_SIZE * 0.94 * breath);
  const { data: pixels } = offCtx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

  const targetSize = Math.min(width, height) * 0.96;
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
    }

    const luminance = 0.299 * red + 0.587 * green + 0.114 * blue;
    const isCutout = alpha >= 0.08 && luminance < 40; // eyes / mouth interior

    if (alpha < 0.08 || isCutout) {
      ctx.beginPath();
      ctx.arc(gx, gy, minR, 0, Math.PI * 2);
      ctx.fillStyle = outerDotColor;
      ctx.fill();
      return;
    }

    // True halftone: dot size follows tone (brighter = bigger against the
    // dark background), so the coral face, red body, and dark horns separate
    // by size as well as color. Luminance 40..170 → 55%..100% of max size.
    const tone = 0.55 + 0.45 * Math.max(0, Math.min(1, (luminance - 40) / 130));

    // Subtle radial shimmer keeps flat fills alive without distorting the face.
    const dist = Math.hypot(gx - cx, gy - cy);
    const shimmer = 0.94 + 0.06 * Math.sin(dist * 0.04 - timeSec * 2);
    const r = Math.max(minR, (minR + (maxR - minR) * alpha) * tone * shimmer);

    ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
    if (r >= 2) {
      drawHeart(ctx, gx, gy, r);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
