// Platform-agnostic lava blob (metaball) math — no canvas or Skia imports.

import type { Blob } from './types';

export const NUM_BLOBS = 3;
export const SPEED = 0.4;

// Strength must be large enough that influence spans ~150-200px radius.
// At dist=100px (distSq=10000): strength/(1+10000) should be ~2000 (near smoothstep max).
// So strength ≈ 2000 * 10001 ≈ 20_000_000.
export const BLOB_STRENGTH_MIN = 16_000_000;
export const BLOB_STRENGTH_MAX = 28_000_000;

// Smoothstep thresholds (raw field units):
// At 100px from blob: field ≈ 20M/10001 ≈ 2000 → near max dot
// At 200px from blob: field ≈ 20M/40001 ≈ 500  → near min dot
export const FIELD_LOW = 350;
export const FIELD_HIGH = 2500;

export function initBlobs(width: number, height: number): Blob[] {
  const blobs: Blob[] = [];
  for (let i = 0; i < NUM_BLOBS; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = SPEED + Math.random() * SPEED;
    blobs.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      strength: BLOB_STRENGTH_MIN + Math.random() * (BLOB_STRENGTH_MAX - BLOB_STRENGTH_MIN),
    });
  }
  return blobs;
}

export function updateBlobs(blobs: Blob[], width: number, height: number): void {
  for (const blob of blobs) {
    blob.x += blob.vx;
    blob.y += blob.vy;
    if (blob.x < 0 || blob.x > width) blob.vx *= -1;
    if (blob.y < 0 || blob.y > height) blob.vy *= -1;
    blob.x = Math.max(0, Math.min(width, blob.x));
    blob.y = Math.max(0, Math.min(height, blob.y));
  }
}

export function computeField(gx: number, gy: number, blobs: Blob[]): number {
  let field = 0;
  for (const blob of blobs) {
    const dx = gx - blob.x;
    const dy = gy - blob.y;
    field += blob.strength / (1 + dx * dx + dy * dy);
  }
  return field;
}
