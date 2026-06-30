// Re-export the SDF from core so web import paths stay backward-compatible.
export { heartSDF } from './core/heartMath';

// Draw a heart centered at (cx, cy) with given radius — web canvas only.
export function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): void {
  const steps = 64;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    const s = radius / 16;
    if (i === 0) ctx.moveTo(cx + hx * s, cy + hy * s);
    else ctx.lineTo(cx + hx * s, cy + hy * s);
  }
  ctx.closePath();
}
