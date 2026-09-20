function paw(c: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) {
  c.save(); c.translate(x, y); c.scale(scale, scale); c.fillStyle = color;
  c.beginPath(); c.ellipse(0, 3, 7, 5.5, 0, 0, Math.PI * 2); c.fill();
  for (const [dx, dy, angle] of [[-8, -4, -0.5], [-3, -8, -0.15], [3, -8, 0.15], [8, -4, 0.5]]) {
    c.beginPath(); c.ellipse(dx, dy, 2.8, 3.7, angle, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

export function drawCheckpoint(c: CanvasRenderingContext2D, x: number, y: number, active: boolean, time: number) {
  c.save(); c.translate(x, y); c.lineJoin = 'round';
  c.fillStyle = '#847c83'; c.strokeStyle = '#5d5065'; c.lineWidth = 1.5;
  c.beginPath(); c.roundRect(-15, -7, 30, 10, [7, 7, 3, 3]); c.fill(); c.stroke();
  const pole = c.createLinearGradient(-3, 0, 4, 0); pole.addColorStop(0, '#7a5660'); pole.addColorStop(0.45, '#eccb9e'); pole.addColorStop(1, '#916866');
  c.fillStyle = pole; c.beginPath(); c.roundRect(-3, -108, 7, 104, 3); c.fill(); c.stroke();
  c.fillStyle = '#f3ce7f'; c.beginPath(); c.arc(0.5, -110, 5, 0, Math.PI * 2); c.fill(); c.stroke();
  const wave = Math.sin(time * 3 + x) * 3;
  const cloth = c.createLinearGradient(5, -100, 53, -60);
  cloth.addColorStop(0, active ? '#fff0b9' : '#d9c5ee'); cloth.addColorStop(0.55, active ? '#f1c974' : '#b697d5'); cloth.addColorStop(1, active ? '#d99b59' : '#8664ad');
  c.beginPath(); c.moveTo(5, -101); c.bezierCurveTo(20, -108, 37, -94 + wave, 56, -101 + wave);
  c.lineTo(48, -83 + wave); c.lineTo(55, -65 + wave); c.bezierCurveTo(35, -58 + wave, 22, -73, 5, -65); c.closePath();
  c.fillStyle = cloth; c.fill(); c.strokeStyle = active ? '#9b6947' : '#6f528e'; c.lineWidth = 1.5; c.stroke();
  c.strokeStyle = '#fff6da99'; c.lineWidth = 1; c.setLineDash([2, 3]);
  c.beginPath(); c.moveTo(9, -97); c.bezierCurveTo(24, -102, 38, -89 + wave, 49, -95 + wave); c.moveTo(9, -69); c.bezierCurveTo(26, -73, 39, -62 + wave, 48, -68 + wave); c.stroke(); c.setLineDash([]);
  paw(c, 28, -82 + wave * 0.3, 0.85, active ? '#6c6744' : '#f8edff');
  for (const py of [-99, -66]) { c.strokeStyle = '#f3dda9'; c.beginPath(); c.ellipse(3, py, 5, 2, 0, 0, Math.PI * 2); c.stroke(); }
  if (active) {
    c.fillStyle = '#fff4cb'; c.strokeStyle = '#64774e'; c.beginPath(); c.arc(0, -24, 9, 0, Math.PI * 2); c.fill(); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.moveTo(-4, -24); c.lineTo(-1, -21); c.lineTo(4, -27); c.stroke();
  }
  c.restore();
}

export function drawCageBack(c: CanvasRenderingContext2D, x: number, y: number) {
  c.save(); c.translate(x, y); c.lineJoin = 'round';
  c.fillStyle = '#55495f22'; c.beginPath(); c.ellipse(0, 2, 70, 9, 0, 0, Math.PI * 2); c.fill();
  const stone = c.createLinearGradient(0, -119, 0, 0); stone.addColorStop(0, '#d0bbd8'); stone.addColorStop(1, '#82758f');
  c.fillStyle = stone; c.strokeStyle = '#594a66'; c.lineWidth = 3;
  c.beginPath(); c.roundRect(-59, -119, 118, 121, [20, 20, 7, 7]); c.fill(); c.stroke();
  const inside = c.createLinearGradient(0, -107, 0, -4); inside.addColorStop(0, '#4e4967'); inside.addColorStop(1, '#94819b');
  c.fillStyle = inside; c.beginPath(); c.roundRect(-49, -108, 98, 101, [13, 13, 3, 3]); c.fill();
  c.strokeStyle = '#bcadca'; c.lineWidth = 2;
  for (const bx of [-46, 46]) { c.beginPath(); c.moveTo(bx, -96); c.lineTo(bx, -10); c.stroke(); }
  c.fillStyle = '#cfa47e'; c.beginPath(); c.roundRect(-49, -13, 98, 13, 3); c.fill();
  c.strokeStyle = '#927064'; c.lineWidth = 1; for (let bx = -32; bx < 48; bx += 20) { c.beginPath(); c.moveTo(bx, -12); c.lineTo(bx - 4, 0); c.stroke(); }
  c.fillStyle = '#dcb6cc'; c.beginPath(); c.ellipse(0, -9, 35, 7, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#f1d4e3'; c.setLineDash([3, 3]); c.beginPath(); c.ellipse(0, -9, 29, 4, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
  c.fillStyle = '#ae91b7'; c.strokeStyle = '#604d73'; c.beginPath(); c.roundRect(-20, -131, 40, 21, 7); c.fill(); c.stroke();
  paw(c, 0, -120, 0.68, '#fff0c3');
  for (const bx of [-53, 53]) for (const by of [-100, -15]) { c.fillStyle = '#fff0d4'; c.beginPath(); c.arc(bx, by, 2.2, 0, Math.PI * 2); c.fill(); }
  c.restore();
}

export function drawCageDoor(c: CanvasRenderingContext2D, x: number, y: number, openness: number) {
  c.save(); c.translate(x + 51, y - 3); c.scale(Math.cos(openness * Math.PI * 0.74), 1);
  c.lineJoin = 'round'; c.lineCap = 'round';
  const metal = c.createLinearGradient(-103, 0, 0, 0); metal.addColorStop(0, '#7e879f'); metal.addColorStop(0.45, '#e7e9ed'); metal.addColorStop(1, '#99a4b8');
  c.strokeStyle = '#515b76'; c.lineWidth = 7; c.beginPath(); c.roundRect(-103, -106, 103, 106, [11, 11, 3, 3]); c.stroke();
  c.strokeStyle = metal; c.lineWidth = 4; c.stroke();
  for (let bx = -87; bx < -8; bx += 18) {
    c.strokeStyle = '#515b76'; c.lineWidth = 6; c.beginPath(); c.moveTo(bx, -100); c.lineTo(bx, -3); c.stroke();
    c.strokeStyle = metal; c.lineWidth = 3.5; c.stroke();
  }
  c.strokeStyle = '#7c8ca7'; c.lineWidth = 4; c.beginPath(); c.moveTo(-100, -71); c.lineTo(-2, -71); c.stroke();
  for (const by of [-84, -22]) { c.fillStyle = '#697990'; c.beginPath(); c.roundRect(-5, by, 10, 15, 3); c.fill(); c.fillStyle = '#e2d8c5'; c.fillRect(-1, by + 3, 2, 9); }
  if (openness < 0.25) {
    c.strokeStyle = '#f8e2a9'; c.lineWidth = 4; c.beginPath(); c.arc(-52, -49, 6.5, Math.PI, 0); c.lineTo(-45.5, -41); c.moveTo(-58.5, -49); c.lineTo(-58.5, -41); c.stroke();
    const gold = c.createLinearGradient(-64, -45, -41, -20); gold.addColorStop(0, '#ffe4a4'); gold.addColorStop(1, '#b7823e');
    c.fillStyle = gold; c.strokeStyle = '#8b623e'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(-64, -45, 24, 24, 5); c.fill(); c.stroke();
    c.fillStyle = '#67506a'; c.beginPath(); c.arc(-52, -36, 3, 0, Math.PI * 2); c.fill(); c.fillRect(-53.5, -35, 3, 7);
  }
  c.restore();
}
