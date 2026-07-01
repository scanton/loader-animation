import { drawHeart } from './heartPath';
import { drawImageAsset } from './stampyImage';

// "Stampy OS v2" — Stampy's art studio. The hologram Stampy (Stampy_Black.svg,
// black fills with red outline strokes) works at the left while a generative
// rose-curve artwork is traced live on a circular artboard, hearts drifting
// from him into the piece. Ambient HUD furniture keeps everything moving:
// rotating rings, palette swatches, progress bar, EQ bars, hex readout, ECG.

interface StudioTheme {
  bg: string;
  gridLine: string;
  line: string;
  lineSoft: string;
  accent: string;
  glow: string;
  text: string;
  panel: string;
}

const DARK_THEME: StudioTheme = {
  bg: '#0c0508',
  gridLine: 'rgba(244, 63, 94, 0.06)',
  line: 'rgba(244, 63, 94, 0.85)',
  lineSoft: 'rgba(244, 63, 94, 0.3)',
  accent: '#ff8fa3',
  glow: 'rgba(233, 41, 63, 0.3)',
  text: 'rgba(255, 143, 163, 0.75)',
  panel: 'rgba(244, 63, 94, 0.08)',
};

const LIGHT_THEME: StudioTheme = {
  bg: '#fdf3f5',
  gridLine: 'rgba(190, 18, 60, 0.07)',
  line: 'rgba(190, 18, 60, 0.85)',
  lineSoft: 'rgba(190, 18, 60, 0.35)',
  accent: '#be123c',
  glow: 'rgba(233, 41, 63, 0.18)',
  text: 'rgba(159, 18, 57, 0.8)',
  panel: 'rgba(190, 18, 60, 0.06)',
};

// Per-artwork stroke color pairs (trail → tip), all in the brand red family.
const ART_COLORS: Array<[string, string]> = [
  ['#f43f5e', '#ff8fa3'],
  ['#e11d48', '#ff7b6d'],
  ['#ed2c3c', '#fda4af'],
  ['#be123c', '#f43f5e'],
];

const ART_K = [3, 4, 5, 7, 6]; // rose-curve petal constants, one per artwork
const ART_DURATION_SEC = 12;

const STATUS_WORDS = ['COMPOSING', 'SKETCHING', 'INKING', 'DREAMING'];

function prand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// One heartbeat of an ECG trace, u in [0,1) → -1..1 (R spike at ~0.3).
function ecgPulse(u: number): number {
  if (u < 0.15) return 0;
  if (u < 0.2) return Math.sin(((u - 0.15) / 0.05) * Math.PI) * 0.15;
  if (u < 0.24) return 0;
  if (u < 0.27) return -((u - 0.24) / 0.03) * 0.3;
  if (u < 0.31) return -0.3 + ((u - 0.27) / 0.04) * 1.3;
  if (u < 0.35) return 1.0 - ((u - 0.31) / 0.04) * 1.35;
  if (u < 0.4) return -0.35 + ((u - 0.35) / 0.05) * 0.35;
  if (u < 0.55) return 0;
  if (u < 0.65) return Math.sin(((u - 0.55) / 0.1) * Math.PI) * 0.25;
  return 0;
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function drawStampyStudioFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  isDark: boolean
): void {
  const t = time / 1000;
  const theme = isDark ? DARK_THEME : LIGHT_THEME;
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

  // --- Layout anchors ---
  const boardX = width * 0.63;
  const boardY = height * 0.44;
  const boardR = unit * 0.24;
  const stampyX = width * 0.21;
  const stampyY = height * 0.47;
  const stampySize = unit * 0.34;

  // --- Artwork state ---
  const artIdx = Math.max(0, Math.floor(t / ART_DURATION_SEC));
  const progress = (t % ART_DURATION_SEC) / ART_DURATION_SEC;
  const k = ART_K[artIdx % ART_K.length];
  const [trailColor, tipColor] = ART_COLORS[artIdx % ART_COLORS.length];
  const artRot = artIdx * 1.7 + t * 0.04;

  // --- Artboard panel: glow + fill + rim ---
  const glow = ctx.createRadialGradient(boardX, boardY, 0, boardX, boardY, boardR * 1.5);
  glow.addColorStop(0, theme.glow);
  glow.addColorStop(1, 'rgba(233, 41, 63, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(boardX - boardR * 1.5, boardY - boardR * 1.5, boardR * 3, boardR * 3);
  ctx.fillStyle = theme.panel;
  ctx.beginPath();
  ctx.arc(boardX, boardY, boardR, 0, Math.PI * 2);
  ctx.fill();

  // --- Generative rose curve, traced over the artwork's lifetime ---
  const fadeOut = progress > 0.92 ? 1 - (progress - 0.92) / 0.08 : 1;
  const drawProgress = Math.min(1, progress / 0.88); // fully drawn at 88%, then admired
  const thetaMax = Math.PI * 2 * drawProgress;
  const steps = Math.max(2, Math.floor(360 * drawProgress));
  const roseR = boardR * 0.82;

  ctx.save();
  ctx.beginPath();
  ctx.arc(boardX, boardY, boardR, 0, Math.PI * 2);
  ctx.clip();

  // Drifting sparkle motes inside the artboard.
  for (let i = 0; i < 10; i++) {
    const orbitR = boardR * (0.2 + prand(i * 3) * 0.75);
    const speed = 0.15 + prand(i * 7) * 0.3;
    const angle = t * speed + prand(i * 11) * Math.PI * 2;
    const mx = boardX + Math.cos(angle) * orbitR;
    const my = boardY + Math.sin(angle) * orbitR;
    ctx.fillStyle = theme.lineSoft;
    ctx.fillRect(mx - 1, my - 1, 2, 2);
  }

  // Trail: full path so far, dim → bright toward the pen.
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  let penX = boardX;
  let penY = boardY;
  for (let i = 1; i <= steps; i++) {
    const th0 = ((i - 1) / steps) * thetaMax;
    const th1 = (i / steps) * thetaMax;
    const r0 = roseR * Math.sin(k * th0);
    const r1 = roseR * Math.sin(k * th1);
    const x0 = boardX + Math.cos(th0 + artRot) * r0;
    const y0 = boardY + Math.sin(th0 + artRot) * r0;
    const x1 = boardX + Math.cos(th1 + artRot) * r1;
    const y1 = boardY + Math.sin(th1 + artRot) * r1;
    const along = i / steps;
    const brightness = 0.3 + 0.7 * Math.max(0, (along - 0.7) / 0.3);
    ctx.strokeStyle = lerpColor(trailColor, tipColor, along);
    ctx.globalAlpha = brightness * fadeOut;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    penX = x1;
    penY = y1;
  }
  ctx.globalAlpha = 1;

  // Pen tip: glow + bright dot, only while actively drawing.
  if (drawProgress < 1) {
    const penGlow = ctx.createRadialGradient(penX, penY, 0, penX, penY, 12);
    penGlow.addColorStop(0, isDark ? 'rgba(255, 143, 163, 0.8)' : 'rgba(190, 18, 60, 0.6)');
    penGlow.addColorStop(1, 'rgba(255, 143, 163, 0)');
    ctx.fillStyle = penGlow;
    ctx.fillRect(penX - 12, penY - 12, 24, 24);
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.arc(penX, penY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Scan line sweeping down the artboard.
  const scanY = boardY - boardR + (((t * 36) % (boardR * 2.6)));
  if (scanY < boardY + boardR) {
    ctx.strokeStyle = theme.lineSoft;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(boardX - boardR, scanY);
    ctx.lineTo(boardX + boardR, scanY);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // --- Rings around the artboard ---
  const r1 = boardR * 1.12;
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = theme.line;
  for (let i = 0; i < 3; i++) {
    const start = t * 0.6 + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.arc(boardX, boardY, r1, start, start + Math.PI / 3.4);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(boardX, boardY);
  ctx.rotate(-t * 0.35);
  ctx.setLineDash([5, 9]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = theme.lineSoft;
  ctx.beginPath();
  ctx.arc(0, 0, boardR * 1.22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const r3 = boardR * 1.34;
  const TICKS = 48;
  for (let i = 0; i < TICKS; i++) {
    const angle = (i / TICKS) * Math.PI * 2;
    const chase = (i / TICKS + t * 0.3) % 1;
    const bright = chase < 0.12;
    const inner = r3 - (i % 4 === 0 ? 8 : 4);
    ctx.strokeStyle = bright ? theme.line : theme.lineSoft;
    ctx.lineWidth = i % 4 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(boardX + Math.cos(angle) * inner, boardY + Math.sin(angle) * inner);
    ctx.lineTo(boardX + Math.cos(angle) * r3, boardY + Math.sin(angle) * r3);
    ctx.stroke();
  }

  // --- Stampy at work: bob + slight lean, hologram art ---
  const bob = Math.sin(t * 0.55 * Math.PI * 2) * unit * 0.012;
  const lean = Math.sin(t * 0.3 * Math.PI * 2) * 0.04;
  ctx.save();
  ctx.translate(stampyX, stampyY + bob);
  ctx.rotate(lean);
  // Fill matches the theme background so Stampy reads as a red-outline
  // hologram in both modes instead of a solid black shape.
  drawImageAsset(ctx, '/Stampy_Black.svg', 0, 0, stampySize, theme.bg);
  ctx.restore();

  // Pedestal ellipse under Stampy.
  ctx.strokeStyle = theme.lineSoft;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(stampyX, stampyY + stampySize * 0.52, stampySize * 0.42, stampySize * 0.09, 0, 0, Math.PI * 2);
  ctx.stroke();

  // --- Hearts drifting from Stampy to the artboard ---
  const HEARTS = 5;
  for (let i = 0; i < HEARTS; i++) {
    const period = 4.2;
    const u = ((t / period + i / HEARTS) % 1);
    const alpha = Math.sin(u * Math.PI); // fade in and out
    // Quadratic bezier from Stampy's head toward the artboard center.
    const sx = stampyX + stampySize * 0.15;
    const sy = stampyY - stampySize * 0.25;
    const mx = (stampyX + boardX) / 2;
    const my = Math.min(sy, boardY) - unit * 0.14 - prand(i * 5) * unit * 0.05;
    const ex = boardX;
    const ey = boardY;
    const mt = 1 - u;
    const hx = mt * mt * sx + 2 * mt * u * mx + u * u * ex;
    const hy = mt * mt * sy + 2 * mt * u * my + u * u * ey;
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = theme.accent;
    drawHeart(ctx, hx, hy, 5.5 - u * 2.5);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // --- Progress bar under the artboard ---
  const barW = boardR * 1.7;
  const barX = boardX - barW / 2;
  const barY = boardY + r3 + unit * 0.035;
  ctx.strokeStyle = theme.lineSoft;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, 7);
  ctx.fillStyle = theme.line;
  ctx.fillRect(barX + 1, barY + 1, (barW - 2) * progress, 5);
  ctx.font = '10px monospace';
  ctx.fillStyle = theme.text;
  const barLabel = progress > 0.92 ? 'SAVING ♥' : `RENDERING ${Math.floor(progress * 100)}%`;
  ctx.fillText(barLabel, barX, barY + 20);
  ctx.fillText(`ARTWORK ${String(artIdx % 100).padStart(2, '0')}`, barX + barW - 68, barY + 20);

  // --- Palette swatches (top right) ---
  const swatches = [tipColor, trailColor, '#ff7b6d', '#fda4af', '#84212d'];
  const swY = 24;
  for (let i = 0; i < swatches.length; i++) {
    const active = Math.floor(t * 2) % swatches.length === i;
    ctx.globalAlpha = active ? 1 : 0.45;
    ctx.fillStyle = swatches[i];
    ctx.fillRect(width - 30 - i * 16, swY, 11, 11);
    ctx.globalAlpha = 1;
  }
  ctx.font = '10px monospace';
  ctx.fillStyle = theme.text;
  ctx.fillText('PALETTE', width - 30 - 4 * 16, swY + 24);

  // --- EQ bars (bottom left) ---
  const barBaseY = height - unit * 0.16;
  ctx.fillStyle = theme.lineSoft;
  for (let i = 0; i < 8; i++) {
    const level = 0.2 + 0.8 * Math.abs(Math.sin(t * (1.2 + i * 0.29) + i * 1.7));
    const bh = unit * 0.07 * level;
    ctx.fillRect(18 + i * 9, barBaseY - bh, 5, bh);
  }

  // --- Hex readout (right edge) ---
  ctx.font = '10px monospace';
  ctx.fillStyle = theme.text;
  for (let i = 0; i < 6; i++) {
    const seed = i * 13 + Math.floor(t * 3);
    let hex = '';
    for (let j = 0; j < 6; j++) {
      hex += Math.floor(prand(seed + j * 7) * 16).toString(16).toUpperCase();
    }
    ctx.fillText(`0x${hex}`, width - 78, height * 0.62 + i * 13);
  }

  // --- ECG trace + BPM (bottom) ---
  const ecgY = height - unit * 0.07;
  const ecgAmp = unit * 0.035;
  const ecgPeriodPx = 200;
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const u = (((x + t * 120) % ecgPeriodPx) + ecgPeriodPx) % ecgPeriodPx / ecgPeriodPx;
    const y = ecgY - ecgPulse(u) * ecgAmp;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  const bpm = 72 + Math.round(Math.sin(t * 0.7) * 4);
  ctx.font = '10px monospace';
  ctx.fillStyle = theme.text;
  ctx.fillText(`❤ ${bpm} BPM`, width - 78, height - 14);

  // --- Header ---
  ctx.font = '11px monospace';
  ctx.fillStyle = theme.text;
  ctx.fillText('STAMPY OS v2.0', 18, 26);
  const word = STATUS_WORDS[Math.floor(t / 3) % STATUS_WORDS.length];
  const dots = '.'.repeat(1 + (Math.floor(t * 2) % 3));
  ctx.fillText(`${word}${dots}`, 18, 42);

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
