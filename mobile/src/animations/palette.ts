import { Skia } from '@shopify/react-native-skia';
import type { SkColor } from '@shopify/react-native-skia';
import { DARK_PALETTE as DARK_HEX, LIGHT_PALETTE as LIGHT_HEX } from '@animations-core/palette';
import type { AnimationPalette } from '@animations-core/palette';

export type SkiaPalette = Record<keyof AnimationPalette, SkColor>;

// Wraps the shared hex-string palette with Skia.Color() once at module load —
// Skia.Color() is not free per-call, and the source-of-truth colors live in
// core/palette.ts so web and mobile never drift.
function toSkiaPalette(hex: AnimationPalette): SkiaPalette {
  return Object.fromEntries(
    Object.entries(hex).map(([key, value]) => [key, Skia.Color(value)])
  ) as SkiaPalette;
}

export const DARK_PALETTE: SkiaPalette = toSkiaPalette(DARK_HEX);
export const LIGHT_PALETTE: SkiaPalette = toSkiaPalette(LIGHT_HEX);
