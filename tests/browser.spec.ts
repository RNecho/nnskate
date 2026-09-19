import { test, expect, type Page } from '@playwright/test';
import type { CameraSnapshot, CharacterSnapshot, PhysicsConfig } from '../src/game/types';

type Diagnostics = { character: CharacterSnapshot; camera: CameraSnapshot; config: PhysicsConfig; paused: boolean; muted: boolean };
const snapshot = (page: Page) => page.evaluate(() => (window as unknown as { __SKATE__: Diagnostics }).__SKATE__);

test.beforeEach(async ({ page }) => {
  // A player may be using the real USB controller while keyboard tests run.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'getGamepads', { value: () => [] });
  });
});

test('playable sequence, inertia, pause shortcuts, audio, restart and live tuning', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('#art-loading').waitFor({ state: 'hidden' });
  await expect(page.locator('#current-state')).toHaveText('IDLE');
  await page.locator('#game').focus();
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await snapshot(page)).character.state, { intervals: [16] }).toBe('PUSH');
  await expect.poll(async () => (await snapshot(page)).character.vx).toBe(210);
  await page.keyboard.up('ArrowRight');
  const coasting = (await snapshot(page)).character;
  expect(coasting.vx).toBeGreaterThan(0);
  await page.waitForTimeout(200);
  const slowed = (await snapshot(page)).character;
  expect(slowed.x).toBeGreaterThan(coasting.x);
  expect(slowed.vx).toBeLessThan(coasting.vx);
  expect(slowed.vx).toBeGreaterThan(0);
  await page.keyboard.down('Space');
  await expect.poll(async () => (await snapshot(page)).character.state, { intervals: [16] }).toBe('JUMP');
  await expect.poll(async () => (await snapshot(page)).character.state, { intervals: [16] }).toBe('FALL');
  await page.keyboard.up('Space');
  await expect.poll(async () => (await snapshot(page)).character.grounded).toBe(true);
  await expect(page.locator('#audio-status')).toHaveText('Tocando: Patinhas ao vento');

  await page.getByRole('button', { name: 'Pausar jogo', exact: true }).click();
  expect((await snapshot(page)).paused).toBe(true);
  const pausedX = (await snapshot(page)).character.x;
  await page.waitForTimeout(160);
  expect((await snapshot(page)).character.x).toBe(pausedX);
  // This shortcut must work even when the toolbar button retains keyboard focus.
  await page.keyboard.press('p');
  await expect(page.locator('#pause-overlay')).toBeHidden();
  await page.keyboard.press('m');
  expect((await snapshot(page)).muted).toBe(true);
  await page.keyboard.press('m');
  expect((await snapshot(page)).muted).toBe(false);
  await page.keyboard.press('r');
  expect((await snapshot(page)).character.x).toBe(150);
  expect((await snapshot(page)).character.state).toBe('IDLE');

  await page.locator('#tuning-panel summary').click();
  await page.locator('#physics-maxSpeed').fill('350');
  expect((await snapshot(page)).config.maxSpeed).toBe(350);
  const beforeSliderKey = (await snapshot(page)).character.x;
  await page.locator('#physics-maxSpeed').press('ArrowRight');
  expect((await snapshot(page)).config.maxSpeed).toBe(360);
  expect((await snapshot(page)).character.x).toBe(beforeSliderKey);
  await page.getByRole('button', { name: 'Restaurar padrão' }).click();
  expect((await snapshot(page)).config.maxSpeed).toBe(280);
  expect(errors).toEqual([]);
});

test('keyboard skating traverses the hill, follows the camera and returns left', async ({ page }) => {
  await page.goto('/');
  await page.locator('#art-loading').waitFor({ state: 'hidden' });
  await page.locator('#game').focus();
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await snapshot(page)).character.x, { intervals: [16] }).toBeGreaterThan(395);
  await page.keyboard.down('Space');
  await expect.poll(async () => (await snapshot(page)).character.x, { timeout: 6000 }).toBeGreaterThan(540);
  await page.keyboard.up('Space');
  await expect.poll(async () => (await snapshot(page)).character.x, { intervals: [16] }).toBeGreaterThan(555);
  await page.keyboard.down('Space');
  await expect.poll(async () => (await snapshot(page)).character.x, { timeout: 6000 }).toBeGreaterThan(900);
  await page.keyboard.up('Space');
  await page.keyboard.up('ArrowRight');
  const right = await snapshot(page);
  expect(right.camera.x).toBeGreaterThan(400);
  expect(right.character.x).toBeGreaterThan(900);
  await page.keyboard.down('ArrowLeft');
  await expect.poll(async () => (await snapshot(page)).character.facing).toBe(-1);
  await page.keyboard.up('ArrowLeft');
});

test('mobile touch controls and focused-button keyboard input move and jump without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#art-loading').waitFor({ state: 'hidden' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const right = page.getByRole('button', { name: 'Mover para direita', exact: true });
  await expect(right).toBeVisible();
  const box = await right.boundingBox();
  if (!box) throw new Error('Touch control not laid out');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(async () => (await snapshot(page)).character.vx).toBeGreaterThan(90);
  await page.mouse.up();
  await page.getByRole('button', { name: 'Pular', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).character.grounded).toBe(false);
  await expect.poll(async () => (await snapshot(page)).character.grounded).toBe(true);
  await right.focus();
  await page.keyboard.down('Space');
  await expect.poll(async () => (await snapshot(page)).character.vx).toBeGreaterThan(150);
  await page.keyboard.up('Space');
  await page.locator('#tuning-panel summary').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});

test('narrow, tablet and large layouts do not overflow horizontally', async ({ page }) => {
  for (const width of [320, 768, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
  await page.locator('#art-loading').waitFor({ state: 'hidden' });
    await page.locator('#tuning-panel summary').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `viewport ${width}`).toBe(true);
  }
});
