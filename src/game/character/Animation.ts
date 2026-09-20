import type { CharacterSnapshot, CharacterState } from '../types';
import { artAssets, footBaselines, ridingFrames, motionFrames, trickFrames, flipFrames, type MonsterFrame } from '../render/ArtAssets';
import type { CharacterId } from './characters';
import { TRICK_DURATION, FLIP_DURATION } from './Character';

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
  celebrate = false,
  doubleJumped = false,
): void {
  const equipment = character.equipment;
  if (equipment === 'patins' && !character.grounded && (character.flipTime ?? 0) > 0) {
    drawFlip(ctx, character, characterId); return;
  }
  if (equipment === 'skate' && !character.grounded && (character.trickTime ?? 0) > 0 && artAssets.tricks) {
    const frames = trickFrames[characterId];
    drawPose(ctx, character, artAssets.tricks, frames, Math.min(7, Math.floor(character.trickTime! / TRICK_DURATION * 8)), time, 112);
    return;
  }
  const calm = !celebrate && (character.invulnerable ?? 0) <= 1.5;
  if (calm && equipment === 'foot' && (characterId === 'nunu' || character.state === 'IDLE' || character.state === 'JUMP' || character.state === 'FALL')) {
    const key = characterId === 'nunu' ? 'nunuMotion' : 'nanaMotion';
    const frames = motionFrames[key], atlas = artAssets[key];
    let pose = 0;
    if (character.state === 'JUMP') pose = characterId === 'nunu' ? 6 : 4;
    else if (character.state === 'FALL') pose = characterId === 'nunu' ? 7 : 5;
    else if (Math.abs(character.vx) > 5) pose = [2, 3, 4, 5][Math.floor((character.stride ?? 0) / 19) % 4];
    else if (time % 3.8 > 3.58) pose = 1;
    else if (characterId === 'nana') pose = [0, 3, 2, 3][Math.floor(time / 1.7) % 4];
    if (atlas && frames.length === 8) { drawPose(ctx, character, atlas, frames, pose, time); return; }
  }
  if (calm && characterId === 'nana' && equipment === 'patins' && (character.state === 'JUMP' || character.state === 'FALL') && artAssets.nanaMotion) {
    drawPose(ctx, character, artAssets.nanaMotion, motionFrames.nanaMotion, character.state === 'JUMP' ? 6 : 7, time); return;
  }
  const originalGear = characterId === 'nana' ? 'skate' : 'patins';
  if (!celebrate && (character.invulnerable ?? 0) <= 1.5 &&
    (characterId === 'nunu' && equipment === 'skate' || characterId === 'nana' && equipment === 'patins')) {
    drawRidingCharacter(ctx, character, time, characterId, doubleJumped); return;
  }
  if (equipment && (equipment !== originalGear || celebrate || (character.invulnerable ?? 0) > 1.5)) {
    drawFootCharacter(ctx, character, time, characterId, celebrate);
    return;
  }
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

function drawRidingCharacter(ctx: CanvasRenderingContext2D, body: CharacterSnapshot, time: number, id: CharacterId, doubleJumped: boolean) {
  const key = id === 'nunu' ? 'nunuSkate' : 'nanaPatins';
  const atlas = artAssets[key], frames = ridingFrames[key];
  if (!atlas || frames.length !== 8) return;
  const skating = id === 'nunu';
  let pose = 0;
  if (body.state === 'JUMP') pose = !skating && doubleJumped ? 5 : 4;
  else if (body.state === 'FALL') pose = skating ? 5 : 6;
  else if (body.state === 'LAND') pose = skating ? 6 : 7;
  else if (Math.abs(body.vx) > 8) {
    const cycle = Math.floor((body.stride ?? time * 120) / 32) % 4;
    pose = skating ? Math.abs(body.vx) < 230 ? [1, 2, 1, 2][cycle] : [2, 3, 7, 3][cycle] : [1, 2, 3, 2][cycle];
  }
  const frame = frames[pose], scale = 135 / Math.max(...frames.map(frame => frame.height));
  const squash = body.state === 'LAND' ? Math.sin(Math.min(1, body.stateTime / 0.12) * Math.PI) * 0.035 : 0;
  const breath = pose === 0 ? Math.sin(time * 2.8) * 0.013 : 0;
  ctx.save(); ctx.translate(Math.round(body.x), Math.round(body.y));
  if (body.grounded) ctx.rotate(body.groundAngle);
  ctx.scale(body.facing * (1 + squash), 1 - squash + breath);
  ctx.drawImage(atlas, frame.x, frame.y, frame.width, frame.height,
    -frame.pivotX * scale, -frame.height * scale, frame.width * scale, frame.height * scale);
  ctx.restore();
}

function drawPose(ctx: CanvasRenderingContext2D, body: CharacterSnapshot, atlas: HTMLCanvasElement, frames: MonsterFrame[], pose: number, time: number, height = 135) {
  const frame = frames[pose];
  if (!frame) return;
  const scale = height / Math.max(...frames.map(f => f.height));
  const idle = body.state === 'IDLE';
  ctx.save(); ctx.translate(Math.round(body.x), Math.round(body.y));
  if (body.grounded) ctx.rotate(body.groundAngle + (idle ? Math.sin(time * 1.8) * 0.009 : 0));
  ctx.scale(body.facing, idle ? 1 + Math.sin(time * 2.5) * 0.012 : 1);
  const cellWidth = atlas.width / 4;
  const pivotX = height === 112 ? frame.width / 2 : (Math.floor(frame.x / cellWidth) + 0.5) * cellWidth - frame.x;
  ctx.drawImage(atlas, frame.x, frame.y, frame.width, frame.height, -pivotX * scale, -frame.height * scale, frame.width * scale, frame.height * scale);
  ctx.restore();
}

/** Eight extra poses supplement the original riding atlases. */
function drawFootCharacter(ctx: CanvasRenderingContext2D, character: CharacterSnapshot, time: number, id: CharacterId, celebrate: boolean): void {
  const atlas = artAssets[id === 'nana' ? 'nanaFoot' : 'nunuFoot'];
  if (!atlas) return;
  const { state, equipment = 'foot' } = character;
  let frame = 0;
  if (celebrate) frame = 7;
  else if ((character.invulnerable ?? 0) > 1.5) frame = 6;
  else if (state === 'JUMP') frame = 4;
  else if (state === 'FALL') frame = 5;
  else if (equipment === 'foot' && Math.abs(character.vx) > 5) frame = [1, 2, 3, 2][Math.floor(time * Math.max(5, Math.abs(character.vx) / 23)) % 4];
  const scale = 0.32;
  const gearHeight = equipment === 'skate' ? 15 : equipment === 'patins' ? 7 : 0;
  ctx.save();
  ctx.translate(Math.round(character.x), Math.round(character.y));
  if (character.grounded) ctx.rotate(character.groundAngle);
  ctx.scale(character.facing, 1);
  const baseline = footBaselines[id][frame] ?? 470;
  ctx.drawImage(atlas, frame % 4 * atlas.width / 4, Math.floor(frame / 4) * atlas.height / 2, atlas.width / 4, atlas.height / 2,
    -192 * scale, -baseline * scale - gearHeight, 384 * scale, 512 * scale);
  if (equipment === 'skate') {
    ctx.fillStyle = '#422b4b'; ctx.fillRect(-38, -15, 76, 7);
    ctx.fillStyle = '#f5b767'; ctx.fillRect(-36, -15, 72, 3);
    ctx.fillStyle = '#f8e4f3'; ctx.fillRect(-26, -7, 10, 7); ctx.fillRect(20, -7, 10, 7);
    ctx.fillStyle = '#6b4983'; ctx.fillRect(-23, -5, 4, 4); ctx.fillRect(23, -5, 4, 4);
  } else if (equipment === 'patins') {
    for (const x of [-14, -3, 21, 32]) {
      ctx.fillStyle = '#633461'; ctx.fillRect(x - 1, -8, 9, 9);
      ctx.fillStyle = '#ed91c2'; ctx.fillRect(x, -7, 7, 7);
      ctx.fillStyle = '#ffe5f0'; ctx.fillRect(x + 2, -5, 3, 3);
    }
  }
  ctx.restore();
}

/** A somersault rotates around the torso, never around the lowest pixel of each pose. */
function drawFlip(ctx: CanvasRenderingContext2D, body: CharacterSnapshot, id: CharacterId) {
  const atlas = artAssets[id === 'nana' ? 'nanaFlip' : 'nunuFlip'];
  const frames = flipFrames[id];
  if (!atlas || frames.length !== 8) return;
  const index = Math.min(7, Math.floor(body.flipTime! / FLIP_DURATION * 8)), frame = frames[index];
  const scale = 132 / Math.max(...frames.map(f => Math.max(f.width, f.height)));
  const cx = (index % 4 + 0.5) * atlas.width / 4, cy = (Math.floor(index / 4) + 0.5) * atlas.height / 2;
  ctx.save(); ctx.translate(Math.round(body.x), Math.round(body.y - 64)); ctx.scale(body.facing, 1);
  ctx.drawImage(atlas, frame.x, frame.y, frame.width, frame.height, (frame.x - cx) * scale, (frame.y - cy) * scale, frame.width * scale, frame.height * scale);
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
