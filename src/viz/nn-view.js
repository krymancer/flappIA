// Renders a neural network as a node/edge diagram overlaid on the game canvas:
// input → hidden → output columns, edges tinted by weight sign/magnitude, nodes
// lit by their activation, and the winning output ("FLAP") highlighted.

const INPUT_LABELS = ['dist', 'gapT', 'gapB', 'y', 'vel'];
const OUTPUT_LABELS = ['NO', 'FLAP'];

// Map a signed value to a fill: cool (blue) for low activation, warm (yellow)
// for high. Activations are 0..1 (sigmoid); inputs are clamped for display.
function activationFill(v) {
  const t = Math.max(0, Math.min(1, v));
  const r = Math.round(40 + t * 215);
  const g = Math.round(60 + t * 180);
  const b = Math.round(120 - t * 80);
  return `rgb(${r},${g},${b})`;
}

function columnPositions(count, x, top, bottom, radius) {
  const positions = [];
  const usable = bottom - top;
  const step = count > 1 ? usable / (count - 1) : 0;
  for (let i = 0; i < count; i++) {
    positions.push({ x, y: count > 1 ? top + step * i : (top + bottom) / 2, r: radius });
  }
  return positions;
}

// network: NeuralNetwork; acts: {hidden:number[], output:number[]}; inputs:number[]
export function drawNetwork(ctx, network, acts, inputs, jump, panel, subtitle) {
  const { x, y, w, h } = panel;

  ctx.save();

  // panel background
  ctx.fillStyle = 'rgba(15, 20, 30, 0.72)';
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();

  // title
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 13px sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('BRAIN', x + 12, y + 20);
  ctx.fillStyle = 'rgba(180,200,230,0.8)';
  ctx.font = '11px sans-serif';
  ctx.fillText(subtitle, x + 58, y + 20);

  const top = y + 40;
  const bottom = y + h - 16;
  const colX = [x + 34, x + w / 2, x + w - 40];
  const radius = 7;

  const inPos = columnPositions(network.inputs, colX[0], top, bottom, radius);
  const hidPos = columnPositions(network.hidden, colX[1], top, bottom, radius);
  const outPos = columnPositions(network.outputs, colX[2], top, bottom, radius);

  // edges input→hidden
  drawEdges(ctx, inPos, hidPos, network.weightsIH, network.inputs);
  // edges hidden→output
  drawEdges(ctx, hidPos, outPos, network.weightsHO, network.hidden);

  // nodes
  drawNodes(ctx, inPos, inputs, INPUT_LABELS, 'left');
  drawNodes(ctx, hidPos, acts.hidden, null, null);
  drawNodes(ctx, outPos, acts.output, OUTPUT_LABELS, 'right');

  // highlight the firing output
  const fireIdx = jump ? 1 : 0;
  const fp = outPos[fireIdx];
  ctx.strokeStyle = jump ? '#ffe14d' : 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(fp.x, fp.y, radius + 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawEdges(ctx, from, to, weights, stride) {
  for (let i = 0; i < to.length; i++) {
    for (let j = 0; j < from.length; j++) {
      const w = weights[i * stride + j];
      const mag = Math.min(1, Math.abs(w));
      ctx.strokeStyle =
        w >= 0 ? `rgba(90,220,160,${mag * 0.55})` : `rgba(240,110,90,${mag * 0.55})`;
      ctx.lineWidth = 0.5 + mag * 1.5;
      ctx.beginPath();
      ctx.moveTo(from[j].x, from[j].y);
      ctx.lineTo(to[i].x, to[i].y);
      ctx.stroke();
    }
  }
}

function drawNodes(ctx, pos, values, labels, labelSide) {
  ctx.font = '9px sans-serif';
  for (let i = 0; i < pos.length; i++) {
    const p = pos[i];
    const v = values ? values[i] : 0;
    ctx.fillStyle = activationFill(v);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (labels) {
      ctx.fillStyle = 'rgba(230,235,245,0.85)';
      ctx.textBaseline = 'middle';
      if (labelSide === 'left') {
        ctx.textAlign = 'right';
        ctx.fillText(labels[i], p.x - p.r - 4, p.y);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(labels[i], p.x + p.r + 4, p.y);
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export { roundRect };
