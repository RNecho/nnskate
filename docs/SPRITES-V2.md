# Sprites adicionais de Nunu e Nana

Gerados com a ferramenta integrada **image_gen**, sem API/CLI. Os arquivos originais foram preservados.

- `public/art/nana-foot-v2.png`: 1536 × 1024, oito poses a pé em quatro colunas e duas linhas.
- `public/art/nunu-foot-v2.png`: mesmo formato; óculos, blusa clara e tênis rosa mantidos.

Posições: parada, três poses de corrida, subida no salto, queda, reação a dano e comemoração. O fundo verde é interpretado como transparência pelo carregador existente, uma única vez. O PNG original gerado permanece íntegro.

## Prompt da Nana

Use case: identity-preserve. Asset type: production game sprite sheet for an existing cute side scrolling platform game. Reference image is the existing character identity and pixel-art treatment; create an ADDITIONAL on-foot animation atlas, not a scene. Landscape 1536x1024. EXACTLY 4 columns by 2 rows of equal 384x512 cells, NO grid lines, NO text. Every full body pose centered horizontally in its cell with soles baseline 470 pixels from the top of each cell, approximate standing height 400 pixels, generous gutters. All face RIGHT in consistent 3/4 side view. Top row left to right: idle standing, run contact left leg forward, run passing legs together, run contact right leg forward. Bottom row: jump rising knees tucked, falling arms out legs down, hurt recoiling, victory both hands up. Clean consistent polished pixel art, dark outlines, same proportions and costume as reference, lively distinct readable poses. Absolutely NO skateboard, NO roller skates, NO wheels, NO props, NO speed trails, NO floor or shadow. Wear ordinary sneakers with flat soles. Uniform solid vivid green chroma key background RGB 0,230,0, no green pixels inside character. Preserve identity, hair, face, outfit across every cell.

Nana is the girl WITHOUT glasses, black sweatshirt with the cute brown teddy bear print, black pants, lavender white sneakers, brown high ponytail.

Referência: `public/art/nana-sprites-keyed.png`.

## Prompt final da Nunu

Create a NEW on-foot game sprite sheet of NUNU, the girl WITH ROUND GLASSES from image 1. Image 2 is ONLY the exact desired 4-column 2-row sheet layout and vivid solid green background. Render image 1's girl in image 2's eight poses, without any wheels or equipment. Pixel art like the references. Landscape 1536x1024. Eight poses in a regular 4x2 grid, one character per cell, 384x512 cells. Row 1: idle, run left leg forward, running passing, run right leg forward. Row 2: jumping, falling, hurt, victory hands up. ALL EIGHT characters must wear round glasses, ivory mouse-emblem sweater, gray pants and pink flat sneakers, brown ponytail. The background MUST be a SINGLE SOLID FLAT GREEN COLOR #00e600 exactly like image 2. Absolutely no brown or gradient background, no floor, no shadows, no glow, no text, no outlines around cells. Full body, soles bottom baseline within each cell, same proportions and scale all poses, no clipping. Ordinary footwear only NO wheels NO skates. Keep the girl recognizable as Nunu in image 1, never Nana from image 2.

Referências: folha original da Nunu e nova folha da Nana, respectivamente.

## Correção localizada da Nunu

Precise localized edit to this pixel-art sprite sheet. In the BOTTOM ROW, THIRD character from the left (the hurt pose), add the same round eyeglasses that the girl wears in the other seven poses. The glasses must surround her closed eyes. Do not change any pixels outside that character's eye area. Preserve the exact flat bright GREEN background, all 8 characters, every pose, original resolution, colors, outfits, and their positions. Output the complete full sprite sheet with this single correction. Do not add shadows or change the background.
