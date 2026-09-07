import assert from 'node:assert/strict';
import test from 'node:test';
import { GamepadInput, mapStandardGamepad, type GamepadDevice } from '../src/game/input/GamepadInput';

function device(options: { axis?: number; pressed?: number[]; index?: number; id?: string; mapping?: string } = {}): GamepadDevice {
  return {
    index: options.index ?? 0,
    id: options.id ?? 'Test standard controller',
    mapping: options.mapping ?? 'standard',
    connected: true,
    axes: [options.axis ?? 0, 0],
    buttons: Array.from({ length: 17 }, (_, index) => ({
      pressed: Boolean(options.pressed?.includes(index)),
      value: options.pressed?.includes(index) ? 1 : 0,
    })),
  };
}

test('stick drift stays neutral inside the deadzone; both directions work outside it', () => {
  for (const axis of [-0.2, -0.05, 0, 0.1, 0.2, Number.NaN]) {
    assert.equal(mapStandardGamepad(device({ axis })).axis, 0);
  }
  assert.equal(mapStandardGamepad(device({ axis: -0.201 })).axis, -1);
  assert.equal(mapStandardGamepad(device({ axis: 0.201 })).axis, 1);
});

test('D-pad takes priority over the stick and opposing D-pad directions cancel', () => {
  assert.equal(mapStandardGamepad(device({ axis: 1, pressed: [14] })).axis, -1);
  assert.equal(mapStandardGamepad(device({ axis: -1, pressed: [15] })).axis, 1);
  assert.equal(mapStandardGamepad(device({ axis: 1, pressed: [14, 15] })).axis, 0);
});

test('only a connected standard mapping is actionable, with A/Cross and Start mapped', () => {
  const active = device({ axis: 1, pressed: [0, 9] });
  assert.deepEqual(mapStandardGamepad(active), {
    axis: 1, jumpHeld: true, pauseHeld: true, previousCharacterHeld: false, nextCharacterHeld: false,
  });
  const idle = { axis: 0, jumpHeld: false, pauseHeld: false, previousCharacterHeld: false, nextCharacterHeld: false };
  assert.deepEqual(mapStandardGamepad({ ...active, mapping: '' }), idle);
  assert.deepEqual(mapStandardGamepad({ ...active, connected: false }), idle);
  assert.deepEqual(mapStandardGamepad(null), idle);
  assert.deepEqual(mapStandardGamepad({ ...active, axes: [], buttons: [] }), idle);
});

test('jump and Start fire once per press and holding does not retrigger interaction', () => {
  let current = device();
  const input = new GamepadInput(() => [current]);
  input.poll();
  current = device({ axis: 1, pressed: [0, 9] });
  let frame = input.poll();
  assert.equal(frame.jumpPressed, true);
  assert.equal(frame.pausePressed, true);
  assert.equal(frame.interacted, true);
  frame = input.poll();
  assert.equal(frame.jumpHeld, true);
  assert.equal(frame.jumpPressed, false);
  assert.equal(frame.pausePressed, false);
  assert.equal(frame.interacted, false);
  current = device(); input.poll();
  current = device({ pressed: [0, 9] });
  frame = input.poll();
  assert.equal(frame.jumpPressed, true);
  assert.equal(frame.pausePressed, true);
});

test('pause/reset clearing preserves Start edges and blocks held jump until release', () => {
  let current = device({ pressed: [0, 9], axis: 1 });
  const input = new GamepadInput(() => [current]);
  assert.equal(input.poll().pausePressed, true);
  input.clear();
  let frame = input.poll();
  assert.equal(frame.pausePressed, false);
  assert.equal(frame.jumpHeld, false);
  assert.equal(frame.jumpPressed, false);
  assert.equal(frame.axis, 0);
  current = device({ pressed: [0] }); input.poll();
  current = device({ pressed: [0, 9] });
  frame = input.poll();
  assert.equal(frame.pausePressed, true, 'Start can resume while jump remains suppressed');
  assert.equal(frame.jumpPressed, false);
  current = device(); input.poll();
  current = device({ pressed: [0] });
  assert.equal(input.poll().jumpPressed, true);
});

test('hidden or unfocused input stays neutral and requires a fresh press after returning', () => {
  let current = device({ axis: -1, pressed: [0, 9] });
  const input = new GamepadInput(() => [current]);
  let frame = input.poll(false);
  assert.equal(frame.connected, true);
  assert.equal(frame.axis, 0);
  assert.equal(frame.jumpHeld, false);
  assert.equal(frame.pausePressed, false);
  frame = input.poll(true);
  assert.equal(frame.axis, 0);
  assert.equal(frame.jumpPressed, false);
  assert.equal(frame.pausePressed, false);
  current = device(); input.poll();
  current = device({ axis: -1, pressed: [0, 9] });
  frame = input.poll();
  assert.equal(frame.axis, -1);
  assert.equal(frame.jumpPressed, true);
  assert.equal(frame.pausePressed, true);
});

test('disconnect clears held controls and reconnect reads the new current device', () => {
  let pads: (GamepadDevice | null)[] = [null, device({ index: 1, pressed: [0], axis: 1 })];
  const input = new GamepadInput(() => pads);
  assert.equal(input.poll().jumpPressed, true);
  pads = [null, null];
  let frame = input.poll();
  assert.equal(frame.connected, false);
  assert.equal(frame.name, '');
  assert.equal(frame.axis, 0);
  assert.equal(frame.jumpHeld, false);
  pads = [null, device({ index: 1, id: 'Replacement', axis: -1, pressed: [0] })];
  frame = input.poll();
  assert.equal(frame.name, 'Replacement');
  assert.equal(frame.axis, -1);
  assert.equal(frame.jumpPressed, true);
});

test('device selection handles empty slots and prefers a supported mapping', () => {
  let pads: (GamepadDevice | null)[] = [null, device({ mapping: '', id: 'Unknown', index: 1 })];
  const input = new GamepadInput(() => pads);
  let frame = input.poll();
  assert.equal(frame.connected, true);
  assert.equal(frame.supported, false);
  pads = [...pads, device({ id: 'Standard', index: 2, axis: 1 })];
  frame = input.poll();
  assert.equal(frame.name, 'Standard');
  assert.equal(frame.supported, true);
  assert.equal(frame.axis, 1);
  pads = [device({ id: 'Another', index: 0, axis: -1 }), ...pads];
  assert.equal(input.poll().name, 'Standard', 'another device must not steal the active controller');
});

test('LB/L1 and RB/R1 select once per press while movement and jumping keep working', () => {
  let current = device({ axis: 1, pressed: [0, 4] });
  const input = new GamepadInput(() => [current]);
  let frame = input.poll();
  assert.equal(frame.characterStep, -1);
  assert.equal(frame.interacted, true);
  assert.equal(frame.axis, 1);
  assert.equal(frame.jumpPressed, true);
  frame = input.poll();
  assert.equal(frame.characterStep, 0);
  assert.equal(frame.interacted, false);
  assert.equal(frame.jumpHeld, true);
  current = device(); input.poll();
  current = device({ pressed: [5] });
  frame = input.poll();
  assert.equal(frame.characterStep, 1);
  assert.equal(frame.interacted, true);
  assert.equal(input.poll().characterStep, 0);
});

test('holding both shoulders cancels selection; releasing one is not a new press', () => {
  let current = device({ pressed: [4, 5] });
  const input = new GamepadInput(() => [current]);
  assert.equal(input.poll().characterStep, 0);
  assert.equal(input.poll().interacted, false);
  current = device({ pressed: [5] });
  assert.equal(input.poll().characterStep, 0);
  current = device(); input.poll();
  current = device({ pressed: [5] });
  assert.equal(input.poll().characterStep, 1);
});

test('pause/reset and hidden state suppress held shoulders until each is released', () => {
  let current = device({ pressed: [4, 9] });
  const input = new GamepadInput(() => [current]);
  let frame = input.poll();
  assert.equal(frame.characterStep, -1);
  assert.equal(frame.pausePressed, true);
  input.clear();
  frame = input.poll();
  assert.equal(frame.characterStep, 0);
  assert.equal(frame.pausePressed, false);
  current = device(); input.poll();
  current = device({ pressed: [5] });
  assert.equal(input.poll().characterStep, 1);
  input.poll(false);
  assert.equal(input.poll(true).characterStep, 0);
  current = device(); input.poll();
  current = device({ pressed: [5] });
  assert.equal(input.poll().characterStep, 1);
});

test('disconnect neutralizes selection and reconnect accepts a fresh shoulder press', () => {
  let current: GamepadDevice | null = device({ pressed: [4] });
  const input = new GamepadInput(() => [current]);
  assert.equal(input.poll().characterStep, -1);
  current = null;
  const disconnected = input.poll();
  assert.equal(disconnected.characterStep, 0);
  assert.equal(disconnected.interacted, false);
  current = device({ pressed: [5] });
  assert.equal(input.poll().characterStep, 1);
  assert.equal(input.poll().characterStep, 0);
});
