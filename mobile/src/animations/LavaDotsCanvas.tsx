import React, { useMemo } from 'react';
import { Canvas, useDrawCallback, Skia } from '@shopify/react-native-skia';
import type { SkCanvas, DrawingInfo } from '@shopify/react-native-skia';

import { smoothstep } from '@animations-core/heartMath';
import {
  initBlobs, updateBlobs, computeField,
  FIELD_LOW, FIELD_HIGH,
} from '@animations-core/lavaMath';
import { forEachGridPoint, DOT_MAX_RADIUS_RATIO, HEART_DOT_MAX_RADIUS_RATIO } from '@animations-core/gridMath';
import { DARK_PALETTE, LIGHT_PALETTE } from './palette';
import { addHeartToPath } from './skiaHeartPath';
import { useStableInit } from './hooks';

interface Props {
  width: number;
  height: number;
  gridSpacing?: number;
  isDark?: boolean;
  useHearts?: boolean;
}

// Powers both "Lava Dots" and "Lava Hearts" — same metaball field, two render modes.
export function LavaDotsCanvas({
  width,
  height,
  gridSpacing = 18,
  isDark = true,
  useHearts = false,
}: Props) {
  const blobs = useStableInit(width, height, initBlobs);

  const dotPaint = useMemo(() => { const p = Skia.Paint(); p.setAntiAlias(true); return p; }, []);
  const dotPath  = useMemo(() => Skia.Path.Make(), []);

  const onDraw = useDrawCallback((canvas: SkCanvas, _info: DrawingInfo) => {
    updateBlobs(blobs, width, height);

    const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
    dotPaint.setColor(useHearts ? palette.hearts : palette.dots);
    canvas.clear(palette.background);

    const minR = useHearts ? 0.8 : 1;
    const maxR = gridSpacing * (useHearts ? HEART_DOT_MAX_RADIUS_RATIO : DOT_MAX_RADIUS_RATIO);

    dotPath.reset();

    forEachGridPoint(width, height, gridSpacing, (gx, gy) => {
      const field = computeField(gx, gy, blobs);
      const t = smoothstep(FIELD_LOW, FIELD_HIGH, field);
      const r = minR + (maxR - minR) * t;

      if (useHearts && r >= 1.5) {
        addHeartToPath(dotPath, gx, gy, r);
      } else {
        dotPath.addCircle(gx, gy, Math.max(0.5, r));
      }
    });

    canvas.drawPath(dotPath, dotPaint);
  }, [width, height, gridSpacing, isDark, useHearts, blobs]);

  return <Canvas style={{ width, height }} onDraw={onDraw} />;
}
