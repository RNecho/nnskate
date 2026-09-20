import { Character } from '../character/Character';
import { gapAt, groundAt } from '../level/Level';
import type { Equipment, GameSound, InputFrame, LevelData } from '../types';

export type Phase = 'intro' | 'playing' | 'reunion' | 'won' | 'defeated';
export interface Enemy {
  id: string; kind: 'slime' | 'hopper' | 'boss'; x: number; y: number;
  home: number; range: number; direction: number; hp: number; cooldown: number;
}
export interface Pickup { x: number; y: number; equipment: Equipment; taken: boolean; touching: boolean }
export interface Spark { x: number; y: number; taken: boolean }
export const CAGE_X = 4410;
export const SKATE_BARRIER_X = 1250;
export const RESCUE_KEY = { x: 3140, y: 135 };
export const SUPER_DURATION = 8;
export const MAX_HEALTH = 5;
export const COMPANION_OFFSET = 64;
// Solid, level resting spots: crates, skate run, roller-skate challenge, guardian.
// Gear stations remain reachable on foot after losing equipment in a fall.
export const CHECKPOINTS = [150, 1120, 1390, 3060, 3890];
export const POWER_LABELS: Record<Equipment, string> = {
  foot: 'A pé', skate: 'Skate · supervelocidade', patins: 'Patins · pulo duplo',
};

/** Deterministic campaign rules, independent of DOM/rendering and character identity. */
export class Adventure {
  phase: Phase = 'intro';
  time = 0;
  introTime = 0;
  reunionTime = 0;
  checkpoint = 0;
  defeated = 0;
  retries = 0;
  readonly maxHealth = MAX_HEALTH;
  health = MAX_HEALTH;
  barrierBroken = false;
  keyCollected = false;
  barrierBurst = 0;
  superTime = 0;
  superAwarded = false;
  pickupFlash = 0;
  message = 'Levaram nosso cachorrinho! Vamos buscar ele.';
  messageTime = 0;
  dogX = CAGE_X;
  enemies: Enemy[] = [];
  pickups: Pickup[] = [];
  sparks: Spark[] = [];
  private invulnerable = 0;
  rampCleared = false;

  constructor(readonly level: LevelData, readonly character: Character, private sound: (sound: GameSound) => void = () => {}) {
    this.reset();
  }

  get boss() { return this.enemies.find(enemy => enemy.kind === 'boss')!; }
  get collected() { return this.sparks.filter(spark => spark.taken).length; }
  get stage(): number {
    if (this.phase === 'won' || this.phase === 'reunion') return 4;
    const x = this.character.snapshot.x;
    return x >= 3830 ? 3 : x >= 2890 ? 2 : x >= 1050 ? 1 : 0;
  }
  get objective(): string {
    if (this.phase === 'intro') return 'O cachorrinho precisa de você!';
    if (this.phase === 'won') return 'Amigo resgatado!';
    if (this.phase === 'reunion') return 'Juntos de novo!';
    if (this.phase === 'defeated') return 'Sem corações. Recomece a aventura do início!';
    if (this.boss.hp === 0) return this.keyCollected ? 'A gaiola abriu! Vá buscar o cachorrinho.' : 'Falta a chave dourada! Volte e use o pulo duplo dos patins.';
    return [
      'Pule nos monstros e atravesse os buracos!',
      !this.barrierBroken ? 'Desafio do skate: acelere para quebrar as caixas!' : this.rampCleared ? 'Salto vencido! Siga até os patins.' : 'Desça de skate e pule na faixa dourada da rampa!',
      this.keyCollected ? 'Chave encontrada! Siga até o guardião.' : 'Desafio dos patins: pegue a chave com pulo duplo!',
      this.keyCollected ? 'Pule 3 vezes na cabeça do guardião!' : 'Pegue a chave dourada com os patins antes de resgatar o amigo!',
    ][this.stage];
  }

  reset(): void {
    this.phase = 'intro'; this.time = 0; this.introTime = 0; this.reunionTime = 0;
    this.checkpoint = 0; this.defeated = 0; this.retries = 0;
    this.health = this.maxHealth;
    this.barrierBroken = false; this.keyCollected = false; this.barrierBurst = 0;
    this.superTime = 0; this.superAwarded = false; this.pickupFlash = 0;
    this.invulnerable = 0; this.rampCleared = false; this.dogX = CAGE_X;
    this.message = 'Levaram nosso cachorrinho! Vamos buscar ele.'; this.messageTime = 0;
    this.character.reset(); this.character.setEquipment('foot');
    this.character.snapshot.invulnerable = 0;
    this.enemies = [
      this.enemy('slime-1', 'slime', 700, 48),
      this.enemy('slime-2', 'slime', 2620, 35),
      this.enemy('hopper-1', 'hopper', 2750, 65),
      this.enemy('slime-3', 'slime', 3380, 30),
      this.enemy('hopper-2', 'hopper', 3750, 40),
      this.enemy('guardian', 'boss', 4110, 110),
    ];
    this.pickups = [
      { x: 1080, y: groundAt(this.level, 1080).y - 44, equipment: 'skate', taken: false, touching: false },
      { x: 1450, y: groundAt(this.level, 1450).y - 44, equipment: 'skate', taken: false, touching: false },
      { x: 2970, y: groundAt(this.level, 2970).y - 44, equipment: 'patins', taken: false, touching: false },
    ];
    this.sparks = [
      [390, 320], [570, 267], [840, 255], [1220, 300], [1350, 244],
      [2060, 166], [2650, 316], [3200, 235], [3390, 170], [3480, 170],
      [3680, 227], [3870, 320],
    ].map(([x, y]) => ({ x, y, taken: false }));
  }

  start(): void {
    if (this.phase !== 'intro') return;
    this.phase = 'playing';
    this.say('Vamos salvar nosso amigo! Pule por cima dos monstrinhos.');
  }

  private enemy(id: string, kind: Enemy['kind'], x: number, range: number): Enemy {
    return { id, kind, x, home: x, range, y: groundAt(this.level, x).y, direction: -1, hp: kind === 'boss' ? 3 : 1, cooldown: 0 };
  }

  update(dt: number, input: InputFrame): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.time += dt;
    if (this.phase === 'intro') { this.introTime += dt; return; }
    if (this.phase === 'won' || this.phase === 'defeated') return;
    const body = this.character.snapshot;
    if (this.phase === 'reunion') {
      this.reunionTime += dt;
      this.dogX += (body.x + COMPANION_OFFSET - this.dogX) * Math.min(1, dt * 3);
      body.vx = 0; body.vy = 0; body.state = 'IDLE';
      if (this.reunionTime >= 3) this.phase = 'won';
      return;
    }
    this.messageTime = Math.max(0, this.messageTime - dt);
    this.barrierBurst = Math.max(0, this.barrierBurst - dt);
    this.superTime = Math.max(0, this.superTime - dt);
    this.pickupFlash = Math.max(0, this.pickupFlash - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    body.invulnerable = this.invulnerable;
    const previousY = body.y;
    const previousX = body.x;
    this.character.update(dt, input);
    // A fall always costs one heart, even during the grace period after a hit.
    if (body.y > this.level.height + 80) {
      this.hurt(body.x, true);
      return;
    }

    const barrierEdge = SKATE_BARRIER_X - 32;
    if (!this.barrierBroken && previousX <= barrierEdge && body.x > barrierEdge && body.y > groundAt(this.level, SKATE_BARRIER_X).y - 112) {
      if (body.equipment === 'skate' && body.grounded && body.vx >= 220) {
        this.barrierBroken = true; this.barrierBurst = 0.7;
        this.sound('break'); this.say('Boa! O skate quebrou as caixas. Agora siga até os patins!');
      } else {
        body.x = barrierEdge;
        // Skate wheels can build speed against the crates; beginners never get stuck.
        if (body.equipment !== 'skate') body.vx = 0;
        if (this.messageTime < 1) this.say('Pegue o skate e segure a direção para quebrar as caixas.');
      }
    }

    if (!this.keyCollected && body.equipment === 'patins' && this.character.usedDoubleJump
      && Math.abs(body.x - RESCUE_KEY.x) < 38 && body.y >= RESCUE_KEY.y - 16 && body.y - 100 < RESCUE_KEY.y + 18) {
      this.keyCollected = true; this.sound('key');
      this.say('Chave encontrada com o pulo duplo! Agora vença o guardião e abra a gaiola.');
    }

    for (const pickup of this.pickups) {
      const touching = Math.abs(body.x - pickup.x) < 40 && body.y >= pickup.y - 145 && body.y - 96 <= pickup.y + 20;
      if (touching && !pickup.touching && body.equipment !== pickup.equipment) {
        pickup.taken = true;
        this.character.setEquipment(pickup.equipment);
        this.pickupFlash = 0.8; this.sound('powerup');
        this.say(pickup.equipment === 'skate' ? 'Supervelocidade! Acelere para derrubar monstros e voar na rampa.' : 'Pulo duplo! Solte e aperte pular de novo no ar.');
      }
      pickup.touching = touching;
    }
    for (const spark of this.sparks) {
      if (!spark.taken && Math.abs(body.x - spark.x) < 29 && body.y >= spark.y - 15 && body.y - 94 < spark.y + 15) {
        spark.taken = true; this.sound('pickup');
      }
    }
    if (!this.superAwarded && this.sparks.length > 0 && this.collected === this.sparks.length) {
      this.superAwarded = true; this.superTime = SUPER_DURATION; this.sound('super');
      this.say('Todas as estrelas! Superbrilho: 8 segundos de proteção contra monstros!');
    }
    const ramp = this.level.skateRamp;
    if (ramp && !this.rampCleared && body.x >= ramp.landing && body.grounded && body.equipment === 'skate') {
      this.rampCleared = true; this.say('Que salto! No ar, toque duas vezes em pular para girar 360°.');
    }

    for (let i = this.checkpoint + 1; i < CHECKPOINTS.length; i++) {
      if (body.x >= CHECKPOINTS[i] && body.grounded && !gapAt(this.level, body.x)) {
        this.checkpoint = i;
        this.sound('checkpoint'); this.say('Checkpoint! Se precisar, você volta para esta bandeira.');
      }
    }

    for (const enemy of this.enemies) {
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      if (enemy.hp <= 0) continue;
      const speed = enemy.kind === 'boss' ? 54 + (3 - enemy.hp) * 13 : enemy.kind === 'hopper' ? 46 : 32;
      if (enemy.cooldown === 0) enemy.x += enemy.direction * speed * dt;
      if (enemy.x <= enemy.home - enemy.range) { enemy.x = enemy.home - enemy.range; enemy.direction = 1; }
      if (enemy.x >= enemy.home + enemy.range) { enemy.x = enemy.home + enemy.range; enemy.direction = -1; }
      enemy.y = groundAt(this.level, enemy.x).y - (enemy.kind === 'hopper' ? Math.max(0, Math.sin(this.time * 3 + enemy.home)) * 42 : 0);
      const halfWidth = enemy.kind === 'boss' ? 43 : 23;
      const height = enemy.kind === 'boss' ? 66 : 35;
      const top = enemy.y - height;
      const horizontal = Math.abs(body.x - enemy.x) < halfWidth + 15;
      const bodyContact = horizontal && body.y > top - 2 && body.y - 76 < enemy.y;
      if (this.superTime > 0 && bodyContact && enemy.cooldown === 0) {
        enemy.hp--; enemy.cooldown = 0.65; this.sound('stomp');
        if (!enemy.hp) {
          this.defeated++;
          if (enemy.kind === 'boss') this.say(this.keyCollected ? 'O guardião caiu! Vá buscar nosso amigo!' : 'Guardião vencido! Volte para buscar a chave.');
        }
        continue;
      }
      const stomping = horizontal && body.vy > 0 && previousY <= top + 14 && body.y >= top - 2;
      if (stomping && enemy.cooldown === 0) {
        enemy.hp--; enemy.cooldown = 0.85;
        body.y = top - 2; this.character.bounce(440); this.sound('stomp');
        if (!enemy.hp) {
          this.defeated++;
          if (enemy.kind === 'boss') { this.say(this.keyCollected ? 'Você conseguiu! A gaiola abriu. Vá até seu amigo!' : 'Guardião vencido! Falta pegar a chave dourada com os patins.'); this.sound('win'); }
        } else this.say(`Boa! Faltam ${enemy.hp} ${enemy.hp === 1 ? 'pulo' : 'pulos'} na cabeça!`);
      } else if (horizontal && body.y > top + 5 && body.y - 76 < enemy.y && enemy.cooldown === 0) {
        if (enemy.kind !== 'boss' && body.equipment === 'skate' && body.grounded && Math.abs(body.vx) > 250) {
          enemy.hp = 0; enemy.cooldown = 0.6; this.defeated++; this.sound('stomp');
        } else if (this.invulnerable === 0 && this.superTime === 0) {
          this.hurt(enemy.x);
          break;
        }
      }
    }
    if (this.phase !== 'playing') return;
    if (this.boss.hp === 0 && this.keyCollected && Math.abs(body.x - CAGE_X) < 90 && body.grounded) {
      this.phase = 'reunion'; this.reunionTime = 0;
      this.superTime = 0;
      this.character.setEquipment('foot');
      this.say('Juntos de novo!'); this.sound('rescue');
    }
  }

  retryCheckpoint(): void {
    if (this.phase !== 'defeated') return;
    this.reset();
    this.start();
    this.say('Cinco corações! Vamos recomeçar a aventura do início.');
  }

  private returnToCheckpoint(): void {
    this.superTime = 0; this.pickupFlash = 0;
    this.retries++;
    const x = CHECKPOINTS[this.checkpoint];
    this.character.reset({ x, y: groundAt(this.level, x).y });
    this.character.setEquipment('foot');
    this.enemies = this.enemies.map(enemy => enemy.home > x ? this.enemy(enemy.id, enemy.kind, enemy.home, enemy.range) : enemy);
    for (const pickup of this.pickups) pickup.touching = false;
    this.invulnerable = 1.8;
    this.character.snapshot.invulnerable = this.invulnerable;
  }

  private hurt(enemyX: number, falling = false): void {
    if (falling) this.superTime = 0;
    const body = this.character.snapshot;
    this.sound('hurt');
    this.health = Math.max(0, this.health - 1);
    const hadPower = body.equipment !== 'foot';
    this.character.setEquipment('foot');
    if (this.health === 0) {
      this.phase = 'defeated'; body.vx = 0; body.vy = 0;
      this.say('Os cinco corações acabaram. A próxima tentativa começa do início.');
    } else if (falling) {
      this.returnToCheckpoint();
      this.say('Menos um coração! Você voltou a pé. Pegue skate ou patins novamente.');
    } else {
      this.character.bounce(280); body.vx = body.x < enemyX ? -160 : 160;
      this.say(hadPower ? 'Menos um coração! Seu poder continua disponível no ponto de coleta.' : 'Menos um coração! Acerte a cabeça do monstro por cima.');
    }
    this.invulnerable = 1.8; body.invulnerable = this.invulnerable;
  }

  private say(text: string) { this.message = text; this.messageTime = 4.5; }
}
