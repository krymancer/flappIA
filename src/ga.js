import { CONFIG } from './config.js';
import { Bird } from './entities/bird.js';

export function createPopulation(n = CONFIG.POPULATION) {
  return Array.from({ length: n }, () => new Bird());
}

export function normalizeFitness(birds) {
  // Raise the score to FITNESS_POWER so higher performers get
  // disproportionately more selection weight (stronger pressure than linear).
  const p = CONFIG.FITNESS_POWER;
  const weight = (b) => Math.pow(b.score, p);
  const total = birds.reduce((s, b) => s + weight(b), 0);
  if (total === 0) {
    const share = 1 / birds.length;
    birds.forEach((b) => (b.fitness = share));
    return;
  }
  birds.forEach((b) => (b.fitness = weight(b) / total));
}

export function poolSelection(birds) {
  let r = Math.random();
  let index = 0;
  while (r > 0 && index < birds.length - 1) {
    r -= birds[index].fitness;
    index++;
  }
  if (r > 0) index = birds.length - 1;
  else index--;
  if (index < 0) index = 0;
  return birds[index].copy();
}

export function nextGeneration(oldBirds) {
  normalizeFitness(oldBirds);

  // Elitism: carry the top ELITE_COUNT brains into the next generation
  // unmutated, so the best solution found so far is never lost.
  const eliteCount = Math.min(CONFIG.ELITE_COUNT, oldBirds.length);
  const elites = [...oldBirds]
    .sort((a, b) => b.score - a.score)
    .slice(0, eliteCount)
    .map((b) => new Bird(b.brain, false));

  const next = elites;
  while (next.length < oldBirds.length) {
    next.push(poolSelection(oldBirds));
  }
  return next;
}
