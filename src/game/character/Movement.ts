import { groundAt } from '../level/Level';
import type { CharacterSnapshot, InputFrame, LevelData, PhysicsConfig, Platform } from '../types';

type MotionBody = Pick<CharacterSnapshot, 'x' | 'y' | 'vx' | 'vy' | 'facing' | 'grounded' | 'groundAngle'>;
type Surface = { kind: 'terrain' } | { kind: 'platform'; platform: Platform };
interface Contact { time: number; surface: Surface }
export interface MovementEvents { jumped: boolean; landed: boolean }

const EPSILON = 0.00001;
const WORLD_PADDING = 16;
const RELEASE_JUMP_RATIO = 0.48;

export function approach(value: number, target: number, amount: number): number {
  return value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);
}

/** Physics uses the board's center as its foot contact point, in pixels and seconds. */
export class Movement {
  private support: Surface | null = null;
  private coyoteRemaining = 0;
  private bufferRemaining = 0;

  constructor(
    private readonly level: LevelData,
    private readonly config: PhysicsConfig,
    readonly body: MotionBody,
  ) {
    this.reset();
  }

  reset(): void {
    const { spawn } = this.level;
    const ground = groundAt(this.level, spawn.x);
    const platform = this.level.platforms.find((p) =>
      spawn.x >= p.x && spawn.x <= p.x + p.width && Math.abs(spawn.y - p.y) < 1,
    );
    const grounded = Boolean(platform) || spawn.y >= ground.y - EPSILON;
    this.support = platform ? { kind: 'platform', platform } : grounded ? { kind: 'terrain' } : null;
    Object.assign(this.body, {
      x: spawn.x, y: platform?.y ?? (grounded ? ground.y : spawn.y),
      vx: 0, vy: 0, facing: 1, grounded,
      groundAngle: grounded && !platform ? ground.angle : 0,
    });
    this.coyoteRemaining = grounded ? this.config.coyoteTime : 0;
    this.bufferRemaining = 0;
  }

  step(dt: number, input: InputFrame): MovementEvents {
    const body = this.body;
    const events: MovementEvents = { jumped: false, landed: false };
    let departedPlatform: Platform | undefined;
    if (input.jumpPressed) this.bufferRemaining = this.config.jumpBuffer;
    if (body.grounded) this.coyoteRemaining = this.config.coyoteTime;

    if ((input.jumpPressed || this.bufferRemaining > 0) && (body.grounded || this.coyoteRemaining > 0)) {
      this.jump(events);
    }

    const previousX = body.x;
    const previousY = body.y;
    const previousVx = body.vx;
    const maxSpeed = Math.max(0, this.config.maxSpeed);
    if (input.axis !== 0) {
      const reversing = body.vx * input.axis < 0;
      const acceleration = reversing ? this.config.braking : this.config.acceleration;
      const control = body.grounded ? 1 : this.config.airControl;
      body.vx = approach(body.vx, input.axis * maxSpeed, Math.max(0, acceleration * control) * dt);
    } else if (body.grounded) {
      body.vx = approach(body.vx, 0, Math.max(0, this.config.deceleration) * dt);
    }
    body.vx = Math.max(-maxSpeed, Math.min(maxSpeed, body.vx));
    const nextX = previousX + (previousVx + body.vx) * 0.5 * dt;
    body.x = Math.max(WORLD_PADDING, Math.min(this.level.width - WORLD_PADDING, nextX));
    if (body.x !== nextX) body.vx = 0;
    if (Math.abs(body.vx) > 1) body.facing = body.vx > 0 ? 1 : -1;

    if (body.grounded && this.support) {
      if (this.support.kind === 'terrain') {
        const ground = groundAt(this.level, body.x);
        body.y = ground.y;
        body.groundAngle = ground.angle;
      } else if (this.onPlatform(body.x, this.support.platform)) {
        body.y = this.support.platform.y;
        body.groundAngle = 0;
      } else {
        departedPlatform = this.support.platform;
        body.grounded = false;
        this.support = null;
      }
    }

    if (!body.grounded) {
      // Releasing the button cuts only the rising part of a jump.
      if (!input.jumpHeld && body.vy < -this.config.jumpForce * RELEASE_JUMP_RATIO) {
        body.vy = -this.config.jumpForce * RELEASE_JUMP_RATIO;
      }
      const gravity = Math.max(0, this.config.gravity) * (body.vy >= 0 ? this.config.fallMultiplier : 1);
      const nextVy = body.vy + gravity * dt;
      const nextY = body.y + (body.vy + nextVy) * 0.5 * dt;
      const contact = this.findLanding(previousX, previousY, body.x, nextY, departedPlatform);
      body.vy = nextVy;
      body.y = nextY;
      if (contact) {
        this.support = contact.surface;
        body.grounded = true;
        body.vy = 0;
        if (contact.surface.kind === 'terrain') {
          const ground = groundAt(this.level, body.x);
          body.y = ground.y;
          body.groundAngle = ground.angle;
        } else {
          body.y = contact.surface.platform.y;
          body.groundAngle = 0;
          // A very narrow platform may be crossed completely within a step.
          // Keep the contact, then fall for the remaining portion of that step.
          if (!this.onPlatform(body.x, contact.surface.platform)) {
            const remaining = dt * (1 - contact.time);
            body.grounded = false;
            this.support = null;
            body.vy = gravity * remaining;
            body.y += 0.5 * gravity * remaining * remaining;
          }
        }
        this.coyoteRemaining = this.config.coyoteTime;
        events.landed = true;
        if (this.bufferRemaining > 0) this.jump(events);
      }
    }

    if (!body.grounded) this.coyoteRemaining = Math.max(0, this.coyoteRemaining - dt);
    this.bufferRemaining = Math.max(0, this.bufferRemaining - dt);
    return events;
  }

  private jump(events: MovementEvents): void {
    this.body.vy = -Math.max(0, this.config.jumpForce);
    this.body.grounded = false;
    this.support = null;
    this.coyoteRemaining = 0;
    this.bufferRemaining = 0;
    events.jumped = true;
  }

  private onPlatform(x: number, platform: Platform): boolean {
    return x >= platform.x - EPSILON && x <= platform.x + platform.width + EPSILON;
  }

  /** Sweep the foot path against every intersected surface; choose the first hit. */
  private findLanding(x0: number, y0: number, x1: number, y1: number, departedPlatform?: Platform): Contact | null {
    const dx = x1 - x0;
    const dy = y1 - y0;
    let nearest: Contact | null = null;
    const consider = (time: number, surface: Surface): void => {
      if (time >= -EPSILON && time <= 1 + EPSILON && (!nearest || time < nearest.time)) {
        nearest = { time: Math.max(0, Math.min(1, time)), surface };
      }
    };

    for (let i = 0; i < this.level.ground.length - 1; i++) {
      const a = this.level.ground[i];
      const b = this.level.ground[i + 1];
      if (b.x < Math.min(x0, x1) || a.x > Math.max(x0, x1)) continue;
      const slope = (b.y - a.y) / (b.x - a.x);
      const relativeDescent = dy - slope * dx;
      if (relativeDescent <= EPSILON) continue;
      const time = (a.y + slope * (x0 - a.x) - y0) / relativeDescent;
      const hitX = x0 + dx * time;
      if (hitX >= a.x - EPSILON && hitX <= b.x + EPSILON) consider(time, { kind: 'terrain' });
    }

    if (dy > EPSILON) {
      for (const platform of this.level.platforms) {
        if (platform === departedPlatform) continue;
        if (y0 > platform.y + EPSILON) continue;
        const time = (platform.y - y0) / dy;
        if (this.onPlatform(x0 + dx * time, platform)) consider(time, { kind: 'platform', platform });
      }
    }
    return nearest;
  }
}
