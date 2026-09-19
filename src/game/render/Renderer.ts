import { drawTerrain } from './TerrainArt';
import { drawCharacter } from '../character/Animation';
import type { CharacterId } from '../character/characters';
import { gapAt, groundAt } from '../level/Level';
import type { CameraSnapshot, CharacterSnapshot, LevelData } from '../types';
import { artAssets } from './ArtAssets';
import { AdventureArt } from './AdventureArt';
import { drawPowerAura } from './ItemArt';
import type { Adventure } from '../adventure/Adventure';

const C = {
  ink: '#243148', cloud: '#fffdf2', cloudShade: '#bedaff',
  grass: '#80ae61', grassLight: '#c5dfa0', grassDark: '#416c4e',
  soil: '#9463bc', soilLight: '#c486d1', soilShade: '#654078',
  leaf: '#44b743', leafLight: '#a0e844', leafDark: '#176b53',
};

/** Scenery is decoration only; all skateable surfaces come from LevelData. */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly adventureArt: AdventureArt;
  // MediaQueryList.matches stays current when the system preference changes.
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  constructor(private readonly canvas: HTMLCanvasElement, private readonly level: LevelData) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Seu navegador não oferece suporte ao Canvas 2D.');
    this.ctx = ctx;
    this.adventureArt = new AdventureArt(ctx);
  }

  private rect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
  }

  private polygon(points: number[][], color: string): void {
    const c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    points.forEach(([x, y], i) => i === 0 ? c.moveTo(Math.round(x), Math.round(y)) : c.lineTo(Math.round(x), Math.round(y)));
    c.closePath(); c.fill();
  }

  private cloud(x: number, y: number, scale = 1): void {
    const r = (dx: number, dy: number, w: number, h: number, color: string) => this.rect(x + dx * scale, y + dy * scale, w * scale, h * scale, color);
    r(0, 18, 100, 13, C.cloudShade); r(10, 10, 75, 18, C.cloudShade);
    r(22, 0, 30, 26, C.cloudShade); r(31, -6, 16, 12, C.cloudShade);
    r(61, 4, 18, 24, C.cloudShade);
    r(0, 16, 97, 11, C.cloud); r(11, 8, 72, 16, C.cloud);
    r(22, -2, 30, 24, C.cloud); r(31, -8, 16, 14, C.cloud);
    r(61, 2, 18, 22, C.cloud);
    r(19, 21, 12, 6, '#ebf6de'); r(56, 16, 9, 11, '#ebf6de');
  }

  private star(x: number, y: number, scale = 1, color = '#fff0a7'): void {
    this.polygon([[x,y-10*scale],[x+3*scale,y-3*scale],[x+10*scale,y-3*scale],[x+6*scale,y+2*scale],[x+7*scale,y+9*scale],[x,y+5*scale],[x-7*scale,y+9*scale],[x-6*scale,y+2*scale],[x-10*scale,y-3*scale],[x-3*scale,y-3*scale]], color);
    this.rect(x-2*scale,y-6*scale,2*scale,4*scale,'#fff9d6');
  }

  private heart(x: number, y: number, scale: number, color: string): void {
    const rows = ['0110110','1111111','1111111','0111110','0011100','0001000'];
    rows.forEach((row, j) => [...row].forEach((pixel, i) => {
      if (pixel === '1') this.rect(x + i * scale, y + j * scale, scale, scale, color);
    }));
  }

  private sky(camera: CameraSnapshot, time: number): void {
    const { width, height } = camera;
    const background = artAssets.background;
    if (background?.complete && background.naturalWidth > 0) {
      // Crop the panorama without stretching its painted trees and houses.
      // The shoreline stays just above the playable ground in every viewport.
      const tileWidth = Math.max(960, width);
      const tileHeight = Math.min(384, height);
      const mobileFraming = tileWidth - width;
      const offset = Math.round(camera.x * 0.18 + mobileFraming);
      const first = Math.floor(offset / tileWidth);
      const sourceHeight = Math.min(background.naturalHeight, background.naturalWidth * tileHeight / tileWidth);
      const sourceY = Math.min(background.naturalHeight - sourceHeight, background.naturalHeight * 0.20);
      this.rect(0, tileHeight, width, Math.max(0, height - tileHeight), '#88c7c4');
      // Alternating reflections make either edge meet itself without a seam.
      for (let tile = first; tile <= first + Math.ceil(width / tileWidth) + 1; tile++) {
        const x = tile * tileWidth - offset;
        this.ctx.save();
        this.ctx.translate(x + (tile % 2 ? tileWidth : 0), 0);
        if (tile % 2) this.ctx.scale(-1, 1);
        this.ctx.drawImage(background, 0, sourceY, background.naturalWidth, sourceHeight, 0, 0, tileWidth, tileHeight);
        this.ctx.restore();
      }
      return;
    }
    const bands = ['#249bef','#2da9f6','#40b9f8','#5cc9f5','#80dcf4'];
    bands.forEach((color, i) => this.rect(0, i * 70, width, 72, color));
    this.rect(0, 350, width, Math.max(0, height - 350), '#24b3d5');

    // A calm, happy sun with a stepped silhouette and tiny rays.
    const sx = width - 144 - camera.x * 0.025, sy = 85;
    for (const [dx, dy, w, h] of [[-5,-61,8,15],[43,-43,8,10],[57,-5,14,8],[43,37,8,10],[-5,51,8,15],[-47,37,8,10],[-64,-5,14,8],[-47,-43,8,10]]) {
      this.rect(sx+dx, sy+dy, w, h, '#ffec4d');
    }
    this.rect(sx-27,sy-42,54,84,'#f6b82f'); this.rect(sx-42,sy-27,84,54,'#f6b82f');
    this.rect(sx-34,sy-35,68,70,'#f6b82f');
    this.rect(sx-26,sy-39,52,77,'#ffe655'); this.rect(sx-39,sy-25,78,51,'#ffe655');
    this.rect(sx-33,sy-32,66,65,'#ffe655'); this.rect(sx-25,sy-35,44,7,'#fff391');
    this.rect(sx-18,sy-5,4,7,'#85755c'); this.rect(sx-14,sy-9,7,4,'#85755c'); this.rect(sx-7,sy-5,3,5,'#85755c');
    this.rect(sx+8,sy-5,4,7,'#85755c'); this.rect(sx+12,sy-9,7,4,'#85755c'); this.rect(sx+19,sy-5,3,5,'#85755c');
    this.rect(sx-5,sy+12,17,3,'#a88763'); this.rect(sx-8,sy+8,4,5,'#a88763'); this.rect(sx+11,sy+8,4,5,'#a88763');
    this.rect(sx-27,sy+6,12,6,'#efb5a1'); this.rect(sx+20,sy+6,12,6,'#efb5a1');

    for (let i = -1; i < 5; i++) {
      const x = i * 304 + 90 - (camera.x * 0.09 % 304);
      this.cloud(x, 81 + ((i+4) % 3)*38, i % 2 === 0 ? 0.95 : 0.66);
    }
    // Far islands and an airy pastel city are lower contrast than the playfield.
    for (let i = -1; i < 8; i++) {
      const x = i * 183 - (camera.x * 0.17 % 183);
      const top = 213 + ((i+12)*17 % 46);
      this.polygon([[x-30,304],[x-30,top+25],[x,top+25],[x,top+9],[x+30,top+9],[x+30,top],[x+70,top],[x+70,top+10],[x+100,top+10],[x+100,top+29],[x+133,top+29],[x+133,304]],'#76c9d7');
    }
    for (let i = -1; i < 17; i++) {
      const x = i * 78 - (camera.x * 0.24 % 78);
      const n = (i + 99) % 7, h = 49 + (n * 29 % 86);
      const colors = ['#7e91de','#83b2e4','#bf8dd9','#60b8cf','#efa6c9','#b1a3ea','#77d0d1'];
      this.rect(x, 307-h, 39, h, colors[n]);
      this.rect(x+7, 301-h, 26, 6, colors[n]);
      for (let wy = 315-h; wy < 297; wy += 18) {
        this.rect(x+8,wy,5,8,'#bedcf5'); this.rect(x+25,wy,5,8,'#f7ccbb');
      }
    }
    // Lake, islands, and small horizontal pixel glints.
    this.rect(0, 305, width, 103, '#249ee7');
    this.rect(0, 305, width, 4, '#a9f0ef');
    for (let i = 0; i < 35; i++) {
      const x = ((i * 83 + Math.floor(time * 3)) % (width + 40)) - 20;
      const y = 318 + (i * 17 % 79);
      this.rect(x,y,15 + (i%4)*9,2,i%3 === 0 ? '#d2ffff' : '#63d9f5');
    }
    // Far-shore trees have a deliberately softer palette.
    for (let i = -1; i < 8; i++) {
      const x = i*168 + 42 - (camera.x*0.32 % 168);
      this.rect(x+15,271,4,35,'#499b93');
      this.rect(x,259,34,21,'#44b591'); this.rect(x+7,252,20,32,'#44b591');
      this.rect(x+6,258,15,9,'#8adb8f');
    }
    const boatX = 343 - (camera.x*0.19 % 1300);
    this.rect(boatX,324,32,4,'#d896ab'); this.rect(boatX+5,328,23,3,'#bba0b5');
    this.rect(boatX+17,293,2,31,'#aaabae');
    this.polygon([[boatX+15,295],[boatX+15,321],[boatX-1,321]],'#fff2d9');
    this.polygon([[boatX+21,301],[boatX+21,321],[boatX+34,321]],'#e7ead8');
  }

  private tree(x: number, y: number, scale = 1, pink = false): void {
    const c = this.ctx;
    c.save(); c.translate(Math.round(x),Math.round(y)); c.scale(scale,scale);
    const colors = pink
      ? ['#723669','#bc478c','#e46fa8','#ffa1c1','#ffd0cf']
      : ['#124d4b',C.leafDark,C.leaf,C.leafLight,'#d1ef58'];
    this.rect(-10,-128,21,128,'#433648'); this.rect(-7,-125,14,125,'#93634e');
    this.rect(-6,-123,5,121,'#d7985d'); this.rect(4,-117,4,114,'#71414a');
    for(let i=0;i<12;i++) {
      this.rect(-6+(i%3)*2,-117+i*10,6,3,'#78404b');
      this.rect(-5,-113+i*10,3,2,'#e6aa67');
    }
    this.rect(-18,-95,15,8,'#543847'); this.rect(-22,-114,8,24,'#543847');
    this.rect(4,-87,20,8,'#543847'); this.rect(18,-111,8,28,'#543847');
    // Overlapping stepped clusters build a leafy silhouette, then small tiles
    // supply the dappled highlights characteristic of a 16-bit background.
    const clusters=[[-21,-156,27], [7,-163,27], [-41,-135,25], [32,-136,25], [-10,-132,32], [10,-109,26], [-29,-108,24], [41,-111,18]];
    clusters.forEach(([cx,cy,size], cluster) => {
      this.rect(cx-size,cy-size+8,size*2,size*2-16,colors[0]);
      this.rect(cx-size+8,cy-size,size*2-16,size*2,colors[0]);
      this.rect(cx-size+3,cy-size+9,size*2-6,size*2-19,colors[1]);
      this.rect(cx-size+9,cy-size+3,size*2-18,size*2-6,colors[1]);
      this.rect(cx-size+6,cy-size+9,size*2-15,size*2-23,colors[2]);
      this.rect(cx-size+11,cy-size+3,size*2-25,size*2-14,colors[2]);
      for(let i=0;i<18;i++) {
        const dx=((i*13+cluster*5)%(size*2-12))-size+5;
        const dy=((i*19+cluster*7)%(size*2-17))-size+5;
        const tint = (i+cluster)%5===0 ? colors[4] : dy<0 ? colors[3] : colors[2];
        this.rect(cx+dx,cy+dy,4+(i%3)*2,4+(i%2)*2,tint);
        if(i%4===0) this.rect(cx+dx+3,cy+dy+5,4,3,colors[1]);
      }
    });
    this.rect(-19,-4,34,4,'#247348'); this.rect(-15,-8,7,5,'#78c93c');
    c.restore();
  }

  private palm(x: number, y: number, scale = 1): void {
    const c=this.ctx;
    c.save(); c.translate(Math.round(x),Math.round(y)); c.scale(scale,scale);
    for(let i=0;i<17;i++) {
      const bend=Math.round(Math.sin(i/22)*12);
      this.rect(bend-5,-i*7-7,12,9,'#414544');
      this.rect(bend-3,-i*7-7,8,7,'#b99148');
      this.rect(bend-3,-i*7-7,3,5,'#e8ba5a');
      this.rect(bend+2,-i*7-5,4,3,'#7b7450');
    }
    const fronds=[[-67,-10],[-56,-34],[-31,-48],[14,-45],[50,-31],[69,-3],[-47,19],[48,20]];
    fronds.forEach(([ex,ey],index)=>{
      for(let step=0;step<12;step++) {
        const t=step/11;
        const px=9+Math.round(ex*t), py=-117+Math.round(ey*t+Math.sin(t*Math.PI)*-12+t*t*19);
        const size=Math.max(3,11-Math.floor(t*7));
        this.rect(px-size/2,py,size+3,size+5,'#176c58');
        this.rect(px-size/2,py-1,size+1,size,index%2===0 ? '#48b83e' : '#65c83b');
        this.rect(px-size/2,py-2,Math.max(2,size-2),3,index<4 ? '#b4e63e' : '#8ed33b');
        if(step%3===0) this.rect(px+2,py+size-2,3,6,'#126b59');
      }
    });
    this.rect(3,-120,11,9,'#725b36'); this.rect(5,-121,4,4,'#cca346');
    this.rect(11,-114,7,7,'#896235');
    c.restore();
  }

  private flower(x: number, y: number, pink = true, scale = 1): void {
    const petal = pink ? '#ff78bc' : '#ffdb49';
    this.rect(x,y-10*scale,2*scale,10*scale,'#176b4c');
    this.rect(x+2*scale,y-5*scale,4*scale,3*scale,'#70cf35');
    this.rect(x-4*scale,y-3*scale,4*scale,2*scale,'#b7e84a');
    this.rect(x-3*scale,y-12*scale,8*scale,4*scale,petal);
    this.rect(x-scale,y-14*scale,4*scale,8*scale,petal);
    this.rect(x-2*scale,y-13*scale,3*scale,2*scale,pink ? '#ffb9d0' : '#fff29a');
    this.rect(x,y-11*scale,2*scale,2*scale,'#fff3b7');
    this.rect(x,y-8*scale,2*scale,scale,pink ? '#d641a0' : '#e78a33');
  }

  private fence(x: number, y: number, width: number): void {
    this.rect(x,y-34,width,7,'#583b47'); this.rect(x,y-33,width,4,'#c8894f'); this.rect(x,y-33,width,2,'#ffe0a1');
    this.rect(x,y-16,width,6,'#583b47'); this.rect(x,y-15,width,3,'#d5a16a');
    for(let px=x;px<=x+width;px+=30) {
      this.rect(px,y-45,8,45,'#513b48'); this.rect(px+2,y-44,5,44,'#cd9257');
      this.rect(px+2,y-44,2,42,'#ffe0a1'); this.rect(px+3,y-31,2,2,'#84697d');
      this.rect(px+5,y-25,2,8,'#a26146');
    }
  }

  private sign(x: number, y: number, direction = 1): void {
    this.rect(x-5,y-67,11,67,'#443045'); this.rect(x-3,y-65,7,65,'#b97543');
    this.rect(x-2,y-61,3,59,'#e9a565'); this.rect(x+1,y-26,2,12,'#86483c');
    this.rect(x-34,y-91,70,47,'#392b45'); this.rect(x-32,y-89,66,43,'#8c503c');
    this.rect(x-31,y-87,63,38,'#e8a664'); this.rect(x-30,y-86,61,5,'#ffd28b');
    this.rect(x-30,y-70,61,2,'#b87348'); this.rect(x-29,y-51,60,3,'#c98454');
    this.rect(x-26,y-80,12,2,'#f8c885'); this.rect(x+12,y-56,16,2,'#f8c885');
    for(const bx of [-25,25]) for(const by of [-82,-56]) {
      this.rect(x+bx,y+by,4,4,'#4b475c'); this.rect(x+bx,y+by,2,2,'#bfc9d1');
    }
    this.ctx.save(); this.ctx.translate(x,y-67); this.ctx.scale(direction,1);
    this.rect(-20,-6,29,13,'#733159');
    this.polygon([[5,-17],[24,0],[5,18]],'#733159');
    this.rect(-18,-4,28,9,'#f03ca5');
    this.polygon([[8,-13],[20,0],[8,13]],'#ff58b8');
    this.rect(-17,-4,25,3,'#ff9bd8'); this.rect(-17,-1,3,5,'#ffaedb');
    this.ctx.restore();
  }

  private cat(x: number, y: number, time: number): void {
    this.rect(x-15,y-5,30,5,'#287155');
    this.rect(x-13,y-20,26,17,'#2f2c40'); this.rect(x-9,y-30,21,16,'#2f2c40');
    this.rect(x-11,y-18,21,13,'#696a85'); this.rect(x-7,y-28,17,13,'#696a85');
    this.polygon([[x-9,y-27],[x-10,y-39],[x,y-31]],'#2f2c40');
    this.polygon([[x+2,y-31],[x+12,y-38],[x+12,y-26]],'#2f2c40');
    this.rect(x-7,y-33,3,5,'#ff8eb3'); this.rect(x+7,y-33,3,5,'#ff8eb3');
    this.rect(x-3,y-29,5,6,'#a5a4bb');
    this.rect(x-7,y-23,15,9,'#fff7e7'); this.rect(x-4,y-16,12,11,'#fff7e7');
    this.rect(x-6,y-10,4,6,'#cad4dc'); this.rect(x+7,y-13,2,8,'#c1bdcb');
    this.rect(x-7,y-5,6,3,'#fff7e7'); this.rect(x+5,y-5,6,3,'#fff7e7');
    this.rect(x-5,y-25,3,3,'#29263a'); this.rect(x+5,y-25,3,3,'#29263a');
    this.rect(x-5,y-25,1,1,'#fffdf4'); this.rect(x+5,y-25,1,1,'#fffdf4');
    this.rect(x,y-21,3,2,'#f389a6'); this.rect(x-2,y-18,6,1,'#524455');
    this.rect(x-11,y-21,5,1,'#cad4dc'); this.rect(x+8,y-21,5,1,'#cad4dc');
    const sway = Math.round(Math.sin(time*2)*2);
    this.rect(x+12,y-14,8,5,'#2f2c40'); this.rect(x+17,y-22+sway,5,11-sway,'#2f2c40');
    this.rect(x+17,y-21+sway,3,8-sway,'#696a85');
    this.rect(x+17,y-25+sway,5,5,'#f5eddd');
  }

  private decorations(camera: CameraSnapshot, time: number): void {
    this.fence(18,368,235);
    // Large trees and foliage are now part of the illustrated panorama.
    this.sign(330,370);
    this.sign(2730,370);
    this.cat(748,groundAt(this.level,748).y,time);
    this.cat(2380,groundAt(this.level,2380).y,time+2);

    // Bunting belongs to the little park, beyond the skateable surface.
    const bx=496, by=207;
    this.rect(bx,by,4,109,'#553b5c'); this.rect(bx+1,by,2,109,'#a88ca7');
    this.rect(bx+203,by+6,4,103,'#553b5c'); this.rect(bx+204,by+6,2,103,'#a88ca7');
    for(let i=0;i<101;i++) this.rect(bx+i*2,by+Math.round(Math.sin(i/100*Math.PI)*15),3,2,'#534b72');
    for(let i=0;i<7;i++) {
      const x=bx+10+i*28, y=by+Math.round(Math.sin((x-bx)/200*Math.PI)*15);
      this.polygon([[x,y],[x+18,y+2],[x+9,y+19]],['#fb62b3','#ffe05b','#39d6ba'][i%3]);
      this.rect(x+3,y+3,9,3,['#ffb5d5','#fff3a4','#a1f1d4'][i%3]);
    }
    this.star(397,205,0.75,'#ffeb53'); this.star(675,144,0.55,'#fff18e');
    this.heart(454,148,2,'#ff89bb');
    for (const x of [39,53,69,84,91,238,251,259,278,288,302,362,372,386,391,484,507,522,536,681,687,706,721,805,817,832,854,879,894,925,1134,1176,1375,1510,1750,2121,2182,2420,2581,2610]) {
      if (gapAt(this.level, x)) continue;
      if(x < camera.x-20 || x > camera.x+camera.width+20) continue;
      const y=groundAt(this.level,x).y;
      this.flower(x,y-2,x%3!==0,x%2===0 ? 1.25 : 1);
      this.rect(x+7,y-6,2,6,'#1c9b4e'); this.rect(x+10,y-9,2,9,'#a5de3d');
      this.rect(x+11,y-4,4,3,'#63bf35'); this.rect(x-6,y-5,5,3,'#80d43c');
    }
  }

  private graffiti(x: number, y: number, star: boolean): void {
    const rows=star ? [
      '.......#.......','......###......','......###......','.....#####.....',
      '###############','.#############.', '..###########..','...#########...',
      '...#########...','..###########..','..#####.#####..','..###.....###..','..#.........#..',
    ] : ['.##.##.','#######','#######','.#####.','..###..','...#...'];
    const size=star ? 3 : 6;
    const left=x-rows[0].length*size/2;
    rows.forEach((row,j)=>[...row].forEach((pixel,i)=>{
      if(pixel!=='#') return;
      this.rect(left+i*size-3,y+j*size-3,size+6,size+6,star ? '#6355c4' : '#814aaa');
    }));
    rows.forEach((row,j)=>[...row].forEach((pixel,i)=>{
      if(pixel!=='#') return;
      this.rect(left+i*size,y+j*size,size,size,star ? (j<6 ? '#ffdd41' : '#ffc638') : (j<3 ? '#ff6eba' : '#ef4dac'));
      if((i*7+j*11)%13===0) this.rect(left+i*size,y+j*size,2,2,star ? '#ffef78' : '#ff95ca');
    }));
    if(star) {
      this.rect(x-7,y+18,3,7,'#6155b8'); this.rect(x+4,y+18,3,7,'#6155b8');
      this.rect(x-4,y+29,10,3,'#6155b8'); this.rect(x-7,y+26,3,3,'#6155b8');
    }
    for(let i=0;i<8;i++) this.rect(x-35+(i*23%71),y-5+(i*19%53),2+(i%2),3,i%2 ? '#ed76bf' : '#6ea7ec');
  }

  private terrain(camera: CameraSnapshot): void {
    drawTerrain(this.ctx, this.level, camera);
  }

  render(character: CharacterSnapshot, camera: CameraSnapshot, time: number, characterId: CharacterId = 'nana', adventure?: Adventure): void {
    const c=this.ctx;
    const reduceMotion=this.reducedMotion.matches;
    const ambientTime=reduceMotion ? 0 : time;
    c.setTransform(this.canvas.width/camera.width,0,0,this.canvas.height/camera.height,0,0);
    c.imageSmoothingEnabled=true;
    c.imageSmoothingQuality='high';
    this.sky(reduceMotion ? { ...camera, x: 0 } : camera,ambientTime);
    c.save();
    c.translate(-Math.round(camera.x),-Math.round(camera.y));
    this.decorations(camera,ambientTime);
    this.terrain(camera);
    if (adventure) this.adventureArt.render(adventure, ambientTime);
    // A compact stepped shadow anchors the skater without a blurry ellipse.
    const ground=groundAt(this.level,character.x).y;
    const shadowY=character.grounded ? character.y : ground;
    const shadowWidth=Math.max(12,31-Math.max(0,shadowY-character.y)*0.08);
    c.globalAlpha=character.grounded || !gapAt(this.level, character.x) ? 0.16 : 0;
    this.rect(character.x-shadowWidth/2,shadowY+1,shadowWidth,4,'#405a60');
    this.rect(character.x-shadowWidth/2+4,shadowY+5,shadowWidth-8,2,'#405a60');
    c.globalAlpha=1;
    const powered = (adventure?.superTime ?? 0) > 0;
    if (powered || (adventure?.pickupFlash ?? 0) > 0) drawPowerAura(c, character.x, character.y, ambientTime, reduceMotion, !powered);
    c.save();
    if (powered) { c.shadowColor = '#ffe58a'; c.shadowBlur = 16; }
    // Freeze idle bob, ponytail sway and blinking; movement/state poses stay live.
    if (character.invulnerable) c.globalAlpha = 0.65;
    drawCharacter(c,character,ambientTime,characterId, adventure?.phase === 'won' || adventure?.phase === 'reunion', adventure?.character.usedDoubleJump);
    c.restore();
    c.globalAlpha = 1;
    if(!reduceMotion && character.state==='LAND' && character.stateTime<0.14) {
      const spread=character.stateTime*95;
      this.rect(character.x-20-spread,character.y-4,5,3,'#f3eccb');
      this.rect(character.x+17+spread,character.y-4,5,3,'#f3eccb');
    }
    c.restore();
  }
}
