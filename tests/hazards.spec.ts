import { test, expect } from '@playwright/test';

test('five visible hearts track mistakes, survive sister switching and refill on checkpoint retry', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => Object.defineProperty(navigator, 'getGamepads', { value: () => [] }));
  await page.goto('/');
  await page.locator('#art-loading').waitFor({ state: 'hidden' });
  await expect(page.locator('[data-heart]:not(.empty)')).toHaveCount(5);
  await page.evaluate(async () => {
    const path = performance.getEntriesByType('resource').map(entry => entry.name)
      .find(url => new URL(url).pathname === '/src/game/audio/AudioManager.ts');
    if (!path) throw new Error('The game did not load its audio module.');
    const { AudioManager } = await import(/* @vite-ignore */ path);
    const original = AudioManager.prototype.play;
    const tally = window as unknown as { __defeatCueCount: number };
    tally.__defeatCueCount = 0;
    AudioManager.prototype.play = function (sound: string) {
      if (sound === 'defeat') tally.__defeatCueCount++;
      original.call(this, sound);
    };
  });
  await page.locator('#begin-button').click();
  await page.clock.install();
  await page.keyboard.down('ArrowRight');
  let switched = false;
  const health = new Set<number>();
  for (let i = 0; i < 80; i++) {
    await page.clock.runFor(400);
    const s = await page.evaluate(() => (window as unknown as { __SKATE__: { adventure: { health: number; phase: string } } }).__SKATE__);
    health.add(s.adventure.health);
    if (s.adventure.health === 4 && !switched) {
      await page.keyboard.press('Digit2');
      await page.clock.runFor(140);
      await expect(page.locator('#character-name')).toHaveText('Nunu');
      await expect(page.locator('#health-label')).toHaveText('4 de 5 corações');
      await expect(page.locator('[data-heart].empty')).toHaveCount(1);
      await page.locator('#game-shell').screenshot({ path: 'test-results/mobile-one-heart-lost.png' });
      switched = true;
    }
    if (s.adventure.phase === 'defeated') break;
  }
  await page.keyboard.up('ArrowRight');
  await page.clock.runFor(140);
  expect(health).toEqual(new Set([5, 4, 3, 2, 1, 0]));
  await expect(page.locator('[data-heart].empty')).toHaveCount(5);
  await expect(page.locator('#defeat-panel')).toBeVisible();
  await expect(page.locator('#retry-checkpoint')).toBeFocused();
  await page.clock.runFor(600);
  expect(await page.evaluate(() => (window as unknown as { __defeatCueCount: number }).__defeatCueCount)).toBe(1);
  await page.locator('#game-shell').screenshot({ path: 'test-results/mobile-defeat.png' });
  await page.locator('#retry-checkpoint').click();
  await page.clock.runFor(140);
  await expect(page.locator('#defeat-panel')).toBeHidden();
  await expect(page.locator('#health-label')).toHaveText('5 de 5 corações');
  await expect(page.locator('[data-heart]:not(.empty)')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('monster atlas recovers from load failure and has twelve clean isolated poses', async ({ page }) => {
  await page.route('**/art/monsters-v2.png', route => route.abort());
  await page.goto('/');
  await expect(page.locator('#retry-art')).toBeVisible();
  await page.unroute('**/art/monsters-v2.png');
  await page.locator('#retry-art').click();
  await expect(page.locator('#art-loading')).toBeHidden();
  const result = await page.evaluate(async () => {
    // Inspect the actual prepared render surface, not a second copy of keying logic.
    const path = performance.getEntriesByType('resource').map(entry => entry.name)
      .find(url => new URL(url).pathname === '/src/game/render/ArtAssets.ts');
    if (!path) throw new Error('The game did not load its art module.');
    const { artAssets, monsterFrames, puppyFrames } = await import(/* @vite-ignore */ path);
    const atlas = artAssets.monsters as HTMLCanvasElement;
    const ctx = atlas.getContext('2d')!;
    return { frames: monsterFrames.flat(), puppyFrames, puppyAlpha: artAssets.puppy.getContext('2d').getImageData(0, 0, 1, 1).data[3], backgroundAlpha: ctx.getImageData(0, 0, 1, 1).data[3] };
  });
  expect(result.backgroundAlpha).toBe(0);
  expect(result.frames).toHaveLength(12);
  expect(result.puppyFrames).toHaveLength(4);
  expect(result.puppyAlpha).toBe(0);
  for (const frame of result.puppyFrames) {
    expect(frame.width).toBeGreaterThan(200); expect(frame.width).toBeLessThan(740);
    expect(frame.height).toBeGreaterThan(200); expect(frame.height).toBeLessThan(490);
  }
  for (const frame of result.frames) {
    expect(frame.width).toBeGreaterThan(100);
    expect(frame.width).toBeLessThan(380);
    expect(frame.height).toBeGreaterThan(100);
    expect(frame.height).toBeLessThan(330);
  }
});
