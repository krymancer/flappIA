import { describe, it, expect } from 'vitest';
import { Game } from './game.js';
import { CONFIG } from './config.js';

describe('Game - activeBirds/allBirds decoupling (regression)', () => {
  it('creates a full population for both allBirds and activeBirds', () => {
    const ctx = {};
    const game = new Game(ctx);
    expect(game.allBirds.length).toBe(CONFIG.POPULATION);
    expect(game.activeBirds.length).toBe(CONFIG.POPULATION);
  });

  it('culling activeBirds must not empty allBirds', () => {
    const ctx = {};
    const game = new Game(ctx);

    // Simulate the whole population dying (as tick() would do via splice).
    game.activeBirds.length = 0;

    expect(game.allBirds.length).toBe(CONFIG.POPULATION);
  });

  it('evolve() repopulates a full new generation after activeBirds empties', () => {
    const ctx = {};
    const game = new Game(ctx);

    game.activeBirds.length = 0;
    game.evolve();

    expect(game.generation).toBe(2);
    expect(game.allBirds.length).toBe(CONFIG.POPULATION);
    expect(game.activeBirds.length).toBe(CONFIG.POPULATION);
  });
});
