import { daysBetween, type ISODate } from './dates';
import { t } from './i18n';
import { overallReadiness, streak } from './planner';
import { SITE_URL } from './shareLink';
import type { PathTheme } from './themes';
import type { Goal } from './types';

// A 1080×1350 picture of a plan's progress, sized for WhatsApp status and
// Instagram. It shows only the plan's name and headline numbers.

const W = 1080;
const H = 1350;
const font = () => {
  const script = getComputedStyle(document.documentElement).getPropertyValue('--script-font').trim();
  return `'Plus Jakarta Sans', ${script || 'system-ui'}, sans-serif`;
};

/** Splits text into lines that fit `width`, at most `max` lines. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > max) {
    lines.length = max;
    lines[max - 1] = `${lines[max - 1].replace(/\s+\S*$/, '')}…`;
  }
  return lines;
}

export async function drawProgress(goal: Goal, theme: PathTheme, today: ISODate): Promise<HTMLCanvasElement> {
  await document.fonts?.ready;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const FONT = font();

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, theme.from);
  bg.addColorStop(1, theme.to);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Dot texture, fading in towards the right like the app's banner.
  for (let x = 30; x < W; x += 36) {
    for (let y = 30; y < H; y += 36) {
      ctx.fillStyle = `rgba(255,255,255,${0.16 * (x / W)})`;
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 34px ${FONT}`;
  ctx.globalAlpha = 0.9;
  ctx.fillText(theme.label.toUpperCase(), 90, 150);
  ctx.globalAlpha = 1;

  ctx.font = `800 84px ${FONT}`;
  const nameLines = wrap(ctx, goal.name, W - 180, 3);
  nameLines.forEach((line, i) => ctx.fillText(line, 90, 260 + i * 98));

  // Readiness ring.
  const readiness = overallReadiness(goal);
  const cx = W / 2;
  const cy = 300 + nameLines.length * 98 + 210;
  const r = 190;
  ctx.lineWidth = 34;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * readiness) / 100);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.font = `800 120px ${FONT}`;
  ctx.fillText(`${readiness}%`, cx, cy + 30);
  ctx.font = `600 36px ${FONT}`;
  ctx.globalAlpha = 0.9;
  ctx.fillText(t('pictureReady'), cx, cy + 86);
  ctx.globalAlpha = 1;

  // Three numbers under the ring.
  const hours = Math.round(goal.log.reduce((s, e) => s + e.minutes, 0) / 60);
  const daysLeft = Math.max(0, daysBetween(today, goal.targetDate));
  const stats: [string, string][] = [
    [String(streak(goal, today)), t('pictureStreak')],
    [String(daysLeft), t('pictureDaysLeft')],
    [String(hours), t('pictureStudied')],
  ];
  const top = cy + r + 90;
  stats.forEach(([value, label], i) => {
    const x = 90 + ((W - 180) / 3) * (i + 0.5);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.roundRect(x - 140, top, 280, 170, 28);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `800 64px ${FONT}`;
    ctx.fillText(value, x, top + 88);
    ctx.font = `600 28px ${FONT}`;
    ctx.globalAlpha = 0.9;
    ctx.fillText(label, x, top + 136);
    ctx.globalAlpha = 1;
  });

  ctx.font = `700 30px ${FONT}`;
  ctx.fillText(t('pictureFooter'), cx, H - 110);
  ctx.font = `500 26px ${FONT}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(SITE_URL.replace(/^https:\/\//, '').replace(/\/$/, ''), cx, H - 66);
  ctx.globalAlpha = 1;
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not draw the picture'))), 'image/png'));
}
