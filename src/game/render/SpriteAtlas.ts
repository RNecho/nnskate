interface Silhouette { id: number; left: number; top: number; right: number; bottom: number; area: number }

/** Isolate complete silhouettes before dividing generated art into animation cells.
 * Source poses can extend past their nominal cell, so a rectangular grid crop
 * alone would cut limbs and pick up pieces of the adjacent character.
 */
export function isolateSpriteAtlas(source: HTMLCanvasElement, rows: number, centered = false): HTMLCanvasElement {
  const width = source.width, height = source.height;
  const pixels = source.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, width, height);
  const labels = new Int32Array(width * height), queue = new Int32Array(width * height);
  const shapes: Silhouette[] = [];
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] || pixels.data[start * 4 + 3] < 8) continue;
    const id = shapes.length + 1;
    let head = 0, tail = 1;
    queue[0] = start; labels[start] = id;
    const shape: Silhouette = { id, left: width, top: height, right: 0, bottom: 0, area: 0 };
    const visit = (index: number) => {
      if (!labels[index] && pixels.data[index * 4 + 3] >= 8) { labels[index] = id; queue[tail++] = index; }
    };
    while (head < tail) {
      const index = queue[head++], x = index % width, y = Math.floor(index / width);
      shape.left = Math.min(shape.left, x); shape.right = Math.max(shape.right, x + 1);
      shape.top = Math.min(shape.top, y); shape.bottom = Math.max(shape.bottom, y + 1);
      if (x > 0) visit(index - 1);
      if (x + 1 < width) visit(index + 1);
      if (y > 0) visit(index - width);
      if (y + 1 < height) visit(index + width);
    }
    shape.area = tail; shapes.push(shape);
  }
  const bodies: (Silhouette | undefined)[] = Array(rows * 4).fill(undefined);
  for (const shape of shapes) {
    const column = Math.min(3, Math.floor((shape.left + shape.right) / 2 / width * 4));
    const row = Math.min(rows - 1, Math.floor((shape.top + shape.bottom) / 2 / height * rows));
    const slot = row * 4 + column;
    if (!bodies[slot] || shape.area > bodies[slot]!.area) bodies[slot] = shape;
  }
  if (bodies.some(body => !body || body.area < 1000)) throw new Error('Sprite incompleto: não foi possível separar todas as poses.');
  const poses = bodies as Silhouette[];
  const owners = new Int16Array(shapes.length + 1).fill(-1);
  poses.forEach((pose, index) => { owners[pose.id] = index; });
  // Keep detached lace/wheel details that belong to the silhouette, not nearby poses.
  for (const shape of shapes) {
    if (owners[shape.id] >= 0 || shape.area < 4) continue;
    let nearest = -1, distance = 7;
    poses.forEach((pose, index) => {
      const dx = Math.max(pose.left - shape.right, shape.left - pose.right, 0);
      const dy = Math.max(pose.top - shape.bottom, shape.top - pose.bottom, 0);
      const gap = Math.hypot(dx, dy);
      if (gap < distance) { nearest = index; distance = gap; }
    });
    if (nearest >= 0) owners[shape.id] = nearest;
  }
  const bounds = poses.map(pose => ({ ...pose }));
  for (const shape of shapes) {
    const owner = owners[shape.id]; if (owner < 0) continue;
    const b = bounds[owner];
    b.left = Math.min(b.left, shape.left); b.right = Math.max(b.right, shape.right);
    b.top = Math.min(b.top, shape.top); b.bottom = Math.max(b.bottom, shape.bottom);
  }
  const cellWidth = 384, cellHeight = 512, padding = 32;
  const scale = Math.min((cellWidth - padding * 2) / Math.max(...bounds.map(b => b.right - b.left)),
    (cellHeight - padding * 2) / Math.max(...bounds.map(b => b.bottom - b.top)));
  const atlas = document.createElement('canvas'); atlas.width = cellWidth * 4; atlas.height = cellHeight * rows;
  const c = atlas.getContext('2d')!;
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  const cutout = document.createElement('canvas');
  bounds.forEach((b, index) => {
    const w = b.right - b.left, h = b.bottom - b.top;
    cutout.width = w; cutout.height = h;
    const cut = cutout.getContext('2d')!, data = cut.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const src = (b.top + y) * width + b.left + x;
      if (owners[labels[src]] !== index) continue;
      const dst = (y * w + x) * 4;
      for (let channel = 0; channel < 4; channel++) data.data[dst + channel] = pixels.data[src * 4 + channel];
    }
    cut.putImageData(data, 0, 0);
    const x = index % 4 * cellWidth + (cellWidth - w * scale) / 2;
    const y = Math.floor(index / 4) * cellHeight + (centered ? (cellHeight - h * scale) / 2 : cellHeight - padding - h * scale);
    c.drawImage(cutout, x, y, w * scale, h * scale);
  });
  return atlas;
}
