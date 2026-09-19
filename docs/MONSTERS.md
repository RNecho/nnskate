# Sprites dos monstros

Asset final: `public/art/monsters-v1.png`, PNG 1536 × 1024, criado com a ferramenta integrada Imagegen. Referência de estilo: `public/art/nana-foot-v2.png`. O arquivo fica no projeto e funciona sem serviço de imagens em tempo de jogo.

Três linhas, quatro poses por linha: gelatina turquesa, saltador coral com orelhas e guardião roxo com coroa. Colunas: repouso, deslocamento/preparação, deslocamento/salto e dano. Limites verticais das linhas: 0, 330, 640 e 1024; colunas de 384 px. O recorte por pixels opacos alinha cada pose pelos pés. O fundo verde é removido uma vez no carregamento, na superfície Canvas em memória, usando o mesmo processamento das personagens.

## Prompt de geração

```text
Use case: stylized-concept. Asset type: production pixel-art monster sprite sheet for Nunu and Nana's cute 2D side-scrolling game. Reference image is STYLE ONLY, do not draw the girl. Create exactly TWELVE monster sprites in a strict 4-column by 3-row equal grid on a 1536x1024 landscape canvas. Each cell 384x341.333. NO text, NO grid lines. Uniform perfectly flat bright GREEN chroma key background #00e600, NO gradients, NO ground, NO shadows, NO green pixels within any monster. Rich hand-crafted 16-bit pixel art with clean dark aubergine outlines, shaded pixel clusters, expressive faces, comparable finish to the reference character. Row 1 is the SAME cute mischievous turquoise jelly monster with tiny feet, big ivory eyes and a little tooth: columns idle, walking squash, walking stretch, hurt squashed with dizzy eyes. Row 2 is the SAME coral-orange fluffy hopping monster, two long ears, little paws, cream belly, big expressive eyes: columns idle, crouching ready to jump, airborne stretched jump, hurt dizzy with folded ears. Row 3 is the SAME purple round guardian monster with short strong legs and GOLDEN crown, magenta belly, stubby arms, large expressive eyes, not frightening: columns idle, walking left foot forward, walking right foot forward, hurt/recoil with wobbly crown. Face three-quarter RIGHT in every cell, same identity and consistent scale within each row. Every sprite fully contained, centered horizontally within its cell, baseline 25 pixels above bottom of its cell; standing sprites about 230 pixels tall (hopper ears included, boss crown included). Generous gutters, sprites never touch adjacent cells. Cute adventure antagonists, no weapons, no blood, no extra stars or floating props. Critical exact THREE rows and FOUR columns, single flat vivid GREEN backdrop.
```

## Edição final

A geração inicial veio com fundo escuro. A edição pelo Imagegen preservou os monstros e substituiu o fundo pelo verde usado pelo jogo:

```text
Remove the dark colored background completely and replace it with ONE perfectly flat solid BRIGHT GREEN #00FF00 chroma-key background. Every empty pixel between and around the twelve monsters must be bright green. No shadows, no gradients, no glow, no black or brown backdrop. Preserve all twelve monsters exactly, their colors, expressions, outlines, positions and size, the 4-column 3-row grid, and 1536x1024 resolution. This is a sprite atlas for extracting transparent monsters. Do NOT alter the monsters at all. The ONLY change is background to pure bright green.
```

Validação: teste no navegador confirma o fundo transparente na superfície preparada, 12 poses não vazias e recortes sem encostar nos limites das células. As capturas da aventura mostram os sprites no cenário real.
