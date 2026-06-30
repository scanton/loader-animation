import React, { useRef } from 'react';
import { Canvas, useDrawCallback, Skia } from '@shopify/react-native-skia';
import type { SkCanvas, SkPath, DrawingInfo } from '@shopify/react-native-skia';

import { heartSDF, smoothstep } from '@animations-core/heartMath';
import {
  BEAT_RATE, HEART_SCALE_FACTOR, BEAT_AMPLITUDE,
  EDGE_OUTER, EDGE_INNER,
  beatPulse, rippleBoostAt,
} from '@animations-core/beatingHeartMath';
import { DARK_PALETTE, LIGHT_PALETTE } from './palette';
import { addHeartToPath } from './skiaHeartPath';

// ---------------------------------------------------------------------------
// Module-level Skia objects — created once, reused every frame.
// If you render multiple BeatingHeartCanvas instances simultaneously, move
// these into useRef() inside the component instead.
// ---------------------------------------------------------------------------
const innerPaint  = Skia.Paint(); innerPaint.setAntiAlias(true);
const ripplePaint = Skia.Paint(); ripplePaint.setAntiAlias(true);
const outerPaint  = Skia.Paint(); outerPaint.setAntiAlias(true);

// Pre-allocated paths — reset() each frame avoids GC pressure from ~60 allocations/sec.
const innerPath  = Skia.Path.Make();
const ripplePath = Skia.Path.Make();
const outerPath  = Skia.Path.Make();

// ---------------------------------------------------------------------------

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
  const startTimeRef = useRef<number | null>(null);

  const onDraw = useDrawCallback((canvas: SkCanvas, info: DrawingInfo) => {
    if (startTimeRef.current === null) startTimeRef.current = info.timestamp;
    const origin = startTimeRef.current ?? info.timestamp;
    const timeSec = (info.timestamp - origin) / 1000;

    const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;

    // Update paint colors for this frame's theme.
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

    const maxR     = gridSpacing * 0.23;
    const minR     = 1.5;
    const innerMin = gridSpacing * 0.165;

    const cols    = Math.floor(width / gridSpacing);
    const rows    = Math.floor(height / gridSpacing);
    const offsetX = (width  - cols * gridSpacing) / 2 + gridSpacing / 2;
    const offsetY = (height - rows * gridSpacing) / 2 + gridSpacing / 2;

    // --- Reset batched paths ---
    innerPath.reset();
    ripplePath.reset();
    outerPath.reset();

    // --- Build batched paths over the grid ---
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gx = offsetX + col * gridSpacing;
        const gy = offsetY + row * gridSpacing;

        // Two SDF evaluations per point (same logic as web):
        // sdfHeart  — pulsing scale → heart interior shape
        // sdfRipple — fixed scale   → ripple rings never contract
        const sdfHeart  = heartSDF(gx, gy, cx, cy, heartScale);
        const sdfRipple = heartSDF(gx, gy, cx, cy, baseHeartScale);
        const inside    = smoothstep(EDGE_OUTER, EDGE_INNER, sdfHeart);

        const rippleBoost   = rippleBoostAt(sdfRipple, timeSec, beatPeriodSec);
        const rippleContrib = rippleBoost * Math.max(0, 1 - inside * 3);

        const r_base = inside > 0.5
          ? innerMin + (maxR - innerMin) * inside * (0.85 + pulse * 0.15)
          : minR + Math.max(0, innerMin - minR) * (inside * 2);
        const r = Math.min(maxR, r_base + rippleContrib * gridSpacing * 0.23);

        // Route this dot into the right color bucket.
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
      }
    }

    // --- 3 draw calls for ~1000 dots ---
    canvas.drawPath(outerPath,  outerPaint);
    canvas.drawPath(ripplePath, ripplePaint);
    canvas.drawPath(innerPath,  innerPaint);
  }, [width, height, gridSpacing, isDark, useHearts]);

  return <Canvas style={{ width, height }} onDraw={onDraw} />;
}
