// Fitness dashboard drawn onto its own canvas: best/avg score per generation
// (line chart), a live alive-count bar, and a histogram of the previous
// generation's scores. Sized to fill ctx.canvas.

import { roundRect } from './nn-view.js';

const AXIS = 'rgba(255,255,255,0.18)';
const BEST = '#ffd84d';
const AVG = '#5adca0';
const BAR = '#6cc6ff';

// stats: { history:[{gen,best,avg}], distribution:number[], alive, population, generation }
export function drawDashboard(ctx, stats) {
  const W = ctx.canvas.width;
  const pad = 16;
  const innerX = pad;
  const innerW = W - pad * 2;

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // ── line chart ──────────────────────────────────────────────────────────
  ctx.fillStyle = '#eef2f8';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('FITNESS / GENERATION', innerX, 26);

  const chartY = 44;
  const chartH = 200;
  drawLineChart(ctx, stats.history, innerX, chartY, innerW, chartH);

  // legend
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = BEST;
  ctx.fillText('■ best', innerX, chartY + chartH + 22);
  ctx.fillStyle = AVG;
  ctx.fillText('■ average', innerX + 70, chartY + chartH + 22);
  ctx.fillStyle = 'rgba(230,235,245,0.6)';
  ctx.textAlign = 'right';
  ctx.fillText(`gen ${stats.generation}`, innerX + innerW, chartY + chartH + 22);
  ctx.textAlign = 'left';

  // ── alive bar ─────────────────────────────────────────────────────────
  const aliveY = chartY + chartH + 56;
  ctx.fillStyle = '#eef2f8';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('POPULATION ALIVE', innerX, aliveY);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(230,235,245,0.85)';
  ctx.fillText(`${stats.alive} / ${stats.population}`, innerX + innerW, aliveY);
  ctx.textAlign = 'left';

  const barY = aliveY + 12;
  const barH = 16;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  roundRect(ctx, innerX, barY, innerW, barH, 6);
  ctx.fill();
  const frac = stats.population ? stats.alive / stats.population : 0;
  ctx.fillStyle = BAR;
  roundRect(ctx, innerX, barY, Math.max(3, innerW * frac), barH, 6);
  ctx.fill();

  // ── histogram ─────────────────────────────────────────────────────────
  const histLabelY = barY + barH + 40;
  ctx.fillStyle = '#eef2f8';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('LAST GENERATION SCORES', innerX, histLabelY);
  drawHistogram(ctx, stats.distribution, innerX, histLabelY + 10, innerW, 74);

  ctx.restore();
}

function drawLineChart(ctx, history, x, y, w, h) {
  ctx.strokeStyle = AXIS;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();

  if (!history || history.length === 0) {
    ctx.fillStyle = 'rgba(200,210,230,0.5)';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('waiting for generation 1…', x + 6, y + h / 2);
    return;
  }

  const maxBest = Math.max(1, ...history.map((d) => d.best));
  const n = history.length;
  const xAt = (i) => (n > 1 ? x + (w * i) / (n - 1) : x + w / 2);
  const yAt = (v) => y + h - (h * v) / maxBest;

  const line = (key, color, width) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    history.forEach((d, i) => {
      const px = xAt(i);
      const py = yAt(d[key]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  };
  line('avg', AVG, 2);
  line('best', BEST, 2.5);

  ctx.fillStyle = 'rgba(230,235,245,0.7)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(String(maxBest), x + 4, y + 12);
  ctx.fillText('0', x + 4, y + h - 4);
}

function drawHistogram(ctx, distribution, x, y, w, h) {
  ctx.strokeStyle = AXIS;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();

  if (!distribution || distribution.length === 0) {
    ctx.fillStyle = 'rgba(200,210,230,0.5)';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('—', x + 6, y + h / 2);
    return;
  }
  const bins = 16;
  const max = Math.max(...distribution);
  const counts = new Array(bins).fill(0);
  for (const s of distribution) {
    const idx = max > 0 ? Math.min(bins - 1, Math.floor((s / max) * bins)) : 0;
    counts[idx]++;
  }
  const maxCount = Math.max(1, ...counts);
  const bw = w / bins;
  for (let i = 0; i < bins; i++) {
    const bh = (h * counts[i]) / maxCount;
    ctx.fillStyle = BAR;
    ctx.fillRect(x + i * bw + 1, y + h - bh, bw - 2, bh);
  }
}
