import React, { useRef } from 'react';
import { Canvas, useDrawCallback, Skia } from '@shopify/react-native-skia';
import type { SkCanvas, SkPath, DrawingInfo } from '@shopify/react-native-skia';

import {
  initFloatingHearts, updateFloatingHeart, computeHeartField,
} from '@animations-core/floatingHeartsMath';
import type { FloatingHeart } from '@animations-core/types';
import { DARK_PALETTE, LIGHT_PALETTE } from './palette';

// Module-level Skia objects — created once, reused every frame.
const innerPaint = Skia.Paint(); innerPaint.setAntiAlias(true);
const midPaint   = Skia.Paint(); midPaint.setAntiAlias(true);
const outerPaint = Skia.Paint(); outerPaint.setAntiAlias(true);

const innerPath = Skia.Path.Make();
const midPath   = Skia.Path.Make();
const outerPath = Skia.Path.Make();

interface Props {
  width: number;
  height: number;
  gridSpacing?: number;
  isDark?: boolean;
}

function heartCount(w: number, h: number): number {
  return Math.min(10, Math.max(6, Math.floor((w * h) / 55000)));
}

export function FloatingHeartsCanvas({
  width,
  height,
  gridSpacing = 18,
  isDark = true,
}: Props) {
  const heartsRef = useRef<FloatingHeart[] | null>(null);
  const dimsRef = useRef<{ w: number; h: number } | null>(null);
  if (heartsRef.current === null || dimsRef.current?.w !== width || dimsRef.current?.h !== height) {
    heartsRef.current = initFloatingHearts(width, height, heartCount(width, height));
    dimsRef.current = { w: width, h: height };
  }
  const startTimeRef = useRef<number | null>(null);

  const onDraw = useDrawCallback((canvas: SkCanvas, info: DrawingInfo) => {
    if (startTimeRef.current === null) startTimeRef.current = info.timestamp;
    const origin = startTimeRef.current ?? info.timestamp;
    const timeSec = (info.timestamp - origin) / 1000;

    const hearts = heartsRef.current!;
    for (const h of hearts) {
      updateFloatingHeart(h, width, height, timeSec);
    }

    const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
    innerPaint.setColor(palette.floatingInner);
    midPaint.setColor(palette.floatingMid);
    outerPaint.setColor(palette.floatingOuter);
    canvas.clear(palette.background);

    const minR = 2;
    const maxR = gridSpacing * 0.23;

    const cols    = Math.floor(width / gridSpacing);
    const rows    = Math.floor(height / gridSpacing);
    const offsetX = (width  - cols * gridSpacing) / 2 + gridSpacing / 2;
    const offsetY = (height - rows * gridSpacing) / 2 + gridSpacing / 2;

    innerPath.reset();
    midPath.reset();
    outerPath.reset();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gx = offsetX + col * gridSpacing;
        const gy = offsetY + row * gridSpacing;

        const field = computeHeartField(gx, gy, hearts);
        const r = minR + (maxR - minR) * field;

        let target: SkPath;
        if (field > 0.7) {
          target = innerPath;
        } else if (field > 0.15) {
          const mix = (field - 0.15) / 0.55;
          target = mix > 0.5 ? innerPath : midPath;
        } else {
          target = outerPath;
        }

        target.addCircle(gx, gy, Math.max(0.5, r));
      }
    }

    canvas.drawPath(outerPath, outerPaint);
    canvas.drawPath(midPath, midPaint);
    canvas.drawPath(innerPath, innerPaint);
  }, [width, height, gridSpacing, isDark]);

  return <Canvas style={{ width, height }} onDraw={onDraw} />;
}
