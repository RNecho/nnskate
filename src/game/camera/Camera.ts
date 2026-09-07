import type { CameraSnapshot, CharacterSnapshot, LevelData } from '../types';

export class Camera {
  readonly snapshot: CameraSnapshot = { x: 0, y: 0, width: 960, height: 480 };

  constructor(private level: LevelData) {}

  resize(width: number, height: number) {
    this.snapshot.width = width;
    this.snapshot.height = height;
    this.snapshot.x = Math.min(this.snapshot.x, Math.max(0, this.level.width - width));
  }

  update(dt: number, character: CharacterSnapshot) {
    const lookAhead = character.vx * 0.28;
    const target = Math.max(0, Math.min(this.level.width - this.snapshot.width, character.x - this.snapshot.width * 0.36 + lookAhead));
    this.snapshot.x += (target - this.snapshot.x) * (1 - Math.exp(-5 * dt));
    this.snapshot.y = 0;
  }

  reset() { this.snapshot.x = 0; this.snapshot.y = 0; }
}
