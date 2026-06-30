import type { Blob } from './types';
import { computeField, updateBlobs, initBlobs, FIELD_LOW, FIELD_HIGH } from './core/lavaMath';
import { smoothstep } from './core/heartMath';
import { forEachGridPoint, HEART_DOT_MAX_RADIUS_RATIO } from './core/gridMath';
import { drawHeart } from './heartPath';

export { initBlobs, updateBlobs };

export function drawHeartsFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  blobs: Blob[],
  gridSpacing: number,
  color: string
): void {
  ctx.clearRect(0, 0, width, height);

  const minR = 0.8;
  const maxR = gridSpacing * HEART_DOT_MAX_RADIUS_RATIO;

  ctx.fillStyle = color;

  forEachGridPoint(width, height, gridSpacing, (gx, gy) => {
    const field = computeField(gx, gy, blobs);
    const t = smoothstep(FIELD_LOW, FIELD_HIGH, field);
    const r = minR + (maxR - minR) * t;

    if (r < 1.5) {
      ctx.beginPath();
      ctx.arc(gx, gy, Math.max(0.5, r), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.save();
      ctx.translate(gx, gy);
      drawHeart(ctx, 0, 0, r);
      ctx.fill();
      ctx.restore();
    }
  });
}
