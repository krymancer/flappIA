import { describe, it, expect } from 'vitest';
import { Pipe } from './pipe.js';
import { CONFIG } from '../config.js';

describe('Pipe', () => {
  it('gap is PIPE_GAP tall', () => {
    const p = new Pipe(500);
    expect(p.gapBottom - p.topHeight).toBe(CONFIG.PIPE_GAP);
  });

  it('move shifts left by PIPE_VEL', () => {
    const p = new Pipe(500);
    p.move();
    expect(p.x).toBe(500 - CONFIG.PIPE_VEL);
  });

  it('width is native*scale', () => {
    const p = new Pipe(500);
    expect(p.width).toBe(52 * CONFIG.SCALE);
  });

  it('offscreen once fully past the left edge', () => {
    const p = new Pipe(-(52 * CONFIG.SCALE) - 1);
    expect(p.offscreen()).toBe(true);
  });
});
