import type { SkPath } from '@shopify/react-native-skia';

// Adds a parametric heart shape to an existing SkPath, centered at (cx, cy).
// 24 segments — plenty for dots a few pixels wide; web uses 64 for larger sprites.
export function addHeartToPath(path: SkPath, cx: number, cy: number, r: number): void {
  const s = r / 16;
  const STEPS = 24;
  for (let i = 0; i <= STEPS; i++) {
    const t  = (i / STEPS) * Math.PI * 2;
    const hx = cx + 16 * Math.pow(Math.sin(t), 3) * s;
    const hy = cy - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s;
    i === 0 ? path.moveTo(hx, hy) : path.lineTo(hx, hy);
  }
  path.close();
}
