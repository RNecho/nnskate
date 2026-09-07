import type { PhysicsConfig } from './types';

/** Pixels and seconds. Edit here, or experiment with the in-game controls. */
export const DEFAULT_PHYSICS: Readonly<PhysicsConfig> = Object.freeze({
  gravity: 1100,
  maxSpeed: 280,
  acceleration: 510,
  deceleration: 190,
  braking: 900,
  jumpForce: 430,
  airControl: 0.65,
  coyoteTime: 0.11,
  jumpBuffer: 0.12,
  fallMultiplier: 1.18,
});

export const FIXED_STEP = 1 / 120;
export const MAX_FRAME_DELTA = 0.1;
