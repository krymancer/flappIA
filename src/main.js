import { loadAssets } from './assets.js';
import { Game } from './game.js';

async function boot() {
  const canvas = document.getElementById('game');
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false; // crisp pixel-art scaling

  try {
    await loadAssets();
  } catch (err) {
    context.fillStyle = '#fff';
    context.font = '24px sans-serif';
    context.fillText('Failed to load assets — check console.', 20, 60);
    console.error(err);
    return;
  }

  const nnCtx = document.getElementById('nn').getContext('2d');
  const chartCtx = document.getElementById('charts').getContext('2d');
  const statsCtx = document.getElementById('stats').getContext('2d');
  new Game(context, nnCtx, chartCtx, statsCtx).start();
}

boot();
