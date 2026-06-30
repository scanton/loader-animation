import { useRef } from 'react';
import type { DrawingInfo } from '@shopify/react-native-skia';

// Lazily creates (and re-creates on resize) some per-canvas state that depends
// on width/height — e.g. blob positions, floating heart spawns. Mutating a ref
// during render is safe here because the assignment is idempotent: re-running
// it on a throwaway render (e.g. React Strict Mode's double-invoke) just
// re-derives the same value from the same width/height inputs.
export function useStableInit<T>(width: number, height: number, factory: (w: number, h: number) => T): T {
  const valueRef = useRef<T | null>(null);
  const dimsRef = useRef<{ w: number; h: number } | null>(null);

  if (valueRef.current === null || dimsRef.current?.w !== width || dimsRef.current?.h !== height) {
    valueRef.current = factory(width, height);
    dimsRef.current = { w: width, h: height };
  }

  return valueRef.current;
}

// Tracks a stable t=0 origin from the first onDraw call and returns elapsed
// seconds since then for the current frame's DrawingInfo.
export function useElapsedSeconds() {
  const startTimeRef = useRef<number | null>(null);

  return (info: DrawingInfo): number => {
    if (startTimeRef.current === null) startTimeRef.current = info.timestamp;
    const origin = startTimeRef.current ?? info.timestamp;
    return (info.timestamp - origin) / 1000;
  };
}
