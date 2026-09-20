import assert from 'node:assert/strict';
import test from 'node:test';
import { Adventure, CHECKPOINTS } from '../src/game/adventure/Adventure';
import { Character } from '../src/game/character/Character';
import { DEFAULT_PHYSICS, FIXED_STEP } from '../src/game/config';
import { gapAt, groundAt, RESCUE_LEVEL } from '../src/game/level/Level';
import type { InputFrame } from '../src/game/types';

const idle: InputFrame = { axis: 0, jumpHeld: false, jumpPressed: false };
function setup() {
  const character = new Character(RESCUE_LEVEL, { ...DEFAULT_PHYSICS });
  const adventure = new Adventure(RESCUE_LEVEL, character); adventure.start();
  return { character, adventure };
}

test('every checkpoint stands on flat ground, clear of hole edges and enemy patrols', () => {
  const { adventure } = setup();
  for (const x of CHECKPOINTS) {
    assert.equal(gapAt(RESCUE_LEVEL, x), undefined);
    assert.equal(groundAt(RESCUE_LEVEL, x).angle, 0);
    for (const gap of RESCUE_LEVEL.gaps!) assert.ok(x < gap.x - 60 || x > gap.x + gap.width + 60);
    for (const enemy of adventure.enemies) assert.ok(Math.abs(x - enemy.home) > enemy.range + 75);
  }
});

test('each activated checkpoint survives a fall and respawns safely on foot without losing a second heart', () => {
  for (let i = 1; i < CHECKPOINTS.length; i++) {
    const { character, adventure } = setup();
    const x = CHECKPOINTS[i];
    character.reset({ x, y: groundAt(RESCUE_LEVEL, x).y }); adventure.update(FIXED_STEP, idle);
    assert.equal(adventure.checkpoint, i);
    character.setEquipment('patins'); character.reset({ x: 1900, y: RESCUE_LEVEL.height + 90 });
    adventure.update(FIXED_STEP, idle);
    assert.equal(character.snapshot.x, x); assert.equal(character.snapshot.equipment, 'foot');
    assert.equal(character.snapshot.grounded, true); assert.equal(adventure.health, 4);
    for (let frame = 0; frame < 180; frame++) adventure.update(FIXED_STEP, idle);
    assert.equal(adventure.health, 4); assert.equal(adventure.retries, 1);
    assert.equal(character.snapshot.x, x);
  }
});

test('flying past a flag cannot save an airborne fall; safe landing activates it', () => {
  const { character, adventure } = setup();
  const x = CHECKPOINTS[2];
  character.reset({ x, y: 80 }); adventure.update(FIXED_STEP, idle);
  assert.equal(adventure.checkpoint, 0);
  character.reset({ x: 1900, y: RESCUE_LEVEL.height + 90 }); adventure.update(FIXED_STEP, idle);
  assert.equal(character.snapshot.x, CHECKPOINTS[0]);
  character.reset({ x, y: groundAt(RESCUE_LEVEL, x).y }); adventure.update(FIXED_STEP, idle);
  assert.equal(adventure.checkpoint, 2);
});

test('the skate and patins stations can be reached again on foot from their checkpoints', () => {
  for (const [index, gear] of [[1, 'skate'], [2, 'skate'], [3, 'patins']] as const) {
    const { character, adventure } = setup(); const x = CHECKPOINTS[index];
    character.reset({ x, y: groundAt(RESCUE_LEVEL, x).y });
    const station = adventure.pickups.filter(p => p.equipment === gear).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
    assert.ok(Math.abs(station.x - x) <= 100);
    for (let frame = 0; frame < 90 && character.snapshot.equipment === 'foot'; frame++) {
      adventure.update(FIXED_STEP, { ...idle, axis: station.x > x ? 1 : -1 });
    }
    assert.equal(character.snapshot.equipment, gear); assert.equal(adventure.health, 5);
  }
});
