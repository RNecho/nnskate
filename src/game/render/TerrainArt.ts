import { groundAt, groundRanges } from '../level/Level';
import type { CameraSnapshot, LevelData } from '../types';
import { artAssets } from './ArtAssets';

const earthPatterns = new WeakMap<CanvasRenderingContext2D, CanvasPattern>();

/** Painted garden earth follows the exact collision profile, including both ramp slopes. */
export function drawTerrain(c: CanvasRenderingContext2D, level: LevelData, camera: CameraSnapshot) {
  const bottom = level.height + 80;
  const from = Math.max(0, Math.floor(camera.x / 40) * 40 - 80);
  const to = Math.min(level.width, camera.x + camera.width + 100);
  const profile = (offset = 0) => {
    c.beginPath(); level.ground.forEach((p, i) => i ? c.lineTo(p.x, p.y + offset) : c.moveTo(p.x, p.y + offset));
  };
  c.save(); c.beginPath();
  for (const r of groundRanges(level)) c.rect(r.from, -1000, r.to - r.from, bottom + 1000);
  c.clip();
  profile(); c.lineTo(level.width, bottom); c.lineTo(0, bottom); c.closePath();
  c.save(); c.clip();
  const earth = c.createLinearGradient(0, 320, 0, bottom);
  earth.addColorStop(0, '#cbad88'); earth.addColorStop(0.48, '#a98670'); earth.addColorStop(1, '#74596b');
  c.fillStyle = earth; c.fillRect(from, 280, to - from, bottom - 280);
  let texture = earthPatterns.get(c);
  if (!texture && artAssets.terrain) {
    texture = c.createPattern(artAssets.terrain, 'repeat') ?? undefined;
    if (texture) {
      texture.setTransform(new DOMMatrix().scale(600 / artAssets.terrain.naturalWidth));
      earthPatterns.set(c, texture);
    }
  }
  if (texture) {
    c.fillStyle = texture; c.fillRect(from, 280, to - from, bottom - 280);
    const depth = c.createLinearGradient(0, 380, 0, bottom);
    depth.addColorStop(0, '#734a4800'); depth.addColorStop(1, '#41334c99');
    c.fillStyle = depth; c.fillRect(from, 280, to - from, bottom - 280);
  }
  // Hand-painted stones and soil grain sit below translucent sediment and roots.
  for (let row = 0; row < 6; row++) {
    c.beginPath(); c.moveTo(from, bottom);
    for (let x = from; x <= to + 40; x += 40) c.lineTo(x, groundAt(level, x).y + 44 + row * 45 + Math.sin(x * 0.013 + row) * 9);
    c.lineTo(to + 40, bottom); c.closePath();
    c.fillStyle = ['#bd98772b', '#89656820', '#dbc19c20'][row % 3]; c.fill();
  }
  for (let x = from; x < to; x += 40) {
    const seed = Math.floor(x / 40), top = groundAt(level, x).y;
    for (let row = 0; row < (texture ? 0 : 5); row++) {
      const px = x + (seed * 13 + row * 19) % 27, py = top + 39 + row * 48 + (seed * 7 + row * 11) % 23;
      const rx = 5 + (seed + row * 3) % 11, ry = 3 + (seed * 3 + row) % 7;
      c.beginPath(); c.ellipse(px, py, rx, ry, Math.sin(seed + row) * 0.4, 0, Math.PI * 2);
      c.fillStyle = ['#d7bca0', '#a99792', '#e5c9a6', '#927c83'][(seed + row) % 4];
      c.fill(); c.strokeStyle = '#72596055'; c.lineWidth = 1; c.stroke();
      c.beginPath(); c.ellipse(px - rx * 0.2, py - ry * 0.35, rx * 0.5, ry * 0.2, 0, 0, Math.PI * 2); c.fillStyle = '#fff0cd55'; c.fill();
    }
    if (seed % 3 === 0) {
      c.strokeStyle = '#725f50'; c.lineWidth = 2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, top + 11); c.bezierCurveTo(x + 16, top + 29, x - 7, top + 45, x + 12, top + 64); c.stroke();
      c.lineWidth = 1; c.beginPath(); c.moveTo(x + 6, top + 32); c.quadraticCurveTo(x + 20, top + 33, x + 25, top + 45); c.moveTo(x + 6, top + 51); c.lineTo(x - 5, top + 60); c.stroke();
    }
  }
  // The speed run shares the earth material; only its riding edge is marked.
  const ramp = level.skateRamp;
  c.restore();
  c.lineJoin = 'round'; c.lineCap = 'round';
  profile(12); c.strokeStyle = '#526e51'; c.lineWidth = 24; c.stroke();
  profile(7); c.strokeStyle = '#82a66a'; c.lineWidth = 15; c.stroke();
  profile(3); c.strokeStyle = '#c3d995'; c.lineWidth = 6; c.stroke();
  profile(); c.strokeStyle = '#4a674b'; c.lineWidth = 1.5; c.stroke();
  for (let x = Math.floor(from / 14) * 14 + 6; x < to; x += 14) {
    const top = groundAt(level, x).y, seed = Math.floor(x / 14);
    c.fillStyle = seed % 3 ? '#66854f' : '#97b575';
    c.beginPath(); c.ellipse(x, top + 15, 7, 5 + seed % 4, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#b4cc82'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(x - 3, top + 11); c.lineTo(x, top + 14); c.lineTo(x + 3, top + 10); c.stroke();
  }
  for (let x = from; x < to; x += 20) {
    const y = groundAt(level, x).y, n = Math.floor(x / 20);
    c.strokeStyle = n % 2 ? '#739754' : '#91b573'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(x, y + 7); c.quadraticCurveTo(x - 3, y - 2, x - 7, y - 3); c.moveTo(x, y + 7); c.quadraticCurveTo(x + 1, y - 2, x + 4, y - 5); c.stroke();
    if (n % 9 === 0) {
      c.fillStyle = '#fff5cf'; for (let i = 0; i < 5; i++) { const angle = i * Math.PI * 0.4; c.beginPath(); c.ellipse(x + Math.cos(angle) * 3, y - 6 + Math.sin(angle) * 3, 2.5, 1.8, angle, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#dca964'; c.beginPath(); c.arc(x, y - 6, 1.8, 0, Math.PI * 2); c.fill();
    }
  }
  if (ramp) {
    c.strokeStyle = '#f8d984'; c.lineWidth = 6;
    c.beginPath(); c.moveTo(ramp.lip - 80, groundAt(level, ramp.lip - 80).y + 4); c.lineTo(ramp.lip - 8, groundAt(level, ramp.lip - 8).y + 4); c.stroke();
  }
  c.restore();
  for (const gap of level.gaps ?? []) {
    if (gap.x > to || gap.x + gap.width < from) continue;
    const left = groundAt(level, gap.x).y, right = groundAt(level, gap.x + gap.width).y;
    const shade = c.createLinearGradient(0, Math.min(left, right), 0, bottom);
    shade.addColorStop(0, '#71949918'); shade.addColorStop(0.5, '#43586ca8'); shade.addColorStop(1, '#263346');
    c.fillStyle = shade; c.beginPath(); c.moveTo(gap.x, left); c.lineTo(gap.x + gap.width, right); c.lineTo(gap.x + gap.width, bottom); c.lineTo(gap.x, bottom); c.closePath(); c.fill();
    for (const [x, y] of [[gap.x, left], [gap.x + gap.width, right]]) {
      c.strokeStyle = '#775f59'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y + 13); c.lineTo(x, bottom); c.stroke();
      c.strokeStyle = '#6b7856'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + 3); c.bezierCurveTo(x - 9, y + 18, x + 8, y + 34, x - 3, y + 56); c.stroke();
    }
  }
  for (const p of level.platforms) {
    if (p.x > to || p.x + p.width < from) continue;
    c.save(); c.beginPath(); c.roundRect(p.x, p.y + 3, p.width, 29, [4, 4, 12, 12]);
    c.fillStyle = texture ?? earth; c.fill();
    c.strokeStyle = '#725445'; c.lineWidth = 1.5; c.stroke(); c.clip();
    const shade = c.createLinearGradient(0, p.y + 7, 0, p.y + 33); shade.addColorStop(0, '#52394d00'); shade.addColorStop(1, '#52394d99');
    c.fillStyle = shade; c.fillRect(p.x, p.y, p.width, 34); c.restore();
    c.fillStyle = '#526e51'; c.beginPath(); c.roundRect(p.x, p.y + 2, p.width, 11, 4); c.fill();
    c.fillStyle = '#82a66a'; c.beginPath(); c.roundRect(p.x, p.y, p.width, 7, 3); c.fill();
    c.strokeStyle = '#c3d995'; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x + 3, p.y + 1); c.lineTo(p.x + p.width - 3, p.y + 1); c.stroke();
    for (let x = p.x + 9; x < p.x + p.width - 5; x += 14) {
      c.fillStyle = '#739755'; c.beginPath(); c.ellipse(x, p.y + 10, 6, 4, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#a7c57e'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 3, p.y + 5); c.lineTo(x, p.y + 2); c.lineTo(x + 2, p.y - 2); c.stroke();
    }
  }
}
