import { CONFIG } from './config.js';
import { SPRITES } from './assets.js';
import { Base } from './entities/base.js';
import { Pipe } from './entities/pipe.js';
import { createPopulation, nextGeneration } from './ga.js';

export class Game {
  constructor(context) {
    this.ctx = context;
    this.base = new Base();
    this.generation = 1;
    this.bestScore = 0;
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

  evolve() {
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

  start() {
    const loop = () => {
      this.tick();
      requestAnimationFrame(loop);
    };
    loop();
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

    if (this.activeBirds.length === 0) this.evolve();
  }

  drawHud() {
    const ctx = this.ctx;
    ctx.fillStyle = '#fff';
    ctx.font = '28px sans-serif';
    ctx.fillText(`Generation: ${this.generation}`, 20, 40);
    ctx.fillText(`Alive: ${this.activeBirds.length}`, 20, 76);
    ctx.fillText(`Best: ${this.bestScore}`, 20, 112);
  }
}
