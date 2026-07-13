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
