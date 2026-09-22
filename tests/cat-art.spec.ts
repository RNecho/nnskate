import { test, expect } from '@playwright/test';

test('cat poses stay isolated and the game keeps its fallback if the optional sheet fails', async ({ page }) => {
  await page.route('**/art/cat-v1.png', route => route.abort());
  await page.goto('/');
  await expect(page.locator('#art-loading')).toBeHidden();
  const fallback = await page.evaluate(async () => {
    const path = performance.getEntriesByType('resource').map(entry => entry.name)
      .find(url => new URL(url).pathname === '/src/game/render/ArtAssets.ts')!;
    const { artAssets, catFrames } = await import(/* @vite-ignore */ path) as typeof import('../src/game/render/ArtAssets');
    return { cat: artAssets.cat, count: catFrames.length };
  });
  expect(fallback).toEqual({ cat: null, count: 0 });

  await page.unroute('**/art/cat-v1.png');
  await page.reload();
  await expect(page.locator('#art-loading')).toBeHidden();
  const result = await page.evaluate(async () => {
    const path = performance.getEntriesByType('resource').map(entry => entry.name)
      .find(url => new URL(url).pathname === '/src/game/render/ArtAssets.ts')!;
    const { artAssets, catFrames } = await import(/* @vite-ignore */ path) as typeof import('../src/game/render/ArtAssets');
    const atlas = artAssets.cat;
    if (!atlas) return null;
    const context = atlas.getContext('2d')!;
    const frames = catFrames.map(frame => ({ ...frame }));
    const cells = Array.from({ length: 8 }, (_, index) => {
      const cell = context.getImageData(index % 4 * 384, Math.floor(index / 4) * 512, 384, 512).data;
      let opaque = 0, border = 0;
      for (let y = 0; y < 512; y++) for (let x = 0; x < 384; x++) {
        if (cell[(y * 384 + x) * 4 + 3] < 8) continue;
        opaque++;
        if (x < 24 || x >= 360 || y < 24 || y >= 488) border++;
      }
      return { opaque, border };
    });
    return { width: atlas.width, height: atlas.height, frames, cells };
  });
  expect(result).not.toBeNull();
  expect(result!.width).toBe(1536);
  expect(result!.height).toBe(1024);
  expect(result!.frames).toHaveLength(8);
  for (const frame of result!.frames) {
    expect(frame.width).toBeGreaterThan(100);
    expect(frame.height).toBeGreaterThan(100);
  }
  for (const cell of result!.cells) {
    expect(cell.opaque).toBeGreaterThan(1000);
    expect(cell.border).toBe(0);
  }
});
