export const CONFIG = {
  CANVAS_WIDTH: 576,
  CANVAS_HEIGHT: 1024,
  SCALE: 2,
  POPULATION: 500,
  PIPE_GAP: 220,
  PIPE_VEL: 6,
  PIPE_SPACING: 380,
  // Max vertical change of a pipe's opening from the previous pipe, so
  // consecutive gaps are always reachable within PIPE_SPACING of travel.
  PIPE_MAX_DELTA: 200,
  BASE_VEL: 5,
  GRAVITY: 0.4,
  LIFT: -9,
  MAX_VEL: 14,
  // Genetic-algorithm tuning. Each weight mutates with MUTATION_RATE
  // probability by a gaussian step scaled by MUTATION_STRENGTH. ELITE_COUNT
  // top birds carry into the next generation unmutated so a good brain is
  // never lost. Fitness is score^FITNESS_POWER for stronger selection
  // pressure. These values were tuned via headless simulation to solve
  // reliably (10/10 seeds within ~60 generations).
  MUTATION_RATE: 0.25,
  MUTATION_STRENGTH: 0.2,
  ELITE_COUNT: 50,
  FITNESS_POWER: 3,
  NN_INPUTS: 5,
  NN_HIDDEN: 8,
  NN_OUTPUTS: 2,
  PIPE_MIN_TOP: 80,
  PIPE_MAX_TOP: 620,
};
