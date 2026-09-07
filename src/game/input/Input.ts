import type { InputFrame } from '../types';
import { GamepadInput, type GamepadFrame, type GamepadStatus } from './GamepadInput';

type Action = 'left' | 'right' | 'jump';
const KEY_ACTIONS: Record<string, Action> = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Space: 'jump', ArrowUp: 'jump', KeyW: 'jump',
};

export interface InputCallbacks {
  onGamepadPause?: () => void;
  onGamepadCharacterStep?: (step: -1 | 1) => void;
  onGamepadChange?: (connected: boolean, name: string, supported: boolean) => void;
  /** Gamepad polling does not grant browser user activation for audio. */
  onGamepadInteract?: () => void;
}

export class Input {
  private held = new Map<string, Action>();
  private jumpQueued = false;
  private gamepad = new GamepadInput();
  private gamepadJumpQueued = false;
  private gamepadIdentity: string | null = null;
  private gamepadFrame: GamepadFrame = {
    axis: 0, jumpPressed: false, jumpHeld: false, pausePressed: false, characterStep: 0,
    interacted: false, connected: false, supported: false, name: '',
  };
  private cleanup: (() => void)[] = [];

  constructor(private onInteract: () => void, touchRoot: HTMLElement, private callbacks: InputCallbacks = {}) {
    const down = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, button, summary, [contenteditable="true"]')) return;
      const action = KEY_ACTIONS[event.code];
      if (!action) return;
      event.preventDefault();
      this.onInteract();
      if (!this.held.has(event.code) && action === 'jump') this.jumpQueued = true;
      this.held.set(event.code, action);
    };
    const up = (event: KeyboardEvent) => { this.held.delete(event.code); };
    const blur = () => this.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    this.cleanup.push(() => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    });

    touchRoot.querySelectorAll<HTMLButtonElement>('[data-control]').forEach(button => {
      const action = button.dataset.control as Action;
      const press = (event: PointerEvent) => {
        event.preventDefault();
        this.onInteract();
        button.setPointerCapture(event.pointerId);
        this.held.set(`pointer-${event.pointerId}`, action);
        if (action === 'jump') this.jumpQueued = true;
        button.classList.add('is-held');
      };
      const release = (event: PointerEvent) => {
        this.held.delete(`pointer-${event.pointerId}`);
        button.classList.remove('is-held');
      };
      const keyPress = (event: KeyboardEvent) => {
        if (event.code !== 'Space' && event.code !== 'Enter') return;
        event.preventDefault();
        if (event.repeat) return;
        this.onInteract();
        this.held.set(`touch-key-${event.code}`, action);
        if (action === 'jump') this.jumpQueued = true;
        button.classList.add('is-held');
      };
      const keyRelease = (event: KeyboardEvent) => {
        if (event.code !== 'Space' && event.code !== 'Enter') return;
        event.preventDefault();
        this.held.delete(`touch-key-${event.code}`);
        button.classList.remove('is-held');
      };
      const focusLost = () => {
        this.held.delete('touch-key-Space');
        this.held.delete('touch-key-Enter');
        button.classList.remove('is-held');
      };
      button.addEventListener('keydown', keyPress);
      button.addEventListener('keyup', keyRelease);
      button.addEventListener('blur', focusLost);
      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
      this.cleanup.push(() => {
        button.removeEventListener('keydown', keyPress);
        button.removeEventListener('keyup', keyRelease);
        button.removeEventListener('blur', focusLost);
        button.removeEventListener('pointerdown', press);
        button.removeEventListener('pointerup', release);
        button.removeEventListener('pointercancel', release);
        button.removeEventListener('lostpointercapture', release);
      });
    });
  }

  get gamepadStatus(): GamepadStatus {
    const { connected, name, supported } = this.gamepadFrame;
    return { connected, name, supported };
  }

  /** Run every render frame, including while the physics simulation is paused. */
  pollGamepad(): void {
    const enabled = !document.hidden && document.hasFocus();
    const frame = this.gamepad.poll(enabled);
    this.gamepadFrame = frame;
    if (!frame.connected || !frame.supported || !enabled) this.gamepadJumpQueued = false;
    else this.gamepadJumpQueued ||= frame.jumpPressed;
    const identity = `${frame.connected}:${frame.supported}:${frame.name}`;
    if (identity !== this.gamepadIdentity) {
      this.gamepadIdentity = identity;
      this.callbacks.onGamepadChange?.(frame.connected, frame.name, frame.supported);
    }
    // Keep these separate from keyboard/pointer onInteract, which may unlock audio.
    if (frame.interacted) this.callbacks.onGamepadInteract?.();
    if (frame.pausePressed) this.callbacks.onGamepadPause?.();
    if (frame.characterStep) this.callbacks.onGamepadCharacterStep?.(frame.characterStep);
  }

  sample(): InputFrame {
    const actions = new Set(this.held.values());
    const combinedAxis = (actions.has('right') ? 1 : 0) - (actions.has('left') ? 1 : 0) + this.gamepadFrame.axis;
    const axis = Math.sign(combinedAxis) as InputFrame['axis'];
    const result = {
      axis,
      jumpPressed: this.jumpQueued || this.gamepadJumpQueued,
      jumpHeld: actions.has('jump') || this.gamepadFrame.jumpHeld,
    };
    this.jumpQueued = false;
    this.gamepadJumpQueued = false;
    return result;
  }

  clear() {
    this.held.clear();
    this.jumpQueued = false;
    this.gamepadJumpQueued = false;
    this.gamepad.clear();
    this.gamepadFrame = { ...this.gamepadFrame, axis: 0, jumpPressed: false, jumpHeld: false, pausePressed: false, characterStep: 0, interacted: false };
    document.querySelectorAll('.is-held').forEach(button => button.classList.remove('is-held'));
  }

  dispose() {
    this.clear();
    this.cleanup.forEach(cleanup => cleanup());
  }
}
