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
import { drawStampyHalftoneFrame } from '@/lib/animations/stampyHalftone';
import { drawStampyHudFrame } from '@/lib/animations/stampyHud';
import { drawStampySvgHalftoneFrame } from '@/lib/animations/stampySvgHalftone';
import { drawStampyStudioFrame } from '@/lib/animations/stampyStudio';
import { drawImageEditPulseFrame } from '@/lib/animations/imageEditPulse';

interface Props {
  animationType: AnimationType;
  width: number;
  height: number;
  gridSpacing?: number;
  isDark: boolean;
  speed?: number;
}

interface AnimState {
  blobs: Blob[];
  floatingHearts: FloatingHeart[];
  // Speed-scaled elapsed time (ms). Accumulated per frame rather than derived
  // from wall clock so changing the speed mid-animation never causes a jump.
  animTime: number;
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
  speed = 1,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<AnimState | null>(null);

  const initState = useCallback(
    (type: AnimationType, w: number, h: number): AnimState => {
      return {
        blobs: type === 'hearts' ? initHeartsBlobs(w, h) : initDotsBlobs(w, h),
        floatingHearts: initFloatingHearts(w, h, floatingHeartCount(w, h)),
        animTime: 0,
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
      stateRef.current = initState(animationType, width, height);
    }

    const state = stateRef.current!;

    // The loop's identity lives in effect-local variables, not on the shared
    // state object. Multiple loops briefly coexisting (Strict Mode, Fast
    // Refresh, rapid prop changes) each keep independent timing, and the
    // `alive` flag guarantees an orphaned loop halts even if its RAF id was
    // lost — a leaked loop would otherwise stomp shared timing fields and
    // effectively freeze the animation clock.
    let alive = true;
    let rafId = 0;
    let lastNow: number | null = null;

    const tick = (now: number) => {
      if (!alive) return;
      // Cap the per-frame delta (e.g. after a backgrounded tab) so animations
      // advance smoothly instead of leaping ahead.
      const delta = lastNow === null ? 0 : Math.min(100, Math.max(0, now - lastNow));
      lastNow = now;
      state.animTime += delta * speed;
      const time = state.animTime;
      const c = isDark ? DARK_PALETTE : LIGHT_PALETTE;

      switch (animationType) {
        case 'dots':
          updateBlobs(state.blobs, width, height, speed);
          drawDotsFrame(ctx, width, height, state.blobs, gridSpacing, c.dots);
          break;

        case 'hearts':
          updateBlobs(state.blobs, width, height, speed);
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
            gridSpacing, c.floatingInner, c.floatingMid, c.floatingOuter, false, speed
          );
          break;

        case 'floating-hearts-shapes':
          drawFloatingHeartsFrame(
            ctx, width, height, state.floatingHearts, time,
            gridSpacing, c.floatingInner, c.floatingMid, c.floatingOuter, true, speed
          );
          break;

        case 'stampy-halftone':
          drawStampyHalftoneFrame(ctx, width, height, time, gridSpacing, c.hearts);
          break;

        case 'stampy-hud':
          drawStampyHudFrame(ctx, width, height, time, isDark);
          break;

        case 'stampy-halftone-svg':
          drawStampySvgHalftoneFrame(ctx, width, height, time, gridSpacing, c.hearts);
          break;

        case 'stampy-studio':
          drawStampyStudioFrame(ctx, width, height, time, isDark);
          break;

        case 'image-edit':
          drawImageEditPulseFrame(ctx, width, height, time, gridSpacing);
          break;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
    };
  }, [animationType, width, height, gridSpacing, isDark, speed, initState]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block' }}
    />
  );
}
