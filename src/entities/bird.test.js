import { describe, it, expect } from 'vitest';
import { Bird } from './bird.js';
import { FLOOR } from './base.js';
import { CONFIG } from '../config.js';

function fakePipe(x, topHeight) {
  return { x, width: 104, topHeight, gapBottom: topHeight + CONFIG.PIPE_GAP };
}

describe('Bird', () => {
  it('collides when overlapping the top pipe', () => {
    const b = new Bird();
    b.y = 10; // near top
    const pipe = fakePipe(b.x, 400); // gap far below, bird hits top pipe
    expect(b.collides(pipe)).toBe(true);
  });

  it('does not collide when inside the gap', () => {
    const b = new Bird();
    const pipe = fakePipe(b.x, b.y - 20); // gap starts above bird, gapBottom below
    expect(b.collides(pipe)).toBe(false);
  });

  it('does not collide when pipe is not horizontally aligned', () => {
    const b = new Bird();
    b.y = 10;
    const pipe = fakePipe(b.x + 1000, 400);
    expect(b.collides(pipe)).toBe(false);
  });

  it('offscreen when below the floor', () => {
    const b = new Bird();
    b.y = FLOOR;
    expect(b.offscreen()).toBe(true);
  });

  it('update applies gravity and increments score', () => {
    const b = new Bird();
    b.update();
    expect(b.vel).toBeCloseTo(CONFIG.GRAVITY);
    expect(b.score).toBe(1);
  });

  it('think jumps when the network favors output[1]', () => {
    const b = new Bird();
    b.brain = { predict: () => [0.1, 0.9] };
    b.vel = 5;
    b.think([fakePipe(b.x + 50, 300)]);
    expect(b.vel).toBe(CONFIG.LIFT);
  });

  it('think does not jump when the network favors output[0]', () => {
    const b = new Bird();
    b.brain = { predict: () => [0.9, 0.1] };
    b.vel = 5;
    b.think([fakePipe(b.x + 50, 300)]);
    expect(b.vel).toBe(5);
  });
});
