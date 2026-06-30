// Platform-agnostic grid layout math — no canvas or Skia imports.
// Every animation lays dots out on the same centered grid; this is the
// single source of truth for that layout so web and mobile can't drift.

export interface GridLayout {
  cols: number;
  rows: number;
  offsetX: number;
  offsetY: number;
}

export function computeGrid(width: number, height: number, gridSpacing: number): GridLayout {
  const cols = Math.floor(width / gridSpacing);
  const rows = Math.floor(height / gridSpacing);
  const offsetX = (width - cols * gridSpacing) / 2 + gridSpacing / 2;
  const offsetY = (height - rows * gridSpacing) / 2 + gridSpacing / 2;
  return { cols, rows, offsetX, offsetY };
}

// Visits every grid point in row-major order, calling back with its pixel coordinates.
export function forEachGridPoint(
  width: number,
  height: number,
  gridSpacing: number,
  fn: (gx: number, gy: number) => void
): void {
  const { cols, rows, offsetX, offsetY } = computeGrid(width, height, gridSpacing);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      fn(offsetX + col * gridSpacing, offsetY + row * gridSpacing);
    }
  }
}

// Max dot radius as a fraction of grid spacing — the universal "how big can a
// dot get before it overlaps its neighbor" constant, shared by every animation.
export const DOT_MAX_RADIUS_RATIO = 0.23;

// Lava Hearts renders slightly smaller than Lava Dots at the same field value —
// heart silhouettes read as "larger" than circles of the same radius, so the
// max is nudged down to keep visual weight consistent between the two modes.
export const HEART_DOT_MAX_RADIUS_RATIO = 0.22;
