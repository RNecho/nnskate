/** Source images live with the project; canvas surfaces are prepared once. */
export const artAssets: {
  background: HTMLImageElement | null;
  nana: HTMLCanvasElement | null;
  nunu: HTMLCanvasElement | null;
} = { background: null, nana: null, nunu: null };

let pending: Promise<void> | null = null;

function loadImage(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = window.setTimeout(() => {
      image.onload = null;
      image.onerror = null;
      reject(new Error(`Tempo esgotado ao carregar ${path}`));
    }, 15_000);
    image.onload = () => { clearTimeout(timer); resolve(image); };
    image.onerror = () => { clearTimeout(timer); reject(new Error(`Não foi possível carregar ${path}`)); };
    image.src = `${import.meta.env.BASE_URL}art/${path}`;
  });
}

/** Interpret the generated green color key once, preserving white sprite details.
 * The original PNG is unchanged; drawing uses this transparent cached surface.
 */
function prepareAtlas(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Não foi possível preparar as animações das personagens.');
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
    if (g > 60 && g > r * 1.4 && g > b * 1.4) pixels.data[i + 3] = 0;
  }
  context.putImageData(pixels, 0, 0);
  return canvas;
}

export function loadArtAssets(): Promise<void> {
  if (artAssets.background && artAssets.nana && artAssets.nunu) return Promise.resolve();
  if (pending) return pending;
  pending = Promise.all([loadImage('dream-city.png'), loadImage('nana-sprites-keyed.png'), loadImage('nunu-sprites-keyed.png')])
    .then(([background, nana, nunu]) => {
      const nanaAtlas = prepareAtlas(nana);
      const nunuAtlas = prepareAtlas(nunu);
      artAssets.background = background;
      artAssets.nana = nanaAtlas;
      artAssets.nunu = nunuAtlas;
    }).finally(() => { pending = null; });
  return pending;
}
