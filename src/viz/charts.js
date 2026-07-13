// Bottom-left overlay dashboard: best/avg score per generation (line chart),
// live alive-count bar, and a histogram of the previous generation's scores.

import { roundRect } from './nn-view.js';

// stats: { history: [{gen,best,avg}], distribution: number[], alive, population }
export function drawDashboard(ctx, stats, panel) {
  const { x, y, w, h } = panel;
  ctx.save();

  ctx.fillStyle = 'rgba(15, 20, 30, 0.72)';
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();

  const pad = 12;
  const innerX = x + pad;
  const innerW = w - pad * 2;

  // ── line chart: best + avg per generation ──────────────────────────────
  const chartY = y + 24;
  const chartH = 78;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('FITNESS / GENERATION', innerX, y + 16);
  drawLineChart(ctx, stats.history, innerX, chartY, innerW, chartH);

  // legend
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#ffe14d';
  ctx.fillText('■ best', innerX, chartY + chartH + 14);
  ctx.fillStyle = '#5adca0';
  ctx.fillText('■ avg', innerX + 48, chartY + chartH + 14);

  // ── alive bar ──────────────────────────────────────────────────────────
  const aliveY = chartY + chartH + 30;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`ALIVE  ${stats.alive} / ${stats.population}`, innerX, aliveY);
  const barY = aliveY + 8;
  const barH = 10;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(ctx, innerX, barY, innerW, barH, 4);
  ctx.fill();
  const frac = stats.population ? stats.alive / stats.population : 0;
  ctx.fillStyle = '#6cc6ff';
  roundRect(ctx, innerX, barY, Math.max(2, innerW * frac), barH, 4);
  ctx.fill();

  // ── histogram: previous generation score distribution ──────────────────
  const histLabelY = barY + barH + 22;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('LAST GEN SCORES', innerX, histLabelY);
  drawHistogram(ctx, stats.distribution, innerX, histLabelY + 6, innerW, 46);

  ctx.restore();
}

function drawLineChart(ctx, history, x, y, w, h) {
  // baseline
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();

  if (!history || history.length === 0) {
    ctx.fillStyle = 'rgba(200,210,230,0.5)';
    ctx.font = '10px sans-serif';
    ctx.fillText('waiting for generation 1…', x + 4, y + h / 2);
    return;
  }

  const maxBest = Math.max(1, ...history.map((d) => d.best));
  const n = history.length;
  const xAt = (i) => (n > 1 ? x + (w * i) / (n - 1) : x + w / 2);
  const yAt = (v) => y + h - (h * v) / maxBest;

  const line = (key, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    history.forEach((d, i) => {
      const px = xAt(i);
      const py = yAt(d[key]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  };
  line('avg', '#5adca0');
  line('best', '#ffe14d');

  // max label
  ctx.fillStyle = 'rgba(230,235,245,0.7)';
  ctx.font = '9px sans-serif';
  ctx.fillText(String(maxBest), x + w - 22, y + 9);
}

function drawHistogram(ctx, distribution, x, y, w, h) {
  if (!distribution || distribution.length === 0) {
    ctx.fillStyle = 'rgba(200,210,230,0.5)';
    ctx.font = '10px sans-serif';
    ctx.fillText('—', x + 4, y + h / 2);
    return;
  }
  const bins = 12;
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
    ctx.fillStyle = '#6cc6ff';
    ctx.fillRect(x + i * bw + 1, y + h - bh, bw - 2, bh);
  }
}
