// Platform-agnostic shared types — no canvas or Skia imports.

export type AnimationType =
  | 'dots'
  | 'hearts'
  | 'beating-heart'
  | 'beating-heart-shapes'
  | 'floating-hearts'
  | 'floating-hearts-shapes'
  | 'stampy-halftone'
  | 'stampy-hud'
  | 'stampy-halftone-svg'
  | 'stampy-studio'
  | 'image-edit';

export interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  strength: number;
}

export interface FloatingHeart {
  x: number;
  y: number;
  scale: number;
  vy: number;
  driftAmp: number;
  driftFreq: number;
  driftPhase: number;
  startX: number;
  opacity: number; // 0–1, fades in as heart enters and out as it exits
}
