import assert from 'node:assert/strict';
import test from 'node:test';
import { Character } from '../src/game/character/Character';
import { DEFAULT_PHYSICS, FIXED_STEP } from '../src/game/config';
import { groundAt, TEST_LEVEL } from '../src/game/level/Level';
import type { GameSound, InputFrame, LevelData, PhysicsConfig } from '../src/game/types';

const idle: InputFrame = { axis: 0, jumpPressed: false, jumpHeld: false };
const right: InputFrame = { ...idle, axis: 1 };
const left: InputFrame = { ...idle, axis: -1 };
const jump: InputFrame = { ...idle, jumpPressed: true, jumpHeld: true };
const holding: InputFrame = { ...idle, jumpHeld: true };
const config = (overrides: Partial<PhysicsConfig> = {}): PhysicsConfig => ({ ...DEFAULT_PHYSICS, ...overrides });
const flat = (spawnY = 370): LevelData => ({
  width: 5000, height: 800, spawn: { x: 150, y: spawnY },
  ground: [{ x: 0, y: 370 }, { x: 5000, y: 370 }], platforms: [],
});
function advance(character: Character, seconds: number, input = idle, dt = FIXED_STEP): void {
  let remaining = seconds;
  let first = true;
  while (remaining > 0.0000001) {
    const step = Math.min(dt, remaining);
    character.update(step, first ? input : { ...input, jumpPressed: false });
    first = false;
    remaining -= step;
  }
}

test('the first playable sequence visits every state and triggers its sounds once', () => {
  const sounds: GameSound[] = [];
  const character = new Character(flat(), config(), (sound) => sounds.push(sound));
  assert.equal(character.snapshot.state, 'IDLE');
  advance(character, 0.1);
  assert.ok(character.snapshot.stateTime > 0);
  character.update(FIXED_STEP, right);
  assert.equal(character.snapshot.state, 'PUSH');
  advance(character, 0.5, right);
  assert.equal(character.snapshot.state, 'ROLL');
  character.update(FIXED_STEP, { ...jump, axis: 1 });
  assert.equal(character.snapshot.state, 'JUMP');
  for (let i = 0; i < 100 && character.snapshot.vy < 0; i++) character.update(FIXED_STEP, holding);
  assert.equal(character.snapshot.state, 'FALL');
  for (let i = 0; i < 120 && !character.snapshot.grounded; i++) character.update(FIXED_STEP, holding);
  assert.equal(character.snapshot.state, 'LAND');
  assert.equal(character.snapshot.y, 370);
  advance(character, 0.2, right);
  assert.equal(character.snapshot.state, 'ROLL');
  assert.deepEqual(sounds, ['push', 'jump', 'land']);
});

test('acceleration, coast, braking and visual direction follow velocity', () => {
  const character = new Character(flat(), config());
  advance(character, 0.2, right);
  assert.ok(character.snapshot.vx > 90 && character.snapshot.vx < 110);
  advance(character, 1, right);
  assert.equal(character.snapshot.vx, DEFAULT_PHYSICS.maxSpeed);
  const before = character.snapshot.x;
  advance(character, 0.2);
  assert.ok(character.snapshot.x > before + 40);
  assert.ok(character.snapshot.vx > 230);
  advance(character, 0.1, left);
  assert.ok(character.snapshot.vx > 0);
  assert.equal(character.snapshot.facing, 1);
  advance(character, 0.25, left);
  assert.ok(character.snapshot.vx < 0);
  assert.equal(character.snapshot.facing, -1);
  advance(character, 2);
  assert.equal(character.snapshot.vx, 0);
  assert.equal(character.snapshot.state, 'IDLE');
});

test('ramps and downhill transitions stay grounded without bouncing or drifting', () => {
  const character = new Character(TEST_LEVEL, config());
  let uphill = false;
  let downhill = false;
  for (let i = 0; i < 950; i++) {
    character.update(FIXED_STEP, right);
    const body = character.snapshot;
    const surface = groundAt(TEST_LEVEL, body.x);
    assert.equal(body.grounded, true);
    assert.ok(Math.abs(body.y - surface.y) < 0.00001);
    assert.equal(body.vy, 0);
    uphill ||= body.groundAngle < -0.1;
    downhill ||= body.groundAngle > 0.1;
  }
  assert.ok(uphill && downhill);
});

test('one-way platform allows ascent from below and catches the descending board', () => {
  const level = flat();
  level.platforms = [{ x: 90, y: 300, width: 180 }];
  const character = new Character(level, config());
  character.update(FIXED_STEP, jump);
  let roseAbove = false;
  for (let i = 0; i < 160 && !character.snapshot.grounded; i++) {
    character.update(FIXED_STEP, holding);
    roseAbove ||= character.snapshot.y < 300;
  }
  assert.ok(roseAbove);
  assert.equal(character.snapshot.grounded, true);
  assert.equal(character.snapshot.y, 300);
});

test('every platform in the playable test level is reachable with the default held jump', () => {
  for (const [index, platform] of TEST_LEVEL.platforms.entries()) {
    const x = platform.x + platform.width / 2;
    const level: LevelData = { ...TEST_LEVEL, spawn: { x, y: groundAt(TEST_LEVEL, x).y } };
    const character = new Character(level, config());
    character.update(FIXED_STEP, jump);
    let highestFoot = level.spawn.y;
    for (let frame = 0; frame < 240 && !character.snapshot.grounded; frame++) {
      character.update(FIXED_STEP, holding);
      highestFoot = Math.min(highestFoot, character.snapshot.y);
    }
    assert.ok(highestFoot < platform.y - 5, `platform ${index + 1} needs clearance above its top`);
    assert.equal(character.snapshot.grounded, true, `platform ${index + 1} needs a landing`);
    assert.equal(character.snapshot.y, platform.y, `platform ${index + 1} must catch the descending board`);
  }
});

test('walking off a platform gives a short coyote jump without a second air jump', () => {
  const level = flat(260);
  level.platforms = [{ x: 120, y: 260, width: 100 }];
  const sounds: GameSound[] = [];
  const character = new Character(level, config(), (sound) => sounds.push(sound));
  for (let i = 0; i < 120 && character.snapshot.grounded; i++) character.update(FIXED_STEP, right);
  assert.equal(character.snapshot.grounded, false);
  assert.ok(!sounds.includes('land'), 'leaving a platform must not produce another landing');
  advance(character, 0.035, right);
  character.update(FIXED_STEP, { ...jump, axis: 1 });
  assert.ok(character.snapshot.vy < -400);
  advance(character, 0.08, { ...holding, axis: 1 });
  const before = character.snapshot.vy;
  character.update(FIXED_STEP, { ...jump, axis: 1 });
  assert.ok(character.snapshot.vy > before, 'a second press must not reset upward velocity');
});

test('coyote jump expires after the configured window', () => {
  const level = flat(210);
  level.platforms = [{ x: 120, y: 210, width: 100 }];
  const character = new Character(level, config());
  for (let i = 0; i < 120 && character.snapshot.grounded; i++) character.update(FIXED_STEP, right);
  advance(character, 0.14, right);
  character.update(FIXED_STEP, { ...jump, axis: 1 });
  assert.ok(character.snapshot.vy > 0);
});

test('a jump pressed just before contact is buffered and bypasses landing animation', () => {
  const sounds: GameSound[] = [];
  const character = new Character(flat(290), config(), (sound) => sounds.push(sound));
  while (character.snapshot.y < 355) character.update(FIXED_STEP, idle);
  character.update(FIXED_STEP, jump);
  for (let i = 0; i < 20 && !sounds.includes('jump'); i++) character.update(FIXED_STEP, holding);
  assert.deepEqual(sounds, ['land', 'jump']);
  assert.equal(character.snapshot.grounded, false);
  assert.equal(character.snapshot.state, 'JUMP');
  assert.ok(character.snapshot.vy < 0);
});

test('releasing jump early makes a lower jump, and LAND accepts a new jump immediately', () => {
  const full = new Character(flat(), config());
  const tap = new Character(flat(), config());
  full.update(FIXED_STEP, jump);
  tap.update(FIXED_STEP, jump);
  let fullTop = 370;
  let tapTop = 370;
  for (let i = 0; i < 120; i++) {
    full.update(FIXED_STEP, holding);
    tap.update(FIXED_STEP, idle);
    fullTop = Math.min(fullTop, full.snapshot.y);
    tapTop = Math.min(tapTop, tap.snapshot.y);
    if (tap.snapshot.state === 'LAND') {
      tap.update(FIXED_STEP, jump);
      assert.equal(tap.snapshot.state, 'JUMP');
      assert.ok(tap.snapshot.vy < -400);
      break;
    }
  }
  assert.ok(fullTop < tapTop - 40);
});

test('a fast downward sweep cannot tunnel through a thin platform', () => {
  const level = flat(50);
  level.platforms = [{ x: 140, y: 200, width: 20 }];
  const character = new Character(level, config({ gravity: 100000 }));
  advance(character, 0.1, idle, 0.1);
  assert.equal(character.snapshot.y, 200);
  assert.equal(character.snapshot.grounded, true);
});

test('high horizontal velocity still detects the platform crossed during a fall', () => {
  const level = flat(195);
  level.platforms = [{ x: 156, y: 198, width: 2 }];
  const sounds: GameSound[] = [];
  const character = new Character(level, config({ gravity: 100000, acceleration: 400000, maxSpeed: 6000 }), (sound) => sounds.push(sound));
  character.update(FIXED_STEP, right);
  assert.ok(sounds.includes('land'));
});

test('30, 60 and 120 Hz updates produce the same skating and jump trajectory', () => {
  const simulate = (hz: number): Character => {
    const character = new Character(flat(), config());
    advance(character, 0.6, right, 1 / hz);
    advance(character, 0.3, { ...jump, axis: 1 }, 1 / hz);
    advance(character, 0.1, right, 1 / hz);
    return character;
  };
  const baseline = simulate(120).snapshot;
  for (const hz of [30, 60]) {
    const actual = simulate(hz).snapshot;
    for (const key of ['x', 'y', 'vx', 'vy'] as const) assert.ok(Math.abs(actual[key] - baseline[key]) < 0.00001, `${hz} Hz: ${key}`);
    assert.equal(actual.state, baseline.state);
  }
});

test('live physics settings, world limits and reset take effect safely', () => {
  const settings = config();
  const character = new Character(flat(), settings);
  advance(character, 1, right);
  settings.maxSpeed = 100;
  character.update(FIXED_STEP, right);
  assert.equal(character.snapshot.vx, 100);
  advance(character, 6, left);
  assert.equal(character.snapshot.x, 16);
  assert.equal(character.snapshot.vx, 0);
  character.reset();
  assert.equal(character.snapshot.x, 150);
  assert.equal(character.snapshot.y, 370);
  assert.equal(character.snapshot.state, 'IDLE');
  assert.equal(character.snapshot.stateTime, 0);
  character.update(Number.NaN, jump);
  assert.equal(character.snapshot.state, 'IDLE');
});
