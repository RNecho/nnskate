import type { InputFrame } from '../types';

export const GAMEPAD_DEADZONE = 0.2;

export interface GamepadDevice {
  readonly index: number;
  readonly id: string;
  readonly connected: boolean;
  readonly mapping: string;
  readonly axes: readonly number[];
  readonly buttons: readonly { readonly pressed: boolean; readonly value: number }[];
}

export interface GamepadControls {
  axis: InputFrame['axis'];
  jumpHeld: boolean;
  pauseHeld: boolean;
  previousCharacterHeld: boolean;
  nextCharacterHeld: boolean;
}

export interface GamepadStatus {
  connected: boolean;
  supported: boolean;
  name: string;
}

export interface GamepadFrame extends InputFrame, GamepadStatus {
  pausePressed: boolean;
  characterStep: -1 | 0 | 1;
  interacted: boolean;
}

type GamepadReader = () => readonly (GamepadDevice | null)[];
const neutral = (): GamepadControls => ({
  axis: 0, jumpHeld: false, pauseHeld: false,
  previousCharacterHeld: false, nextCharacterHeld: false,
});

/** Standard mapping: left stick/D-pad, A/Cross, Start, LB/L1 and RB/R1. */
export function mapStandardGamepad(pad: GamepadDevice | null, deadzone = GAMEPAD_DEADZONE): GamepadControls {
  if (!pad?.connected || pad.mapping !== 'standard') return neutral();
  const pressed = (index: number) => pad.buttons[index]?.pressed || (pad.buttons[index]?.value ?? 0) > 0.5;
  const left = pressed(14);
  const right = pressed(15);
  const stick = Number.isFinite(pad.axes[0]) ? pad.axes[0] : 0;
  const axis = left || right
    ? (Number(right) - Number(left)) as InputFrame['axis']
    : stick < -deadzone ? -1 : stick > deadzone ? 1 : 0;
  return {
    axis, jumpHeld: pressed(0), pauseHeld: pressed(9),
    previousCharacterHeld: pressed(4), nextCharacterHeld: pressed(5),
  };
}

/** Polls current device objects; connection events alone contain stale input. */
export class GamepadInput {
  private identity = '';
  private previous = neutral();
  private suppressAxis = false;
  private suppressJump = false;
  private suppressPause = false;
  private suppressPreviousCharacter = false;
  private suppressNextCharacter = false;
  private warned = false;

  constructor(private read: GamepadReader = () =>
    typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : []) {}

  poll(enabled = true): GamepadFrame {
    let devices: readonly (GamepadDevice | null)[] = [];
    try {
      devices = this.read();
    } catch (error) {
      if (!this.warned) console.warn('Não foi possível consultar o controle:', error);
      this.warned = true;
    }
    const connected = devices.filter((pad): pad is GamepadDevice => Boolean(pad?.connected));
    const identify = (pad: GamepadDevice) => `${pad.index}:${pad.id}:${pad.mapping}`;
    const current = connected.find(pad => identify(pad) === this.identity);
    // Keep one controller selected; prefer a usable device over an unknown layout.
    const pad = current?.mapping === 'standard' ? current
      : connected.find(device => device.mapping === 'standard') ?? current ?? connected[0] ?? null;
    const identity = pad ? identify(pad) : '';
    if (identity !== this.identity) {
      this.identity = identity;
      this.previous = neutral();
    }

    const controls = mapStandardGamepad(pad);
    if (!enabled) this.clear();
    if (!controls.axis) this.suppressAxis = false;
    if (!controls.jumpHeld) this.suppressJump = false;
    if (!controls.pauseHeld) this.suppressPause = false;
    if (!controls.previousCharacterHeld) this.suppressPreviousCharacter = false;
    if (!controls.nextCharacterHeld) this.suppressNextCharacter = false;

    const axis = enabled && !this.suppressAxis ? controls.axis : 0;
    const jumpHeld = enabled && !this.suppressJump && controls.jumpHeld;
    const jumpPressed = jumpHeld && !this.previous.jumpHeld;
    const pausePressed = enabled && !this.suppressPause && controls.pauseHeld && !this.previous.pauseHeld;
    const previousCharacterPressed = enabled && !this.suppressPreviousCharacter
      && controls.previousCharacterHeld && !this.previous.previousCharacterHeld;
    const nextCharacterPressed = enabled && !this.suppressNextCharacter
      && controls.nextCharacterHeld && !this.previous.nextCharacterHeld;
    const characterStep = controls.previousCharacterHeld && controls.nextCharacterHeld
      ? 0 : (Number(nextCharacterPressed) - Number(previousCharacterPressed)) as GamepadFrame['characterStep'];
    const interacted = jumpPressed || pausePressed || characterStep !== 0 || (axis !== 0 && axis !== this.previous.axis);
    this.previous = controls;

    return {
      axis, jumpHeld, jumpPressed, pausePressed, characterStep, interacted,
      connected: pad !== null,
      supported: pad?.mapping === 'standard',
      name: pad?.id ?? '',
    };
  }

  /** Pause/blur/reset requires release before reusing a held button or stick. */
  clear(): void {
    this.suppressAxis = true;
    this.suppressJump = true;
    this.suppressPause = true;
    this.suppressPreviousCharacter = true;
    this.suppressNextCharacter = true;
    // Preserve the Start edge history so holding it cannot toggle pause repeatedly.
  }
}
