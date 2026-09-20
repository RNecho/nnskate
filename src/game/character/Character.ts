import { FIXED_STEP } from '../config';
import type { CharacterSnapshot, CharacterState, Equipment, GameSound, GroundPoint, InputFrame, LevelData, PhysicsConfig } from '../types';
import { Movement } from './Movement';

const PUSH_DURATION = 0.3;
const LAND_DURATION = 0.12;
const IDLE_SPEED = 0.5;
export const TRICK_DURATION = 0.48;
export const FLIP_DURATION = 0.5;

/** Owns animation states; Movement owns all motion and surface collision. */
export class Character {
  readonly snapshot: CharacterSnapshot = {
    x: 0, y: 0, vx: 0, vy: 0, facing: 1,
    grounded: true, state: 'IDLE', stateTime: 0, groundAngle: 0,
  };
  private readonly movement: Movement;
  private trickTapWindow = 0;
  private trickUsed = false;
  get usedDoubleJump() { return this.movement.usedDoubleJump; }

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
    // Adventure owns fall damage and checkpoint recovery; motion never teleports.
  }

  reset(spawn?: GroundPoint): void {
    this.movement.reset(spawn);
    this.snapshot.state = 'IDLE';
    this.snapshot.stateTime = 0;
    this.snapshot.stride = 0; this.snapshot.trickTime = 0; this.snapshot.tricks = 0;
    this.snapshot.flipTime = 0;
    this.trickTapWindow = 0; this.trickUsed = false;
  }

  setEquipment(equipment: Equipment): void {
    this.snapshot.equipment = equipment;
    this.movement.equipment = equipment;
    if (equipment !== 'skate') { this.snapshot.trickTime = 0; this.trickTapWindow = 0; }
    if (equipment !== 'patins') this.snapshot.flipTime = 0;
  }

  bounce(force = 430): void {
    this.movement.launch(force);
    this.setState('JUMP');
  }

  private tick(dt: number, input: InputFrame): void {
    const body = this.snapshot;
    const previousVx = body.vx;
    const airborne = !body.grounded;
    this.trickTapWindow = Math.max(0, this.trickTapWindow - dt);
    if ((body.trickTime ?? 0) > 0) body.trickTime = body.trickTime! + dt >= TRICK_DURATION ? 0 : body.trickTime! + dt;
    if ((body.flipTime ?? 0) > 0) body.flipTime = body.flipTime! + dt >= FLIP_DURATION ? 0 : body.flipTime! + dt;
    if (airborne && body.equipment === 'skate' && input.jumpPressed && !this.trickUsed) {
      if (this.trickTapWindow > 0) {
        body.trickTime = dt; body.tricks = (body.tricks ?? 0) + 1;
        this.trickUsed = true; this.trickTapWindow = 0; this.onSound?.('trick');
      } else this.trickTapWindow = 0.45;
    }
    body.stateTime += dt;
    const doubleJumpWasUsed = this.movement.usedDoubleJump;
    const events = this.movement.step(dt, input);
    if (events.jumped && airborne && body.equipment === 'patins' && !doubleJumpWasUsed && this.movement.usedDoubleJump) {
      body.flipTime = dt; this.onSound?.('trick');
    }
    if (body.grounded) {
      body.stride = (body.stride ?? 0) + Math.abs(body.vx) * dt;
      body.trickTime = 0; this.trickUsed = false; this.trickTapWindow = 0;
      body.flipTime = 0;
    }
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
