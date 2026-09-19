# Jardim ilustrado e desafios dos poderes

Artes criadas/editadas com a ferramenta integrada Imagegen. As versões anteriores foram mantidas. Assets finais em `public/art/`: `monsters-v2.png`, `puppy-v2.png` e `dream-garden-v2.png`.

- Monstros: mesmas três espécies e 12 poses, agora com sobrancelhas fechadas, dentes e expressões hostis. Grade e extração iguais à versão anterior.
- Cachorro: quatro poses em grade 2×2, 1536×1024: preocupado, feliz, corrida A e corrida B. Poses alinhadas pelos pixels dos pés e animadas no resgate; altura máxima de 70 unidades de mundo.
- Cenário: jardim ilustrado com lago, vila e montanhas suaves. O renderizador recorta a imagem preservando proporções, usa paralaxe e espelha as bordas dos painéis. A paleta das plataformas foi suavizada para acompanhar a nova arte.
- Tela: largura máxima de 1680 px, margens menores e Canvas 16:9 no desktop; adaptações de toque preservadas no celular.

## Desafios fáceis

1. **Skate — caixas**: barreira em x=1250, depois do poder e do checkpoint. Acelerar com skate a 220 px/s quebra as caixas. Encostar sem o poder não tira vida; o skate pode ganhar velocidade pressionado contra as caixas para evitar travar um iniciante.
2. **Patins — chave**: chave em x=2250, y=180, sobre chão seguro, depois do checkpoint dos patins. É preciso soltar e apertar pulo de novo no ar, usando patins, e tocar a região da chave. Ela abre a gaiola após derrotar o guardião. Uma zona generosa de coleta evita exigir precisão excessiva.
3. Caixas e chave ficam concluídas após cair ou tentar de novo. Reiniciar a aventura limpa os desafios. Cinco buracos e avisos nas bordas; inimigos afastados da região da chave e da chegada do último buraco.

## Prompts usados

### Monstros: monsters-v2.png

```text
Edit this exact 1536x1024 monster sprite atlas. Change ONLY the monsters' facial expressions to look like naughty angry villains, clearly hostile rather than friendly. In the first THREE columns of ALL three rows use thick eyebrows angled sharply downward toward the nose, narrowed determined eyes, snarling mouths with one or two small ivory fangs, no happy smiles, no pink blush. Fourth column retains hurt/dizzy expression but looks like an angry villain being defeated. Keep the SAME three monster species, turquoise slime, coral floppy-eared hopper, purple crowned guardian; identical bodies, shapes, positions, frame sizes, poses, 4 columns and 3 rows. Keep EVERY background pixel perfectly flat bright GREEN #00FF00 as in input, including around edges and between sprites. No shadows on background, no glow, no objects added, no text. Preserve existing illustrated sprite style and clear dark outlines. Family-friendly platformer antagonists, expressive and grumpy, no gore.
```

### Cachorro: puppy-v2.png

```text
Use case: stylized-concept. Create a production sprite atlas for a cute puppy rescued in a 2D side-scrolling game. Reference image is STYLE ONLY: match its richly shaded cartoon sprite illustration, clean deep aubergine outlines, expressive round eyes and warm highlights; do NOT draw any girl. Landscape canvas 1536x1024, strict TWO columns and TWO rows, FOUR frames of exactly the SAME small caramel and cream puppy with floppy chocolate ears, fluffy cream muzzle and chest, little paws, big dark expressive eyes, dark shiny nose, purple collar with gold round tag. First row left: seated worried puppy, ears down, mouth small, looking right. First row right: happy seated puppy, tongue out, tail raised, looking right. Second row left: running right, left paws forward, happy. Second row right: running right, opposite paws forward, happy. Keep each entire dog centered in its 768x512 cell, paws around y440 within cell, puppy height 340 pixels including ears, tail entirely in cell. No props, no stars, no ground, no lettering, no grid. Use perfectly flat solid BRIGHT GREEN #00FF00 chroma-key background everywhere outside the four puppies, no gradient or shadow on background. Green is background only. Generous empty gutters. This is game art that must visibly match the reference girl's smooth detailed sprite style.
```

### Correção do fundo do cachorro

```text
Remove the dark colored background completely and replace it with ONE perfectly flat solid BRIGHT GREEN #00FF00 chroma-key background. Every empty pixel between and around the FOUR puppies must be bright green. No shadows, no gradients, no glow, no black or brown backdrop. Preserve all four puppies exactly, their colors, expressions, outlines, positions and size, the 2-column 2-row grid, and 1536x1024 resolution. This is a sprite atlas for extracting transparent puppies. Do NOT alter the puppies at all. The ONLY change is background to pure bright green.
```

### Cenário: dream-garden-v2.png

```text
Create a wide landscape BACKGROUND for a 2D side-scrolling game starring the character shown in the reference. Reference is STYLE ONLY, do not draw her or any characters. Match her polished hand-painted cartoon game illustration: clean soft-edged forms, rich warm shading, deep plum outlines in nearby objects, no blocky pixel squares. The scene is a welcoming dream garden beside a quiet turquoise lake, distant little pastel lavender and peach houses, a graceful small curved footbridge, rounded fluffy mint/sage treetops, a few flowering pink trees, rolling lavender hills. Gentle golden afternoon light, pale turquoise sky with soft cream clouds occupying upper 55 percent; a small natural sun glow high to the LEFT, no sun face. Midground lake and tiny distant village occupy bottom 30 percent. Layered atmospheric depth, low contrast distant objects so dark-outlined characters read clearly on top. Color harmony of sage, lilac, peach, warm cream, muted teal with occasional pink blossoms matching the heroine's warm brown hair and purple shoes. Premium cozy storybook platform game, detailed yet uncluttered. Absolutely no characters, no puppy, no monsters, no hearts, no words, no HUD, no foreground platform or ground collision surface. A horizontally expansive scenic panorama, landscape aspect ratio 3:2, 1536x1024. Keep both extreme side edges naturally low-detail sky/lake/foliage for reflected horizontal tiling. Original setting, not a screenshot of an existing game.
```
