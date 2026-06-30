import React, { useMemo } from 'react';
import { Canvas, useDrawCallback, Skia } from '@shopify/react-native-skia';
import type { SkCanvas, SkPath, DrawingInfo } from '@shopify/react-native-skia';

import {
  initFloatingHearts, updateFloatingHeart, computeHeartField, floatingHeartCount,
} from '@animations-core/floatingHeartsMath';
import { forEachGridPoint, DOT_MAX_RADIUS_RATIO } from '@animations-core/gridMath';
import { DARK_PALETTE, LIGHT_PALETTE } from './palette';
import { useStableInit, useElapsedSeconds } from './hooks';

interface Props {
  width: number;
  height: number;
  gridSpacing?: number;
  isDark?: boolean;
}

export function FloatingHeartsCanvas({
  width,
  height,
  gridSpacing = 18,
  isDark = true,
}: Props) {
  const hearts = useStableInit(width, height, (w, h) =>
    initFloatingHearts(w, h, floatingHeartCount(w, h))
  );

  const innerPaint = useMemo(() => { const p = Skia.Paint(); p.setAntiAlias(true); return p; }, []);
  const midPaint   = useMemo(() => { const p = Skia.Paint(); p.setAntiAlias(true); return p; }, []);
  const outerPaint = useMemo(() => { const p = Skia.Paint(); p.setAntiAlias(true); return p; }, []);
  const innerPath  = useMemo(() => Skia.Path.Make(), []);
  const midPath    = useMemo(() => Skia.Path.Make(), []);
  const outerPath  = useMemo(() => Skia.Path.Make(), []);

  const getElapsedSeconds = useElapsedSeconds();

  const onDraw = useDrawCallback((canvas: SkCanvas, info: DrawingInfo) => {
    const timeSec = getElapsedSeconds(info);

    for (const h of hearts) {
      updateFloatingHeart(h, width, height, timeSec);
    }

    const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
    innerPaint.setColor(palette.floatingInner);
    midPaint.setColor(palette.floatingMid);
    outerPaint.setColor(palette.floatingOuter);
    canvas.clear(palette.background);

    const minR = 2;
    const maxR = gridSpacing * DOT_MAX_RADIUS_RATIO;

    innerPath.reset();
    midPath.reset();
    outerPath.reset();

    forEachGridPoint(width, height, gridSpacing, (gx, gy) => {
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
    });

    canvas.drawPath(outerPath, outerPaint);
    canvas.drawPath(midPath, midPaint);
    canvas.drawPath(innerPath, innerPaint);
  }, [width, height, gridSpacing, isDark, hearts]);

  return <Canvas style={{ width, height }} onDraw={onDraw} />;
}
