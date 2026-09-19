import assert from 'node:assert/strict';
import test from 'node:test';
import { Adventure, CAGE_X, COMPANION_OFFSET, RESCUE_KEY, SKATE_BARRIER_X, SUPER_DURATION } from '../src/game/adventure/Adventure';
import { Character } from '../src/game/character/Character';
import { DEFAULT_PHYSICS, FIXED_STEP } from '../src/game/config';
import { groundAt, RESCUE_LEVEL } from '../src/game/level/Level';
import type { GameSound, InputFrame } from '../src/game/types';

const idle: InputFrame = { axis: 0, jumpHeld: false, jumpPressed: false };
const held: InputFrame = { ...idle, jumpHeld: true };
function setup(sounds: GameSound[] = []) {
  const character = new Character(RESCUE_LEVEL, { ...DEFAULT_PHYSICS });
  const adventure = new Adventure(RESCUE_LEVEL, character, sound => sounds.push(sound));
  return { character, adventure };
}
function advance(adventure: Adventure, seconds: number, input = idle) {
  for (let i = 0; i < Math.ceil(seconds / FIXED_STEP); i++) adventure.update(FIXED_STEP, { ...input, jumpPressed: i === 0 && input.jumpPressed });
}
function place(character: Character, x: number, y = groundAt(RESCUE_LEVEL, x).y) { character.reset({ x, y }); }

function collectKey(character: Character, adventure: Adventure) {
  character.setEquipment('patins'); place(character, RESCUE_KEY.x);
  advance(adventure, 0.30, { ...held, jumpPressed: true });
  advance(adventure, 0.25, { ...held, jumpPressed: true });
  assert.equal(adventure.keyCollected, true);
}

test('the easy crate challenge blocks walking and patins, then breaks with skateboard acceleration', () => {
  const { character, adventure } = setup(); adventure.start();
  place(character, SKATE_BARRIER_X - 45);
  advance(adventure, 1, { ...idle, axis: 1 });
  assert.equal(character.snapshot.x, SKATE_BARRIER_X - 32);
  assert.equal(adventure.barrierBroken, false);
  character.setEquipment('patins'); advance(adventure, 0.5, { ...idle, axis: 1 });
  assert.equal(adventure.barrierBroken, false);
  character.setEquipment('skate'); advance(adventure, 0.6, { ...idle, axis: 1 });
  assert.equal(adventure.barrierBroken, true);
  assert.equal(adventure.health, 5, 'trying the challenge does not cause damage');
  adventure.reset(); assert.equal(adventure.barrierBroken, false);
});

test('the rescue key requires an actual patins double jump and stays collected after a fall', () => {
  const { character, adventure } = setup(); adventure.start();
  for (const gear of ['foot', 'patins'] as const) {
    character.setEquipment(gear); place(character, RESCUE_KEY.x);
    advance(adventure, 0.9, { ...held, jumpPressed: true });
    assert.equal(adventure.keyCollected, false, 'a single held jump is not a double jump');
  }
  collectKey(character, adventure);
  place(character, 3500, RESCUE_LEVEL.height + 90); adventure.update(FIXED_STEP, idle);
  assert.equal(adventure.keyCollected, true);
  adventure.reset(); assert.equal(adventure.keyCollected, false);
});

test('intro holds the character; both powers are picked up and full reset clears the journey', () => {
  const { character, adventure } = setup();
  advance(adventure, 2, { ...idle, axis: 1 });
  assert.equal(character.snapshot.x, 150);
  assert.equal(character.snapshot.equipment, 'foot');
  adventure.start();
  place(character, 1080); adventure.update(FIXED_STEP, idle);
  assert.equal(character.snapshot.equipment, 'skate');
  place(character, 2970); adventure.update(FIXED_STEP, idle);
  assert.equal(character.snapshot.equipment, 'patins');
  adventure.reset();
  assert.equal(adventure.phase, 'intro');
  assert.equal(character.snapshot.equipment, 'foot');
  assert.ok(adventure.pickups.every(pickup => !pickup.taken));
  assert.equal(adventure.boss.hp, 3);
  assert.equal(adventure.checkpoint, 0);
});

test('only patins grants a second jump; no third jump or repeated held-button jump', () => {
  for (const gear of ['foot', 'skate', 'patins'] as const) {
    const { character } = setup();
    character.setEquipment(gear);
    character.update(FIXED_STEP, { ...held, jumpPressed: true });
    for (let i = 0; i < 35; i++) character.update(FIXED_STEP, held);
    const vy = character.snapshot.vy;
    character.update(FIXED_STEP, { ...held, jumpPressed: true });
    if (gear === 'patins') assert.ok(character.snapshot.vy < vy - 200);
    else assert.ok(character.snapshot.vy > vy);
    const second = character.snapshot.vy;
    character.update(FIXED_STEP, { ...held, jumpPressed: true });
    assert.ok(character.snapshot.vy > second, 'third press must not jump');
  }
});

test('five side hits remove hearts with grace time; defeat restarts the whole adventure', () => {
  const { character, adventure } = setup(); adventure.start();
  place(character, 1080); adventure.update(FIXED_STEP, idle);
  place(character, 1170); adventure.update(FIXED_STEP, idle);
  assert.equal(adventure.checkpoint, 1);
  const enemy = adventure.enemies[1];
  place(character, enemy.x); adventure.update(FIXED_STEP, idle);
  assert.equal(character.snapshot.equipment, 'foot');
  assert.equal(adventure.health, 4);
  assert.equal(adventure.retries, 0);
  place(character, enemy.x); adventure.update(FIXED_STEP, idle);
  assert.equal(adventure.retries, 0, 'grace time protects against repeat damage');
  assert.equal(adventure.health, 4);
  place(character, 1180); advance(adventure, 2);
  place(character, enemy.x); adventure.update(FIXED_STEP, idle);
  assert.equal(adventure.health, 3);
  assert.equal(adventure.phase, 'playing');
  for (let remaining = 2; remaining >= 1; remaining--) {
    place(character, 1180); advance(adventure, 2);
    place(character, enemy.x); adventure.update(FIXED_STEP, idle);
    assert.equal(adventure.health, remaining);
    assert.equal(adventure.phase, 'playing');
  }
  place(character, 1180); advance(adventure, 2);
  place(character, enemy.x); adventure.update(FIXED_STEP, idle);
  assert.equal(adventure.health, 0);
  assert.equal(adventure.phase, 'defeated');
  const position = character.snapshot.x;
  advance(adventure, 2, { ...idle, axis: 1 });
  assert.equal(character.snapshot.x, position, 'defeat freezes movement');
  adventure.retryCheckpoint();
  assert.equal(adventure.health, 5);
  assert.equal(adventure.phase, 'playing');
  assert.equal(adventure.retries, 0);
  assert.equal(adventure.checkpoint, 0);
  assert.equal(character.snapshot.x, RESCUE_LEVEL.spawn.x);
  assert.equal(character.snapshot.equipment, 'foot');
});

test('powers can be recollected at their permanent stations without resetting the adventure', () => {
  const { character, adventure } = setup(); adventure.start();
  for (const pickup of adventure.pickups) {
    place(character, pickup.x); adventure.update(FIXED_STEP, idle);
    assert.equal(character.snapshot.equipment, pickup.equipment);
    character.setEquipment('foot');
    adventure.update(FIXED_STEP, idle);
    assert.equal(character.snapshot.equipment, 'foot', 'remaining inside does not repeatedly equip');
    place(character, pickup.x - 100); adventure.update(FIXED_STEP, idle);
    place(character, pickup.x); adventure.update(FIXED_STEP, idle);
    assert.equal(character.snapshot.equipment, pickup.equipment);
    assert.equal(pickup.taken, true);
  }
});

test('falling through a hole consumes exactly one heart and returns to the checkpoint', () => {
  const { character, adventure } = setup(); adventure.start();
  place(character, 1170); adventure.update(FIXED_STEP, idle);
  place(character, 1900, 500);
  advance(adventure, 1.5);
  assert.equal(adventure.health, 4);
  assert.equal(adventure.retries, 1);
  assert.equal(character.snapshot.x, 1150);
  assert.equal(adventure.phase, 'playing');
  // Falling again during invulnerability still costs one heart.
  place(character, 1900, RESCUE_LEVEL.height + 90); adventure.update(FIXED_STEP, idle);
  assert.equal(adventure.health, 3);
  for (let remaining = 2; remaining >= 1; remaining--) {
    place(character, 1900, RESCUE_LEVEL.height + 90); adventure.update(FIXED_STEP, idle);
    assert.equal(adventure.health, remaining);
    assert.equal(adventure.phase, 'playing');
  }
  place(character, 1900, RESCUE_LEVEL.height + 90); adventure.update(FIXED_STEP, idle);
  assert.equal(adventure.phase, 'defeated');
  assert.equal(adventure.health, 0);
  adventure.reset(); assert.equal(adventure.health, 5);
});

test('descending feet defeat a slime and bounce; fast skateboard defeats side contact', () => {
  const { character, adventure } = setup(); adventure.start();
  let enemy = adventure.enemies[0];
  place(character, enemy.x, enemy.y - 38); character.snapshot.vy = 200;
  advance(adventure, 0.035, held);
  assert.equal(enemy.hp, 0); assert.ok(character.snapshot.vy < 0);
  enemy = adventure.enemies[1];
  character.setEquipment('skate'); place(character, enemy.x - 25);
  character.snapshot.vx = 350;
  adventure.update(FIXED_STEP, { ...idle, axis: 1 });
  assert.equal(enemy.hp, 0);
  assert.equal(adventure.health, 5, 'correct attacks do not cost hearts');
});

test('the guardian needs three separate stomps and the puppy cannot be rescued before victory', () => {
  const sounds: GameSound[] = [];
  const { character, adventure } = setup(sounds); adventure.start();
  place(character, CAGE_X); adventure.update(FIXED_STEP, idle);
  assert.equal(adventure.phase, 'playing');
  for (let hp = 2; hp >= 0; hp--) {
    const boss = adventure.boss;
    place(character, boss.x, boss.y - 68); character.snapshot.vy = 180;
    adventure.update(FIXED_STEP, held);
    assert.equal(boss.hp, hp);
    if (hp > 0) {
      place(character, boss.x, boss.y - 68); character.snapshot.vy = 180;
      adventure.update(FIXED_STEP, held); assert.equal(boss.hp, hp, 'stomps must respect recovery');
      place(character, 2950); advance(adventure, 1);
    }
  }
  place(character, CAGE_X - 50); adventure.update(FIXED_STEP, idle);
  assert.equal(adventure.phase, 'playing', 'defeating the guardian without the key cannot open the cage');
  assert.equal(sounds.includes('rescue'), false);
  collectKey(character, adventure);
  place(character, CAGE_X - 50); adventure.update(FIXED_STEP, idle);
  assert.equal(adventure.phase, 'reunion');
  advance(adventure, 3.1);
  assert.equal(adventure.phase, 'won');
  assert.equal(sounds.filter(sound => sound === 'rescue').length, 1);
  assert.ok(Math.abs(adventure.dogX - character.snapshot.x - COMPANION_OFFSET) < 1);
});

test('the twelfth star grants exactly eight seconds of protection, once per adventure', () => {
  const sounds: GameSound[] = [];
  const { character, adventure } = setup(sounds); adventure.start();
  adventure.sparks.slice(0, -1).forEach(star => star.taken = true);
  adventure.update(FIXED_STEP, idle);
  assert.equal(adventure.superTime, 0);
  place(character, adventure.sparks.at(-1)!.x); adventure.update(FIXED_STEP, idle);
  assert.equal(adventure.collected, 12);
  assert.equal(adventure.superTime, SUPER_DURATION);
  character.setEquipment('patins');
  const enemy = adventure.enemies[0];
  place(character, enemy.x); adventure.update(FIXED_STEP, idle);
  assert.equal(enemy.hp, 0, 'glowing side contact defeats a monster');
  assert.equal(adventure.health, 5);
  assert.equal(character.snapshot.equipment, 'patins');
  place(character, 150); advance(adventure, SUPER_DURATION + 0.1);
  assert.equal(adventure.superTime, 0);
  place(character, adventure.enemies[1].x); adventure.update(FIXED_STEP, idle);
  assert.equal(adventure.health, 4, 'ordinary contact is dangerous again after expiry');
  assert.equal(sounds.filter(sound => sound === 'super').length, 1);
  adventure.reset();
  assert.equal(adventure.superAwarded, false);
  assert.equal(adventure.collected, 0);
});

test('Superbrilho protects against the guardian but preserves three separate hits', () => {
  const { character, adventure } = setup(); adventure.start();
  adventure.sparks.forEach(star => star.taken = true);
  adventure.update(FIXED_STEP, idle);
  for (let hp = 2; hp >= 0; hp--) {
    place(character, adventure.boss.x); adventure.update(FIXED_STEP, idle);
    assert.equal(adventure.boss.hp, hp);
    assert.equal(adventure.health, 5);
    adventure.update(FIXED_STEP, idle);
    assert.equal(adventure.boss.hp, hp, 'continuous contact respects recovery');
    place(character, 150); advance(adventure, 0.7);
  }
});

test('a hole still costs a heart and ends Superbrilho without awarding it again', () => {
  const { character, adventure } = setup(); adventure.start();
  adventure.sparks.forEach(star => star.taken = true);
  adventure.update(FIXED_STEP, idle);
  place(character, 460, RESCUE_LEVEL.height + 90); adventure.update(FIXED_STEP, idle);
  assert.equal(adventure.health, 4);
  advance(adventure, 1);
  assert.equal(adventure.superTime, 0);
  assert.equal(adventure.superAwarded, true);
});

test('the raised key is physically above the reach of a single jump from the ground', () => {
  const { character, adventure } = setup(); adventure.start();
  place(character, RESCUE_KEY.x); character.setEquipment('patins');
  let highestFeet = character.snapshot.y;
  for (let i = 0; i < 120; i++) {
    adventure.update(FIXED_STEP, { ...held, jumpPressed: i === 0 });
    highestFeet = Math.min(highestFeet, character.snapshot.y);
  }
  assert.ok(highestFeet - 100 > RESCUE_KEY.y + 18, 'even the top of the pickup hitbox must fall short');
  collectKey(character, adventure);
});

test('default controls can complete the entire adventure without teleporting', () => {
  const { character, adventure } = setup(); adventure.start();
  for (let i = 0; i < 120 * 150 && adventure.phase !== 'won'; i++) {
    const b = character.snapshot;
    const target = adventure.enemies.find(e => e.hp > 0 && e.x > b.x - 100);
    let axis: InputFrame['axis'] = 1;
    let jump = false;
    if (target) {
      const dx = target.x - b.x;
      if (target.kind === 'boss' || b.equipment !== 'skate') {
        if (b.grounded && Math.abs(dx) < Math.max(115, Math.abs(b.vx) * 0.4 + 65)) jump = true;
        if (!b.grounded && Math.abs(dx) < 18) axis = b.vx > 20 ? -1 : b.vx < -20 ? 1 : 0;
        else axis = dx > 0 ? 1 : -1;
      }
    } else if (adventure.boss.hp > 0) axis = b.x > adventure.boss.x ? -1 : 1;
    if (b.grounded && RESCUE_LEVEL.gaps?.some(gap => gap.x > b.x && gap.x - b.x < Math.max(22, Math.abs(b.vx) * 0.12))) { axis = 1; jump = true; }
    if (!b.grounded && b.equipment === 'patins' && b.vy > 30 && RESCUE_LEVEL.gaps?.some(gap => b.x >= gap.x - 20 && b.x < gap.x + gap.width)) { axis = 1; jump = true; }
    if (!adventure.keyCollected && b.equipment === 'patins' && b.x > RESCUE_KEY.x - 140 && b.x < RESCUE_KEY.x + 100) {
      const dx = RESCUE_KEY.x - b.x;
      axis = Math.abs(dx) < 18 ? b.vx > 20 ? -1 : b.vx < -20 ? 1 : 0 : dx > 0 ? 1 : -1;
      jump = b.grounded && Math.abs(dx) < 100 || !b.grounded && !character.usedDoubleJump && b.vy > -100;
    }
    adventure.update(FIXED_STEP, { axis, jumpHeld: !b.grounded || jump, jumpPressed: jump });
  }
  assert.equal(adventure.phase, 'won', JSON.stringify({ x: character.snapshot.x, gear: character.snapshot.equipment, hp: adventure.boss.hp, retries: adventure.retries }));
  assert.equal(adventure.barrierBroken, true);
  assert.equal(adventure.keyCollected, true);
});
