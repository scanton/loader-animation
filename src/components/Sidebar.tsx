'use client';

import type { AnimationType } from '@/lib/animations/types';

interface Props {
  selected: AnimationType;
  onSelect: (type: AnimationType) => void;
  width: number;
  height: number;
  onWidthChange: (v: number) => void;
  onHeightChange: (v: number) => void;
  gridSpacing: number;
  onGridSpacingChange: (v: number) => void;
  isDark: boolean;
  onToggleDark: () => void;
}

const ANIMATIONS: { type: AnimationType; label: string; icon: string }[] = [
  { type: 'dots', label: 'Lava Dots', icon: '⬤' },
  { type: 'hearts', label: 'Lava Hearts', icon: '♥' },
  { type: 'beating-heart', label: 'Beating Heart', icon: '💓' },
  { type: 'beating-heart-shapes', label: 'Heart Pulse', icon: '♥' },
  { type: 'floating-hearts', label: 'Floating Hearts', icon: '💕' },
];

export default function Sidebar({
  selected,
  onSelect,
  width,
  height,
  onWidthChange,
  onHeightChange,
  gridSpacing,
  onGridSpacingChange,
  isDark,
  onToggleDark,
}: Props) {
  const sectionLabelClass =
    `text-xs font-semibold uppercase tracking-widest mb-3 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`;

  return (
    <aside className="flex flex-col gap-6 w-56 shrink-0">
      {/* Light / Dark toggle */}
      <button
        onClick={onToggleDark}
        aria-pressed={isDark}
        className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
          isDark
            ? 'bg-zinc-800/60 text-zinc-300 border-zinc-700/50 hover:bg-zinc-700/60'
            : 'bg-zinc-200/70 text-zinc-700 border-zinc-300/60 hover:bg-zinc-300/70'
        }`}
      >
        <span>{isDark ? '🌙 Dark mode' : '☀️ Light mode'}</span>
        <span className="text-xs opacity-60">{isDark ? 'switch to light' : 'switch to dark'}</span>
      </button>

      {/* Animation type selector */}
      <div>
        <p className={sectionLabelClass}>Animation</p>
        <div className="flex flex-col gap-2">
          {ANIMATIONS.map(({ type, label: animLabel, icon }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              aria-current={selected === type}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                selected === type
                  ? isDark
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-rose-100 text-rose-700 border border-rose-400/50'
                  : isDark
                    ? 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/60 hover:text-zinc-200'
                    : 'bg-zinc-200/60 text-zinc-600 border border-zinc-300/50 hover:bg-zinc-300/60 hover:text-zinc-800'
              }`}
            >
              <span className="text-base">{icon}</span>
              {animLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Size controls */}
      <div>
        <p className={sectionLabelClass}>Canvas Size</p>
        <div className="flex flex-col gap-4">
          <SliderControl
            label="Width"
            value={width}
            min={200}
            max={900}
            step={20}
            onChange={onWidthChange}
            unit="px"
            isDark={isDark}
          />
          <SliderControl
            label="Height"
            value={height}
            min={150}
            max={700}
            step={20}
            onChange={onHeightChange}
            unit="px"
            isDark={isDark}
          />
        </div>
      </div>

      {/* Grid spacing */}
      <div>
        <p className={sectionLabelClass}>Grid Density</p>
        <SliderControl
          label="Spacing"
          value={gridSpacing}
          min={12}
          max={40}
          step={2}
          onChange={onGridSpacingChange}
          unit="px"
          isDark={isDark}
        />
      </div>
    </aside>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
  isDark,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
  isDark: boolean;
}) {
  const inputId = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <label htmlFor={inputId} className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {label}
        </label>
        <span className={`text-xs font-mono ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
          {value}{unit}
        </span>
      </div>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-rose-500"
      />
    </div>
  );
}
