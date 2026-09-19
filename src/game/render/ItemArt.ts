/** Illustrated Canvas items, drawn at world scale without external assets. */
export function starPath(c: CanvasRenderingContext2D, radius: number) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? radius * 0.48 : radius;
    const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
    if (i) c.lineTo(x, y); else c.moveTo(x, y);
  }
  c.closePath();
}

export function drawGoldStar(c: CanvasRenderingContext2D, x: number, y: number, time: number, radius = 15) {
  c.save(); c.translate(x, y);
  const glow = c.createRadialGradient(0, 0, 2, 0, 0, radius * 2);
  glow.addColorStop(0, '#ffe8a866'); glow.addColorStop(1, '#ffe8a800');
  c.fillStyle = glow; c.fillRect(-radius * 2, -radius * 2, radius * 4, radius * 4);
  c.rotate(Math.sin(time * 2 + x) * 0.08);
  const gold = c.createLinearGradient(-radius, -radius, radius, radius);
  gold.addColorStop(0, '#fff8ce'); gold.addColorStop(0.38, '#ffdd73'); gold.addColorStop(1, '#dc8b37');
  starPath(c, radius); c.fillStyle = gold; c.fill(); c.strokeStyle = '#865236'; c.lineWidth = 1.6; c.lineJoin = 'round'; c.stroke();
  starPath(c, radius * 0.67); c.strokeStyle = '#fff6c7'; c.lineWidth = 1; c.stroke();
  c.fillStyle = '#fffdf0'; c.beginPath(); c.ellipse(-radius * 0.23, -radius * 0.3, 2, 3.5, 0.4, 0, Math.PI * 2); c.fill();
  c.restore();
}

function wheel(c: CanvasRenderingContext2D, x: number, y: number, r = 6) {
  c.fillStyle = '#67456b'; c.strokeStyle = '#46314f'; c.lineWidth = 1.5;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = '#f2b8d5'; c.beginPath(); c.arc(x - 0.8, y - 0.7, r * 0.65, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff5df'; c.beginPath(); c.arc(x, y, 1.6, 0, Math.PI * 2); c.fill();
}

export function drawGearItem(c: CanvasRenderingContext2D, x: number, y: number, skate: boolean) {
  c.save(); c.translate(x, y); c.lineJoin = 'round';
  if (skate) {
    c.fillStyle = '#acaec1'; c.strokeStyle = '#554765'; c.lineWidth = 2;
    for (const dx of [-23, 23]) { c.fillRect(dx - 5, 0, 10, 7); wheel(c, dx, 9); }
    const deck = c.createLinearGradient(0, -13, 0, 4); deck.addColorStop(0, '#ffe4aa'); deck.addColorStop(1, '#cb8555');
    c.beginPath(); c.moveTo(-39, -11); c.quadraticCurveTo(-33, 2, -21, 2); c.lineTo(23, 2); c.quadraticCurveTo(34, 1, 39, -10);
    c.lineTo(33, -13); c.quadraticCurveTo(29, -6, 20, -6); c.lineTo(-21, -6); c.quadraticCurveTo(-31, -6, -34, -14); c.closePath();
    c.fillStyle = deck; c.fill(); c.strokeStyle = '#654157'; c.stroke();
    c.strokeStyle = '#bd80c3'; c.lineWidth = 3; c.beginPath(); c.moveTo(-23, -5); c.lineTo(24, -5); c.stroke();
    c.fillStyle = '#fff3d0'; for (const dx of [-22, 22]) c.fillRect(dx - 1, -7, 2, 2);
    drawGoldStar(c, 0, -7, 0, 5);
  } else {
    for (const dx of [-22, 5]) {
      c.save(); c.translate(dx, 0);
      wheel(c, 2, 11, 5); wheel(c, 20, 11, 5);
      c.fillStyle = '#9e83b5'; c.strokeStyle = '#654157'; c.lineWidth = 1.5;
      c.beginPath(); c.roundRect(-5, 3, 32, 5, 2); c.fill(); c.stroke();
      const boot = c.createLinearGradient(-4, -25, 22, 6); boot.addColorStop(0, '#ffdbec'); boot.addColorStop(0.5, '#f29bc9'); boot.addColorStop(1, '#b565a2');
      c.beginPath(); c.moveTo(-5, -23); c.quadraticCurveTo(1, -28, 11, -24); c.lineTo(10, -9);
      c.quadraticCurveTo(12, -4, 21, -3); c.quadraticCurveTo(28, -2, 26, 4); c.lineTo(-5, 4); c.closePath();
      c.fillStyle = boot; c.fill(); c.stroke();
      c.fillStyle = '#fff0e9'; c.fillRect(-4, -24, 14, 5);
      c.strokeStyle = '#fff5ed'; c.lineWidth = 1.8;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(5, -16 + i * 5); c.lineTo(11, -13 + i * 5); c.stroke(); }
      c.fillStyle = '#ae70ab'; c.beginPath(); c.arc(-1, -9, 2.3, 0, Math.PI * 2); c.fill();
      c.restore();
    }
  }
  c.restore();
}

export function drawCrate(c: CanvasRenderingContext2D, x: number, y: number, row: number) {
  c.save(); c.translate(x, y); c.lineJoin = 'round';
  c.fillStyle = '#8d5b48'; c.strokeStyle = '#593e51'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(20, -34); c.lineTo(25, -30); c.lineTo(25, 0); c.lineTo(20, 3); c.closePath(); c.fill(); c.stroke();
  const wood = c.createLinearGradient(-20, -34, 20, 2); wood.addColorStop(0, '#f0c08a'); wood.addColorStop(1, '#b97953');
  c.fillStyle = wood; c.beginPath(); c.roundRect(-21, -34, 42, 37, 3); c.fill(); c.stroke();
  c.strokeStyle = '#ad724e'; c.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const top = -27 + i * 10; c.beginPath(); c.moveTo(-17, top); c.bezierCurveTo(-4, top - 2, 6, top + 2, 18, top); c.stroke();
  }
  c.strokeStyle = '#f8d29c'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(-16, -29); c.lineTo(16, -2); c.moveTo(16, -29); c.lineTo(-16, -2); c.stroke();
  for (const by of [-31, -2]) {
    c.fillStyle = '#9b91a3'; c.fillRect(-20, by, 40, 4);
    for (const bx of [-16, 16]) { c.fillStyle = '#493d54'; c.beginPath(); c.arc(bx, by + 2, 1.3, 0, Math.PI * 2); c.fill(); }
  }
  if (row === 1) { c.fillStyle = '#7b547a'; c.beginPath(); c.roundRect(-11, -25, 22, 20, 4); c.fill(); drawGoldStar(c, 0, -15, 0, 8); }
  c.restore();
}

export function drawPowerAura(c: CanvasRenderingContext2D, x: number, y: number, time: number, reducedMotion: boolean, pickup = false) {
  c.save(); c.translate(x, y - 60);
  const glow = c.createRadialGradient(0, 0, 20, 0, 0, 88);
  glow.addColorStop(0, pickup ? '#ddb4ff44' : '#ffeaab55'); glow.addColorStop(1, '#ffeaab00');
  c.fillStyle = glow; c.beginPath(); c.ellipse(0, 0, 73, 88, 0, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5 + (reducedMotion ? 0 : time * 1.6);
    drawGoldStar(c, Math.cos(a) * 49, Math.sin(a) * 63, reducedMotion ? 0 : time, 5 + i % 2 * 2);
  }
  c.restore();
}
