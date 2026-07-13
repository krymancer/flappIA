import { CONFIG } from './config.js';
import { Bird } from './entities/bird.js';

export function createPopulation(n = CONFIG.POPULATION) {
  return Array.from({ length: n }, () => new Bird());
}

export function normalizeFitness(birds) {
  const total = birds.reduce((s, b) => s + b.score, 0);
  if (total === 0) {
    const share = 1 / birds.length;
    birds.forEach((b) => (b.fitness = share));
    return;
  }
  birds.forEach((b) => (b.fitness = b.score / total));
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
  return oldBirds.map(() => poolSelection(oldBirds));
}
