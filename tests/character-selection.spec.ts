import { test, expect, type Page } from '@playwright/test';
import type { CharacterSnapshot, PhysicsConfig } from '../src/game/types';

type CharacterId = 'nana' | 'nunu';
type Diagnostics = {
  selectedCharacter: CharacterId;
  character: CharacterSnapshot;
  config: PhysicsConfig;
  paused: boolean;
};
type MockGamepad = {
  connected: boolean;
  id: string;
  index: number;
  mapping: string;
  axes: number[];
  buttons: { pressed: boolean; value: number }[];
};
type TestWindow = { __SKATE__: Diagnostics; selectionPad: MockGamepad };

const snapshot = (page: Page) => page.evaluate(() => (window as unknown as TestWindow).__SKATE__);
const portraitPixels = (page: Page) => page.locator('#character-portrait').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL());
const nanaButton = (page: Page) => page.getByRole('button', { name: 'Selecionar Nana, skate', exact: true });
const nunuButton = (page: Page) => page.getByRole('button', { name: 'Selecionar Nunu, patins', exact: true });

async function expectSelected(page: Page, selected: CharacterId): Promise<void> {
  await expect(page.locator('#character-name')).toHaveText(selected === 'nana' ? 'Nana' : 'Nunu');
  await expect(nanaButton(page)).toHaveAttribute('aria-pressed', String(selected === 'nana'));
  await expect(nunuButton(page)).toHaveAttribute('aria-pressed', String(selected === 'nunu'));
  await expect.poll(async () => (await snapshot(page)).selectedCharacter).toBe(selected);
}

async function updateGamepad(page: Page, values: { connected?: boolean; axis?: number; button?: number; pressed?: boolean }): Promise<void> {
  await page.evaluate(values => {
    const pad = (window as unknown as TestWindow).selectionPad;
    if (values.connected !== undefined) pad.connected = values.connected;
    if (values.axis !== undefined) pad.axes[0] = values.axis;
    if (values.button !== undefined) pad.buttons[values.button] = { pressed: Boolean(values.pressed), value: Number(Boolean(values.pressed)) };
  }, values);
}

async function waitForGamepadRelease(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

async function expectHeldShoulderDoesNotRepeat(page: Page, expected: CharacterId): Promise<void> {
  const selections = await page.evaluate(async () => {
    const values: CharacterId[] = [];
    for (let frame = 0; frame < 15; frame++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      values.push((window as unknown as TestWindow).__SKATE__.selectedCharacter);
    }
    return values;
  });
  expect(selections).toEqual(Array.from({ length: 15 }, () => expected));
}

test.beforeEach(async ({ page }) => {
  // Keep selection tests independent of any physical controller connected locally.
  await page.addInitScript(() => {
    const pad: MockGamepad = {
      connected: false, id: 'Character Selection Test Controller', index: 0, mapping: 'standard',
      axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    };
    (window as unknown as TestWindow).selectionPad = pad;
    Object.defineProperty(navigator, 'getGamepads', { value: () => pad.connected ? [pad] : [] });
  });
  await page.goto('/');
  await page.locator('#art-loading').waitFor({ state: 'hidden' });
});

test('mouse and number keys select Nana or Nunu with matching names, pressed buttons and portraits', async ({ page }) => {
  await expectSelected(page, 'nana');
  const nanaPortrait = await portraitPixels(page);
  await nunuButton(page).click();
  await expectSelected(page, 'nunu');
  await expect.poll(() => portraitPixels(page)).not.toBe(nanaPortrait);
  const nunuPortrait = await portraitPixels(page);

  await page.keyboard.press('1');
  await expectSelected(page, 'nana');
  await expect.poll(() => portraitPixels(page)).toBe(nanaPortrait);
  await page.keyboard.press('2');
  await expectSelected(page, 'nunu');
  await expect.poll(() => portraitPixels(page)).toBe(nunuPortrait);
  await nanaButton(page).click();
  await expectSelected(page, 'nana');
});

test('switching characters preserves current position, velocity, physics and pause', async ({ page }) => {
  await page.locator('#game').focus();
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await snapshot(page)).character.vx).toBeGreaterThan(120);
  await page.keyboard.up('ArrowRight');

  // Capture both snapshots in one browser task so frame progression cannot hide a reset.
  const switched = await nunuButton(page).evaluate(button => {
    const before = (window as unknown as TestWindow).__SKATE__;
    (button as HTMLButtonElement).click();
    const after = (window as unknown as TestWindow).__SKATE__;
    return { before, after };
  });
  expect(switched.before.character.x).toBeGreaterThan(150);
  expect(switched.after.selectedCharacter).toBe('nunu');
  expect(switched.after.character).toEqual(switched.before.character);
  expect(switched.after.config).toEqual(switched.before.config);
  expect(switched.after.paused).toBe(false);
  await expectSelected(page, 'nunu');

  await page.keyboard.press('p');
  await expect.poll(async () => (await snapshot(page)).paused).toBe(true);
  const paused = await snapshot(page);
  await page.keyboard.press('1');
  await expectSelected(page, 'nana');
  const switchedWhilePaused = await snapshot(page);
  expect(switchedWhilePaused.paused).toBe(true);
  expect(switchedWhilePaused.character).toEqual(paused.character);
  expect(switchedWhilePaused.config).toEqual(paused.config);
  await expect(page.locator('#pause-overlay')).toBeVisible();
  await page.keyboard.press('p');
  await expect.poll(async () => (await snapshot(page)).paused).toBe(false);
});

test('the portrait button alternates sisters by click, Enter and Space without changing paused movement', async ({ page }) => {
  const toggle = page.locator('#character-toggle');
  const portrait = page.locator('#character-portrait');
  await expect(toggle).toBeEnabled();
  await page.locator('#game').focus();
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await snapshot(page)).character.vx).toBeGreaterThan(120);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('p');
  await expect.poll(async () => (await snapshot(page)).paused).toBe(true);
  const paused = await snapshot(page);
  expect(paused.character.x).toBeGreaterThan(150);
  const nanaPortrait = await portraitPixels(page);
  const initialLabel = await toggle.getAttribute('aria-label');
  expect(initialLabel).toBeTruthy();

  const expectPreserved = async (selected: CharacterId) => {
    await expectSelected(page, selected);
    const after = await snapshot(page);
    expect(after.character).toEqual(paused.character);
    expect(after.config).toEqual(paused.config);
    expect(after.paused).toBe(true);
    await expect(page.locator('#pause-overlay')).toBeVisible();
    await expect(page.locator('#game')).toBeFocused();
  };

  // Click the actual portrait, including while the pause overlay is visible.
  await portrait.click();
  await expectPreserved('nunu');
  await expect.poll(() => portraitPixels(page)).not.toBe(nanaPortrait);
  await expect(toggle).not.toHaveAttribute('aria-label', initialLabel!);
  await portrait.click();
  await expectPreserved('nana');
  await expect.poll(() => portraitPixels(page)).toBe(nanaPortrait);

  for (const [key, selected] of [['Enter', 'nunu'], ['Space', 'nana']] as const) {
    await toggle.focus();
    await page.keyboard.press(key);
    await expectPreserved(selected);
  }
});

test.describe('portrait touch selection', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('tapping the portrait alternates both sisters above the pause overlay on a narrow screen', async ({ page }) => {
    await expect(page.locator('#character-toggle')).toBeEnabled();
    await page.locator('#pause-button').tap();
    await expect.poll(async () => (await snapshot(page)).paused).toBe(true);
    const paused = await snapshot(page);

    for (const selected of ['nunu', 'nana'] as const) {
      await page.locator('#character-portrait').tap();
      await expectSelected(page, selected);
      const after = await snapshot(page);
      expect(after.character).toEqual(paused.character);
      expect(after.config).toEqual(paused.config);
      expect(after.paused).toBe(true);
      await expect(page.locator('#game')).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});

test('Nunu moves and jumps on a gamepad while held LB and RB each switch only once', async ({ page }) => {
  await page.locator('#game').focus();
  await updateGamepad(page, { connected: true });
  await expect(page.locator('#gamepad-status')).toHaveText('Controle conectado');

  await updateGamepad(page, { button: 5, pressed: true });
  await expectSelected(page, 'nunu');
  await expectHeldShoulderDoesNotRepeat(page, 'nunu');
  await updateGamepad(page, { button: 5, pressed: false });
  await waitForGamepadRelease(page);

  const startX = (await snapshot(page)).character.x;
  await updateGamepad(page, { axis: 1 });
  await expect.poll(async () => (await snapshot(page)).character.vx).toBeGreaterThan(150);
  expect((await snapshot(page)).character.x).toBeGreaterThan(startX);
  await updateGamepad(page, { button: 0, pressed: true });
  await expect.poll(async () => (await snapshot(page)).character.state, { intervals: [16] }).toBe('JUMP');
  expect((await snapshot(page)).character.grounded).toBe(false);
  await updateGamepad(page, { axis: 0, button: 0, pressed: false });
  await expect.poll(async () => (await snapshot(page)).character.grounded).toBe(true);
  await expectSelected(page, 'nunu');

  await updateGamepad(page, { button: 4, pressed: true });
  await expectSelected(page, 'nana');
  await expectHeldShoulderDoesNotRepeat(page, 'nana');
  await updateGamepad(page, { button: 4, pressed: false });
  await waitForGamepadRelease(page);
  await updateGamepad(page, { button: 4, pressed: true });
  await expectSelected(page, 'nunu');
  await expectHeldShoulderDoesNotRepeat(page, 'nunu');
});

test('both character buttons remain visible and usable on narrow mobile screens without overflow', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(nanaButton(page)).toBeVisible();
    await expect(nunuButton(page)).toBeVisible();
    await expect(nanaButton(page)).toBeInViewport({ ratio: 1 });
    await expect(nunuButton(page)).toBeInViewport({ ratio: 1 });
    await nunuButton(page).click();
    await expectSelected(page, 'nunu');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Nunu at ${width}px`).toBe(true);
    await nanaButton(page).click();
    await expectSelected(page, 'nana');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Nana at ${width}px`).toBe(true);
  }
});
