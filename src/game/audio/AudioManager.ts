import type { GameSound } from '../types';

const TEMPO = 112;
const STEP_DURATION = 60 / TEMPO / 4;
const MASTER_VOLUME = 0.48;

// Original eight-bar tune in C major. Zero is a rest; values are MIDI notes.
const MELODY = [
  [76, 0, 79, 0, 81, 0, 79, 0, 76, 0, 72, 0, 74, 76, 79, 0],
  [77, 0, 81, 0, 79, 0, 77, 0, 76, 0, 74, 0, 72, 0, 0, 0],
  [76, 0, 79, 0, 84, 0, 83, 0, 81, 0, 79, 0, 76, 0, 79, 0],
  [74, 0, 79, 0, 83, 0, 81, 0, 79, 0, 76, 74, 72, 0, 74, 0],
  [76, 0, 79, 0, 81, 79, 76, 0, 84, 0, 79, 0, 76, 0, 0, 0],
  [77, 0, 81, 0, 84, 0, 81, 0, 79, 0, 77, 0, 76, 0, 74, 0],
  [74, 0, 76, 0, 79, 0, 81, 0, 83, 0, 81, 79, 76, 0, 74, 0],
  [76, 0, 79, 0, 84, 0, 79, 0, 72, 0, 0, 0, 0, 0, 0, 0],
];
const CHORDS = [[48, 52, 55], [53, 57, 60], [45, 48, 52], [43, 47, 50],
  [48, 52, 55], [53, 57, 60], [43, 47, 50], [48, 52, 55]];
const frequency = (note: number) => 440 * 2 ** ((note - 69) / 12);

/** Small synthesizer: no downloads, autoplay, or audio dependency. */
export class AudioManager {
  public muted = false;
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private voices = new Map<AudioScheduledSourceNode, GainNode>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextStepTime = 0;
  private step = 0;
  private paused = false;
  private disposed = false;

  /** Invoke from a trusted keyboard/pointer gesture; errors belong to the UI. */
  async unlock(): Promise<void> {
    if (this.disposed) throw new Error('O áudio já foi encerrado.');
    if (!this.context) {
      const AudioContextClass = window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) throw new Error('Este navegador não oferece suporte a áudio Web Audio.');
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted || this.paused ? 0 : MASTER_VOLUME;
      this.master.connect(this.context.destination);
      this.noiseBuffer = this.context.createBuffer(1, Math.ceil(this.context.sampleRate * 0.12), this.context.sampleRate);
      const samples = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    await this.context.resume();
    if (this.disposed) return;
    if (this.context.state !== 'running') throw new Error('Toque no jogo para ativar o áudio.');
    if (!this.paused) this.startMusic();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.updateVolume();
  }

  setPaused(paused: boolean): void {
    if (this.paused === paused || this.disposed) return;
    this.paused = paused;
    this.updateVolume();
    if (paused) {
      this.stopMusic();
      this.stopVoices();
    } else {
      this.startMusic();
    }
  }

  play(sound: GameSound): void {
    if (!this.context || this.context.state !== 'running' || this.paused || this.muted || this.disposed) return;
    const now = this.context.currentTime;
    if (sound === 'jump') {
      this.tone(330, now, 0.16, 'square', 0.07, 740);
      this.tone(660, now + 0.045, 0.12, 'triangle', 0.035, 990);
    } else if (sound === 'land') {
      this.tone(145, now, 0.11, 'sine', 0.19, 55);
      this.noise(now, 0.075, 0.035);
    } else if (sound === 'push') {
      this.noise(now, 0.1, 0.027);
      this.tone(130, now, 0.055, 'triangle', 0.07, 85);
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopMusic();
    this.stopVoices();
    this.master?.disconnect();
    if (this.context && this.context.state !== 'closed') {
      void this.context.close().catch((error: unknown) => console.warn('Não foi possível encerrar o áudio:', error));
    }
  }

  private updateVolume(): void {
    if (!this.context || !this.master || this.disposed) return;
    const gain = this.master.gain;
    gain.cancelScheduledValues(this.context.currentTime);
    gain.setTargetAtTime(this.muted || this.paused ? 0 : MASTER_VOLUME, this.context.currentTime, 0.015);
  }

  private startMusic(): void {
    if (this.timer !== null || this.paused || this.disposed || this.context?.state !== 'running') return;
    this.nextStepTime = this.context.currentTime + 0.04;
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 25);
  }

  private stopMusic(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  private schedule(): void {
    if (!this.context || this.context.state !== 'running' || this.paused || this.disposed) return;
    const now = this.context.currentTime;
    // A throttled background tab must never replay missed notes in a burst.
    if (this.nextStepTime < now - STEP_DURATION) this.nextStepTime = now + 0.025;
    while (this.nextStepTime < now + 0.12) {
      const bar = Math.floor(this.step / 16) % MELODY.length;
      const beat = this.step % 16;
      const at = this.nextStepTime;
      const note = MELODY[bar][beat];
      const chord = CHORDS[bar];
      if (note) this.tone(frequency(note), at, STEP_DURATION * 1.5, 'square', 0.048);
      if (beat % 4 === 0) this.tone(frequency(chord[beat % 8 === 0 ? 0 : 2] - 12), at, 0.32, 'triangle', 0.14);
      if (beat % 4 === 2) this.tone(frequency(chord[Math.floor(beat / 4) % 3] + 12), at, 0.105, 'triangle', 0.052);
      if (beat === 0 || beat === 8) this.tone(110, at, 0.1, 'sine', 0.13, 48);
      if (beat === 4 || beat === 12) this.noise(at, 0.045, 0.027);
      if (beat % 4 === 2) this.noise(at, 0.018, 0.012);
      this.step = (this.step + 1) % (MELODY.length * 16);
      this.nextStepTime += STEP_DURATION;
    }
  }

  private tone(hz: number, at: number, duration: number, type: OscillatorType, volume: number, endHz?: number): void {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(hz, at);
    if (endHz) oscillator.frequency.exponentialRampToValueAtTime(endHz, at + duration);
    this.envelope(oscillator, at, duration, volume);
  }

  private noise(at: number, duration: number, volume: number): void {
    if (!this.context || !this.noiseBuffer) return;
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;
    this.envelope(source, at, duration, volume);
  }

  private envelope(source: AudioScheduledSourceNode, at: number, duration: number, volume: number): void {
    if (!this.context || !this.master) return;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    gain.gain.setValueAtTime(0, at + duration + 0.01);
    source.connect(gain);
    gain.connect(this.master);
    this.voices.set(source, gain);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      this.voices.delete(source);
    };
    source.start(at);
    source.stop(at + duration + 0.02);
  }

  private stopVoices(): void {
    for (const [source, gain] of this.voices) {
      source.stop();
      source.disconnect();
      gain.disconnect();
    }
    this.voices.clear();
  }
}
