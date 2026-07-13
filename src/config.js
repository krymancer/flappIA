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
  MUTATION_RATE: 0.1,
  NN_INPUTS: 5,
  NN_HIDDEN: 8,
  NN_OUTPUTS: 2,
  PIPE_MIN_TOP: 80,
  PIPE_MAX_TOP: 620,
};
