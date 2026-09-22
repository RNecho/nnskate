import { test, expect } from '@playwright/test';

test('generated Nana art loads, fails recoverably, and keeps the portrait compact', async ({ page }) => {
  await page.route('**/art/nana-sprites-keyed.png', route => route.abort());
  await page.goto('/');
  await expect(page.locator('#retry-art')).toBeVisible();
  await expect(page.locator('#art-status')).toContainText('A arte não carregou');
  await page.unroute('**/art/nana-sprites-keyed.png');
  await page.locator('#retry-art').click();
  await expect(page.locator('#art-loading')).toBeHidden();
  await expect(page.locator('.character-hud strong')).toHaveText('Nana');
  const portrait = await page.locator('#character-portrait').boundingBox();
  expect(portrait?.width).toBeLessThan(50);
  expect(portrait?.height).toBeLessThan(50);
  await page.screenshot({ path: 'test-results/nana-ready.png', fullPage: true });
});

test('gamepad controls move, jump, pause and resume once per press; unplugging releases input', async ({ page }) => {
  await page.addInitScript(() => {
    const pad = {
      connected: true, id: 'Test USB Standard Controller', index: 0, mapping: 'standard',
      axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    };
    (window as unknown as { testPad: typeof pad }).testPad = pad;
    Object.defineProperty(navigator, 'getGamepads', { value: () => pad.connected ? [pad] : [] });
  });
  await page.goto('/');
  await page.locator('#art-loading').waitFor({ state: 'hidden' });
  await page.locator('#game').focus();
  await expect(page.locator('#gamepad-status')).toHaveText('Controle conectado');
  const update = async (axis: number, jump = false, pause = false, connected = true) => page.evaluate(({ axis, jump, pause, connected }) => {
    const pad = (window as unknown as { testPad: { connected: boolean; axes: number[]; buttons: { pressed: boolean; value: number }[] } }).testPad;
    pad.axes[0] = axis;
    pad.buttons[0] = { pressed: jump, value: Number(jump) };
    pad.buttons[9] = { pressed: pause, value: Number(pause) };
    pad.connected = connected;
  }, { axis, jump, pause, connected });
  const state = () => page.evaluate(() => (window as unknown as { __SKATE__: { paused: boolean; character: { x: number; vx: number; state: string; grounded: boolean } } }).__SKATE__);
  await update(1);
  await expect.poll(async () => (await state()).character.vx).toBe(210);
  await update(0);
  await expect.poll(async () => (await state()).character.vx).toBe(0);
  await expect(page.locator('#audio-status')).toHaveText('Clique no som para ativar a música');
  // One pointer gesture activates sound; it must not accidentally mute it.
  await page.locator('#sound-button').click();
  await expect(page.locator('#audio-status')).toHaveText('Tocando: Patinhas ao vento');
  await update(0, true);
  await expect.poll(async () => (await state()).character.grounded, { intervals: [16] }).toBe(false);
  await update(0, false);
  await expect.poll(async () => (await state()).character.grounded).toBe(true);
  await update(0, false, true);
  await expect.poll(async () => (await state()).paused).toBe(true);
  await page.waitForTimeout(180);
  expect((await state()).paused).toBe(true);
  await update(0);
  await page.waitForTimeout(50);
  await update(0, false, true);
  await expect.poll(async () => (await state()).paused).toBe(false);
  await update(0);
  await page.waitForTimeout(50);
  await update(-1);
  await expect.poll(async () => (await state()).character.vx).toBeLessThan(-90);
  await update(0, false, false, false);
  await expect(page.locator('#gamepad-status')).toContainText('aperte um botão');
  await expect.poll(async () => (await state()).character.vx).toBe(0);
});
