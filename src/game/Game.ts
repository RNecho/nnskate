import { AudioManager } from './audio/AudioManager';
import { Camera } from './camera/Camera';
import { Character } from './character/Character';
import type { CharacterId } from './character/characters';
import { DEFAULT_PHYSICS, FIXED_STEP, MAX_FRAME_DELTA } from './config';
import { Input } from './input/Input';
import { TEST_LEVEL } from './level/Level';
import { Renderer } from './render/Renderer';
import type { CharacterSnapshot, PhysicsConfig } from './types';

export interface GameCallbacks {
  onFrame: (snapshot: CharacterSnapshot) => void;
  onPause: (paused: boolean) => void;
  onAudio: (ready: boolean, error?: string) => void;
  onStarted: () => void;
  onGamepadChange: (connected: boolean, name: string, supported: boolean) => void;
  onGamepadAudioNeeded: () => void;
  onCharacterChanged: (id: CharacterId) => void;
}

export class Game {
  readonly config: PhysicsConfig = { ...DEFAULT_PHYSICS };
  readonly audio = new AudioManager();
  readonly character: Character;
  readonly camera = new Camera(TEST_LEVEL);
  readonly input: Input;
  paused = false;
  selectedCharacter: CharacterId = 'nana';
  private artReady = false;
  private renderer: Renderer;
  private frame = 0;
  private previous = 0;
  private accumulator = 0;
  private time = 0;
  private uiElapsed = 0;
  private started = false;
  private audioPending = false;
  private audioReady = false;
  private observer: ResizeObserver;

  constructor(private canvas: HTMLCanvasElement, touchRoot: HTMLElement, private callbacks: GameCallbacks) {
    this.character = new Character(TEST_LEVEL, this.config, sound => this.audio.play(sound));
    this.renderer = new Renderer(canvas, TEST_LEVEL);
    this.input = new Input(() => this.interact(), touchRoot, {
      onGamepadChange: (connected, name, supported) => callbacks.onGamepadChange(connected, name, supported),
      onGamepadInteract: () => this.interact(false),
      onGamepadPause: () => { if (this.artReady) this.setPaused(!this.paused); },
      onGamepadCharacterStep: () => this.selectCharacter(this.selectedCharacter === 'nana' ? 'nunu' : 'nana'),
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('blur', this.onBlur);
    this.frame = requestAnimationFrame(this.tick);
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.height) return;
    const logicalHeight = 480;
    const logicalWidth = Math.round(logicalHeight * rect.width / rect.height);
    // Match display density for softer edges, capped at 2× the logical
    // resolution to keep rendering light. Camera framing and physics stay fixed.
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const renderScale = Math.min(2, Math.max(1, rect.height / logicalHeight * pixelRatio));
    this.canvas.height = Math.round(logicalHeight * renderScale);
    this.canvas.width = Math.round(logicalWidth * renderScale);
    this.camera.resize(logicalWidth, logicalHeight);
  }

  interact(trustedAudio = true) {
    if (!this.started) { this.started = true; this.callbacks.onStarted(); }
    if (!trustedAudio) {
      if (!this.audioReady && !this.audio.muted) this.callbacks.onGamepadAudioNeeded();
      return;
    }
    if (!this.audioPending) {
      this.audioPending = true;
      this.audio.unlock().then(() => {
        this.audioReady = true;
        this.audio.setPaused(this.paused);
        this.callbacks.onAudio(true);
      }).catch(error => {
        console.warn('Áudio indisponível:', error);
        this.callbacks.onAudio(false, 'Áudio indisponível. Toque no som para tentar novamente.');
      }).finally(() => { this.audioPending = false; });
    }
  }

  setPaused(paused: boolean) {
    if (this.paused === paused) return;
    this.paused = paused;
    this.input.clear();
    this.accumulator = 0;
    this.audio.setPaused(paused);
    this.callbacks.onPause(paused);
  }

  reset() {
    this.character.reset();
    this.camera.reset();
    this.input.clear();
    this.accumulator = 0;
    this.setPaused(false);
    this.callbacks.onFrame(this.character.snapshot);
    this.canvas.focus({ preventScroll: true });
  }

  resetConfig() { Object.assign(this.config, DEFAULT_PHYSICS); }

  /** Switching the selected sister preserves position, momentum and pause. */
  selectCharacter(id: CharacterId) {
    if (!this.artReady || id === this.selectedCharacter) return;
    this.selectedCharacter = id;
    this.callbacks.onCharacterChanged(id);
  }

  setArtReady(ready: boolean) {
    this.artReady = ready;
    this.input.clear();
    this.accumulator = 0;
  }

  private onVisibility = () => { if (document.hidden) this.setPaused(true); };
  private onBlur = () => { if (this.started) this.setPaused(true); };

  private tick = (now: number) => {
    this.input.pollGamepad();
    const dt = this.previous ? Math.min((now - this.previous) / 1000, MAX_FRAME_DELTA) : 0;
    this.previous = now;
    if (!this.paused && this.artReady) {
      this.accumulator += dt;
      while (this.accumulator >= FIXED_STEP) {
        this.character.update(FIXED_STEP, this.input.sample());
        this.camera.update(FIXED_STEP, this.character.snapshot);
        this.accumulator -= FIXED_STEP;
        this.time += FIXED_STEP;
      }
    }
    this.renderer.render(this.character.snapshot, this.camera.snapshot, this.time, this.selectedCharacter);
    this.uiElapsed += dt;
    if (this.uiElapsed > 0.08) {
      this.callbacks.onFrame(this.character.snapshot);
      this.uiElapsed = 0;
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.input.dispose();
    this.audio.dispose();
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('blur', this.onBlur);
  }
}
