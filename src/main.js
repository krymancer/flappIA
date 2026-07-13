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
