import React, { useMemo } from 'react';
import { Canvas, useDrawCallback, Skia } from '@shopify/react-native-skia';
import type { SkCanvas, SkPath, DrawingInfo } from '@shopify/react-native-skia';

import { heartSDF, smoothstep } from '@animations-core/heartMath';
import { forEachGridPoint, DOT_MAX_RADIUS_RATIO } from '@animations-core/gridMath';
import {
  BEAT_RATE, HEART_SCALE_FACTOR, BEAT_AMPLITUDE,
  EDGE_OUTER, EDGE_INNER,
  beatPulse, rippleBoostAt,
} from '@animations-core/beatingHeartMath';
import { DARK_PALETTE, LIGHT_PALETTE } from './palette';
import { addHeartToPath } from './skiaHeartPath';
import { useElapsedSeconds } from './hooks';

interface Props {
  width: number;
  height: number;
  gridSpacing?: number;
  isDark?: boolean;
  useHearts?: boolean;
}

export function BeatingHeartCanvas({
  width,
  height,
  gridSpacing = 18,
  isDark = true,
  useHearts = false,
}: Props) {
  // Paint/path objects are per-instance (not module-level) so multiple
  // BeatingHeartCanvas instances can render simultaneously without one
  // instance's frame corrupting another's in-flight path.
  const innerPaint  = useMemo(() => { const p = Skia.Paint(); p.setAntiAlias(true); return p; }, []);
  const ripplePaint = useMemo(() => { const p = Skia.Paint(); p.setAntiAlias(true); return p; }, []);
  const outerPaint  = useMemo(() => { const p = Skia.Paint(); p.setAntiAlias(true); return p; }, []);
  const innerPath   = useMemo(() => Skia.Path.Make(), []);
  const ripplePath  = useMemo(() => Skia.Path.Make(), []);
  const outerPath   = useMemo(() => Skia.Path.Make(), []);

  const getElapsedSeconds = useElapsedSeconds();

  const onDraw = useDrawCallback((canvas: SkCanvas, info: DrawingInfo) => {
    const timeSec = getElapsedSeconds(info);
    const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;

    innerPaint.setColor(palette.beatingInner);
    ripplePaint.setColor(palette.beatingRipple);
    outerPaint.setColor(palette.beatingOuter);
    canvas.clear(palette.background);

    // --- Heartbeat state ---
    const beatPeriodSec = 1 / BEAT_RATE;
    const pulse     = beatPulse((timeSec * BEAT_RATE) % 1);
    const beatScale = 1 + pulse * BEAT_AMPLITUDE;

    const cx = width / 2;
    const cy = height / 2;
    const baseHeartScale = Math.min(width, height) * HEART_SCALE_FACTOR;
    const heartScale     = baseHeartScale * beatScale;

    const maxR     = gridSpacing * DOT_MAX_RADIUS_RATIO;
    const minR     = 1.5;
    const innerMin = gridSpacing * 0.165;

    innerPath.reset();
    ripplePath.reset();
    outerPath.reset();

    forEachGridPoint(width, height, gridSpacing, (gx, gy) => {
      // sdfHeart  — pulsing scale → heart interior shape
      // sdfRipple — fixed scale   → ripple rings never contract
      const sdfHeart  = heartSDF(gx, gy, cx, cy, heartScale);
      const sdfRipple = heartSDF(gx, gy, cx, cy, baseHeartScale);
      const inside    = smoothstep(EDGE_OUTER, EDGE_INNER, sdfHeart);

      const rippleBoost   = rippleBoostAt(sdfRipple, timeSec, beatPeriodSec);
      const rippleContrib = rippleBoost * Math.max(0, 1 - inside * 3);

      const rBase = inside > 0.5
        ? innerMin + (maxR - innerMin) * inside * (0.85 + pulse * 0.15)
        : minR + Math.max(0, innerMin - minR) * (inside * 2);
      const r = Math.min(maxR, rBase + rippleContrib * maxR);

      let target: SkPath;
      if (inside > 0.35) {
        target = innerPath;
      } else if (rippleBoost > 0.25) {
        target = rippleBoost > 0.6 ? innerPath : ripplePath;
      } else {
        target = outerPath;
      }

      if (useHearts && r >= 2) {
        addHeartToPath(target, gx, gy, r);
      } else {
        target.addCircle(gx, gy, Math.max(0.5, r));
      }
    });

    // --- 3 draw calls for ~1000 dots ---
    canvas.drawPath(outerPath,  outerPaint);
    canvas.drawPath(ripplePath, ripplePaint);
    canvas.drawPath(innerPath,  innerPaint);
  }, [width, height, gridSpacing, isDark, useHearts]);

  return <Canvas style={{ width, height }} onDraw={onDraw} />;
}
