import type { CharacterId } from '../character/characters';
import { isolateSpriteAtlas } from './SpriteAtlas';
/** Source images live with the project; canvas surfaces are prepared once. */
export const artAssets: {
  background: HTMLImageElement | null;
  terrain: HTMLImageElement | null;
  nana: HTMLCanvasElement | null;
  nunu: HTMLCanvasElement | null;
  nanaFoot: HTMLCanvasElement | null;
  nunuFoot: HTMLCanvasElement | null;
  monsters: HTMLCanvasElement | null;
  puppy: HTMLCanvasElement | null;
  cat: HTMLCanvasElement | null;
  nunuSkate: HTMLCanvasElement | null;
  nanaPatins: HTMLCanvasElement | null;
  nunuMotion: HTMLCanvasElement | null;
  nanaMotion: HTMLCanvasElement | null;
  tricks: HTMLCanvasElement | null;
  nunuFlip: HTMLCanvasElement | null;
  nanaFlip: HTMLCanvasElement | null;
} = { background: null, terrain: null, nana: null, nunu: null, nanaFoot: null, nunuFoot: null, monsters: null, puppy: null, cat: null, nunuSkate: null, nanaPatins: null, nunuMotion: null, nanaMotion: null, tricks: null,
  nunuFlip: null, nanaFlip: null };

export interface MonsterFrame { x: number; y: number; width: number; height: number }
export const monsterFrames: MonsterFrame[][] = [];
export const puppyFrames: MonsterFrame[] = [];
export const catFrames: MonsterFrame[] = [];
export interface RidingFrame extends MonsterFrame { pivotX: number }
export const ridingFrames: Record<'nunuSkate' | 'nanaPatins', RidingFrame[]> = { nunuSkate: [], nanaPatins: [] };
export const motionFrames: Record<'nunuMotion' | 'nanaMotion', MonsterFrame[]> = { nunuMotion: [], nanaMotion: [] };
export const trickFrames: Record<'nunu' | 'nana', MonsterFrame[]> = { nunu: [], nana: [] };
export const flipFrames: Record<CharacterId, MonsterFrame[]> = { nana: [], nunu: [] };

function prepareRidingFrames(atlas: HTMLCanvasElement): RidingFrame[] {
  const ctx = atlas.getContext('2d', { willReadFrequently: true })!;
  return prepareFrames(atlas, 4, [0, 512, 1024]).flat().map(frame => {
    // Anchor on the wheels, including poses whose pushing leg extends behind the deck.
    const bottom = Math.min(8, frame.height);
    const pixels = ctx.getImageData(frame.x, frame.y + frame.height - bottom, frame.width, bottom).data;
    let min = frame.width, max = 0;
    for (let y = 0; y < bottom; y++) for (let x = 0; x < frame.width; x++) {
      if (pixels[(y * frame.width + x) * 4 + 3] > 128) { min = Math.min(min, x); max = Math.max(max, x); }
    }
    return { ...frame, pivotX: (min + max) / 2 };
  });
}

function prepareFrames(atlas: HTMLCanvasElement, columns: number, rowEdges: number[], gutter = 0) {
  const ctx = atlas.getContext('2d', { willReadFrequently: true })!;
  // The generated rows have a little extra room for the guardian's crown.
  const rows = rowEdges.map(y => Math.round(y * atlas.height / 1024));
  const frames: MonsterFrame[][] = [];
  for (let row = 0; row < rows.length - 1; row++) {
    frames[row] = [];
    for (let column = 0; column < columns; column++) {
      const left = Math.round(column * atlas.width / columns), right = Math.round((column + 1) * atlas.width / columns);
      const top = rows[row], w = right - left, h = rows[row + 1] - top;
      const pixels = ctx.getImageData(left, top, w, h).data;
      let minX = w, minY = h, maxX = -1, maxY = -1;
      for (let y = 0; y < h; y++) for (let x = gutter; x < w - gutter; x++) {
        if (pixels[(y * w + x) * 4 + 3] < 128) continue;
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
      if (maxX < minX) throw new Error('Pose vazia no atlas.');
      frames[row].push({ x: left + minX, y: top + minY, width: maxX - minX + 1, height: maxY - minY + 1 });
    }
  }
  return frames;
}

export const footBaselines: Record<'nana' | 'nunu', number[]> = { nana: [], nunu: [] };

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
  // The cat is scenery; a missing or malformed optional sheet keeps the drawn cat.
  if (Object.entries(artAssets).every(([key, asset]) => key === 'cat' || Boolean(asset))) return Promise.resolve();
  if (pending) return pending;
  pending = Promise.all([loadImage('dream-garden-v2.png'), loadImage('nana-sprites-keyed.png'), loadImage('nunu-sprites-keyed.png'), loadImage('nana-foot-v2.png'), loadImage('nunu-foot-v2.png'), loadImage('monsters-v2.png'), loadImage('puppy-v2.png'), loadImage('nunu-skate-v3.png'), loadImage('nana-patins-v3.png'), loadImage('nunu-motion-v4.png'), loadImage('nana-motion-v4.png'), loadImage('skate-360-v4.png'), loadImage('nunu-flip-v1.png'), loadImage('nana-flip-v1.png'), loadImage('terrain-earth-v5.png'), loadImage('cat-v1.png').catch(() => null)])
    .then(([background, nana, nunu, nanaFoot, nunuFoot, monsters, puppy, nunuSkate, nanaPatins, nunuMotion, nanaMotion, tricks, nunuFlip, nanaFlip, terrain, cat]) => {
      const nanaAtlas = prepareAtlas(nana);
      const nunuAtlas = prepareAtlas(nunu);
      artAssets.background = background;
      artAssets.terrain = terrain;
      artAssets.nana = nanaAtlas;
      artAssets.nunu = nunuAtlas;
      artAssets.nanaFoot = prepareAtlas(nanaFoot);
      artAssets.nunuFoot = prepareAtlas(nunuFoot);
      const monsterAtlas = prepareAtlas(monsters);
      monsterFrames.splice(0, monsterFrames.length, ...prepareFrames(monsterAtlas, 4, [0, 330, 640, 1024]));
      artAssets.monsters = monsterAtlas;
      const puppyAtlas = prepareAtlas(puppy);
      puppyFrames.splice(0, puppyFrames.length, ...prepareFrames(puppyAtlas, 2, [0, 512, 1024]).flat());
      artAssets.puppy = puppyAtlas;
      if (cat) {
        try {
          // Each pose is separated before cropping so ears, whiskers and the tail
          // never borrow opaque pixels from the next cell.
          const atlas = isolateSpriteAtlas(prepareAtlas(cat), 2);
          const frames = prepareFrames(atlas, 4, [0, 512, 1024], 8).flat();
          if (frames.length !== 8 || frames.some(frame => frame.width < 100 || frame.height < 100)) {
            throw new Error('Pose incompleta no atlas do gato.');
          }
          catFrames.splice(0, catFrames.length, ...frames);
          artAssets.cat = atlas;
        } catch (error) {
          console.warn('Não foi possível preparar o gato ilustrado:', error);
          catFrames.splice(0);
          artAssets.cat = null;
        }
      }
      for (const [id, key, source] of [['nunu', 'nunuFlip', nunuFlip], ['nana', 'nanaFlip', nanaFlip]] as const) {
        artAssets[key] = isolateSpriteAtlas(prepareAtlas(source), 2, true);
        flipFrames[id] = prepareFrames(artAssets[key], 4, [0, 512, 1024], 8).flat();
      }
      for (const [key, source] of [['nunuMotion', nunuMotion], ['nanaMotion', nanaMotion]] as const) {
        artAssets[key] = prepareAtlas(source);
        motionFrames[key] = prepareFrames(artAssets[key], 4, [0, 512, 1024], 8).flat();
      }
      artAssets.tricks = prepareAtlas(tricks);
      const spin = prepareFrames(artAssets.tricks, 4, [0, 256, 512, 768, 1024]).flat();
      trickFrames.nunu = spin.slice(0, 8); trickFrames.nana = spin.slice(8);
      for (const [key, source] of [['nunuSkate', nunuSkate], ['nanaPatins', nanaPatins]] as const) {
        const atlas = prepareAtlas(source);
        ridingFrames[key] = prepareRidingFrames(atlas);
        artAssets[key] = atlas;
      }
      // Align each generated pose by its actual lowest opaque shoe pixel.
      for (const id of ['nana', 'nunu'] as const) {
        const atlas = artAssets[id === 'nana' ? 'nanaFoot' : 'nunuFoot']!;
        const ctx = atlas.getContext('2d', { willReadFrequently: true })!;
        const w = atlas.width / 4, h = atlas.height / 2;
        footBaselines[id] = Array.from({ length: 8 }, (_, index) => {
          const pixels = ctx.getImageData(index % 4 * w, Math.floor(index / 4) * h, w, h).data;
          for (let y = h - 1; y >= 0; y--) {
            let count = 0;
            for (let x = 0; x < w; x++) if (pixels[(y * w + x) * 4 + 3] > 128) count++;
            if (count > 6) return (y + 1) * 1024 / atlas.height;
          }
          return 470;
        });
      }
    }).finally(() => { pending = null; });
  return pending;
}
