import { FIXED_STEP } from '../config';
import type { CharacterSnapshot, CharacterState, GameSound, InputFrame, LevelData, PhysicsConfig } from '../types';
import { Movement } from './Movement';

const PUSH_DURATION = 0.3;
const LAND_DURATION = 0.12;
const IDLE_SPEED = 0.5;

/** Owns animation states; Movement owns all motion and surface collision. */
export class Character {
  readonly snapshot: CharacterSnapshot = {
    x: 0, y: 0, vx: 0, vy: 0, facing: 1,
    grounded: true, state: 'IDLE', stateTime: 0, groundAngle: 0,
  };
  private readonly movement: Movement;

  constructor(
    private readonly level: LevelData,
    config: PhysicsConfig,
    private readonly onSound?: (sound: GameSound) => void,
  ) {
    this.movement = new Movement(level, config, this.snapshot);
  }

  update(dt: number, input: InputFrame): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    // Bound catch-up work after a suspended tab. Small steps also protect ledges.
    let remaining = Math.min(dt, 0.25);
    let firstStep = true;
    while (remaining > 0.0000001) {
      const step = Math.min(FIXED_STEP, remaining);
      this.tick(step, firstStep ? input : { ...input, jumpPressed: false });
      remaining -= step;
      firstStep = false;
    }
    if (this.snapshot.y > this.level.height + 160) this.reset();
  }

  reset(): void {
    this.movement.reset();
    this.snapshot.state = 'IDLE';
    this.snapshot.stateTime = 0;
  }

  private tick(dt: number, input: InputFrame): void {
    const body = this.snapshot;
    const previousVx = body.vx;
    body.stateTime += dt;
    const events = this.movement.step(dt, input);
    if (events.landed) this.onSound?.('land');
    if (events.jumped) {
      this.onSound?.('jump');
      this.setState('JUMP');
    } else if (!body.grounded) {
      this.setState(body.vy < 0 ? 'JUMP' : 'FALL');
    } else if (events.landed) {
      this.setState('LAND');
    } else if (body.state === 'LAND' && body.stateTime < LAND_DURATION) {
      // Landing briefly compresses the pose, without blocking controls.
    } else if (Math.abs(body.vx) <= IDLE_SPEED) {
      this.setState('IDLE');
    } else if (input.axis !== 0 && (body.state === 'IDLE' || previousVx * input.axis <= 0 && body.vx * input.axis > 0)) {
      this.setState('PUSH');
    } else if (body.state !== 'PUSH' || body.stateTime >= PUSH_DURATION) {
      this.setState('ROLL');
    }
  }

  private setState(state: CharacterState): void {
    if (this.snapshot.state === state) return;
    this.snapshot.state = state;
    this.snapshot.stateTime = 0;
    if (state === 'PUSH') this.onSound?.('push');
  }
}
