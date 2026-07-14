import { CONFIG } from './config.js';
import { SPRITES } from './assets.js';
import { Base } from './entities/base.js';
import { Pipe } from './entities/pipe.js';
import { createPopulation, nextGeneration } from './ga.js';
import { drawNetwork } from './viz/nn-view.js';
import { drawDashboard } from './viz/charts.js';

export class Game {
  constructor(context, nnCtx, chartCtx, statsCtx, genTableCtx) {
    this.ctx = context;
    this.nnCtx = nnCtx ?? null; // dedicated canvas for the brain diagram
    this.chartCtx = chartCtx ?? null; // dedicated canvas for the fitness charts
    this.statsCtx = statsCtx ?? null; // dedicated canvas for the left stats column
    this.genTableCtx = genTableCtx ?? null; // dedicated canvas for the generations table
    this.base = new Base();
    this.generation = 1;
    this.bestScore = 0;
    // Visualisation state.
    this.history = []; // [{ gen, best, avg }] per finished generation
    this.distribution = []; // scores of the most recently finished generation
    this.champion = null; // { brain, score } best bird seen across all generations
    this.nnTarget = 'leading'; // 'leading' | 'champion'
    this.showViz = true;
    this.reset(createPopulation());
  }

  reset(birds) {
    this.allBirds = birds;
    this.activeBirds = [...birds];
    const first = new Pipe(CONFIG.CANVAS_WIDTH);
    this.pipes = [first, new Pipe(CONFIG.CANVAS_WIDTH + CONFIG.PIPE_SPACING, first.topHeight)];
  }

  // Record the finished generation's stats, then breed the next one.
  evolve() {
    const scores = this.allBirds.map((b) => b.score);
    const best = Math.max(...scores);
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    this.history.push({ gen: this.generation, best, avg });
    this.distribution = scores;

    const topBird = this.allBirds.reduce((a, b) => (b.score > a.score ? b : a));
    if (!this.champion || topBird.score > this.champion.score) {
      this.champion = { brain: topBird.brain.copy(), score: topBird.score };
    }

    this.generation++;
    this.reset(nextGeneration(this.allBirds));
  }

  updatePipes() {
    this.pipes.forEach((p) => p.move());
    if (this.pipes[0].offscreen()) {
      this.pipes.shift();
      const last = this.pipes[this.pipes.length - 1];
      this.pipes.push(new Pipe(last.x + CONFIG.PIPE_SPACING, last.topHeight));
    }
  }

  // First still-alive bird that has made at least one decision this frame.
  leadingBird() {
    return this.activeBirds.find((b) => b.lastInputs) ?? null;
  }

  start() {
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', (e) => this.onKey(e));
    }
    const loop = () => {
      this.tick();
      requestAnimationFrame(loop);
    };
    loop();
  }

  onKey(e) {
    const k = e.key.toLowerCase();
    if (k === 'n') this.nnTarget = this.nnTarget === 'leading' ? 'champion' : 'leading';
    else if (k === 'v') this.showViz = !this.showViz;
  }

  tick() {
    const ctx = this.ctx;
    this.base.move();
    this.updatePipes();

    for (let i = this.activeBirds.length - 1; i >= 0; i--) {
      const bird = this.activeBirds[i];
      bird.think(this.pipes);
      bird.update();
      const dead = bird.offscreen() || this.pipes.some((p) => bird.collides(p));
      if (dead) this.activeBirds.splice(i, 1);
      if (bird.score > this.bestScore) this.bestScore = bird.score;
    }

    // draw
    ctx.drawImage(SPRITES.backgrounds.day, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    this.pipes.forEach((p) => p.draw(ctx));
    this.activeBirds.forEach((b) => b.draw(ctx));
    this.base.draw(ctx);
    if (this.statsCtx) this.drawStats();
    if (this.genTableCtx) this.drawGenTable();
    if (this.showViz) this.drawViz();

    if (this.activeBirds.length === 0) this.evolve();
  }

  // Left column: live scores, generation, and run configuration.
  drawStats() {
    const ctx = this.statsCtx;
    clearCanvas(ctx);
    const W = ctx.canvas.width;
    const x = 18;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#eef2f8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('flappIA', x, 34);
    ctx.fillStyle = 'rgba(180,200,230,0.7)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('neuroevolution', x, 50);

    const last = this.history[this.history.length - 1];
    const current = this.activeBirds[0]?.score ?? 0;
    const rows = [
      ['GENERATION', String(this.generation), true],
      ['SCORE (this run)', String(current), false],
      ['ALIVE', `${this.activeBirds.length} / ${this.allBirds.length}`, false],
      ['BEST EVER', String(this.bestScore), false],
      ['LAST GEN', last ? `best ${last.best} · avg ${Math.round(last.avg)}` : '—', false],
    ];

    let y = 84;
    for (const [label, value, big] of rows) {
      ctx.fillStyle = 'rgba(180,200,230,0.7)';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(label, x, y);
      ctx.fillStyle = big ? '#ffd84d' : '#eef2f8';
      ctx.font = big ? 'bold 34px system-ui, sans-serif' : 'bold 22px system-ui, sans-serif';
      ctx.fillText(value, x, y + (big ? 34 : 26));
      y += big ? 62 : 50;
    }

    // config footer
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(W - x, y - 6);
    ctx.stroke();
    ctx.fillStyle = 'rgba(180,200,230,0.7)';
    ctx.font = '12px system-ui, sans-serif';
    y += 14;
    const cfg = [
      ['population', String(CONFIG.POPULATION)],
      ['elite carried', String(CONFIG.ELITE_COUNT)],
      ['mutation', `${Math.round(CONFIG.MUTATION_RATE * 100)}% · ±${CONFIG.MUTATION_STRENGTH}`],
      ['fitness', `score^${CONFIG.FITNESS_POWER}`],
    ];
    for (const [k, v] of cfg) {
      ctx.fillStyle = 'rgba(180,200,230,0.7)';
      ctx.textAlign = 'left';
      ctx.fillText(k, x, y);
      ctx.fillStyle = 'rgba(232,237,245,0.9)';
      ctx.textAlign = 'right';
      ctx.fillText(v, W - x, y);
      y += 20;
    }
    ctx.textAlign = 'left';
  }

  // Left column, bottom: a table of recent generations (newest first).
  drawGenTable() {
    const ctx = this.genTableCtx;
    clearCanvas(ctx);
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const x = 18;
    const colBest = W - 105;
    const colAvg = W - 18;
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#eef2f8';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('GENERATIONS', x, 26);

    // column headers
    ctx.fillStyle = 'rgba(180,200,230,0.7)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('GEN', x, 48);
    ctx.textAlign = 'right';
    ctx.fillText('BEST', colBest, 48);
    ctx.fillText('AVG', colAvg, 48);

    const rowH = 21;
    const maxRows = Math.floor((H - 60) / rowH);
    const rows = this.history.slice(-maxRows).reverse(); // newest first
    let y = 68;
    ctx.font = '13px system-ui, sans-serif';
    for (const r of rows) {
      const isBest = r.best === this.bestScore;
      ctx.fillStyle = isBest ? '#ffd84d' : 'rgba(232,237,245,0.9)';
      ctx.textAlign = 'left';
      ctx.fillText(String(r.gen), x, y);
      ctx.textAlign = 'right';
      ctx.fillText(String(r.best), colBest, y);
      ctx.fillStyle = 'rgba(180,200,230,0.8)';
      ctx.fillText(String(Math.round(r.avg)), colAvg, y);
      y += rowH;
    }
    if (rows.length === 0) {
      ctx.fillStyle = 'rgba(200,210,230,0.5)';
      ctx.textAlign = 'left';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('waiting for generation 1…', x, y);
    }
    ctx.textAlign = 'left';
  }

  // Render the brain diagram and fitness charts onto their dedicated canvases.
  drawViz() {
    const lead = this.leadingBird();
    const inputs = lead?.lastInputs;

    if (this.nnCtx) {
      clearCanvas(this.nnCtx);
      if (inputs) {
        if (this.nnTarget === 'champion' && this.champion) {
          const acts = this.champion.brain.activations(inputs);
          const jump = acts.output[1] > acts.output[0];
          drawNetwork(
            this.nnCtx,
            this.champion.brain,
            acts,
            inputs,
            jump,
            `champion · ${this.champion.score}`
          );
        } else {
          const acts = { hidden: lead.lastHidden, output: lead.lastOutput };
          drawNetwork(this.nnCtx, lead.brain, acts, inputs, lead.lastJump, 'leading bird');
        }
      }
    }

    if (this.chartCtx) {
      clearCanvas(this.chartCtx);
      drawDashboard(this.chartCtx, {
        history: this.history,
        distribution: this.distribution,
        alive: this.activeBirds.length,
        population: this.allBirds.length,
        generation: this.generation,
      });
    }
  }
}

function clearCanvas(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
