// Single source of truth for animation colors — both web (canvas, plain hex
// strings) and mobile (Skia, wraps these with Skia.Color()) read from here so
// a color tweak only needs to happen in one place.

export interface AnimationPalette {
  background:    string;
  dots:          string;
  hearts:        string;
  beatingInner:  string;
  beatingOuter:  string;
  beatingRipple: string;
  floatingInner: string;
  floatingMid:   string;
  floatingOuter: string;
}

export const DARK_PALETTE: AnimationPalette = {
  background:    '#18181b', // zinc-900
  dots:          '#8a94a0',
  hearts:        '#e879a0',
  beatingInner:  '#f43f5e',
  beatingOuter:  '#5a2535',
  beatingRipple: '#c04468',
  floatingInner: '#e879a0',
  floatingMid:   '#9b3d65',
  floatingOuter: '#4a2030',
};

export const LIGHT_PALETTE: AnimationPalette = {
  background:    '#ffffff',
  dots:          '#64748b',
  hearts:        '#e11d48',
  beatingInner:  '#f43f5e',
  beatingOuter:  '#d1d5db',
  beatingRipple: '#fda4af',
  floatingInner: '#f43f5e',
  floatingMid:   '#fda4af',
  floatingOuter: '#e5e7eb',
};
