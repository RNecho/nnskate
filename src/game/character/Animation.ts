import type { CharacterSnapshot, CharacterState } from '../types';
import { artAssets } from '../render/ArtAssets';
import type { CharacterId } from './characters';

interface SpriteFrame {
  x: number; y: number; width: number; height: number;
  /** Supporting wheels' center and lowest pixel, relative to the frame crop. */
  pivotX: number; pivotY: number;
}

// Crops follow the actual art. All poses share one scale and align their
// wheels with the existing physics foot position.
export const NANA_FRAMES: Record<CharacterState, SpriteFrame> = {
  IDLE: { x: 164, y: 14, width: 283, height: 438, pivotX: 150, pivotY: 431 },
  PUSH: { x: 592, y: 32, width: 330, height: 415, pivotX: 185, pivotY: 409 },
  ROLL: { x: 1058, y: 30, width: 334, height: 416, pivotX: 155, pivotY: 411 },
  JUMP: { x: 150, y: 474, width: 326, height: 429, pivotX: 174, pivotY: 420 },
  FALL: { x: 601, y: 499, width: 325, height: 405, pivotX: 169, pivotY: 399 },
  LAND: { x: 1061, y: 589, width: 315, height: 367, pivotX: 152, pivotY: 358 },
};

// The supplied Nunu sheet is a 5 × 2 atlas. Crops intentionally exclude the
// white speed trails, neighboring poses and green ground shadows. Her pink
// roller skates belong to the sprite, and never receive Nana's skateboard.
export const NUNU_FRAMES: Record<CharacterState, SpriteFrame> = {
  IDLE: { x: 15, y: 82, width: 245, height: 389, pivotX: 132, pivotY: 385 },
  PUSH: { x: 606, y: 90, width: 295, height: 379, pivotX: 174, pivotY: 377 },
  ROLL: { x: 318, y: 90, width: 245, height: 379, pivotX: 118, pivotY: 377 },
  JUMP: { x: 15, y: 512, width: 275, height: 337, pivotX: 130, pivotY: 336 },
  FALL: { x: 15, y: 512, width: 275, height: 337, pivotX: 130, pivotY: 336 },
  LAND: { x: 937, y: 595, width: 296, height: 314, pivotX: 140, pivotY: 310 },
};

const SPRITE_SCALES: Record<CharacterId, number> = { nana: 0.32, nunu: 0.35 };

/** Each sister's art shares the same six movement states and physics pivot. */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  character: CharacterSnapshot,
  time: number,
  characterId: CharacterId = 'nana',
): void {
  const atlas = artAssets[characterId];
  if (!atlas) return;
  const { state, stateTime, facing } = character;
  let pose = state;
  if (state === 'PUSH' && (stateTime < 0.045 || stateTime > 0.255)) pose = 'ROLL';
  const frame = (characterId === 'nunu' ? NUNU_FRAMES : NANA_FRAMES)[pose];
  const spriteScale = SPRITE_SCALES[characterId];
  const idleBreath = state === 'IDLE' ? Math.sin(time * 2.8) * 0.006 : 0;
  const rollBob = state === 'ROLL' ? Math.sin(time * 10) * 0.003 : 0;
  const landCompression = state === 'LAND' ? Math.sin(Math.min(1, stateTime / 0.12) * Math.PI) * 0.025 : 0;
  const fallExtension = characterId === 'nunu' && state === 'FALL' ? 0.025 : 0;
  const ratioX = atlas.width / 1536, ratioY = atlas.height / 1024;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(Math.round(character.x), Math.round(character.y));
  if (character.grounded) ctx.rotate(character.groundAngle);
  ctx.scale(facing * spriteScale * (1 + landCompression), spriteScale * (1 + idleBreath + rollBob - landCompression + fallExtension));
  ctx.drawImage(atlas,
    frame.x * ratioX, frame.y * ratioY, frame.width * ratioX, frame.height * ratioY,
    -frame.pivotX, -frame.pivotY, frame.width, frame.height,
  );
  ctx.restore();
}

export function drawCharacterPortrait(canvas: HTMLCanvasElement, characterId: CharacterId): void {
  const atlas = artAssets[characterId];
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = characterId === 'nunu' ? '#ffd5e5' : '#e5d0fa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!atlas) return;
  const sx = atlas.width / 1536, sy = atlas.height / 1024;
  const crop = characterId === 'nunu'
    ? { x: 88, y: 88, width: 166, height: 177 }
    : { x: 220, y: 25, width: 194, height: 190 };
  ctx.drawImage(atlas, crop.x * sx, crop.y * sy, crop.width * sx, crop.height * sy, 1, 1, canvas.width - 2, canvas.height - 2);
}
