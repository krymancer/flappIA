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
  const [day, night, up, mid, down, pipeDown, pipeUp, base] = await Promise.all([
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
