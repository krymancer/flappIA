import { CONFIG } from '../config.js';
import { SPRITES } from '../assets.js';

const rand = (min, max) => Math.floor(Math.random() * (max - min)) + min;

export class Pipe {
  constructor(x) {
    this.x = x;
    this.topHeight = rand(CONFIG.PIPE_MIN_TOP, CONFIG.PIPE_MAX_TOP);
    this.gapBottom = this.topHeight + CONFIG.PIPE_GAP;
  }

  get width() {
    return 52 * CONFIG.SCALE;
  }

  move() {
    this.x -= CONFIG.PIPE_VEL;
  }

  offscreen() {
    return this.x + this.width < 0;
  }

  passed(birdX) {
    return this.x + this.width < birdX;
  }

  draw(context) {
    const green = SPRITES.pipes.green;
    const w = 52 * CONFIG.SCALE;
    const h = 320 * CONFIG.SCALE;
    // top pipe (upside-down sprite), bottom edge sits at topHeight
    context.drawImage(green.up, this.x, this.topHeight - h, w, h);
    // bottom pipe, top edge sits at gapBottom
    context.drawImage(green.down, this.x, this.gapBottom, w, h);
  }
}
