import { drawHeart, heartSDF } from './heartPath';
import { smoothstep } from './core/heartMath';
import {
  BEAT_RATE, HEART_SCALE_FACTOR, BEAT_AMPLITUDE,
  EDGE_OUTER, EDGE_INNER,
  beatPulse, rippleBoostAt,
} from './core/beatingHeartMath';

export function drawBeatingHeartFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  gridSpacing: number,
  colorInner: string,
  colorOuter: string,
  colorRipple: string,
  useHearts: boolean
): void {
  ctx.clearRect(0, 0, width, height);

  const timeSec = time / 1000;
  const beatPeriodSec = 1 / BEAT_RATE;
  const pulse = beatPulse((timeSec * BEAT_RATE) % 1);
  const beatScale = 1 + pulse * BEAT_AMPLITUDE;

  const cx = width / 2;
  const cy = height / 2;
  const baseHeartScale = Math.min(width, height) * HEART_SCALE_FACTOR;
  const heartScale = baseHeartScale * beatScale;

  const cols = Math.floor(width / gridSpacing);
  const rows = Math.floor(height / gridSpacing);
  const offsetX = (width - cols * gridSpacing) / 2 + gridSpacing / 2;
  const offsetY = (height - rows * gridSpacing) / 2 + gridSpacing / 2;

  const maxR    = gridSpacing * 0.23;
  const minR    = 1.5;
  const innerMin = gridSpacing * 0.165;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const gx = offsetX + col * gridSpacing;
      const gy = offsetY + row * gridSpacing;

      // sdfHeart pulsing scale → heart interior; sdfRipple fixed scale → ripple rings
      const sdfHeart  = heartSDF(gx, gy, cx, cy, heartScale);
      const sdfRipple = heartSDF(gx, gy, cx, cy, baseHeartScale);
      const inside    = smoothstep(EDGE_OUTER, EDGE_INNER, sdfHeart);

      const rippleBoost  = rippleBoostAt(sdfRipple, timeSec, beatPeriodSec);
      const rippleContrib = rippleBoost * Math.max(0, 1 - inside * 3);

      const r_base = inside > 0.5
        ? innerMin + (maxR - innerMin) * inside * (0.85 + pulse * 0.15)
        : minR + Math.max(0, innerMin - minR) * (inside * 2);
      const r = Math.min(maxR, r_base + rippleContrib * gridSpacing * 0.23);

      let color: string;
      if (inside > 0.35) {
        color = colorInner;
      } else if (rippleBoost > 0.25) {
        color = rippleBoost > 0.6 ? colorInner : colorRipple;
      } else {
        color = colorOuter;
      }
      ctx.fillStyle = color;

      if (useHearts && r >= 2) {
        ctx.save();
        ctx.translate(gx, gy);
        drawHeart(ctx, 0, 0, r);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(gx, gy, Math.max(0.5, r), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
