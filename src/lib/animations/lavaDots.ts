import type { Blob } from './types';
import { initBlobs, updateBlobs, computeField, FIELD_LOW, FIELD_HIGH } from './core/lavaMath';
import { smoothstep } from './core/heartMath';

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
  const maxR = gridSpacing * 0.23;

  const cols = Math.floor(width / gridSpacing);
  const rows = Math.floor(height / gridSpacing);
  const offsetX = (width - cols * gridSpacing) / 2 + gridSpacing / 2;
  const offsetY = (height - rows * gridSpacing) / 2 + gridSpacing / 2;

  ctx.fillStyle = color;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const gx = offsetX + col * gridSpacing;
      const gy = offsetY + row * gridSpacing;

      const field = computeField(gx, gy, blobs);
      const t = smoothstep(FIELD_LOW, FIELD_HIGH, field);
      const r = minR + (maxR - minR) * t;

      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
