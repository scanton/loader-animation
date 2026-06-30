// Platform-agnostic beating heart math — no canvas or Skia imports.

export const BEAT_RATE = 1.2;           // beats per second
export const HEART_SCALE_FACTOR = 0.52; // fraction of min(width, height)
export const BEAT_AMPLITUDE = 0.22;     // fractional size change per beat
export const RIPPLE_SPEED = 0.55;       // SDF units/sec outward from heart surface
export const MAX_RIPPLE_SEC = 1.8;      // ripple lifetime in seconds
export const EDGE_OUTER = 0.07;         // SDF threshold: outside → edge
export const EDGE_INNER = -0.05;        // SDF threshold: edge → inside

// Sharp attack, quick decay, subtle second beat
export function beatPulse(t: number): number {
  const cycle = t % 1;
  if (cycle < 0.08) return cycle / 0.08;
  if (cycle < 0.25) return 1 - (cycle - 0.08) / 0.17;
  if (cycle < 0.42) return 0.15 + ((cycle - 0.25) / 0.17) * 0.2;
  return Math.max(0, 0.35 - ((cycle - 0.42) / 0.58) * 0.35);
}

// Accumulate ripple ring contributions at a grid point.
// sdfRipple: SDF value at this point using the FIXED (non-pulsing) heart scale.
// timeSec:   seconds since animation start.
// beatPeriodSec: 1 / BEAT_RATE.
// Returns 0–1; higher = closer to a ripple ring.
export function rippleBoostAt(
  sdfRipple: number,
  timeSec: number,
  beatPeriodSec: number
): number {
  const currentBeatIdx = Math.floor(timeSec / beatPeriodSec);
  let boost = 0;
  for (let k = currentBeatIdx; k >= Math.max(0, currentBeatIdx - 4); k--) {
    const ageSec = timeSec - k * beatPeriodSec;
    if (ageSec < 0 || ageSec > MAX_RIPPLE_SEC) continue;
    const ringPos = RIPPLE_SPEED * ageSec;
    const distFromRing = sdfRipple - ringPos;
    const fade = Math.pow(1 - ageSec / MAX_RIPPLE_SEC, 1.5);
    const sigma = 0.09 + ageSec * 0.12;
    boost += Math.exp(-(distFromRing * distFromRing) / (sigma * sigma)) * fade;
  }
  return Math.min(1, boost);
}
