import type { FloatingHeart } from './core/types';
import { initFloatingHearts, updateFloatingHeart, computeHeartField } from './core/floatingHeartsMath';
import { forEachGridPoint, DOT_MAX_RADIUS_RATIO } from './core/gridMath';

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
  const maxR = gridSpacing * DOT_MAX_RADIUS_RATIO;

  forEachGridPoint(width, height, gridSpacing, (gx, gy) => {
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
  });
}
