// Platform-agnostic heart math — no canvas or Skia imports.
// Used by both web (canvas) and mobile (Skia) render layers.

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// IQ's geometric heart SDF.
// Returns negative inside the heart, positive outside, in normalized units.
// Coordinate origin: cx/cy is the canvas center.
// y-shift of +0.55 centers the visual heart (tip at 0, lobe tops at ≈1.1 → midpoint 0.55).
export function heartSDF(
  px: number,
  py: number,
  cx: number,
  cy: number,
  scale: number
): number {
  let x = (px - cx) / scale;
  let y = -(py - cy) / scale + 0.55;

  x = Math.abs(x);

  if (y + x > 1.0) {
    const dx = x - 0.25;
    const dy = y - 0.75;
    return Math.sqrt(dx * dx + dy * dy) - Math.sqrt(2) / 4;
  }

  const d1 = x * x + (y - 1) * (y - 1);
  const t = Math.max(x + y, 0) * 0.5;
  const d2 = (x - t) * (x - t) + (y - t) * (y - t);
  return Math.sqrt(Math.min(d1, d2)) * Math.sign(x - y);
}
