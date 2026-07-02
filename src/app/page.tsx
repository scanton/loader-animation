'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { AnimationType } from '@/lib/animations/types';
import Sidebar from '@/components/Sidebar';

const AnimationCanvas = dynamic(
  () => import('@/components/canvas/AnimationCanvas'),
  { ssr: false }
);

const SUBTITLES: Record<AnimationType, string> = {
  'beating-heart-shapes': 'Pouring some love into this — almost there.',
  dots: 'Generating a more detailed image — hang tight.',
  hearts: 'Crafting something beautiful for you…',
  'beating-heart': 'Pouring some love into this — almost there.',
  'floating-hearts': 'HeartStamp is thinking of you 💕',
  'floating-hearts-shapes': 'HeartStamp is thinking of you 💕',
  'stampy-halftone': 'Putting the pieces together…',
  'stampy-hud': 'Heart OS is online — analyzing with love.',
  'stampy-halftone-svg': 'Stampy is coming together, dot by dot…',
  'stampy-studio': 'Stampy is painting something for you…',
};

export default function Home() {
  const [animationType, setAnimationType] = useState<AnimationType>('hearts');
  const [width, setWidth] = useState(740);
  const [height, setHeight] = useState(600);
  const [gridSpacing, setGridSpacing] = useState(18);
  const [speed, setSpeed] = useState(1);
  const [isDark, setIsDark] = useState(true);

  // Keep <body>'s background in sync with the theme so overscroll/edge
  // areas outside <main> don't flash the wrong color.
  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  return (
    <main className={`min-h-screen flex p-8 transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-zinc-100'}`}>
      <div className="flex gap-8 items-start">
        <Sidebar
          selected={animationType}
          onSelect={setAnimationType}
          width={width}
          height={height}
          onWidthChange={setWidth}
          onHeightChange={setHeight}
          gridSpacing={gridSpacing}
          onGridSpacingChange={setGridSpacing}
          speed={speed}
          onSpeedChange={setSpeed}
          isDark={isDark}
          onToggleDark={() => setIsDark(d => !d)}
        />

        <div className="flex flex-col gap-4">
          <div>
            <ThinkingText isDark={isDark} />
            <p className={`text-lg mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {SUBTITLES[animationType]}
            </p>
          </div>

          <div
            className={`rounded-2xl overflow-hidden transition-colors duration-300 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}
            style={{ width, height }}
          >
            <AnimationCanvas
              animationType={animationType}
              width={width}
              height={height}
              gridSpacing={gridSpacing}
              speed={speed}
              isDark={isDark}
            />
          </div>

          <p className={`text-xs text-right tracking-widest uppercase ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
            HeartStamp Loading Animations
          </p>
        </div>
      </div>
    </main>
  );
}

function ThinkingText({ isDark }: { isDark: boolean }) {
  return (
    <h1 className={`text-2xl font-light tracking-wide flex items-baseline ${isDark ? 'text-white' : 'text-zinc-900'}`}>
      <span>Thinking</span>
      <span className={`animate-[blink_1s_step-end_infinite] ml-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-400'}`}>_</span>
    </h1>
  );
}
