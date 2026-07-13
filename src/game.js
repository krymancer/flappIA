import { CONFIG } from './config.js';
import { SPRITES } from './assets.js';
import { Base } from './entities/base.js';
import { Pipe } from './entities/pipe.js';
import { createPopulation, nextGeneration } from './ga.js';
import { drawNetwork } from './viz/nn-view.js';
import { drawDashboard } from './viz/charts.js';

export class Game {
  constructor(context) {
    this.ctx = context;
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
    this.pipes = [
      new Pipe(CONFIG.CANVAS_WIDTH),
      new Pipe(CONFIG.CANVAS_WIDTH + CONFIG.PIPE_SPACING),
    ];
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
      this.pipes.push(new Pipe(last.x + CONFIG.PIPE_SPACING));
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
    ctx.fillStyle = '#fff';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Generation: ${this.generation}`, 20, 40);
    ctx.fillText(`Alive: ${this.activeBirds.length}`, 20, 76);
    ctx.fillText(`Best: ${this.bestScore}`, 20, 112);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '13px sans-serif';
    ctx.fillText('[n] brain: leading/champion   [v] hide graphs', 20, 140);
  }

  drawViz() {
    const ctx = this.ctx;
    const W = CONFIG.CANVAS_WIDTH;
    const H = CONFIG.CANVAS_HEIGHT;

    // Network diagram (top-right).
    const lead = this.leadingBird();
    const inputs = lead?.lastInputs;
    if (inputs) {
      const nnPanel = { x: W - 262, y: 12, w: 250, h: 214 };
      if (this.nnTarget === 'champion' && this.champion) {
        const acts = this.champion.brain.activations(inputs);
        const jump = acts.output[1] > acts.output[0];
        drawNetwork(
          ctx,
          this.champion.brain,
          acts,
          inputs,
          jump,
          nnPanel,
          `(champion · ${this.champion.score})`
        );
      } else {
        const acts = { hidden: lead.lastHidden, output: lead.lastOutput };
        drawNetwork(ctx, lead.brain, acts, inputs, lead.lastJump, nnPanel, '(leading)');
      }
    }

    // Fitness dashboard (bottom-left).
    const dashPanel = { x: 12, y: H - 262, w: 258, h: 250 };
    drawDashboard(
      ctx,
      {
        history: this.history,
        distribution: this.distribution,
        alive: this.activeBirds.length,
        population: this.allBirds.length,
      },
      dashPanel
    );
  }
}
