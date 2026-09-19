import { test, expect, type Page } from '@playwright/test';
import type { CharacterSnapshot } from '../src/game/types';
import type { Enemy, Phase } from '../src/game/adventure/Adventure';

interface Diagnostics {
  character: CharacterSnapshot;
  selectedCharacter: string;
  adventure: { phase: Phase; enemies: Enemy[]; bossHP: number; checkpoint: number; stage: number; retries: number; health: number; gaps: { x: number; width: number }[]; barrierBroken: boolean; keyCollected: boolean; usedDoubleJump: boolean; rescueKey: { x: number }; skateRamp: { lip: number }; rampCleared: boolean };
}
const snapshot = (page: Page) => page.evaluate(() => (window as unknown as { __SKATE__: Diagnostics }).__SKATE__);

for (const sister of ['Nana', 'Nunu']) {
  test(`${sister} completes the rescue through gamepad input, both powers, reunion and replay`, async ({ page }) => {
    test.setTimeout(180_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      let jumpHeld = false, spinTap = 0;
      const pad = { connected: true, id: 'Rescue test controller', index: 0, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
      Object.defineProperty(navigator, 'getGamepads', { value: () => {
        const s = (window as unknown as { __SKATE__?: Diagnostics }).__SKATE__;
        if (!s || s.adventure.phase !== 'playing') { pad.axes[0] = 0; pad.buttons[0] = { pressed: false, value: 0 }; return [pad]; }
        const b = s.character;
        const target = s.adventure.enemies.find(e => e.hp > 0 && e.x > b.x - 100);
        let axis = 1, jump = false;
        if (target && (target.kind === 'boss' || b.equipment !== 'skate')) {
          const dx = target.x - b.x;
          jump = b.grounded && Math.abs(dx) < Math.max(115, Math.abs(b.vx) * 0.4 + 65);
          axis = !b.grounded && Math.abs(dx) < 18 ? b.vx > 20 ? -1 : b.vx < -20 ? 1 : 0 : dx > 0 ? 1 : -1;
        } else if (!target && s.adventure.bossHP > 0) axis = b.x > s.adventure.enemies.find(e => e.kind === 'boss')!.x ? -1 : 1;
        if (b.grounded && s.adventure.gaps.some(gap => gap.x > b.x && gap.x - b.x < Math.max(22, Math.abs(b.vx) * 0.12))) { axis = 1; jump = true; }
        // Release on the first grounded frame so a new physical button edge
        // can launch the next jump. No game state or position is modified.
        let secondJump = !b.grounded && b.equipment === 'patins' && b.vy > 30 && s.adventure.gaps.some(gap => b.x >= gap.x - 20 && b.x < gap.x + gap.width);
        if (secondJump) axis = 1;
        if (!s.adventure.keyCollected && b.equipment === 'patins' && b.x > s.adventure.rescueKey.x - 140 && b.x < s.adventure.rescueKey.x + 100) {
          const dx = s.adventure.rescueKey.x - b.x;
          axis = Math.abs(dx) < 18 ? b.vx > 20 ? -1 : b.vx < -20 ? 1 : 0 : dx > 0 ? 1 : -1;
          jump = b.grounded && Math.abs(dx) < 100;
          secondJump = !b.grounded && !s.adventure.usedDoubleJump && b.vy > -100;
        }
        jumpHeld = b.grounded ? jump && !jumpHeld : secondJump ? !jumpHeld : jumpHeld;
        if (!b.grounded && b.equipment === 'skate' && b.x > s.adventure.skateRamp.lip && b.x < s.adventure.skateRamp.lip + 170 && spinTap < 4) {
          jumpHeld = spinTap % 2 === 1; spinTap++;
        }
        pad.axes[0] = axis;
        pad.buttons[0] = { pressed: jumpHeld, value: Number(jumpHeld) };
        return [pad];
      } });
    });
    await page.goto('/');
    await page.locator('#art-loading').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: `Selecionar ${sister}`, exact: true }).click();
    await expect(page.locator('#power-label')).toHaveText('A pé');
    await page.locator('#begin-button').click();
    await page.clock.install();
    const gear = new Set<string>();
    const stages = new Set<number>();
    let spinSeen = false;
    for (let i = 0; i < 180; i++) {
      const s = await snapshot(page), b = s.character;
      gear.add(b.equipment ?? 'foot');
      spinSeen ||= (b.tricks ?? 0) > 0;
      if (!stages.has(s.adventure.stage)) {
        stages.add(s.adventure.stage);
        await page.locator('#game-shell').screenshot({ path: `test-results/${sister.toLowerCase()}-stage-${s.adventure.stage}.png` });
      }
      if (s.adventure.phase === 'won') break;
      await page.clock.runFor(500);
    }
    const final = await snapshot(page);
    expect(final.adventure.phase, JSON.stringify(final)).toBe('won');
    expect(final.selectedCharacter).toBe(sister.toLowerCase());
    expect(final.adventure.barrierBroken).toBe(true);
    expect(final.adventure.keyCollected).toBe(true);
    expect(final.adventure.rampCleared).toBe(true);
    expect(spinSeen).toBe(true);
    expect(gear).toEqual(new Set(['foot', 'skate', 'patins']));
    await page.clock.runFor(120);
    await expect(page.locator('#victory-panel')).toBeVisible();
    await expect(page.locator('#play-again')).toBeFocused();
    await page.locator('#game-shell').screenshot({ path: `test-results/${sister.toLowerCase()}-victory.png` });
    await page.locator('#play-again').click();
    await page.clock.runFor(120);
    expect((await snapshot(page)).adventure.bossHP).toBe(3);
    expect((await snapshot(page)).character.equipment).toBe('foot');
    await expect(page.locator('#victory-panel')).toBeHidden();
    expect(errors).toEqual([]);
  });
}
