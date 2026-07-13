import { CONFIG } from '../config.js';
import { SPRITES } from '../assets.js';
import { FLOOR } from './base.js';
import { NeuralNetwork } from '../nn/network.js';

const ANIMATION_TIME = 5;

export class Bird {
  constructor(brain) {
    if (brain instanceof NeuralNetwork) {
      this.brain = brain.copy();
      this.brain.mutate(CONFIG.MUTATION_RATE);
    } else {
      this.brain = new NeuralNetwork(CONFIG.NN_INPUTS, CONFIG.NN_HIDDEN, CONFIG.NN_OUTPUTS);
    }
    this.x = 115;
    this.y = 350;
    this.vel = 0;
    this.tilt = 0;
    this.frame = 0;
    this.score = 0;
    this.fitness = 0;
    this.alive = true;
  }

  get width() {
    return 34 * CONFIG.SCALE;
  }

  get height() {
    return 24 * CONFIG.SCALE;
  }

  jump() {
    this.vel = CONFIG.LIFT;
  }

  update() {
    this.vel += CONFIG.GRAVITY;
    if (this.vel > CONFIG.MAX_VEL) this.vel = CONFIG.MAX_VEL;
    this.y += this.vel;
    this.tilt = Math.max(-90, Math.min(25, -this.vel * 3));
    this.score++;
  }

  nearestPipe(pipes) {
    let nearest = null;
    let record = Infinity;
    for (const pipe of pipes) {
      const right = pipe.x + pipe.width;
      if (right >= this.x && pipe.x - this.x < record) {
        record = pipe.x - this.x;
        nearest = pipe;
      }
    }
    return nearest ?? pipes[0];
  }

  think(pipes) {
    const pipe = this.nearestPipe(pipes);
    const W = CONFIG.CANVAS_WIDTH;
    const H = CONFIG.CANVAS_HEIGHT;
    const inputs = [
      (pipe.x - this.x) / W, // horizontal distance to pipe
      pipe.topHeight / H, // gap top
      pipe.gapBottom / H, // gap bottom
      this.y / H, // bird height
      this.vel / CONFIG.MAX_VEL, // bird velocity
    ];
    const { hidden, output } = this.brain.activations(inputs);
    // Remember the last decision so the network visualiser can render this
    // bird's live inputs / neuron activations / jump choice.
    this.lastInputs = inputs;
    this.lastHidden = hidden;
    this.lastOutput = output;
    this.lastJump = output[1] > output[0];
    if (this.lastJump) this.jump();
  }

  collides(pipe) {
    const withinX = this.x + this.width > pipe.x && this.x < pipe.x + pipe.width;
    if (!withinX) return false;
    const hitsTop = this.y < pipe.topHeight;
    const hitsBottom = this.y + this.height > pipe.gapBottom;
    return hitsTop || hitsBottom;
  }

  offscreen() {
    return this.y + this.height >= FLOOR || this.y < 0;
  }

  copy() {
    return new Bird(this.brain);
  }

  draw(context) {
    const frames = SPRITES.birds.yellow;
    this.frame = (this.frame + 1) % (ANIMATION_TIME * frames.length);
    const sprite = frames[Math.floor(this.frame / ANIMATION_TIME)];
    blitRotateCenter(context, sprite, this.x, this.y, this.width, this.height, this.tilt);
  }
}

function blitRotateCenter(context, image, x, y, w, h, angleDeg) {
  context.save();
  context.translate(x + w / 2, y + h / 2);
  context.rotate((angleDeg * Math.PI) / 180);
  context.drawImage(image, -w / 2, -h / 2, w, h);
  context.restore();
}
