import { CONFIG } from './config.js';
import { SPRITES } from './assets.js';
import { Base } from './entities/base.js';
import { Pipe } from './entities/pipe.js';
import { createPopulation, nextGeneration } from './ga.js';
import { drawNetwork } from './viz/nn-view.js';
import { drawDashboard } from './viz/charts.js';

export class Game {
  constructor(context, nnCtx, chartCtx) {
    this.ctx = context;
    this.nnCtx = nnCtx ?? null; // dedicated canvas for the brain diagram
    this.chartCtx = chartCtx ?? null; // dedicated canvas for the fitness charts
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
    this.drawHud();
    if (this.showViz) this.drawViz();

    if (this.activeBirds.length === 0) this.evolve();
  }

  drawHud() {
    const ctx = this.ctx;
    ctx.textAlign = 'left';
    // subtle shadow panel behind the text for legibility over the sky
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(16, 18, 300, 118);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(`Generation ${this.generation}`, 30, 56);
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText(`Alive: ${this.activeBirds.length} / ${this.allBirds.length}`, 30, 92);
    ctx.fillText(`Best: ${this.bestScore}`, 30, 124);
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
