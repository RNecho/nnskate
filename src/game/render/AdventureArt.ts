import { CAGE_X, CHECKPOINTS, COMPANION_OFFSET, RESCUE_KEY, SKATE_BARRIER_X, type Adventure, type Enemy } from '../adventure/Adventure';
import { groundAt } from '../level/Level';
import { artAssets, monsterFrames, puppyFrames } from './ArtAssets';
import { drawCrate, drawGearItem, drawGoldStar } from './ItemArt';

/** Native pixel scenery follows the same palette and shapes as the original park. */
export class AdventureArt {
  constructor(private c: CanvasRenderingContext2D) {}
  private rect(x: number, y: number, w: number, h: number, color: string) {
    this.c.fillStyle = color; this.c.fillRect(Math.round(x), Math.round(y), w, h);
  }
  private label(x: number, y: number, text: string, color = '#403452') {
    this.c.font = '600 12px "DM Sans", sans-serif';
    const width = this.c.measureText(text).width + 18;
    this.rect(x - width / 2, y - 16, width, 25, '#fff2d9');
    this.c.fillStyle = color; this.c.textAlign = 'center'; this.c.fillText(text, x, y);
  }

  dog(x: number, y: number, time: number, happy = false, running = false, facing = 1) {
    const c = this.c;
    if (artAssets.puppy && puppyFrames.length === 4) {
      const frame = puppyFrames[running ? 2 + Math.floor(time * 9) % 2 : happy ? 1 : 0];
      const scale = 70 / Math.max(...puppyFrames.map(pose => pose.height));
      c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(facing, 1);
      c.drawImage(artAssets.puppy, frame.x, frame.y, frame.width, frame.height,
        -frame.width * scale / 2, -frame.height * scale, frame.width * scale, frame.height * scale);
      c.restore(); return;
    }
    c.save(); c.translate(Math.round(x), Math.round(y));
    if (happy) c.translate(0, -Math.abs(Math.sin(time * 5)) * 9);
    this.rect(-18, -28, 33, 22, '#6e423e');
    this.rect(-16, -26, 30, 20, '#e5ab6b');
    this.rect(-13, -24, 15, 15, '#fff0d0');
    this.rect(-13, -9, 8, 9, '#694740'); this.rect(5, -9, 9, 9, '#694740');
    this.rect(-11, -8, 6, 6, '#fff0d0'); this.rect(7, -8, 6, 6, '#fff0d0');
    this.rect(-18, -47, 37, 27, '#68413e');
    this.rect(-16, -45, 33, 24, '#f7d393');
    this.rect(-20, -43, 10, 24, '#915440'); this.rect(11, -43, 10, 25, '#915440');
    this.rect(-19, -41, 5, 18, '#c07b4d'); this.rect(14, -41, 5, 18, '#c07b4d');
    this.rect(-8, -38, 4, 6, '#3f3142'); this.rect(5, -38, 4, 6, '#3f3142');
    this.rect(-7, -38, 2, 2, '#fff3df'); this.rect(6, -38, 2, 2, '#fff3df');
    this.rect(-7, -30, 15, 8, '#fff1d4'); this.rect(-2, -32, 6, 4, '#463040');
    this.rect(0, -25, 4, happy ? 7 : 3, '#ed879b');
    this.rect(-11, -20, 24, 4, '#8059c3'); this.rect(-1, -17, 5, 5, '#f9cd57');
    const wag = Math.round(Math.sin(time * (happy ? 14 : 4)) * 3);
    this.rect(-25, -24 + wag, 10, 6, '#a26744'); this.rect(-27, -29 + wag, 5, 8, '#f7d393');
    c.restore();
  }

  private monster(enemy: Enemy, time: number) {
    if (enemy.hp <= 0 && enemy.cooldown <= 0) return;
    const c = this.c, boss = enemy.kind === 'boss';
    const atlas = artAssets.monsters;
    const row = boss ? 2 : enemy.kind === 'hopper' ? 1 : 0;
    const poses = monsterFrames[row];
    if (atlas && poses) {
      const frameIndex = enemy.cooldown > 0 ? 3 : enemy.kind === 'hopper'
        ? Math.sin(time * 3 + enemy.home) > 0.2 ? 2 : Math.sin(time * 3 + enemy.home) > -0.4 ? 1 : 0
        : [0, 1, 0, 2][Math.floor(time * 7 + enemy.home) % 4];
      const frame = poses[frameIndex];
      const scale = (boss ? 93 : enemy.kind === 'hopper' ? 61 : 46) / Math.max(...poses.map(pose => pose.height));
      c.save(); c.translate(Math.round(enemy.x), Math.round(enemy.y)); c.scale(enemy.direction, 1);
      c.globalAlpha = enemy.hp <= 0 ? Math.min(1, enemy.cooldown / 0.5) : enemy.cooldown > 0 ? 0.75 : 1;
      c.drawImage(atlas, frame.x, frame.y, frame.width, frame.height,
        -frame.width * scale / 2, -frame.height * scale, frame.width * scale, frame.height * scale);
      c.restore();
    } else {
    c.save(); c.translate(Math.round(enemy.x), Math.round(enemy.y));
    const s = boss ? 1.8 : 1;
    c.scale(s, s);
    c.globalAlpha = enemy.cooldown > 0 ? 0.55 : 1;
    const hopper = enemy.kind === 'hopper';
    const light = boss ? '#bb8de0' : hopper ? '#ffd280' : '#9bf0ed';
    const mid = boss ? '#8351b3' : hopper ? '#dd8859' : '#4bafba';
    const outline = '#3f3153';
    this.rect(-21, -27, 42, 24, outline); this.rect(-15, -36, 30, 33, outline);
    this.rect(-19, -25, 38, 20, mid); this.rect(-13, -34, 26, 26, mid);
    this.rect(-12, -32, 24, 7, light); this.rect(-17, -24, 7, 10, light);
    this.rect(-22, -7, 17, 7, outline); this.rect(5, -7, 17, 7, outline);
    this.rect(-20, -6, 13, 4, mid); this.rect(7, -6, 13, 4, mid);
    this.rect(-12, -26, 10, 12, '#fff2d9'); this.rect(3, -26, 10, 12, '#fff2d9');
    this.rect(-8 + enemy.direction, -23, 4, 7, outline); this.rect(6 + enemy.direction, -23, 4, 7, outline);
    this.rect(-8, -10, 17, 3, outline); this.rect(-6, -10, 4, 4, '#fff2d9');
    if (hopper) { this.rect(-12, -48, 7, 14, outline); this.rect(7, -45, 7, 11, outline); }
    if (boss) {
      this.rect(-14, -42, 28, 7, '#f4bf57');
      for (const x of [-14, -2, 10]) this.rect(x, -48, 5, 10, '#ffdc7e');
      this.rect(-1, -41, 5, 5, '#ee7a96');
      this.rect(-13, -28, 12, 3, outline); this.rect(4, -28, 12, 3, outline);
    }
    c.restore();
    }
    if (boss && enemy.hp > 0) {
      this.label(enemy.x, enemy.y - 115, 'GUARDIÃO');
      for (let i = 0; i < 3; i++) {
        this.rect(enemy.x - 30 + i * 21, enemy.y - 100, 17, 8, '#423052');
        this.rect(enemy.x - 28 + i * 21, enemy.y - 98, 13, 4, i < enemy.hp ? '#f1a3d0' : '#736282');
      }
    }
  }

  private gear(x: number, y: number, skate: boolean) {
    drawGearItem(this.c, x, y, skate);
  }

  private challenges(adventure: Adventure, time: number) {
    const c = this.c, x = SKATE_BARRIER_X, y = groundAt(adventure.level, x).y;
    if (!adventure.barrierBroken) {
      for (let row = 0; row < 3; row++) {
        drawCrate(c, x, y - row * 36 - 3, row);
      }
      this.label(x, y - 131, 'ACELERE DE SKATE!');
    } else if (adventure.barrierBurst > 0) {
      const t = 0.7 - adventure.barrierBurst;
      for (let i = 0; i < 12; i++) {
        c.save(); c.translate(x + (i - 6) * t * 60, y - 45 - t * 165 + t * t * 300 + i % 3 * 12); c.rotate(t * (i - 6) * 2);
        c.fillStyle = i % 2 ? '#dca270' : '#f3c796'; c.strokeStyle = '#87614b'; c.lineWidth = 1;
        c.fillRect(-5, -3, 12, 5); c.strokeRect(-5, -3, 12, 5); c.restore();
      }
    }
    if (!adventure.keyCollected) {
      const { x: keyX, y: keyY } = RESCUE_KEY;
      this.label(keyX, keyY - 45, 'PULE + PULE = CHAVE');
      c.save(); c.translate(keyX, keyY + Math.sin(time * 3) * 4);
      c.strokeStyle = '#fff0b0'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 33, 0, Math.PI * 2); c.stroke();
      for (const [color, width] of [['#6c4a50', 10], ['#f6cb62', 6]] as const) {
        c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round';
        c.beginPath(); c.arc(-10, -3, 9, 0, Math.PI * 2);
        c.moveTo(-1, -3); c.lineTo(20, -3); c.lineTo(20, 6);
        c.moveTo(11, -3); c.lineTo(11, 4); c.stroke();
      }
      c.restore();
    }
    const ramp = adventure.level.skateRamp;
    if (ramp) {
      this.label(ramp.from + 115, 263, 'DESÇA DE SKATE!');
      this.label(ramp.lip - 55, 264, 'PULE NA FAIXA DOURADA');
      this.label((ramp.lip + ramp.landing) / 2, 95, 'NO AR: ↑ + ↑ = GIRO 360°');
      const speed = Math.abs(adventure.character.snapshot.vx);
      const ready = adventure.character.snapshot.equipment === 'skate' && speed >= ramp.minSpeed;
      if (adventure.character.snapshot.x >= ramp.from && adventure.character.snapshot.x < ramp.lip) {
        this.label(ramp.lip - 55, 291, ready ? 'BOM EMBALO!' : 'GANHE VELOCIDADE NA DESCIDA', ready ? '#326746' : '#805c38');
      }
    }
  }

  render(adventure: Adventure, time: number) {
    const c = this.c;
    this.challenges(adventure, time);
    for (const spark of adventure.sparks) {
      if (spark.taken) continue;
      const y = spark.y + Math.sin(time * 3 + spark.x) * 3;
      drawGoldStar(c, spark.x, y, time);
    }
    for (const pickup of adventure.pickups) {
      const y = pickup.y + Math.sin(time * 3) * 5;
      c.strokeStyle = '#fff0b9'; c.lineWidth = 3;
      c.beginPath(); c.arc(pickup.x, y, 37, 0, Math.PI * 2); c.stroke();
      this.gear(pickup.x, y, pickup.equipment === 'skate');
      this.label(pickup.x, y - 50, pickup.equipment === 'skate' ? 'SUPERVELOCIDADE' : 'PULO DUPLO');
      this.rect(pickup.x - 34, groundAt(adventure.level, pickup.x).y - 5, 68, 5, '#c29ce5');
    }
    for (let i = 1; i < CHECKPOINTS.length; i++) {
      const x = CHECKPOINTS[i], y = groundAt(adventure.level, x).y;
      this.rect(x - 2, y - 82, 5, 82, '#59415d');
      this.rect(x + 3, y - 81, 35, 22, i <= adventure.checkpoint ? '#faf0ba' : '#776382');
      this.rect(x + 10, y - 75, 7, 7, i <= adventure.checkpoint ? '#5b9a70' : '#b3a1bd');
      this.rect(x + 17, y - 68, 7, 7, i <= adventure.checkpoint ? '#5b9a70' : '#b3a1bd');
    }
    for (const x of [440, 810, 1750, 2260, 2900, 3390]) {
      const y = groundAt(adventure.level, x).y + 45;
      this.rect(x - 5, y, 10, 8, '#f8caa5');
      for (const dx of [-9, -2, 5]) this.rect(x + dx, y - 7, 5, 5, '#f8caa5');
    }
    this.label(640, 214, 'PULE NA CABEÇA!');
    this.label(410, 259, 'CUIDADO! PULE!');
    this.label(3420, 132, 'PULE DE NOVO NO AR');
    for (const enemy of adventure.enemies) this.monster(enemy, time);

    const y = groundAt(adventure.level, CAGE_X).y;
    if (adventure.phase === 'intro') {
      const progress = Math.max(0, Math.min(1, (adventure.introTime - 1) / 3));
      const x = 275 + progress * 620;
      this.monster({ ...adventure.boss, x, y: 370, kind: 'slime', hp: 1 }, time);
      this.dog(x, 327, time);
      this.label(x, 237, 'AU! AU!');
      // His ball is left behind at the beginning of the trail.
      this.rect(237, 359, 11, 11, '#e79dbd'); this.rect(239, 359, 4, 5, '#ffe7a1');
    } else {
      const rescued = adventure.phase === 'reunion' || adventure.phase === 'won';
      this.rect(CAGE_X - 52, y - 100, 104, 102, '#66527b');
      this.rect(CAGE_X - 47, y - 94, 94, 91, '#c2b2ca');
      this.rect(CAGE_X - 41, y - 87, 82, 80, '#6f637f');
      if (!rescued) this.dog(CAGE_X, y - 7, time, false, false, -1);
      if (adventure.boss.hp > 0 || !adventure.keyCollected) {
        for (let bar = -35; bar <= 35; bar += 17) { this.rect(CAGE_X + bar, y - 90, 5, 87, '#e4d6e1'); }
        this.rect(CAGE_X - 10, y - 45, 20, 23, '#f6c96c'); this.rect(CAGE_X - 2, y - 39, 5, 10, '#69516a');
      } else {
        this.rect(CAGE_X + 48, y - 96, 28, 5, '#e4d6e1'); this.rect(CAGE_X + 72, y - 96, 4, 96, '#e4d6e1');
      }
      if (rescued) {
        const target = adventure.character.snapshot.x + COMPANION_OFFSET;
        const running = Math.abs(adventure.dogX - target) > 14;
        const facing = running ? adventure.dogX > target ? -1 : 1 : adventure.character.snapshot.x < adventure.dogX ? -1 : 1;
        this.dog(adventure.dogX, y, time, true, running, facing);
        this.rect(adventure.dogX + 20, y - 9, 10, 10, '#e79dbd'); this.rect(adventure.dogX + 22, y - 9, 4, 5, '#ffe7a1');
        for (let i = 0; i < 5; i++) {
          const x = adventure.character.snapshot.x - 50 + i * 25, top = 200 - (time * 18 + i * 14) % 75;
          this.rect(x, top, 5, 5, '#ffc8da'); this.rect(x + 8, top, 5, 5, '#ffc8da'); this.rect(x + 3, top + 4, 8, 7, '#ffc8da');
        }
      }
    }
  }
}
