import { drawHeart } from './heartPath';
import { drawStampySource } from './stampyImage';

// "Stampy OS" — a Jarvis-style AI interface in HeartStamp red. Stampy sits in
// an arc-reactor core surrounded by rotating rings, a radar sweep, orbiting
// hearts, an ECG heartbeat trace, and ambient data readouts.

interface HudTheme {
  bg: string;
  gridLine: string;
  line: string;       // primary ring/line color
  lineSoft: string;   // dimmer structural lines
  accent: string;     // bright highlights (sweep leading edge, ECG spike)
  glow: string;       // radial glow behind Stampy (center stop)
  text: string;
}

const DARK_THEME: HudTheme = {
  bg: '#0c0508',
  gridLine: 'rgba(244, 63, 94, 0.06)',
  line: 'rgba(244, 63, 94, 0.85)',
  lineSoft: 'rgba(244, 63, 94, 0.3)',
  accent: '#ff8fa3',
  glow: 'rgba(233, 41, 63, 0.35)',
  text: 'rgba(255, 143, 163, 0.75)',
};

const LIGHT_THEME: HudTheme = {
  bg: '#fdf3f5',
  gridLine: 'rgba(190, 18, 60, 0.07)',
  line: 'rgba(190, 18, 60, 0.85)',
  lineSoft: 'rgba(190, 18, 60, 0.35)',
  accent: '#be123c',
  glow: 'rgba(233, 41, 63, 0.22)',
  text: 'rgba(159, 18, 57, 0.8)',
};

// Deterministic pseudo-random so readouts flicker without Math.random().
function prand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// One heartbeat of an ECG trace, u in [0,1) → -1..1 (R spike at ~0.3).
function ecgPulse(u: number): number {
  if (u < 0.15) return 0;
  if (u < 0.2) return Math.sin(((u - 0.15) / 0.05) * Math.PI) * 0.15;   // P
  if (u < 0.24) return 0;
  if (u < 0.27) return -((u - 0.24) / 0.03) * 0.3;                       // Q
  if (u < 0.31) return -0.3 + ((u - 0.27) / 0.04) * 1.3;                 // R
  if (u < 0.35) return 1.0 - ((u - 0.31) / 0.04) * 1.35;                 // S
  if (u < 0.4) return -0.35 + ((u - 0.35) / 0.05) * 0.35;
  if (u < 0.55) return 0;
  if (u < 0.65) return Math.sin(((u - 0.55) / 0.1) * Math.PI) * 0.25;    // T
  return 0;
}

export function drawStampyHudFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  isDark: boolean
): void {
  const t = time / 1000;
  const theme = isDark ? DARK_THEME : LIGHT_THEME;
  const cx = width / 2;
  const cy = height / 2;
  const unit = Math.min(width, height);

  // --- Background + blueprint grid ---
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = theme.gridLine;
  ctx.lineWidth = 1;
  const gridStep = 40;
  ctx.beginPath();
  for (let x = gridStep / 2; x < width; x += gridStep) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
  for (let y = gridStep / 2; y < height; y += gridStep) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
  ctx.stroke();

  // --- Core glow, pulsing with the heartbeat ---
  const beatU = (t * 1.1) % 1;
  const beat = Math.max(0, ecgPulse(beatU));
  const glowR = unit * (0.26 + beat * 0.03);
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
  glow.addColorStop(0, theme.glow);
  glow.addColorStop(1, 'rgba(233, 41, 63, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);

  const coreR = unit * 0.19;

  // --- Radar sweep inside the outer ring ---
  const sweepR = unit * 0.335;
  const sweepAngle = t * 0.9;
  if (typeof ctx.createConicGradient === 'function') {
    const conic = ctx.createConicGradient(sweepAngle, cx, cy);
    conic.addColorStop(0, isDark ? 'rgba(244, 63, 94, 0.28)' : 'rgba(190, 18, 60, 0.2)');
    conic.addColorStop(0.12, 'rgba(244, 63, 94, 0)');
    conic.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, sweepR, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = conic;
    ctx.fillRect(cx - sweepR, cy - sweepR, sweepR * 2, sweepR * 2);
    ctx.restore();
  }

  // --- Ring 1: rotating arc segments just outside the core ---
  const r1 = coreR * 1.32;
  ctx.lineWidth = 3;
  ctx.strokeStyle = theme.line;
  for (let i = 0; i < 3; i++) {
    const start = t * 0.7 + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r1, start, start + Math.PI / 3.2);
    ctx.stroke();
  }

  // --- Ring 2: dashed, counter-rotating ---
  const r2 = coreR * 1.52;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-t * 0.4);
  ctx.setLineDash([6, 10]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = theme.lineSoft;
  ctx.beginPath();
  ctx.arc(0, 0, r2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // --- Ring 3: tick gauge with a chasing highlight ---
  const r3 = unit * 0.335;
  const TICKS = 72;
  for (let i = 0; i < TICKS; i++) {
    const angle = (i / TICKS) * Math.PI * 2;
    const isMajor = i % 6 === 0;
    const chase = (i / TICKS + t * 0.25) % 1;
    const bright = chase < 0.15;
    const inner = r3 - (isMajor ? 9 : 5);
    ctx.strokeStyle = bright ? theme.line : theme.lineSoft;
    ctx.lineWidth = isMajor ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * r3, cy + Math.sin(angle) * r3);
    ctx.stroke();
  }
  ctx.strokeStyle = theme.lineSoft;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r3, 0, Math.PI * 2);
  ctx.stroke();

  // --- Orbiting hearts between ring 2 and the tick gauge ---
  const orbitR = (r2 + r3) / 2;
  ctx.fillStyle = theme.line;
  for (let i = 0; i < 3; i++) {
    const angle = t * 0.5 + (i * Math.PI * 2) / 3;
    const hx = cx + Math.cos(angle) * orbitR;
    const hy = cy + Math.sin(angle) * orbitR;
    drawHeart(ctx, hx, hy, 6);
    ctx.fill();
  }

  // --- Stampy in the core, breathing, nudged by the heartbeat ---
  const breath = 1 + Math.sin(t * 0.55 * Math.PI * 2) * 0.025 + beat * 0.04;
  drawStampySource(ctx, cx, cy, coreR * 2 * breath);

  // --- ECG heartbeat trace along the bottom ---
  const ecgY = height - unit * 0.09;
  const ecgAmp = unit * 0.045;
  const ecgPeriodPx = 220;
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const u = (((x + t * 130) % ecgPeriodPx) + ecgPeriodPx) % ecgPeriodPx / ecgPeriodPx;
    const y = ecgY - ecgPulse(u) * ecgAmp;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // --- Left: equalizer bars ---
  const barBaseY = cy + unit * 0.12;
  ctx.fillStyle = theme.lineSoft;
  for (let i = 0; i < 7; i++) {
    const level = 0.25 + 0.75 * Math.abs(Math.sin(t * (1.3 + i * 0.31) + i * 1.7));
    const barH = unit * 0.09 * level;
    ctx.fillRect(18 + i * 10, barBaseY - barH, 6, barH);
  }

  // --- Right: flickering hex readout ---
  ctx.font = '10px monospace';
  ctx.fillStyle = theme.text;
  const lines = 8;
  for (let i = 0; i < lines; i++) {
    const seed = i * 13 + Math.floor(t * 3);
    let hex = '';
    for (let j = 0; j < 6; j++) {
      hex += Math.floor(prand(seed + j * 7) * 16).toString(16).toUpperCase();
    }
    ctx.fillText(`0x${hex}`, width - 78, cy - unit * 0.1 + i * 14);
  }

  // --- Header / footer labels ---
  ctx.font = '11px monospace';
  ctx.fillStyle = theme.text;
  ctx.fillText('STAMPY OS v1.0', 18, 26);
  const dots = '.'.repeat(1 + (Math.floor(t * 2) % 3));
  ctx.fillText(`ANALYZING${dots}`, 18, 42);
  const bpm = 72 + Math.round(Math.sin(t * 0.7) * 4);
  ctx.fillText(`❤ ${bpm} BPM`, width - 78, height - 20);

  // --- Corner brackets ---
  const m = 10;
  const len = 22;
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 2;
  const corners: Array<[number, number, number, number]> = [
    [m, m, 1, 1], [width - m, m, -1, 1], [m, height - m, 1, -1], [width - m, height - m, -1, -1],
  ];
  for (const [x, y, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + len * sx, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + len * sy);
    ctx.stroke();
  }
}
