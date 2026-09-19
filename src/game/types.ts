export type CharacterState = 'IDLE' | 'PUSH' | 'ROLL' | 'JUMP' | 'FALL' | 'LAND';
export type GameSound = 'jump' | 'land' | 'push' | 'pickup' | 'powerup' | 'key' | 'break' | 'super' | 'rescue' | 'stomp' | 'hurt' | 'checkpoint' | 'win' | 'trick';
export type Equipment = 'foot' | 'skate' | 'patins';

export interface PhysicsConfig {
  gravity: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  braking: number;
  jumpForce: number;
  airControl: number;
  coyoteTime: number;
  jumpBuffer: number;
  fallMultiplier: number;
}

export interface InputFrame {
  axis: -1 | 0 | 1;
  jumpPressed: boolean;
  jumpHeld: boolean;
}

/** Feet/board position in world pixels. Positive y points down. */
export interface CharacterSnapshot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: -1 | 1;
  grounded: boolean;
  state: CharacterState;
  stateTime: number;
  groundAngle: number;
  equipment?: Equipment;
  invulnerable?: number;
  /** Stable distance-based walk cycle and elapsed airborne trick animation. */
  stride?: number;
  trickTime?: number;
  tricks?: number;
}

export interface GroundPoint { x: number; y: number }
export interface Platform { x: number; y: number; width: number }
export interface Gap { x: number; width: number }
export interface LevelData {
  width: number;
  height: number;
  spawn: GroundPoint;
  ground: GroundPoint[];
  platforms: Platform[];
  gaps?: Gap[];
  skateRamp?: { from: number; lip: number; landing: number; minSpeed: number; maxSpeed: number; jumpForce: number };
}

export interface CameraSnapshot { x: number; y: number; width: number; height: number }
