import assert from 'node:assert/strict';
import test from 'node:test';
import { Character, TRICK_DURATION, FLIP_DURATION } from '../src/game/character/Character';
import { Adventure } from '../src/game/adventure/Adventure';
import { DEFAULT_PHYSICS, FIXED_STEP } from '../src/game/config';
import { RESCUE_LEVEL, SKATE_RAMP, groundAt } from '../src/game/level/Level';
import type { Equipment, InputFrame, GameSound } from '../src/game/types';

const idle: InputFrame = { axis: 0, jumpHeld: false, jumpPressed: false };

test('the patins somersault starts only on the second jump and ends without granting a third jump', () => {
  const sounds: GameSound[] = [];
  const character = new Character(RESCUE_LEVEL, { ...DEFAULT_PHYSICS }, sound => sounds.push(sound));
  character.setEquipment('patins');
  const jump = { ...idle, jumpHeld: true, jumpPressed: true };
  character.update(FIXED_STEP, jump);
  assert.equal(character.snapshot.flipTime ?? 0, 0);
  for (let i = 0; i < 12; i++) character.update(FIXED_STEP, { ...jump, jumpPressed: false });
  character.update(FIXED_STEP, jump);
  assert.ok(character.snapshot.flipTime! > 0);
  const secondVy = character.snapshot.vy;
  character.update(FIXED_STEP, { ...jump, jumpPressed: false });
  character.update(FIXED_STEP, jump);
  assert.ok(character.snapshot.vy > secondVy, 'a third press must not apply another impulse');
  assert.equal(sounds.filter(sound => sound === 'trick').length, 1);
  for (let i = 0; i < Math.ceil(FLIP_DURATION / FIXED_STEP) + 2; i++) character.update(FIXED_STEP, { ...jump, jumpPressed: false });
  assert.equal(character.snapshot.flipTime, 0);
  character.reset(); assert.equal(character.snapshot.flipTime, 0);
});

test('the downhill run builds skateboard speed and its marked jump clears the ravine', () => {
  const body = new Character(RESCUE_LEVEL, { ...DEFAULT_PHYSICS });
  body.setEquipment('skate'); body.reset({ x: 1420, y: groundAt(RESCUE_LEVEL, 1420).y });
  let jumped = false, landed = false, speed = 0;
  for (let i = 0; i < 600; i++) {
    const jump = !jumped && body.snapshot.x >= SKATE_RAMP.lip - 80;
    if (jump) { jumped = true; speed = body.snapshot.vx; }
    body.update(FIXED_STEP, { axis: 1, jumpHeld: jumped, jumpPressed: jump });
    if (jumped && body.snapshot.grounded) { landed = true; break; }
  }
  assert.ok(speed >= SKATE_RAMP.minSpeed);
  assert.ok(landed);
  assert.ok(body.snapshot.x >= SKATE_RAMP.landing);
});

test('foot and even optimally timed double jumps cannot span the skateboard ravine', () => {
  for (const gear of ['foot', 'patins'] as Equipment[]) for (const offset of [2, 20, 60]) for (const secondAt of [0.18, 0.3, 0.39]) {
    const character = new Character(RESCUE_LEVEL, { ...DEFAULT_PHYSICS });
    character.setEquipment(gear);
    const x = SKATE_RAMP.lip - offset;
    character.reset({ x, y: groundAt(RESCUE_LEVEL, x).y });
    character.snapshot.vx = gear === 'foot' ? 210 : 280;
    for (let i = 0; i < 240; i++) character.update(FIXED_STEP, {
      axis: 1, jumpHeld: true, jumpPressed: i === 0 || gear === 'patins' && i === Math.round(secondAt / FIXED_STEP),
    });
    assert.ok(character.snapshot.y > RESCUE_LEVEL.height, `${gear}, offset=${offset}, second=${secondAt} should fall`);
  }
});

test('falling removes either accessory at the checkpoint; the permanent station can equip it again', () => {
  for (const gear of ['skate', 'patins'] as Equipment[]) {
    const character = new Character(RESCUE_LEVEL, { ...DEFAULT_PHYSICS });
    const adventure = new Adventure(RESCUE_LEVEL, character); adventure.start();
    const station = adventure.pickups.find(p => p.equipment === gear)!;
    character.reset({ x: station.x, y: groundAt(RESCUE_LEVEL, station.x).y });
    adventure.update(FIXED_STEP, idle);
    assert.equal(character.snapshot.equipment, gear);
    character.reset({ x: 1900, y: RESCUE_LEVEL.height + 90 });
    adventure.update(FIXED_STEP, idle);
    assert.equal(adventure.health, 4);
    assert.equal(character.snapshot.equipment, 'foot');
    character.reset({ x: station.x, y: groundAt(RESCUE_LEVEL, station.x).y });
    adventure.update(FIXED_STEP, idle);
    assert.equal(character.snapshot.equipment, gear);
  }
});

test('two airborne presses trigger one complete skate spin without adding height or changing trajectory', () => {
  const sounds: GameSound[] = [];
  const character = new Character(RESCUE_LEVEL, { ...DEFAULT_PHYSICS }, sound => sounds.push(sound));
  const control = new Character(RESCUE_LEVEL, { ...DEFAULT_PHYSICS });
  for (const c of [character, control]) c.setEquipment('skate');
  for (let i = 0; i < 90; i++) {
    character.update(FIXED_STEP, { ...idle, jumpHeld: true, jumpPressed: [0, 12, 24, 28, 35].includes(i) });
    control.update(FIXED_STEP, { ...idle, jumpHeld: true, jumpPressed: i === 0 });
    assert.equal(character.snapshot.y, control.snapshot.y);
    assert.equal(character.snapshot.vy, control.snapshot.vy);
    if (i === 13) assert.equal(character.snapshot.trickTime ?? 0, 0, 'first airborne tap only arms the trick');
    if (i === 25) assert.ok(character.snapshot.trickTime! > 0);
  }
  assert.equal(character.snapshot.tricks, 1);
  assert.equal(character.snapshot.trickTime, 0);
  assert.equal(sounds.filter(sound => sound === 'trick').length, 1);
  assert.ok(TRICK_DURATION < 0.6);
});

test('a slow pair of taps, foot and patins never trigger the skateboard trick', () => {
  for (const gear of ['skate', 'foot', 'patins'] as Equipment[]) {
    const character = new Character(RESCUE_LEVEL, { ...DEFAULT_PHYSICS });
    character.setEquipment(gear); character.reset({ x: 150, y: -600 });
    for (let i = 0; i < 65; i++) character.update(FIXED_STEP, { ...idle, jumpHeld: true, jumpPressed: i === 0 || i === (gear === 'skate' ? 60 : 8) });
    assert.equal(character.snapshot.tricks, 0);
  }
});
