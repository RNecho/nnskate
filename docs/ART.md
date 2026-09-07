# Arte da Nana · referência e geração

## Nunu: atlas fornecido pelo usuário

`public/art/nunu-sprites-keyed.png` é uma cópia da imagem enviada pelo usuário para a Nunu, em 1536×1024. Não houve nova geração nem alteração do arquivo original. O carregador já existente interpreta o fundo verde como transparência em memória. A Nunu mantém óculos, blusa clara, calça escura e patins rosa. Os recortes de IDLE/PUSH/ROLL/JUMP/FALL/LAND e os retratos ficam em `Animation.ts`; a seleção entre irmãs fica em `Game.ts` e na interface.

## Nana e cenário

Os assets desta revisão foram gerados com a ferramenta integrada **image_gen**, usando a imagem fornecida pelo usuário como referência de personagem e estilo. Não foi usada a API/CLI.

Arquivos integrados:

- `public/art/nana-sprites-keyed.png`: seis poses da Nana, com roupa preta, ursinho, rabo de cavalo e skate preto com borda laranja. Atlas em 1536×1024.
- `public/art/dream-city.png`: panorama da cidade, ponte, lago, nuvens e sol sorridente.

A primeira saída do atlas trouxe um padrão quadriculado opaco apesar do pedido de alpha. A edição seguinte, também pelo image_gen, preservou as poses e substituiu o fundo por verde. O carregador interpreta essa cor como transparência uma vez em Canvas, preservando o PNG original. Os recortes e pontos de apoio de cada pose ficam em `src/game/character/Animation.ts`. O terreno continua desenhado a partir da geometria real de colisão.

## Prompt de criação da Nana

Use case: stylized-concept.
Asset type: production sprite atlas PNG for a playable side-scrolling 2D pixel-art skate game.
Input image 1 is the EXACT character identity and detailed pixel-art STYLE reference, NOT an image to reuse as a background.
Create a sprite sheet of the girl NANA in the reference, faithfully preserving her identity: little girl with large expressive brown eyes and rosy cheeks, thick brown high ponytail with tiny lavender tie, side-swept bangs, BLACK oversized sweatshirt with a honey-brown teddy bear face and small black bow with white dots on its chest, BLACK jogger pants, white sneakers with pale lavender shadows. BLACK skateboard with warm orange rim, white wheels, same teddy bear design. She is cute, joyful and childlike. Detailed shaded pixel clusters, stepped dark outlines, rich colors and texture exactly like the reference. Not a tiny simplified block character; retain the detail of her face, hair and bear embroidery.
OUTPUT: one transparent PNG atlas, 3 equally sized columns by 2 equally sized rows, 1536x1024 landscape. Exactly SIX separated full-body versions of the SAME Nana, all facing RIGHT in consistent side/three-quarter side view suitable for a platform game, always WITH her skateboard below her feet. Absolutely transparent background (real alpha), no floor, no shadows outside sprite, no labels, no grid, no text, no effects or props.
Top row left: IDLE, relaxed standing on horizontal board, knees softly bent, natural arms.
Top row middle: PUSH, one foot on board, rear foot extending backward/down to push, leaning forward slightly.
Top row right: ROLL, both feet on horizontal board with softly bent knees, arms balanced.
Bottom row left: JUMP, both legs tucked up with skateboard close below shoes, arms spread; board tilts slightly nose-up.
Bottom row middle: FALL, knees less tucked, arms balanced, board nearly horizontal directly below feet.
Bottom row right: LAND, deep bent-knee crouch, body compressed down, both feet on horizontal board.
Strict registration: each sprite center aligned in its own 512x512 cell. Same head size and body proportions in all six. All skateboard wheel baselines aligned 32 pixels above the bottom of their respective cells (y480 top row / y992 bottom row). Normal standing total sprite height approximately 420px; crouched versions naturally shorter. 32px clear gutters on all sides, no overlapping between cells, every hair tip and wheel entirely visible. Full-body game sprites, NOT a character portrait/contact sheet with different zooms. Prioritize matching the exact supplied Nana and pixel-art craftsmanship.

## Prompt de preparação do fundo do atlas

Edit target: the supplied six-pose Nana sprite sheet. Preserve EXACTLY every sprite, face, ponytail, teddy bear, outfit, skateboard, pose, position, size, pixel texture and colors. Change ONLY the empty background: replace the entire white/light-gray checkerboard with a perfectly solid pure chroma-key GREEN background, RGB(0,255,0), hex #00FF00. This is a production sprite atlas needing one exact color for game-engine transparency. Every empty space outside the sprites and between arms/legs and around wheels must be exactly the same flat #00FF00 green. NO checkerboard, NO white, NO gradient, NO shadow, NO anti-aliased green fringing. Preserve all white pixels INSIDE the character's sneakers, eyes, bow and wheels. Do not crop, move or redraw any sprite. Keep source dimensions 1536x1024 and the existing 3-column 2-row arrangement exactly unchanged.

## Prompt do panorama

Use case: stylized-concept. Asset type: panoramic background layer for a real 2D side-scrolling pixel-art skate game. Input image 1 is STYLE AND WORLD reference. Create the BACKGROUND ONLY of this exact type of cheerful colorful 16-bit dream city. Match the supplied reference closely: saturated vivid azure blue sky with lighter cyan toward the horizon, puffy white clouds with lavender-blue pixel shadows, smiling bright yellow pixel sun with pink cheeks in upper right, colorful violet/pink/peach/turquoise city skyline with little window highlights, tropical palms on the far shore, a blue suspension bridge, sparkling bright blue lake and one tiny white-and-pink sailboat. Rich lively detailed pixel-art, crisp stepped pixel clusters and lovely textured 16-bit shading. True bright blue, lime green, saturated purple and hot pink accents like reference, absolutely NOT muted mint/beige, not flat geometric placeholders.
Output a wide horizontal 2:1 panorama, ideally 1920x960, no UI, no text. Composition: upper 45% is open sky and clouds; distant buildings/bridge and tree line across the middle from 42% to 73% image height; open blue lake spans bottom 27%. All this is BEHIND the actual playable terrain which will be drawn separately. Crucially exclude ALL characters, skateboards, enemies, coins, collectibles, stars, foreground grass ground/platforms, masonry platforms, foreground ramps, fences, crates and signs. Also no left or right framing walls. Fill entire canvas edge to edge with the distant background, not a scene with foreground gameplay objects. Detailed pixel art like the supplied image, no blur/antialiasing or realistic 3D.
