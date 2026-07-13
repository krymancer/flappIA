import { CONFIG } from '../config.js';
import { SPRITES } from '../assets.js';

export const FLOOR = CONFIG.CANVAS_HEIGHT - 112 * CONFIG.SCALE;

export class Base {
  constructor() {
    this.y = FLOOR;
    this.x1 = 0;
    this.x2 = this.width;
  }

  get width() {
    return 336 * CONFIG.SCALE;
  }

  move() {
    const w = this.width;
    this.x1 -= CONFIG.BASE_VEL;
    this.x2 -= CONFIG.BASE_VEL;
    if (this.x1 + w < 0) this.x1 = this.x2 + w;
    if (this.x2 + w < 0) this.x2 = this.x1 + w;
  }

  draw(context) {
    const w = this.width;
    const h = 112 * CONFIG.SCALE;
    context.drawImage(SPRITES.base, this.x1, this.y, w, h);
    context.drawImage(SPRITES.base, this.x2, this.y, w, h);
  }
}
