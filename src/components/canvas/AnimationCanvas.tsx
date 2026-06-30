'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { AnimationType, Blob } from '@/lib/animations/types';
import { initBlobs as initDotsBlobs, updateBlobs, drawDotsFrame } from '@/lib/animations/lavaDots';
import { initBlobs as initHeartsBlobs, drawHeartsFrame } from '@/lib/animations/lavaHearts';
import { drawBeatingHeartFrame } from '@/lib/animations/beatingHeart';
import {
  initFloatingHearts,
  drawFloatingHeartsFrame,
  type FloatingHeart,
} from '@/lib/animations/floatingHearts';
import { floatingHeartCount } from '@/lib/animations/core/floatingHeartsMath';
import { DARK_PALETTE, LIGHT_PALETTE } from '@/lib/animations/core/palette';

interface Props {
  animationType: AnimationType;
  width: number;
  height: number;
  gridSpacing?: number;
  isDark: boolean;
}

interface AnimState {
  blobs: Blob[];
  floatingHearts: FloatingHeart[];
  rafId: number;
  startTime: number;
  lastType: AnimationType;
  lastWidth: number;
  lastHeight: number;
}

export default function AnimationCanvas({
  animationType,
  width,
  height,
  gridSpacing = 18,
  isDark,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<AnimState | null>(null);

  const initState = useCallback(
    (type: AnimationType, w: number, h: number): AnimState => {
      return {
        blobs: type === 'hearts' ? initHeartsBlobs(w, h) : initDotsBlobs(w, h),
        floatingHearts: initFloatingHearts(w, h, floatingHeartCount(w, h)),
        rafId: 0,
        startTime: performance.now(),
        lastType: type,
        lastWidth: w,
        lastHeight: h,
      };
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prev = stateRef.current;
    const needsReinit =
      !prev ||
      prev.lastType !== animationType ||
      prev.lastWidth !== width ||
      prev.lastHeight !== height;

    if (needsReinit) {
      if (prev?.rafId) cancelAnimationFrame(prev.rafId);
      stateRef.current = initState(animationType, width, height);
    }

    const state = stateRef.current!;

    const tick = (now: number) => {
      const time = now - state.startTime;
      const c = isDark ? DARK_PALETTE : LIGHT_PALETTE;

      switch (animationType) {
        case 'dots':
          updateBlobs(state.blobs, width, height);
          drawDotsFrame(ctx, width, height, state.blobs, gridSpacing, c.dots);
          break;

        case 'hearts':
          updateBlobs(state.blobs, width, height);
          drawHeartsFrame(ctx, width, height, state.blobs, gridSpacing, c.hearts);
          break;

        case 'beating-heart':
          drawBeatingHeartFrame(
            ctx, width, height, time, gridSpacing,
            c.beatingInner, c.beatingOuter, c.beatingRipple, false
          );
          break;

        case 'beating-heart-shapes':
          drawBeatingHeartFrame(
            ctx, width, height, time, gridSpacing,
            c.beatingInner, c.beatingOuter, c.beatingRipple, true
          );
          break;

        case 'floating-hearts':
          drawFloatingHeartsFrame(
            ctx, width, height, state.floatingHearts, time,
            gridSpacing, c.floatingInner, c.floatingMid, c.floatingOuter
          );
          break;
      }

      state.rafId = requestAnimationFrame(tick);
    };

    state.rafId = requestAnimationFrame(tick);

    return () => {
      if (state.rafId) cancelAnimationFrame(state.rafId);
    };
  }, [animationType, width, height, gridSpacing, isDark, initState]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block' }}
    />
  );
}
