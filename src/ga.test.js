import { describe, it, expect } from 'vitest';
import { createPopulation, normalizeFitness, poolSelection, nextGeneration } from './ga.js';

describe('genetic algorithm', () => {
  it('createPopulation makes N birds', () => {
    expect(createPopulation(10)).toHaveLength(10);
  });

  it('normalizeFitness uses score^power and sums to 1', () => {
    const birds = createPopulation(4);
    birds.forEach((b, i) => (b.score = i + 1)); // 1,2,3,4 => cubes 1,8,27,64 sum 100
    normalizeFitness(birds);
    const sum = birds.reduce((s, b) => s + b.fitness, 0);
    expect(sum).toBeCloseTo(1);
    expect(birds[3].fitness).toBeCloseTo(64 / 100); // score^3, not linear 0.4
  });

  it('normalizeFitness handles all-zero scores without NaN', () => {
    const birds = createPopulation(3);
    normalizeFitness(birds);
    expect(birds.every((b) => Number.isFinite(b.fitness))).toBe(true);
  });

  it('poolSelection returns a Bird copy', () => {
    const birds = createPopulation(3);
    birds.forEach((b) => (b.score = 1));
    normalizeFitness(birds);
    const picked = poolSelection(birds);
    expect(picked).toBeTruthy();
    expect(typeof picked.think).toBe('function');
  });

  it('nextGeneration preserves population size', () => {
    const birds = createPopulation(5);
    birds.forEach((b, i) => (b.score = i + 1));
    const next = nextGeneration(birds);
    expect(next).toHaveLength(5);
  });

  it('nextGeneration carries the best brain forward unmutated (elitism)', () => {
    const birds = createPopulation(30);
    birds.forEach((b, i) => (b.score = i)); // birds[29] is the clear best
    const bestWeights = Array.from(birds[29].brain.weightsIH);
    const next = nextGeneration(birds);
    // an elite copy of the best brain must exist unchanged in the new generation
    const carried = next.some(
      (b) =>
        b.brain.weightsIH.length === bestWeights.length &&
        Array.from(b.brain.weightsIH).every((w, i) => w === bestWeights[i])
    );
    expect(carried).toBe(true);
  });
});
