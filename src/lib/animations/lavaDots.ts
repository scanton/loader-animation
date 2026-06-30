import type { Blob } from './types';
import { initBlobs, updateBlobs, computeField, FIELD_LOW, FIELD_HIGH } from './core/lavaMath';
import { smoothstep } from './core/heartMath';
import { forEachGridPoint, DOT_MAX_RADIUS_RATIO } from './core/gridMath';

export { initBlobs, updateBlobs, computeField };

export function drawDotsFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  blobs: Blob[],
  gridSpacing: number,
  color: string
): void {
  ctx.clearRect(0, 0, width, height);

  const minR = 1;
  const maxR = gridSpacing * DOT_MAX_RADIUS_RATIO;

  ctx.fillStyle = color;

  forEachGridPoint(width, height, gridSpacing, (gx, gy) => {
    const field = computeField(gx, gy, blobs);
    const t = smoothstep(FIELD_LOW, FIELD_HIGH, field);
    const r = minR + (maxR - minR) * t;

    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.fill();
  });
}
