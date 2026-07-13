# flappIA — Neuroevolution Remake Design

Date: 2026-07-13

## Goal

Finish the mid-flight "Remake" of flappIA by porting the project's original
neuroevolution engine onto the newer animated-sprite rendering. Birds fly
themselves; a population evolves across generations toward high scores. The
result is a modern, tooled, runnable vanilla-JS project.

## Background

The repo went through two eras:

- **Pre-"Remake" (commit `1a38550`..`51bd2ed`, tree at `HEAD~1`):** a working
  neuroevolution Flappy Bird. Files: `NeuralNetwork.js` + `Matrix.js`
  (Shiffman / Toy-Neural-Network style), `Bird.js` (`think()` feeds pipe/bird
  positions into the net and decides to jump), `Pipe.js`, `layers.js`, and a
  `main.js` genetic-algorithm loop (population of 1000, fitness = score,
  fitness normalization, pool selection, mutation).
- **"Remake" (commit `f85163c`, `HEAD`):** the graphics were rebuilt with real
  Flappy Bird sprites, day/night backgrounds, an animated + rotating bird, and a
  scrolling base. All AI was stripped to a single WIP `js/main.js`. The AI was
  never re-wired — which is why `bird.move()` is commented out in the loop and
  `Pipe.collide()` is a `return false` stub.

This design closes that gap: keep the new rendering, bring back the AI, and
modernize the whole thing.

## Decisions (agreed)

- **Port the GA onto the new render.** Not a fresh algorithm — reuse the proven
  neuroevolution approach.
- **Modernize the neural net.** Keep only what the GA needs: `predict`, `copy`,
  `mutate`. Drop `train()`/backprop/`serialize` and the separate `Matrix` class.
  Use flat `Float32Array` weights with a small direct forward pass.
- **Tooling: Vite + ESLint + Prettier**, vanilla JS (no TypeScript), ES modules
  split one concern per file. Static `vite build` output.
- **Population default 250** (old code used 1000; heavier now with per-frame
  animated sprites). Lives in `config.js`, trivially changed.
- **GitHub repo unarchived** (`krymancer/flappIA`) — already done.

## Architecture

Vite vanilla-JS project. One class/concern per file:

```
flappIA/
  index.html              # Vite entry, <canvas id="game">
  package.json            # scripts: dev, build, preview, lint, format
  vite.config.js
  .eslintrc.json / .prettierrc.json
  .gitignore              # node_modules, dist
  src/
    main.js               # bootstrap: await loadAssets() -> new Game() -> start
    game.js               # Game: owns population, pipes, base, generation, HUD, RAF loop
    config.js             # tunables (POPULATION, GAP, speeds, gravity, mutationRate, sizes)
    assets.js             # preload all sprites (and audio) -> Promise; exports handles
    entities/
      bird.js             # Bird: physics, sprite animation, rotation, collision, think()
      pipe.js             # Pipe: move, draw, gap; collides(bird)
      base.js             # scrolling ground (ported from current main.js Base)
    nn/
      network.js          # NeuralNetwork: predict, copy, mutate (Float32Array)
    ga.js                 # population init, fitness normalize, pool selection, nextGeneration
```

Assets (`assets/sprites`, `assets/audio`, `favicon.ico`) stay where they are;
Vite serves them from the project root / `public` per its static-asset rules
(resolved during implementation).

## Components

### assets.js

- `loadAssets(): Promise<void>` — creates every `Image`, resolves via
  `Promise.all` on each `onload`. Exports loaded sprite handles (backgrounds,
  bird frames, pipes, base).
- **Fixes a real current bug:** today `FLOOR = canvas.height - BASE.height * 2`
  runs before the base PNG loads, so `BASE.height` is `0`. Preloading removes
  the race — the game starts only after assets exist.

### config.js

Single source of tunables: `POPULATION`, `PIPE_GAP`, `PIPE_VEL`, `BASE_VEL`,
gravity/lift constants, `MUTATION_RATE`, sprite scale, NN shape
(`INPUTS=5, HIDDEN=8, OUTPUTS=2`), spawn spacing.

### nn/network.js

- Single hidden layer. Weights/biases as `Float32Array`, randomized in
  `[-1, 1]`.
- `predict(inputs: number[]): number[]` — forward pass, sigmoid activation.
- `copy(): NeuralNetwork` — deep clone of weight arrays.
- `mutate(rate): void` — with probability `rate` per weight, add gaussian noise.
- No training/backprop — evolution only.

### entities/bird.js

- Physics ported from the working pre-Remake `Bird` (gravity/lift/velocity),
  adapted to the new sprite scale.
- Rendering from the current Remake bird: 3-frame flap animation + tilt, drawn
  through a **fixed** `blitRotateCenter` (see Fixes).
- `think(pipes)`: pick the nearest upcoming pipe, build the 5 normalized inputs
  (nearest pipe x, gap top, gap bottom, bird y, pipe x), `predict`, jump when
  output[1] > output[0]. Logic ported from old `Bird.think`.
- `collides(pipe): boolean` — real AABB against the pipe's top/bottom rects and
  the gap. Replaces `Pipe.collide` stub.
- `offscreen()`: hits ground (`FLOOR`) or ceiling.
- Tracks `score` (frames survived) and `fitness`.

### entities/pipe.js

Ported/kept from current `Pipe`: moves left, draws top/bottom green pipes with a
gap; exposes geometry for collision. Continuous spawn/despawn handled by `Game`
(the current code never recycles pipes — this design does).

### entities/base.js

Scrolling ground — ported from the current `Base` class largely as-is.

### ga.js

- `createPopulation(n)` → array of `Bird` with fresh random brains.
- `normalizeFitness(birds)` — fitness = score / total score.
- `poolSelection(birds)` — roulette-wheel pick weighted by fitness.
- `nextGeneration(birds)` — build new population from selected+mutated brains.

### game.js

Owns state: `activeBirds`, `allBirds`, `pipes`, `base`, `generation`,
`bestScore`. Per frame: move pipes/base, spawn/recycle pipes, each active bird
`think()` + update + collision check (dead → removed), draw everything, draw HUD
(`Generation`, `Best Score`, alive count). When `activeBirds` empties →
`nextGeneration()` and reset pipes. Drives the `requestAnimationFrame` loop.

## Data flow (per frame)

```
Game.loop()
  base.move(); pipes.move()/recycle
  for bird in activeBirds:
      bird.think(pipes)        # NN decides jump
      bird.update()            # physics, score++
      if bird.collides(nearPipe) or bird.offscreen():
          move bird -> dead; remove from activeBirds
  draw bg, pipes, birds, base, HUD
  if activeBirds empty: GA.nextGeneration(allBirds); reset pipes; generation++
  requestAnimationFrame(loop)
```

## Fixes carried in this work

1. **Asset load race** — preload before start (see `assets.js`).
2. **Collision** — real AABB replaces `Pipe.collide()` `return false`.
3. **`blitRotateCenter`** — currently ignores `angle` and swaps width/height
   (`image.height`/`image.width` transposed). Rewrite to `save →
translate(center) → rotate(angle) → drawImage → restore`.
4. **Pipe recycling** — current loop never respawns pipes; `Game` recycles them
   off the left edge with a fresh gap height.
5. **Physics re-enabled** — `bird.update()` runs every frame (was commented out
   pending AI).

## Error handling

- `loadAssets()` rejects if any image errors → `main.js` shows a console error
  and a canvas message rather than starting a broken loop.
- Defensive guards where the old GA assumed ≥2 pipes always present.

## Testing / verification

No unit-test harness exists and this is a canvas render loop, so verification is
behavioral: `npm run dev`, confirm the game boots, birds fall + flap, collide
and die, generations advance, best score climbs over generations, HUD updates,
`npm run lint` clean, `npm run build` produces a working `dist`. Pure functions
(NN forward pass, fitness normalization, pool selection) are the natural seams
if lightweight tests are added later; not in scope for this pass.

## Out of scope

- TypeScript.
- Human-playable keyboard mode.
- Audio playback wiring (assets exist; hooking sounds is a later nicety).
- Persisting/serializing trained brains.
- Unit-test framework setup.
