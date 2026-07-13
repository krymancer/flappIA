const sigmoid = (x) => 1 / (1 + Math.exp(-x));

function randArray(n) {
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
  return a;
}

// Standard-normal sample (Box–Muller).
function gaussian() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export class NeuralNetwork {
  constructor(inputs, hidden, outputs) {
    this.inputs = inputs;
    this.hidden = hidden;
    this.outputs = outputs;
    this.weightsIH = randArray(hidden * inputs);
    this.weightsHO = randArray(outputs * hidden);
    this.biasH = randArray(hidden);
    this.biasO = randArray(outputs);
  }

  // Full forward pass exposing the hidden-layer activations as well as the
  // outputs — used by the network visualiser to light up firing neurons.
  activations(inputArray) {
    const { inputs, hidden, outputs, weightsIH, weightsHO, biasH, biasO } = this;

    const h = new Array(hidden);
    for (let i = 0; i < hidden; i++) {
      let sum = biasH[i];
      for (let j = 0; j < inputs; j++) sum += weightsIH[i * inputs + j] * inputArray[j];
      h[i] = sigmoid(sum);
    }

    const out = new Array(outputs);
    for (let i = 0; i < outputs; i++) {
      let sum = biasO[i];
      for (let j = 0; j < hidden; j++) sum += weightsHO[i * hidden + j] * h[j];
      out[i] = sigmoid(sum);
    }
    return { hidden: h, output: out };
  }

  predict(inputArray) {
    return this.activations(inputArray).output;
  }

  copy() {
    const clone = new NeuralNetwork(this.inputs, this.hidden, this.outputs);
    clone.weightsIH = this.weightsIH.slice();
    clone.weightsHO = this.weightsHO.slice();
    clone.biasH = this.biasH.slice();
    clone.biasO = this.biasO.slice();
    return clone;
  }

  mutate(rate, strength = 0.5) {
    const mut = (arr) => {
      for (let i = 0; i < arr.length; i++) {
        if (Math.random() < rate) arr[i] += gaussian() * strength;
      }
    };
    mut(this.weightsIH);
    mut(this.weightsHO);
    mut(this.biasH);
    mut(this.biasO);
  }
}
