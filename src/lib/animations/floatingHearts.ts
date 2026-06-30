import type { FloatingHeart } from './core/types';
import { initFloatingHearts, updateFloatingHeart, computeHeartField } from './core/floatingHeartsMath';

export type { FloatingHeart };
export { initFloatingHearts };

export function drawFloatingHeartsFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hearts: FloatingHeart[],
  time: number,
  gridSpacing: number,
  colorInner: string,
  colorMid: string,
  colorOuter: string
): void {
  ctx.clearRect(0, 0, width, height);

  const timeSec = time / 1000;

  for (const h of hearts) {
    updateFloatingHeart(h, width, height, timeSec);
  }

  const minR = 2;
  const maxR = gridSpacing * 0.23;

  const cols = Math.floor(width / gridSpacing);
  const rows = Math.floor(height / gridSpacing);
  const offsetX = (width - cols * gridSpacing) / 2 + gridSpacing / 2;
  const offsetY = (height - rows * gridSpacing) / 2 + gridSpacing / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const gx = offsetX + col * gridSpacing;
      const gy = offsetY + row * gridSpacing;

      const field = computeHeartField(gx, gy, hearts);
      const r = minR + (maxR - minR) * field;

      if (field > 0.7) {
        ctx.fillStyle = colorInner;
      } else if (field > 0.15) {
        const mix = (field - 0.15) / 0.55;
        ctx.fillStyle = mix > 0.5 ? colorInner : colorMid;
      } else {
        ctx.fillStyle = colorOuter;
      }

      ctx.beginPath();
      ctx.arc(gx, gy, Math.max(0.5, r), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
