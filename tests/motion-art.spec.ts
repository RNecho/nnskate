import { test, expect } from '@playwright/test';

test('new motion and 360 atlases are isolated, and cheerful air poses plus idle cycles render cleanly', async ({ page }) => {
  await page.goto('/'); await page.locator('#art-loading').waitFor({ state: 'hidden' });
  const result = await page.evaluate(async () => {
    const module = async (name: string) => {
      const pathname = `/src/game/${name}.ts`;
      const url = performance.getEntriesByType('resource').map(entry => entry.name).find(url => new URL(url).pathname === pathname) ?? pathname;
      return import(/* @vite-ignore */ url);
    };
    const [{ artAssets, motionFrames, trickFrames }, { drawCharacter }, { TRICK_DURATION }] = await Promise.all([
      module('render/ArtAssets'), module('character/Animation'), module('character/Character'),
    ]);
    const canvas = document.createElement('canvas'); canvas.id = 'motion-fixture'; canvas.width = 1120; canvas.height = 720;
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:1120px;height:720px;z-index:10000'; document.body.append(canvas);
    const c = canvas.getContext('2d')!; c.fillStyle = '#eef3df'; c.fillRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 8; col++) {
      const trick = row >= 2, id = row % 2 ? 'nana' : 'nunu';
      const x = col * 140 + 70, y = row * 180 + 165;
      const state = trick ? 'JUMP' : col < 2 ? 'IDLE' : col < 6 ? 'ROLL' : col === 6 ? 'JUMP' : 'FALL';
      const equipment = trick ? 'skate' : row === 1 && col >= 6 ? 'patins' : 'foot';
      drawCharacter(c, { x, y, vx: state === 'ROLL' ? 180 : 0, vy: 0, facing: 1, state,
        grounded: !trick && col < 6, groundAngle: 0, stateTime: 0, equipment,
        stride: (col - 2) * 19, trickTime: trick ? (col + 0.1) / 8 * TRICK_DURATION : 0 }, col === 1 ? 3.65 : 0.2, id);
    }
    const keys = ['nunuMotion', 'nanaMotion', 'tricks'];
    return { alpha: keys.map(key => artAssets[key].getContext('2d').getImageData(0, 0, 1, 1).data[3]),
      counts: [motionFrames.nunuMotion.length, motionFrames.nanaMotion.length, trickFrames.nunu.length, trickFrames.nana.length],
      frames: [...trickFrames.nunu, ...trickFrames.nana].map(f => ({ ...f, cell: artAssets.tricks.width / 4 })) };
  });
  expect(result.alpha).toEqual([0, 0, 0]); expect(result.counts).toEqual([8, 8, 8, 8]);
  for (const frame of result.frames) {
    expect(frame.width).toBeGreaterThan(100); expect(frame.width).toBeLessThanOrEqual(Math.ceil(frame.cell));
    expect(frame.height).toBeGreaterThan(150); expect(frame.height).toBeLessThanOrEqual(Math.ceil(frame.cell));
  }
  await page.locator('#motion-fixture').screenshot({ path: 'test-results/motion-v4-poses.png' });
});

test('the extended slope and takeoff strip render with the same terrain geometry used by physics', async ({ page }) => {
  await page.goto('/'); await page.locator('#art-loading').waitFor({ state: 'hidden' });
  await page.evaluate(async () => {
    const module = async (name: string) => {
      const pathname = `/src/game/${name}.ts`;
      const url = performance.getEntriesByType('resource').map(entry => entry.name).find(url => new URL(url).pathname === pathname) ?? pathname;
      return import(/* @vite-ignore */ url);
    };
    const [{ Character }, { Adventure }, { RESCUE_LEVEL, groundAt }, { DEFAULT_PHYSICS }, { Renderer }] = await Promise.all([
      module('character/Character'), module('adventure/Adventure'), module('level/Level'), module('config'), module('render/Renderer'),
    ]);
    const canvas = document.createElement('canvas'); canvas.id = 'ramp-fixture'; canvas.width = 1200; canvas.height = 540;
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:1200px;height:540px;z-index:10000'; document.body.append(canvas);
    const character = new Character(RESCUE_LEVEL, { ...DEFAULT_PHYSICS }); const adventure = new Adventure(RESCUE_LEVEL, character); adventure.start();
    character.reset({ x: 1770, y: groundAt(RESCUE_LEVEL, 1770).y }); character.setEquipment('skate');
    character.snapshot.vx = 600; character.snapshot.state = 'ROLL'; character.snapshot.stride = 40;
    adventure.barrierBroken = true;
    new Renderer(canvas, RESCUE_LEVEL).render(character.snapshot, { x: 1330, y: 0, width: 1200, height: 540 }, 2, 'nunu', adventure);
  });
  await page.locator('#ramp-fixture').screenshot({ path: 'test-results/ramp-v4.png' });
});
