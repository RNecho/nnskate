import type { LevelData } from '../types';

export const TEST_LEVEL: LevelData = {
  width: 2800,
  height: 600,
  spawn: { x: 150, y: 370 },
  ground: [
    { x: 0, y: 370 }, { x: 410, y: 370 },
    { x: 560, y: 316 }, { x: 690, y: 316 },
    { x: 860, y: 370 }, { x: 1210, y: 370 },
    { x: 1320, y: 325 }, { x: 1370, y: 325 },
    { x: 1470, y: 370 }, { x: 1780, y: 370 },
    { x: 1870, y: 404 }, { x: 2050, y: 404 },
    { x: 2150, y: 370 }, { x: 2800, y: 370 },
  ],
  platforms: [
    { x: 960, y: 300, width: 144 },
    { x: 1555, y: 300, width: 136 },
    { x: 2240, y: 300, width: 152 },
  ],
};

/** Piecewise-linear terrain is shared by rendering and collision. */
export function groundAt(level: LevelData, x: number): { y: number; angle: number } {
  const points = level.ground;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    if (x <= b.x) {
      const t = Math.max(0, Math.min(1, (x - a.x) / (b.x - a.x)));
      return { y: a.y + (b.y - a.y) * t, angle: Math.atan2(b.y - a.y, b.x - a.x) };
    }
  }
  return { y: points[points.length - 1].y, angle: 0 };
}
