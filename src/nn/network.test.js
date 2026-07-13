import { describe, it, expect } from 'vitest';
import { NeuralNetwork } from './network.js';

describe('NeuralNetwork', () => {
  it('predict returns outputs in (0,1) of correct length', () => {
    const nn = new NeuralNetwork(5, 8, 2);
    const out = nn.predict([0.1, 0.2, 0.3, 0.4, 0.5]);
    expect(out).toHaveLength(2);
    for (const v of out) {
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic for the same inputs', () => {
    const nn = new NeuralNetwork(5, 8, 2);
    const a = nn.predict([0.1, 0.2, 0.3, 0.4, 0.5]);
    const b = nn.predict([0.1, 0.2, 0.3, 0.4, 0.5]);
    expect(a).toEqual(b);
  });

  it('copy produces an independent identical network', () => {
    const nn = new NeuralNetwork(5, 8, 2);
    const clone = nn.copy();
    const input = [0.5, 0.5, 0.5, 0.5, 0.5];
    expect(clone.predict(input)).toEqual(nn.predict(input));
    clone.mutate(1); // mutate clone fully
    expect(clone.weightsIH).not.toEqual(nn.weightsIH);
  });

  it('mutate(0) changes nothing', () => {
    const nn = new NeuralNetwork(5, 8, 2);
    const before = Array.from(nn.weightsIH);
    nn.mutate(0);
    expect(Array.from(nn.weightsIH)).toEqual(before);
  });

  it('activations exposes hidden + output layers, and predict returns the output', () => {
    const nn = new NeuralNetwork(5, 8, 2);
    const input = [0.1, 0.2, 0.3, 0.4, 0.5];
    const { hidden, output } = nn.activations(input);
    expect(hidden).toHaveLength(8);
    expect(output).toHaveLength(2);
    for (const v of [...hidden, ...output]) {
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(1);
    }
    expect(nn.predict(input)).toEqual(output);
  });
});
