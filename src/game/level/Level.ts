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

/** One continuous adventure, reusing the original garden and its ramps. */
export const SKATE_RAMP = { from: 1400, lip: 1850, landing: 2350, minSpeed: 450, maxSpeed: 600, jumpForce: 640 };
export const RESCUE_LEVEL: LevelData = {
  ...TEST_LEVEL,
  width: 4600,
  skateRamp: SKATE_RAMP,
  gaps: [{ x: 450, width: 65 }, { x: 930, width: 90 }, { x: SKATE_RAMP.lip, width: SKATE_RAMP.landing - SKATE_RAMP.lip }, { x: 2840, width: 70 }, { x: 3485, width: 120 }],
  ground: [...TEST_LEVEL.ground.filter(p => p.x <= 1370),
    { x: 1420, y: 325 }, { x: 1660, y: 440 }, { x: 1730, y: 440 },
    { x: 1850, y: 340 }, { x: 2350, y: 340 }, { x: 2440, y: 370 },
    ...TEST_LEVEL.ground.filter(p => p.x >= 1780 && p.x < 2800).map(p => ({ x: p.x + 900, y: p.y })),
    { x: 4600, y: 370 }],
  platforms: [
    { x: 840, y: 302, width: 150 },
    { x: 2460, y: 295, width: 160 },
    { x: 3190, y: 282, width: 150 },
    { x: 3390, y: 218, width: 165 },
    { x: 3620, y: 275, width: 145 },
  ],
};

export function gapAt(level: LevelData, x: number) {
  return level.gaps?.find(gap => x >= gap.x && x < gap.x + gap.width);
}

/** Solid horizontal ranges are shared by terrain rendering and collision. */
export function groundRanges(level: LevelData): { from: number; to: number }[] {
  let from = 0;
  const ranges: { from: number; to: number }[] = [];
  for (const gap of [...level.gaps ?? []].sort((a, b) => a.x - b.x)) {
    if (gap.x > from) ranges.push({ from, to: Math.min(level.width, gap.x) });
    from = Math.max(from, gap.x + gap.width);
  }
  if (from < level.width) ranges.push({ from, to: level.width });
  return ranges;
}

export function groundSegments(level: LevelData) {
  return groundRanges(level).flatMap(range => level.ground.slice(0, -1).flatMap((a, i) => {
    const b = level.ground[i + 1];
    const from = Math.max(a.x, range.from), to = Math.min(b.x, range.to);
    return from < to ? [{ a: { x: from, y: groundAt(level, from).y }, b: { x: to, y: groundAt(level, to).y } }] : [];
  }));
}

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
