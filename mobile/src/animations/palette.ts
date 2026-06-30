import { Skia } from '@shopify/react-native-skia';
import type { SkColor } from '@shopify/react-native-skia';

export interface Palette {
  background:    SkColor;
  dots:          SkColor;
  hearts:        SkColor;
  beatingInner:  SkColor;
  beatingOuter:  SkColor;
  beatingRipple: SkColor;
  floatingInner: SkColor;
  floatingMid:   SkColor;
  floatingOuter: SkColor;
}

// Colors are pre-parsed once at module load — Skia.Color() is not free.
export const DARK_PALETTE: Palette = {
  background:    Skia.Color('#18181b'), // zinc-900
  dots:          Skia.Color('#8a94a0'),
  hearts:        Skia.Color('#e879a0'),
  beatingInner:  Skia.Color('#f43f5e'),
  beatingOuter:  Skia.Color('#5a2535'),
  beatingRipple: Skia.Color('#c04468'),
  floatingInner: Skia.Color('#e879a0'),
  floatingMid:   Skia.Color('#9b3d65'),
  floatingOuter: Skia.Color('#4a2030'),
};

export const LIGHT_PALETTE: Palette = {
  background:    Skia.Color('#ffffff'),
  dots:          Skia.Color('#64748b'),
  hearts:        Skia.Color('#e11d48'),
  beatingInner:  Skia.Color('#f43f5e'),
  beatingOuter:  Skia.Color('#d1d5db'),
  beatingRipple: Skia.Color('#fda4af'),
  floatingInner: Skia.Color('#f43f5e'),
  floatingMid:   Skia.Color('#fda4af'),
  floatingOuter: Skia.Color('#e5e7eb'),
};
