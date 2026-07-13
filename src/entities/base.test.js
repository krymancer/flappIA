import { describe, it, expect } from 'vitest';
import { Base, FLOOR } from './base.js';
import { CONFIG } from '../config.js';

describe('Base', () => {
  it('FLOOR sits one base-height above the canvas bottom', () => {
    expect(FLOOR).toBe(CONFIG.CANVAS_HEIGHT - 112 * CONFIG.SCALE);
  });

  it('move scrolls left and wraps a segment that runs off', () => {
    const b = new Base();
    for (let i = 0; i < 1000; i++) b.move();
    // both segments stay within [-width, width]
    expect(b.x1).toBeGreaterThanOrEqual(-b.width);
    expect(b.x2).toBeGreaterThanOrEqual(-b.width);
  });
});
