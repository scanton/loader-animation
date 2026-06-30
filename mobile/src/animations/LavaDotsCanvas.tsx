import React, { useRef } from 'react';
import { Canvas, useDrawCallback, Skia } from '@shopify/react-native-skia';
import type { SkCanvas, DrawingInfo } from '@shopify/react-native-skia';

import { smoothstep } from '@animations-core/heartMath';
import {
  initBlobs, updateBlobs, computeField,
  FIELD_LOW, FIELD_HIGH,
} from '@animations-core/lavaMath';
import type { Blob } from '@animations-core/types';
import { DARK_PALETTE, LIGHT_PALETTE } from './palette';
import { addHeartToPath } from './skiaHeartPath';

// Module-level Skia objects — created once, reused every frame.
const dotPaint = Skia.Paint(); dotPaint.setAntiAlias(true);
const dotPath  = Skia.Path.Make();

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
  const blobsRef = useRef<Blob[] | null>(null);
  const dimsRef = useRef<{ w: number; h: number } | null>(null);
  if (blobsRef.current === null || dimsRef.current?.w !== width || dimsRef.current?.h !== height) {
    blobsRef.current = initBlobs(width, height);
    dimsRef.current = { w: width, h: height };
  }

  const onDraw = useDrawCallback((canvas: SkCanvas, _info: DrawingInfo) => {
    const blobs = blobsRef.current!;
    updateBlobs(blobs, width, height);

    const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
    dotPaint.setColor(useHearts ? palette.hearts : palette.dots);
    canvas.clear(palette.background);

    const minR = useHearts ? 0.8 : 1;
    const maxR = gridSpacing * (useHearts ? 0.22 : 0.23);

    const cols    = Math.floor(width / gridSpacing);
    const rows    = Math.floor(height / gridSpacing);
    const offsetX = (width  - cols * gridSpacing) / 2 + gridSpacing / 2;
    const offsetY = (height - rows * gridSpacing) / 2 + gridSpacing / 2;

    dotPath.reset();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gx = offsetX + col * gridSpacing;
        const gy = offsetY + row * gridSpacing;

        const field = computeField(gx, gy, blobs);
        const t = smoothstep(FIELD_LOW, FIELD_HIGH, field);
        const r = minR + (maxR - minR) * t;

        if (useHearts && r >= 1.5) {
          addHeartToPath(dotPath, gx, gy, r);
        } else {
          dotPath.addCircle(gx, gy, Math.max(0.5, r));
        }
      }
    }

    canvas.drawPath(dotPath, dotPaint);
  }, [width, height, gridSpacing, isDark, useHearts]);

  return <Canvas style={{ width, height }} onDraw={onDraw} />;
}
