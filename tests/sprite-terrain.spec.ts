import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/'); await page.locator('#art-loading').waitFor({ state: 'hidden' });
});

test('sprites that cross grid boundaries keep their entire silhouette and exclude neighboring poses', async ({ page }) => {
  const results = await page.evaluate(async () => {
    const path = '/src/game/render/SpriteAtlas.ts';
    const { isolateSpriteAtlas } = await import(/* @vite-ignore */ path);
    const source = document.createElement('canvas'); source.width = 400; source.height = 400;
    const c = source.getContext('2d')!;
    for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
      c.fillStyle = `rgb(${40 + (row * 4 + col) * 25}, 80, 120)`;
      c.fillRect(col * 100 + (col === 1 ? -20 : 10), row * 200 + 30, 50, 100);
    }
    const atlas = isolateSpriteAtlas(source, 2), ctx = atlas.getContext('2d')!;
    return Array.from({ length: 8 }, (_, i) => {
      const data = ctx.getImageData(i % 4 * 384, Math.floor(i / 4) * 512, 384, 512).data;
      let minX = 384, maxX = 0, minY = 512, maxY = 0;
      const colors = new Set<number>();
      for (let y = 0; y < 512; y++) for (let x = 0; x < 384; x++) {
        const p = (y * 384 + x) * 4; if (data[p + 3] < 200) continue;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        colors.add(data[p]);
      }
      return { ratio: (maxX - minX + 1) / (maxY - minY + 1), colors: [...colors], minX, maxX, minY, maxY };
    });
  });
  results.forEach((r, index) => {
    expect(r.ratio).toBeCloseTo(0.5, 2);
    expect(r.colors).toEqual([40 + index * 25]);
    expect(r.minX).toBeGreaterThanOrEqual(31); expect(r.maxX).toBeLessThan(353);
    expect(r.minY).toBeGreaterThanOrEqual(31); expect(r.maxY).toBeLessThan(481);
  });
});

test('both somersault sheets have transparent gutters and consistent character sizes', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const artPath = '/src/game/render/ArtAssets.ts', drawPath = '/src/game/character/Animation.ts';
    const { artAssets, loadArtAssets } = await import(/* @vite-ignore */ artPath);
    const { drawCharacter } = await import(/* @vite-ignore */ drawPath);
    await loadArtAssets();
    const margins = ['nanaFlip','nunuFlip'].map(key => {
      const atlas = artAssets[key] as HTMLCanvasElement, c = atlas.getContext('2d')!;
      const data = c.getImageData(0,0,atlas.width,atlas.height).data;
      let leaks = 0;
      for (let y=0;y<atlas.height;y++) for(let x=0;x<atlas.width;x++) {
        if ((x%384<24 || x%384>=360 || y%512<24 || y%512>=488) && data[(y*atlas.width+x)*4+3]>8) leaks++;
      }
      return {key,leaks};
    });
    const canvas = document.createElement('canvas');canvas.width=256;canvas.height=256;
    const c=canvas.getContext('2d')!;
    const heights = ['nana','nunu'].map(id => {
      c.clearRect(0,0,256,256);
      drawCharacter(c,{x:128,y:220,vx:0,vy:0,facing:1,grounded:true,state:'IDLE',stateTime:0,groundAngle:0,equipment:'foot'},0,id);
      const data=c.getImageData(0,0,256,256).data;
      let minY=256,maxY=0;
      for(let y=0;y<256;y++) for(let x=0;x<256;x++) if(data[(y*256+x)*4+3]>128){minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
      return maxY-minY+1;
    });
    return {margins,heights};
  });
  for (const entry of result.margins) expect(entry.leaks,entry.key).toBe(0);
  for (const height of result.heights) { expect(height).toBeGreaterThan(125); expect(height).toBeLessThanOrEqual(140); }
  expect(Math.abs(result.heights[0] - result.heights[1])).toBeLessThan(8);
});

test('earth texture covers slopes and floating platforms, remains fixed while scrolling and leaves holes open', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const terrainPath='/src/game/render/TerrainArt.ts', levelPath='/src/game/level/Level.ts', artPath='/src/game/render/ArtAssets.ts';
    const [{drawTerrain},{RESCUE_LEVEL},{loadArtAssets}] = await Promise.all([
      import(/* @vite-ignore */ terrainPath),import(/* @vite-ignore */ levelPath),import(/* @vite-ignore */ artPath)]);
    await loadArtAssets();
    const canvas=document.createElement('canvas');canvas.width=4600;canvas.height=680;const c=canvas.getContext('2d')!;
    const render=(x:number,width:number)=>{c.clearRect(0,0,4600,680);drawTerrain(c,RESCUE_LEVEL,{x,y:0,width,height:680});};
    render(0,4600);
    const colors=(x:number,y:number,w:number,h:number)=>{
      const d=c.getImageData(x,y,w,h).data;const values=new Set<string>();
      for(let i=0;i<d.length;i+=4)values.add(`${d[i]},${d[i+1]},${d[i+2]}`);
      return values.size;
    };
    const detail=[colors(1500,400,30,20),colors(845,317,120,12),colors(3400,233,130,12)];
    const holeAlpha=c.getImageData(1980,300,1,1).data[3];
    render(1200,1000);const before=Array.from(c.getImageData(1370,315,420,210).data);
    render(1240,1000);const after=Array.from(c.getImageData(1370,315,420,210).data);
    let changed=0, maxDelta=0;
    for(let i=0;i<before.length;i++)if(before[i]!==after[i]) {
      changed++;maxDelta=Math.max(maxDelta,Math.abs(before[i]-after[i]));
    }
    return {detail,holeAlpha,changed,maxDelta};
  });
  for(const colors of result.detail)expect(colors).toBeGreaterThan(150);
  expect(result.holeAlpha).toBe(0);
  // Canvas can round a blended channel by one level when the clipped path length
  // changes. Allow only that rounding, never a shifted grass blade or soil texel.
  expect(result.maxDelta,JSON.stringify(result)).toBeLessThanOrEqual(1);
  expect(result.changed).toBeLessThan(16);
});
