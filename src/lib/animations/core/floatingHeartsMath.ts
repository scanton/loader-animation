// Platform-agnostic floating hearts math — no canvas or Skia imports.

import type { FloatingHeart } from './types';
import { heartSDF, smoothstep } from './heartMath';

// Keep count low (6–10) so hearts stay visually distinct and don't overlap into blobs.
export function floatingHeartCount(width: number, height: number): number {
  return Math.min(10, Math.max(6, Math.floor((width * height) / 55000)));
}

export function initFloatingHearts(width: number, height: number, count: number): FloatingHeart[] {
  return Array.from({ length: count }, () => spawnHeart(width, height, true));
}

export function spawnHeart(width: number, height: number, randomY = false): FloatingHeart {
  const x = 40 + Math.random() * (width - 80);
  return {
    x,
    y: randomY ? Math.random() * height : height + 80,
    scale: 45 + Math.random() * 85,   // 45–130px — large enough to show heart shape in dot grid
    vy: 0.35 + Math.random() * 0.55,
    driftAmp: 18 + Math.random() * 35,
    driftFreq: 0.2 + Math.random() * 0.35,
    driftPhase: Math.random() * Math.PI * 2,
    startX: x,
    opacity: randomY ? Math.random() : 0,
  };
}

// Advances one heart's position/opacity in place and respawns it once it
// scrolls fully off the top of the canvas. Called once per heart per frame.
export function updateFloatingHeart(
  h: FloatingHeart,
  width: number,
  height: number,
  timeSec: number
): void {
  h.y -= h.vy;
  h.x = h.startX + Math.sin(timeSec * h.driftFreq + h.driftPhase) * h.driftAmp;

  const progress = 1 - h.y / height; // 0 at bottom, 1 at top
  h.opacity = smoothstep(0, 0.1, progress) * smoothstep(1.1, 0.85, progress);

  if (h.y < -h.scale * 2.5) {
    Object.assign(h, spawnHeart(width, height, false));
  }
}

// For each grid point, compute how much "heart glow" it receives.
// Uses a crisp interior + exponential glow outside — heart shape reads clearly,
// edges look soft/blurry rather than sharp.
export function computeHeartField(
  gx: number,
  gy: number,
  hearts: FloatingHeart[]
): number {
  // Use max() instead of sum so overlapping hearts don't compound into blobs —
  // each point takes the strongest single-heart contribution only.
  let field = 0;
  for (const h of hearts) {
    if (h.opacity <= 0) continue;
    const sdf = heartSDF(gx, gy, h.x, h.y, h.scale);

    const interior = smoothstep(0.04, -0.06, sdf);
    // Tight exponential glow outside — soft halo but falls off quickly
    // so adjacent hearts don't bleed into each other.
    const glow = Math.exp(-Math.max(0, sdf) * 4.5) * 0.7;

    const contribution = Math.max(interior, glow) * h.opacity;
    field = Math.max(field, contribution);
  }
  return field;
}
