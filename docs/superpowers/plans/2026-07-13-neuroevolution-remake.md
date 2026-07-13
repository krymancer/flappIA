# flappIA Neuroevolution Remake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port flappIA's original neuroevolution engine onto the newer animated-sprite rendering so a population of self-flying birds evolves across generations, in a modern Vite + ESLint + Prettier vanilla-JS project.

**Architecture:** Vite vanilla-JS app, ES modules, one concern per file under `src/`. A `Game` object drives a `requestAnimationFrame` loop over a population of `Bird`s; each bird owns a small `NeuralNetwork` (Float32Array, forward-pass only) that decides jumps; a genetic algorithm (`ga.js`) breeds the next generation from fitness-weighted selection + mutation. Pure logic (NN, GA, collision) is unit-tested with Vitest; the render loop is verified behaviorally.

**Tech Stack:** Vanilla JS (ES modules), Vite 5, Vitest, ESLint 9 (flat config), Prettier, HTML5 Canvas 2D. Node 24 / npm 11.

## Global Constraints

- Vanilla JavaScript only — no TypeScript.
- ES modules (`import`/`export`) throughout; `"type": "module"` in package.json.
- Canvas is 576×1024; all sprites render at 2× their native pixel size (native: base 336×112, pipe-green 52×320, bird frame 34×24, background 288×512).
- Neural net shape: 5 inputs, 8 hidden, 2 outputs; sigmoid activation; evolution only (no backprop).
- Population default 250; all tunables live in `src/config.js`.
- Assets stay at repo-root `assets/` and `favicon.ico`; served via Vite `publicDir` set to project root or an explicit `public/` (decided in Task 1).
- Commit after every task with a Conventional Commits message.

---

## File Structure

- Create: `package.json`, `vite.config.js`, `eslint.config.js`, `.prettierrc.json`, `.gitignore`, `index.html` (rewritten), `src/main.js`, `src/game.js`, `src/config.js`, `src/assets.js`, `src/entities/bird.js`, `src/entities/pipe.js`, `src/entities/base.js`, `src/nn/network.js`, `src/ga.js`
- Create tests: `src/nn/network.test.js`, `src/ga.test.js`, `src/entities/bird.test.js`, `src/entities/pipe.test.js`, `src/entities/base.test.js`, `src/assets.test.js`
- Delete: `js/main.js` (and empty `js/`)
- Modify: `README.md`

---

### Task 1: Project tooling scaffold

**Files:**
- Create: `package.json`, `vite.config.js`, `eslint.config.js`, `.prettierrc.json`, `.gitignore`
- Modify: `index.html` (point script at `/src/main.js`)
- Create: `src/main.js` (temporary stub, replaced in Task 9)

**Interfaces:**
- Consumes: nothing.
- Produces: working `npm run dev`, `npm run build`, `npm run lint`, `npm run format`, `npm test`; a `src/main.js` module loaded by `index.html`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "flappia",
  "version": "1.0.0",
  "description": "Neuroevolution Flappy Bird",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "eslint": "^9.13.0",
    "prettier": "^3.3.3",
    "vite": "^5.4.0",
    "vitest": "^2.1.0",
    "jsdom": "^25.0.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

Serves repo-root static `assets/` and `favicon.ico` unchanged, and configures Vitest with jsdom.

```js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'assets-public', // non-existent dir on purpose: keep Vite from copying; we reference /assets directly
  build: { outDir: 'dist' },
  server: { open: true },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
  },
});
```

Note: assets are referenced by absolute URL `/assets/...`. Because `index.html` is at project root, Vite serves sibling `assets/` and `favicon.ico` as static files in dev, and copies referenced ones on build. `publicDir` is pointed at a non-existent folder to avoid double-copying `assets/`.

- [ ] **Step 3: Create `eslint.config.js` (flat config)**

```js
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { window: 'readonly', document: 'readonly', Image: 'readonly', requestAnimationFrame: 'readonly' },
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },
  {
    files: ['**/*.test.js'],
    languageOptions: { globals: { global: 'readonly' } },
  },
];
```

Add `@eslint/js` to devDependencies (Step 1 covers `eslint`; also add `"@eslint/js": "^9.13.0"`).

- [ ] **Step 4: Create `.prettierrc.json`**

```json
{
  "singleQuote": true,
  "semi": true,
  "printWidth": 100,
  "trailingComma": "es5"
}
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules
dist
```

- [ ] **Step 6: Rewrite `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>flappIA — Neuroevolution Flappy Bird</title>
    <link rel="shortcut icon" href="/favicon.ico" />
    <style>
      body {
        margin: 0;
        background: #181717;
        width: 100%;
        height: 100vh;
        position: relative;
      }
      #game {
        position: absolute;
        inset: 0;
        margin: auto;
      }
    </style>
    <script type="module" src="/src/main.js"></script>
  </head>
  <body>
    <canvas id="game" width="576" height="1024"></canvas>
  </body>
</html>
```

- [ ] **Step 7: Create temporary `src/main.js` stub**

```js
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
context.fillStyle = '#fff';
context.font = '24px sans-serif';
context.fillText('flappIA booting…', 20, 40);
```

- [ ] **Step 8: Install and verify tooling**

Run: `npm install`
Then: `npm run lint`
Expected: exits 0 (no errors; warnings allowed).
Then: `npm run build`
Expected: succeeds, produces `dist/`.
Then: `npm test`
Expected: Vitest runs and reports "No test files found" (0 failures) — acceptable at this stage.

- [ ] **Step 9: Commit**

```bash
git add package.json vite.config.js eslint.config.js .prettierrc.json .gitignore index.html src/main.js package-lock.json
git commit -m "chore: scaffold vite + eslint + prettier + vitest tooling"
```

---

### Task 2: Config + asset preloader

**Files:**
- Create: `src/config.js`
- Create: `src/assets.js`
- Test: `src/assets.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `config.js` exports `const CONFIG` with numeric fields: `CANVAS_WIDTH=576`, `CANVAS_HEIGHT=1024`, `SCALE=2`, `POPULATION=250`, `PIPE_GAP=200`, `PIPE_VEL=6`, `PIPE_SPACING=350`, `BASE_VEL=5`, `GRAVITY=0.4`, `LIFT=-9`, `MAX_VEL=14`, `MUTATION_RATE=0.1`, `NN_INPUTS=5`, `NN_HIDDEN=8`, `NN_OUTPUTS=2`, `PIPE_MIN_TOP=80`, `PIPE_MAX_TOP=650`.
  - `assets.js` exports `async function loadAssets()` returning `{ backgrounds, birds, pipes, base }` and, after resolution, a module-level `SPRITES` with the same shape (populated on load). `backgrounds.day/night` are `Image`; `birds.yellow` is a 3-frame `Image[]`; `pipes.green.up/down` are `Image`; `base` is an `Image`.

- [ ] **Step 1: Create `src/config.js`**

```js
export const CONFIG = {
  CANVAS_WIDTH: 576,
  CANVAS_HEIGHT: 1024,
  SCALE: 2,
  POPULATION: 250,
  PIPE_GAP: 200,
  PIPE_VEL: 6,
  PIPE_SPACING: 350,
  BASE_VEL: 5,
  GRAVITY: 0.4,
  LIFT: -9,
  MAX_VEL: 14,
  MUTATION_RATE: 0.1,
  NN_INPUTS: 5,
  NN_HIDDEN: 8,
  NN_OUTPUTS: 2,
  PIPE_MIN_TOP: 80,
  PIPE_MAX_TOP: 650,
};
```

- [ ] **Step 2: Write the failing test `src/assets.test.js`**

Mocks `Image` so `loadAssets()` resolves without a browser (jsdom's Image never fires `onload`).

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.stubGlobal(
    'Image',
    class {
      constructor() {
        this.width = 10;
        this.height = 10;
        setTimeout(() => this.onload && this.onload());
      }
      set src(v) {
        this._src = v;
      }
      get src() {
        return this._src;
      }
    }
  );
});

describe('loadAssets', () => {
  it('resolves with sprite handles', async () => {
    const { loadAssets } = await import('./assets.js');
    const sprites = await loadAssets();
    expect(sprites.base).toBeTruthy();
    expect(sprites.birds.yellow).toHaveLength(3);
    expect(sprites.pipes.green.up).toBeTruthy();
    expect(sprites.backgrounds.day).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/assets.test.js`
Expected: FAIL — cannot resolve `./assets.js` (module not found).

- [ ] **Step 4: Create `src/assets.js`**

```js
function load(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

export let SPRITES = null;

export async function loadAssets() {
  const p = 'assets/sprites/';
  const [
    day,
    night,
    up,
    mid,
    down,
    pipeDown,
    pipeUp,
    base,
  ] = await Promise.all([
    load(`${p}background-day.png`),
    load(`${p}background-night.png`),
    load(`${p}yellowbird-upflap.png`),
    load(`${p}yellowbird-midflap.png`),
    load(`${p}yellowbird-downflap.png`),
    load(`${p}pipe-green.png`),
    load(`${p}pipe-green-up.png`),
    load(`${p}base.png`),
  ]);

  SPRITES = {
    backgrounds: { day, night },
    birds: { yellow: [up, mid, down] },
    pipes: { green: { down: pipeDown, up: pipeUp } },
    base,
  };
  return SPRITES;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/assets.test.js`
Expected: PASS.

- [ ] **Step 6: Lint and commit**

Run: `npm run lint`
Expected: exits 0.

```bash
git add src/config.js src/assets.js src/assets.test.js
git commit -m "feat: add config and async sprite preloader"
```

---

### Task 3: Neural network (Float32Array, forward-only)

**Files:**
- Create: `src/nn/network.js`
- Test: `src/nn/network.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces `class NeuralNetwork`:
  - `new NeuralNetwork(inputs, hidden, outputs)` — random weights in `[-1, 1]`.
  - `predict(inputArray: number[]): number[]` — length `outputs`, each in `(0,1)`.
  - `copy(): NeuralNetwork` — deep clone (independent weight arrays).
  - `mutate(rate: number): void` — each weight/bias, with probability `rate`, gets gaussian noise added.
  - Fields used by `copy`: `inputs`, `hidden`, `outputs`, `weightsIH`, `weightsHO`, `biasH`, `biasO` (all `Float32Array` except the three counts).

- [ ] **Step 1: Write the failing test `src/nn/network.test.js`**

```js
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/nn/network.test.js`
Expected: FAIL — module `./network.js` not found.

- [ ] **Step 3: Create `src/nn/network.js`**

```js
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

  predict(inputArray) {
    const { inputs, hidden, outputs, weightsIH, weightsHO, biasH, biasO } = this;

    const h = new Float32Array(hidden);
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
    return out;
  }

  copy() {
    const clone = new NeuralNetwork(this.inputs, this.hidden, this.outputs);
    clone.weightsIH = this.weightsIH.slice();
    clone.weightsHO = this.weightsHO.slice();
    clone.biasH = this.biasH.slice();
    clone.biasO = this.biasO.slice();
    return clone;
  }

  mutate(rate) {
    const mut = (arr) => {
      for (let i = 0; i < arr.length; i++) {
        if (Math.random() < rate) arr[i] += gaussian() * 0.5;
      }
    };
    mut(this.weightsIH);
    mut(this.weightsHO);
    mut(this.biasH);
    mut(this.biasO);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/nn/network.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Lint and commit**

Run: `npm run lint`
Expected: exits 0.

```bash
git add src/nn/network.js src/nn/network.test.js
git commit -m "feat: add float32 neural network (predict/copy/mutate)"
```

---

### Task 4: Pipe entity

**Files:**
- Create: `src/entities/pipe.js`
- Test: `src/entities/pipe.test.js`

**Interfaces:**
- Consumes: `CONFIG` from `src/config.js`; `SPRITES` from `src/assets.js` (only inside `draw`).
- Produces `class Pipe`:
  - `new Pipe(x)` — sets `this.x = x`, random gap; `this.topHeight` (y where the top pipe's opening ends), `this.gapBottom = this.topHeight + CONFIG.PIPE_GAP`.
  - `move()` — `this.x -= CONFIG.PIPE_VEL`.
  - `get width()` — `52 * CONFIG.SCALE` (= 104).
  - `offscreen(): boolean` — `this.x + this.width < 0`.
  - `draw(context)` — draws top + bottom green pipes at 2× scale.
  - `passed(birdX): boolean` — `this.x + this.width < birdX` (for scoring hook; optional use).

- [ ] **Step 1: Write the failing test `src/entities/pipe.test.js`**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/entities/pipe.test.js`
Expected: FAIL — `./pipe.js` not found.

- [ ] **Step 3: Create `src/entities/pipe.js`**

```js
import { CONFIG } from '../config.js';
import { SPRITES } from '../assets.js';

const rand = (min, max) => Math.floor(Math.random() * (max - min)) + min;

export class Pipe {
  constructor(x) {
    this.x = x;
    this.topHeight = rand(CONFIG.PIPE_MIN_TOP, CONFIG.PIPE_MAX_TOP);
    this.gapBottom = this.topHeight + CONFIG.PIPE_GAP;
  }

  get width() {
    return 52 * CONFIG.SCALE;
  }

  move() {
    this.x -= CONFIG.PIPE_VEL;
  }

  offscreen() {
    return this.x + this.width < 0;
  }

  passed(birdX) {
    return this.x + this.width < birdX;
  }

  draw(context) {
    const green = SPRITES.pipes.green;
    const w = 52 * CONFIG.SCALE;
    const h = 320 * CONFIG.SCALE;
    // top pipe (upside-down sprite), bottom edge sits at topHeight
    context.drawImage(green.up, this.x, this.topHeight - h, w, h);
    // bottom pipe, top edge sits at gapBottom
    context.drawImage(green.down, this.x, this.gapBottom, w, h);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/entities/pipe.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Lint and commit**

Run: `npm run lint`
Expected: exits 0.

```bash
git add src/entities/pipe.js src/entities/pipe.test.js
git commit -m "feat: add pipe entity with gap geometry"
```

---

### Task 5: Base (scrolling ground)

**Files:**
- Create: `src/entities/base.js`
- Test: `src/entities/base.test.js`

**Interfaces:**
- Consumes: `CONFIG`; `SPRITES` (inside `draw`).
- Produces `class Base`:
  - `new Base()` — `this.y = FLOOR` where `FLOOR = CONFIG.CANVAS_HEIGHT - 112 * CONFIG.SCALE`; `this.x1 = 0`, `this.x2 = width`.
  - static/exported `FLOOR` value reused by Bird for ground collision.
  - `get width()` — `336 * CONFIG.SCALE`.
  - `move()` — scroll both segments left by `CONFIG.BASE_VEL`, wrapping.
  - `draw(context)`.

- [ ] **Step 1: Write the failing test `src/entities/base.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { Base, FLOOR } from './base.js';
import { CONFIG } from '../config.js';

describe('Base', () => {
  it('FLOOR sits one base-height above the canvas bottom', () => {
    expect(FLOOR).toBe(CONFIG.CANVAS_HEIGHT - 112 * CONFIG.SCALE);
  });

  it('move scrolls left and wraps a segment that runs off', () => {
    const b = new Base();
    for (let i = 0; i < 1000; i++) b.move();
    // both segments stay within [-width, width]
    expect(b.x1).toBeGreaterThanOrEqual(-b.width);
    expect(b.x2).toBeGreaterThanOrEqual(-b.width);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/entities/base.test.js`
Expected: FAIL — `./base.js` not found.

- [ ] **Step 3: Create `src/entities/base.js`**

```js
import { CONFIG } from '../config.js';
import { SPRITES } from '../assets.js';

export const FLOOR = CONFIG.CANVAS_HEIGHT - 112 * CONFIG.SCALE;

export class Base {
  constructor() {
    this.y = FLOOR;
    this.x1 = 0;
    this.x2 = this.width;
  }

  get width() {
    return 336 * CONFIG.SCALE;
  }

  move() {
    const w = this.width;
    this.x1 -= CONFIG.BASE_VEL;
    this.x2 -= CONFIG.BASE_VEL;
    if (this.x1 + w < 0) this.x1 = this.x2 + w;
    if (this.x2 + w < 0) this.x2 = this.x1 + w;
  }

  draw(context) {
    const w = this.width;
    const h = 112 * CONFIG.SCALE;
    context.drawImage(SPRITES.base, this.x1, this.y, w, h);
    context.drawImage(SPRITES.base, this.x2, this.y, w, h);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/entities/base.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Lint and commit**

Run: `npm run lint`
Expected: exits 0.

```bash
git add src/entities/base.js src/entities/base.test.js
git commit -m "feat: add scrolling base entity"
```

---

### Task 6: Bird entity (physics, AI, collision, render)

**Files:**
- Create: `src/entities/bird.js`
- Test: `src/entities/bird.test.js`

**Interfaces:**
- Consumes: `CONFIG`; `SPRITES` (inside `draw`); `FLOOR` from `./base.js`; `NeuralNetwork` from `../nn/network.js`; `Pipe` shape (`x`, `width`, `topHeight`, `gapBottom`).
- Produces `class Bird`:
  - `new Bird(brain?)` — if `brain` is a `NeuralNetwork`, `this.brain = brain.copy()` then `this.brain.mutate(CONFIG.MUTATION_RATE)`; else fresh `new NeuralNetwork(NN_INPUTS, NN_HIDDEN, NN_OUTPUTS)`. Start `x=115`, `y=350`, `vel=0`, `score=0`, `fitness=0`, `alive=true`.
  - `get width()` = `34 * CONFIG.SCALE`; `get height()` = `24 * CONFIG.SCALE`.
  - `jump()` — `this.vel = CONFIG.LIFT`.
  - `update()` — gravity: `vel += GRAVITY`, clamp `vel` to `MAX_VEL`, `y += vel`, `score++`.
  - `think(pipes)` — pick nearest pipe with `x + width >= this.x`; build 5 normalized inputs; `predict`; if `out[1] > out[0]` → `jump()`.
  - `collides(pipe): boolean` — AABB vs top and bottom pipe rects.
  - `offscreen(): boolean` — `y + height >= FLOOR || y < 0`.
  - `draw(context)` — animated frame + rotation via internal `blitRotateCenter`.
  - `copy(): Bird` — `new Bird(this.brain)`.

- [ ] **Step 1: Write the failing test `src/entities/bird.test.js`**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/entities/bird.test.js`
Expected: FAIL — `./bird.js` not found.

- [ ] **Step 3: Create `src/entities/bird.js`**

```js
import { CONFIG } from '../config.js';
import { SPRITES } from '../assets.js';
import { FLOOR } from './base.js';
import { NeuralNetwork } from '../nn/network.js';

const ANIMATION_TIME = 5;

export class Bird {
  constructor(brain) {
    if (brain instanceof NeuralNetwork) {
      this.brain = brain.copy();
      this.brain.mutate(CONFIG.MUTATION_RATE);
    } else {
      this.brain = new NeuralNetwork(CONFIG.NN_INPUTS, CONFIG.NN_HIDDEN, CONFIG.NN_OUTPUTS);
    }
    this.x = 115;
    this.y = 350;
    this.vel = 0;
    this.tilt = 0;
    this.frame = 0;
    this.score = 0;
    this.fitness = 0;
    this.alive = true;
  }

  get width() {
    return 34 * CONFIG.SCALE;
  }

  get height() {
    return 24 * CONFIG.SCALE;
  }

  jump() {
    this.vel = CONFIG.LIFT;
  }

  update() {
    this.vel += CONFIG.GRAVITY;
    if (this.vel > CONFIG.MAX_VEL) this.vel = CONFIG.MAX_VEL;
    this.y += this.vel;
    this.tilt = Math.max(-90, Math.min(25, -this.vel * 3));
    this.score++;
  }

  nearestPipe(pipes) {
    let nearest = null;
    let record = Infinity;
    for (const pipe of pipes) {
      const right = pipe.x + pipe.width;
      if (right >= this.x && pipe.x - this.x < record) {
        record = pipe.x - this.x;
        nearest = pipe;
      }
    }
    return nearest ?? pipes[0];
  }

  think(pipes) {
    const pipe = this.nearestPipe(pipes);
    const W = CONFIG.CANVAS_WIDTH;
    const H = CONFIG.CANVAS_HEIGHT;
    const inputs = [
      (pipe.x - this.x) / W, // horizontal distance to pipe
      pipe.topHeight / H, // gap top
      pipe.gapBottom / H, // gap bottom
      this.y / H, // bird height
      this.vel / CONFIG.MAX_VEL, // bird velocity
    ];
    const out = this.brain.predict(inputs);
    if (out[1] > out[0]) this.jump();
  }

  collides(pipe) {
    const withinX = this.x + this.width > pipe.x && this.x < pipe.x + pipe.width;
    if (!withinX) return false;
    const hitsTop = this.y < pipe.topHeight;
    const hitsBottom = this.y + this.height > pipe.gapBottom;
    return hitsTop || hitsBottom;
  }

  offscreen() {
    return this.y + this.height >= FLOOR || this.y < 0;
  }

  copy() {
    return new Bird(this.brain);
  }

  draw(context) {
    const frames = SPRITES.birds.yellow;
    this.frame = (this.frame + 1) % (ANIMATION_TIME * frames.length);
    const sprite = frames[Math.floor(this.frame / ANIMATION_TIME)];
    blitRotateCenter(context, sprite, this.x, this.y, this.width, this.height, this.tilt);
  }
}

function blitRotateCenter(context, image, x, y, w, h, angleDeg) {
  context.save();
  context.translate(x + w / 2, y + h / 2);
  context.rotate((angleDeg * Math.PI) / 180);
  context.drawImage(image, -w / 2, -h / 2, w, h);
  context.restore();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/entities/bird.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Lint and commit**

Run: `npm run lint`
Expected: exits 0.

```bash
git add src/entities/bird.js src/entities/bird.test.js
git commit -m "feat: add bird entity with physics, AI, collision, rotation"
```

---

### Task 7: Genetic algorithm

**Files:**
- Create: `src/ga.js`
- Test: `src/ga.test.js`

**Interfaces:**
- Consumes: `Bird` from `./entities/bird.js`; `CONFIG`.
- Produces:
  - `createPopulation(n = CONFIG.POPULATION): Bird[]` — `n` fresh birds.
  - `normalizeFitness(birds: Bird[]): void` — sets each `bird.fitness = bird.score / totalScore` (guards total 0 → equal shares).
  - `poolSelection(birds: Bird[]): Bird` — roulette-wheel pick by `fitness`, returns a `bird.copy()`.
  - `nextGeneration(oldBirds: Bird[]): Bird[]` — normalize then produce `oldBirds.length` children via `poolSelection`.

- [ ] **Step 1: Write the failing test `src/ga.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { createPopulation, normalizeFitness, poolSelection, nextGeneration } from './ga.js';

describe('genetic algorithm', () => {
  it('createPopulation makes N birds', () => {
    expect(createPopulation(10)).toHaveLength(10);
  });

  it('normalizeFitness makes fitness sum to 1', () => {
    const birds = createPopulation(4);
    birds.forEach((b, i) => (b.score = i + 1)); // 1,2,3,4 => sum 10
    normalizeFitness(birds);
    const sum = birds.reduce((s, b) => s + b.fitness, 0);
    expect(sum).toBeCloseTo(1);
    expect(birds[3].fitness).toBeCloseTo(0.4);
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/ga.test.js`
Expected: FAIL — `./ga.js` not found.

- [ ] **Step 3: Create `src/ga.js`**

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/ga.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Lint and commit**

Run: `npm run lint`
Expected: exits 0.

```bash
git add src/ga.js src/ga.test.js
git commit -m "feat: add genetic algorithm (population, fitness, selection)"
```

---

### Task 8: Game loop

**Files:**
- Create: `src/game.js`

**Interfaces:**
- Consumes: `CONFIG`; `SPRITES`; `Base`, `Pipe`, `Bird`; `createPopulation`, `nextGeneration`.
- Produces `class Game`:
  - `new Game(context)` — stores context, `createPopulation()`, initial pipes, `new Base()`, `generation=1`, `bestScore=0`.
  - `start()` — kicks the `requestAnimationFrame` loop.
  - internal `tick()` — one frame; `spawnPipes()`, `recyclePipes()`, per-bird think/update/collision, draw, HUD; when all dead → `evolve()`.

- [ ] **Step 1: Create `src/game.js`**

```js
import { CONFIG } from './config.js';
import { SPRITES } from './assets.js';
import { Base } from './entities/base.js';
import { Pipe } from './entities/pipe.js';
import { createPopulation, nextGeneration } from './ga.js';

export class Game {
  constructor(context) {
    this.ctx = context;
    this.base = new Base();
    this.generation = 1;
    this.bestScore = 0;
    this.reset(createPopulation());
  }

  reset(birds) {
    this.activeBirds = birds;
    this.allBirds = birds;
    this.pipes = [
      new Pipe(CONFIG.CANVAS_WIDTH),
      new Pipe(CONFIG.CANVAS_WIDTH + CONFIG.PIPE_SPACING),
    ];
  }

  evolve() {
    this.generation++;
    this.reset(nextGeneration(this.allBirds));
  }

  updatePipes() {
    this.pipes.forEach((p) => p.move());
    if (this.pipes[0].offscreen()) {
      this.pipes.shift();
      const last = this.pipes[this.pipes.length - 1];
      this.pipes.push(new Pipe(last.x + CONFIG.PIPE_SPACING));
    }
  }

  start() {
    const loop = () => {
      this.tick();
      requestAnimationFrame(loop);
    };
    loop();
  }

  tick() {
    const ctx = this.ctx;
    this.base.move();
    this.updatePipes();

    for (let i = this.activeBirds.length - 1; i >= 0; i--) {
      const bird = this.activeBirds[i];
      bird.think(this.pipes);
      bird.update();
      const dead = bird.offscreen() || this.pipes.some((p) => bird.collides(p));
      if (dead) this.activeBirds.splice(i, 1);
      if (bird.score > this.bestScore) this.bestScore = bird.score;
    }

    // draw
    ctx.drawImage(SPRITES.backgrounds.day, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    this.pipes.forEach((p) => p.draw(ctx));
    this.activeBirds.forEach((b) => b.draw(ctx));
    this.base.draw(ctx);
    this.drawHud();

    if (this.activeBirds.length === 0) this.evolve();
  }

  drawHud() {
    const ctx = this.ctx;
    ctx.fillStyle = '#fff';
    ctx.font = '28px sans-serif';
    ctx.fillText(`Generation: ${this.generation}`, 20, 40);
    ctx.fillText(`Alive: ${this.activeBirds.length}`, 20, 76);
    ctx.fillText(`Best: ${this.bestScore}`, 20, 112);
  }
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: exits 0 (warnings allowed).

- [ ] **Step 3: Run full test suite (nothing regressed)**

Run: `npm test`
Expected: all prior tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/game.js
git commit -m "feat: add game loop with pipe recycling, evolution, HUD"
```

---

### Task 9: Bootstrap, cleanup, behavioral verification, README

**Files:**
- Modify: `src/main.js` (replace stub)
- Delete: `js/main.js` (and empty `js/` dir)
- Modify: `README.md`

**Interfaces:**
- Consumes: `loadAssets` from `./assets.js`; `Game` from `./game.js`.
- Produces: running application.

- [ ] **Step 1: Replace `src/main.js`**

```js
import { loadAssets } from './assets.js';
import { Game } from './game.js';

async function boot() {
  const canvas = document.getElementById('game');
  const context = canvas.getContext('2d');
  try {
    await loadAssets();
  } catch (err) {
    context.fillStyle = '#fff';
    context.font = '24px sans-serif';
    context.fillText('Failed to load assets — check console.', 20, 60);
    console.error(err);
    return;
  }
  new Game(context).start();
}

boot();
```

- [ ] **Step 2: Delete legacy file**

```bash
git rm js/main.js
```

- [ ] **Step 3: Update `README.md`**

```markdown
# flappIA

Neuroevolution Flappy Bird — a population of birds, each driven by a small
neural network, learns to fly through pipes by genetic algorithm. Built with
vanilla JS + Vite.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the build
- `npm test` — run unit tests (Vitest)
- `npm run lint` — ESLint
- `npm run format` — Prettier

## How it works

Each bird has a 5→8→2 neural network. Inputs: horizontal distance to the next
pipe, gap top, gap bottom, bird height, bird velocity. When output[1] > output[0]
the bird jumps. When every bird has died, the next generation is bred by
fitness-weighted (score) roulette selection plus mutation. Tunables live in
`src/config.js`.
```

- [ ] **Step 4: Full verification — tests, lint, build**

Run: `npm test`
Expected: all tests PASS.
Run: `npm run lint`
Expected: exits 0.
Run: `npm run build`
Expected: succeeds, `dist/` produced.

- [ ] **Step 5: Behavioral verification (manual)**

Run: `npm run dev`
Open the served URL. Confirm:
- Game boots (no blank canvas / no console errors).
- Birds fall, flap (animated), and tilt with velocity.
- Birds die on pipe/ground contact and are removed.
- HUD shows Generation, Alive count, Best score.
- When all birds die, Generation increments and a new population spawns.
- Over several generations, Best score trends upward (learning).

If any check fails, use superpowers:systematic-debugging before proceeding.

- [ ] **Step 6: Commit**

```bash
git add src/main.js README.md
git commit -m "feat: wire bootstrap, remove legacy main.js, update README"
```

---

## Self-Review Notes

- **Spec coverage:** tooling (Task 1), config+asset-race fix (Task 2), modernized NN predict/copy/mutate (Task 3), pipe+recycling (Tasks 4/8), base (Task 5), bird physics/AI/real-collision/fixed-rotation (Task 6), GA fitness/selection/mutation (Task 7), game loop+HUD (Task 8), bootstrap+bug-fixes+verify (Task 9). All spec sections mapped.
- **Fixes from spec:** asset race (Task 2 preloader), real AABB collision (Task 6 `collides`), `blitRotateCenter` rotation (Task 6), pipe recycling (Task 8 `updatePipes`), physics re-enabled (Task 6 `update` called in Task 8 loop).
- **Type consistency:** `SPRITES` shape defined in Task 2 is consumed identically in Tasks 4/5/6/8. `NeuralNetwork` fields (`weightsIH` etc.) defined Task 3, used by Bird copy Task 6. `Pipe` fields (`x`, `width`, `topHeight`, `gapBottom`) defined Task 4, consumed by Bird `collides`/`think` Task 6 and Game Task 8. `Bird` API (`think/update/collides/offscreen/copy/score/fitness`) defined Task 6, consumed by GA Task 7 and Game Task 8.
- **Out of scope (per spec):** TypeScript, keyboard mode, audio wiring, brain persistence.
