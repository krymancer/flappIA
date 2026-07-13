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
