// Renders a neural network onto its own canvas: input → hidden → output
// columns, edges tinted by weight sign/magnitude, nodes lit by activation, and
// the winning output ("FLAP") highlighted. Sized to fill ctx.canvas.

const INPUT_LABELS = ['pipe dist', 'gap top', 'gap bottom', 'bird y', 'velocity'];
const OUTPUT_LABELS = ['DON’T', 'FLAP'];

// Activation (0..1) → cool-to-warm fill.
function activationFill(v) {
  const t = Math.max(0, Math.min(1, v));
  const r = Math.round(35 + t * 220);
  const g = Math.round(55 + t * 175);
  const b = Math.round(130 - t * 95);
  return `rgb(${r},${g},${b})`;
}

function column(count, x, top, bottom) {
  const pts = [];
  const step = count > 1 ? (bottom - top) / (count - 1) : 0;
  for (let i = 0; i < count; i++) {
    pts.push({ x, y: count > 1 ? top + step * i : (top + bottom) / 2 });
  }
  return pts;
}

export function drawNetwork(ctx, network, acts, inputs, jump, subtitle) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const R = 13;

  ctx.save();
  ctx.textBaseline = 'alphabetic';

  // header
  ctx.fillStyle = '#eef2f8';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('NEURAL NET', 16, 26);
  ctx.fillStyle = 'rgba(180,200,230,0.75)';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(subtitle, 140, 26);

  const top = 62;
  const bottom = H - 30;
  const colX = [96, W / 2, W - 96];

  const inPos = column(network.inputs, colX[0], top, bottom);
  const hidPos = column(network.hidden, colX[1], top, bottom);
  const outPos = column(network.outputs, colX[2], top, bottom);

  drawEdges(ctx, inPos, hidPos, network.weightsIH, network.inputs);
  drawEdges(ctx, hidPos, outPos, network.weightsHO, network.hidden);

  drawNodes(ctx, inPos, inputs, R, INPUT_LABELS, 'left');
  drawNodes(ctx, hidPos, acts.hidden, R, null, null);
  drawNodes(ctx, outPos, acts.output, R, OUTPUT_LABELS, 'right');

  // highlight the firing output with a glow ring
  const fp = outPos[jump ? 1 : 0];
  ctx.strokeStyle = jump ? '#ffd84d' : 'rgba(255,255,255,0.6)';
  ctx.shadowColor = jump ? '#ffd84d' : 'transparent';
  ctx.shadowBlur = jump ? 14 : 0;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(fp.x, fp.y, R + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // decision caption
  ctx.fillStyle = jump ? '#ffd84d' : 'rgba(230,235,245,0.8)';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(jump ? 'decision: FLAP' : 'decision: glide', W - 14, H - 8);

  ctx.restore();
}

function drawEdges(ctx, from, to, weights, stride) {
  for (let i = 0; i < to.length; i++) {
    for (let j = 0; j < from.length; j++) {
      const w = weights[i * stride + j];
      const mag = Math.min(1, Math.abs(w));
      ctx.strokeStyle = w >= 0 ? `rgba(90,220,160,${mag * 0.6})` : `rgba(245,110,95,${mag * 0.6})`;
      ctx.lineWidth = 0.5 + mag * 2.2;
      ctx.beginPath();
      ctx.moveTo(from[j].x, from[j].y);
      ctx.lineTo(to[i].x, to[i].y);
      ctx.stroke();
    }
  }
}

function drawNodes(ctx, pos, values, r, labels, side) {
  ctx.font = '12px system-ui, sans-serif';
  for (let i = 0; i < pos.length; i++) {
    const p = pos[i];
    const v = values ? values[i] : 0;
    ctx.fillStyle = activationFill(v);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (labels) {
      ctx.fillStyle = 'rgba(232,237,245,0.9)';
      ctx.textBaseline = 'middle';
      if (side === 'left') {
        ctx.textAlign = 'right';
        ctx.fillText(labels[i], p.x - r - 8, p.y);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(labels[i], p.x + r + 8, p.y);
      }
      ctx.textBaseline = 'alphabetic';
    }
  }
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
