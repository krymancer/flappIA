import { CONFIG } from '../config.js';
import { SPRITES } from '../assets.js';

const rand = (min, max) => Math.floor(Math.random() * (max - min)) + min;

export class Pipe {
  // prevTopHeight (optional): the previous pipe's opening, so this one's gap
  // stays within PIPE_MAX_DELTA of it and remains reachable.
  constructor(x, prevTopHeight) {
    this.x = x;
    const { PIPE_MIN_TOP, PIPE_MAX_TOP, PIPE_MAX_DELTA } = CONFIG;
    let lo = PIPE_MIN_TOP;
    let hi = PIPE_MAX_TOP;
    if (prevTopHeight != null) {
      lo = Math.max(PIPE_MIN_TOP, prevTopHeight - PIPE_MAX_DELTA);
      hi = Math.min(PIPE_MAX_TOP, prevTopHeight + PIPE_MAX_DELTA);
    }
    this.topHeight = rand(lo, hi + 1);
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
