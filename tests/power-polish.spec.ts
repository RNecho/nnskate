import { test, expect } from '@playwright/test';

test('riding atlases have eight isolated transparent poses and render both power scenes', async ({ page }) => {
  await page.goto('/');
  await page.locator('#art-loading').waitFor({ state: 'hidden' });
  const metadata = await page.evaluate(async () => {
    const path = performance.getEntriesByType('resource').map(entry => entry.name)
      .find(url => new URL(url).pathname === '/src/game/render/ArtAssets.ts')!;
    const { artAssets, ridingFrames } = await import(/* @vite-ignore */ path);
    return Object.entries(ridingFrames).map(([key, frames]) => ({
      key, frames: frames as { width: number; height: number; pivotX: number }[],
      alpha: artAssets[key].getContext('2d').getImageData(0, 0, 1, 1).data[3],
    }));
  });
  for (const atlas of metadata) {
    expect(atlas.alpha).toBe(0);
    expect(atlas.frames).toHaveLength(8);
    for (const frame of atlas.frames) {
      expect(frame.width).toBeGreaterThan(200); expect(frame.width).toBeLessThan(384);
      expect(frame.height).toBeGreaterThan(250); expect(frame.height).toBeLessThan(512);
      expect(frame.pivotX).toBeGreaterThan(0); expect(frame.pivotX).toBeLessThan(frame.width);
    }
  }
  // Isolated rendering fixtures exercise the production renderer without changing the live game.
  for (const sister of ['nunu', 'nana']) {
    await page.evaluate(async sister => {
      const module = async (name: string) => import(/* @vite-ignore */ `/src/game/${name}.ts`);
      const [{ Character }, { Adventure }, { RESCUE_LEVEL, groundAt }, { DEFAULT_PHYSICS }, { Renderer }] = await Promise.all([
        module('character/Character'), module('adventure/Adventure'), module('level/Level'), module('config'), module('render/Renderer'),
      ]);
      document.querySelector('#render-fixture')?.remove();
      const canvas = document.createElement('canvas'); canvas.id = 'render-fixture';
      canvas.width = 960; canvas.height = 540;
      canvas.style.cssText = 'position:fixed;top:0;left:0;width:960px;height:540px;z-index:10000';
      document.body.append(canvas);
      const character = new Character(RESCUE_LEVEL, { ...DEFAULT_PHYSICS });
      const adventure = new Adventure(RESCUE_LEVEL, character); adventure.start();
      const x = sister === 'nunu' ? 1130 : 3050;
      character.reset({ x, y: groundAt(RESCUE_LEVEL, x).y });
      character.setEquipment(sister === 'nunu' ? 'skate' : 'patins');
      character.snapshot.vx = 170; character.snapshot.state = 'PUSH';
      adventure.superTime = 8;
      new Renderer(canvas, RESCUE_LEVEL).render(character.snapshot, { x: x - 280, y: 0, width: 960, height: 540 }, 2.3, sister, adventure);
    }, sister);
    await page.locator('#render-fixture').screenshot({ path: `test-results/${sister}-superbrilho.png` });
  }
});

test('rescue fanfare produces a complete unclipped waveform and respects mute and pause', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(async () => {
    const path = '/src/game/audio/AudioManager.ts';
    const { AudioManager } = await import(/* @vite-ignore */ path);
    const OriginalContext = window.AudioContext;
    const results = [];
    for (const mode of ['audible', 'muted', 'paused']) {
      const ctx = new OfflineAudioContext(1, 44100 * 3, 44100);
      Object.defineProperty(ctx, 'state', { get: () => 'running' });
      Object.defineProperty(ctx, 'resume', { value: async () => {} });
      Object.defineProperty(ctx, 'close', { value: async () => {} });
      window.AudioContext = function () { return ctx; } as unknown as typeof AudioContext;
      const audio = new AudioManager();
      await audio.unlock(); audio.resetMusic();
      if (mode === 'muted') audio.setMuted(true);
      if (mode === 'paused') audio.setPaused(true);
      audio.play('rescue');
      const buffer = await ctx.startRendering();
      audio.dispose();
      const samples = buffer.getChannelData(0);
      let peak = 0, tailEnergy = 0;
      samples.forEach((sample: number, i: number) => {
        peak = Math.max(peak, Math.abs(sample));
        if (i > 44100 * 2.5) tailEnergy += sample * sample;
      });
      results.push({ mode, peak, tailEnergy });
    }
    window.AudioContext = OriginalContext;
    return results;
  });
  expect(results[0].peak).toBeGreaterThan(0.02);
  expect(results[0].peak).toBeLessThan(0.95);
  expect(results[0].tailEnergy).toBeGreaterThan(0.01);
  expect(results[1].peak).toBe(0);
  expect(results[2].peak).toBe(0);
});
