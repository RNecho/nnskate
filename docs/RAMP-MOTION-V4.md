# Descida, manobra 360° e animações — V4

## Como jogar

- A fase passou de 3.700 para **4.600 pixels**, mantendo uma aventura só.
- Depois das caixas, há outro skate em x=1450, uma descida e uma subida com faixa dourada. Segure direita para ganhar embalo e aperte pulo na faixa. O vão vai de x=1850 a x=2350. O skate chega a 600 px/s nesse trecho; andar e patins não alcançam a outra margem com a física padrão.
- Durante um salto de skate, **pressione e solte ↑ duas vezes em até 0,45 s**. Espaço, W, botão de pulo no celular e A/✕ do controle também funcionam. O salto inicial não conta: são dois novos toques no ar. O giro dura 0,48 s, uma vez por salto, sem alterar velocidade, altura ou colisão.
- Cair em buraco custa um coração e remove skate/patins. Enquanto há corações, o checkpoint devolve a personagem a pé. Ao perder os cinco, a próxima tentativa reinicia a fase inteira. Equipamentos permanecem nas estações. A bandeira anterior aos patins fica antes da estação para permitir recuperar o acessório no caminho.
- Chave x=3140, y=135; guardião x=4110; cachorro x=4410. Chave, caixas e estrelas coletadas permanecem após queda.

## Animações e arte

Nunu a pé tem quatro poses alternadas de caminhada, selecionadas pela distância percorrida, evitando oscilar a frequência quando muda de velocidade. As irmãs paradas respiram, piscam e mudam suavemente de pose; as poses ambiente ficam estáticas com redução de movimento. Nana subindo e descendo a pé ou de patins mantém os olhos abertos e expressão confiante. Dor fica reservada ao momento em que recebe dano.

A manobra usa oito ângulos por irmã, incluindo costas e perfis, desenhados com o skate. A imagem tem transparência real preservada. O chão é desenhado em Canvas com terra em camadas, pedras arredondadas, raízes, grama e flores. Plataformas e madeira da rampa acompanham a geometria de colisão.

## Arquivos finais e ferramenta

Modo **Imagegen integrado**, geração com referência, seguida de edição de fundo apenas nas duas folhas de movimento. Originais e variantes anteriores preservados; apenas finais copiados ao projeto:

- [nunu-motion-v4.png](../public/art/nunu-motion-v4.png): 1536 × 1024, oito poses.
- [nana-motion-v4.png](../public/art/nana-motion-v4.png): 1536 × 1024, oito poses.
- [skate-360-v4.png](../public/art/skate-360-v4.png): 1254 × 1254, 16 poses; primeira metade Nunu, segunda Nana. O gerador entregou tamanho diferente do solicitado; o recorte escala proporcionalmente.

As folhas verdes usam remoção de chroma já existente. O recorte das novas poses ignora uma margem lateral de oito pixels por célula para excluir pequenos fios da célula vizinha. O atlas 360 preserva seu canal alfa sem substituição.

## Prompts

### nunuMotionV4

Game sprite sheet, identity-preserve illustration. Reference image is Nunu: brown ponytail, ROUND GLASSES, ivory sweatshirt with mouse emblem, charcoal pants, pink sneakers. Create EIGHT FULL BODY sprites in exact 4 columns x 2 rows, 1536x1024 canvas, each 384x512 cell, ample 25px gutters. Same character size 360px, feet baseline y470 within each cell. Flat pure bright GREEN #00FF00 background everywhere outside sprites, absolutely no black backdrop or glow. Warm detailed illustrated chibi style, match reference, smooth edges. Row1: 1 relaxed standing looking right, eyes open, gentle smile; 2 identical standing but gentle blink with softly curved eyelids and relaxed smile (NOT clenched pain eyes); 3 walking right LEFT foot forward planted and right foot back, opposing arms; 4 passing walking pose right knee moving forward underneath hip, left supporting leg straight. Row2: 5 walking right RIGHT foot forward planted, left foot back, arms alternate visibly; 6 other passing pose left knee moving forward, right supporting leg straight; 7 cheerful upward jump both knees tucked, open eyes and confident smile; 8 descending ready-to-land knees slightly bent, arms balanced, eyes open and confident smile. This must be a true alternating-leg walk cycle, no four copies of the same running pose. All faces toward RIGHT 3/4 except blink identical. NO skateboards or roller skates. Every sprite stays entirely inside its cell, consistent head size and outlines. No text, no floor, no cast shadows.

### nanaMotionV4

Create a precise production GAME SPRITE SHEET for Nana from reference: brown ponytail, no glasses, black teddy bear sweatshirt and black pants. Warm illustrated chibi style matching reference. EXACT 4 columns x2 rows on1536x1024, equal384x512cells, generous25pxgutters, whole body360px high, lowestfoot/wheels y470 percell. FLAT pure bright GREEN #00FF00 chroma background with no shadows or glow. Eight poses: top row left to right all WITHOUT skates, wearing pink sneakers: 1 relaxed idle smiling eyes open; 2 same idle gentle blink with softly curved eyelids, smile, NOT painful squeezed eyes; 3 idle tiny weight shift and hand near hip, smile; 4 idle glancing slightly forward happily. Bottom row left to right: 5 WITHOUT skates cheerful ascending jump, knees tucked, open bright eyes and confident smile; 6 WITHOUT skates falling toward landing, knees soft, arms balanced, open eyes and small confident smile; 7 WITH pink quad roller skates, energetic second jump arms lifted, eyes OPEN happy smile; 8 WITH pink quad roller skates descending with knees soft, arms balancing, eyes OPEN, confident smile. Critical: NO hurt expressions, NO eyes squeezed shut except natural relaxed blink in top row cell2, NO grimaces or screaming mouth. Correct detailed natural limbs, consistent scale, identity and face. No labels, shadows, floor or background art.

### tricksV4

Production sprite sheet for a skateboard 360 aerial spin, TWO characters from references. Reference1 Nunu: round glasses, ivory mouse sweatshirt, gray pants, pink sneakers. Reference2 Nana: no glasses, black teddy sweatshirt, black pants, pink sneakers. Give BOTH a wooden skateboard with pink wheels firmly under feet; NO roller skates in this atlas. 1536x1536 square atlas, EXACT 4 columns x4 rows sixteen384x384cells. Top EIGHT cells (first two rows) ONLY Nunu, bottom EIGHT cells (last two rows) ONLY Nana. Each character performs eight sequential orientations of the SAME airborne crouched skateboard spin around the VERTICAL body axis: frame1 facing right 3/4front (0deg), frame2 right profile45deg, frame3 right3/4back90deg, frame4 fullback135deg, frame5 left3/4back180deg, frame6 leftprofile225deg, frame7 left3/4front270deg, frame8 frontview315deg. Board rotates with feet, board visible edge-on when appropriate. All girls stay UPRIGHT, knees tucked, arms extended for balance, ponytail follows turn, cheerful confident face whenever visible. Whole sprite INCLUDING skateboard ~290px tall with consistent head size, centered, lowest wheels at y340 within EVERY cell, 25px gutters. Match detailed warm chibi illustrations. Nunu glasses visible whenever facing front. Back views show BACK of sweatshirt, NO face painted on back of head, NO emblem on back. FLAT BRIGHT GREEN #00FF00 background, absolutely NO black backdrop, NO lighting gradient, NO shadows, NO swooshes, NO labels, NO extra sprites. A usable frame-by-frame sprite atlas rather than a poster.

### Edição de fundo das folhas de movimento

EDIT ONLY THE BACKGROUND of image1. Image2 shows the required FLAT GREEN background. Keep every girl, pose, glasses, clothes, skates, position, size and the exact4x2grid of image1 unchanged. Remove all dark brown backdrop and ALL glows/shadows, replace with one perfectly solid bright GREEN #00FF00 page, exactly like image2. Every pixel outside the eight sprites must be bright green. No shadows, no black, no dark gradient. Preserve all eight sprites exactly.1536x1024.

## Verificação

Testes de física cobrem o vão com skate, tentativas a pé e com patins, perda e nova coleta do equipamento, dois toques no ar, limite de uma manobra por salto e trajetória idêntica durante o giro. Os testes de navegador completam a aventura com as duas irmãs, registram a travessia e a manobra, conferem os atlases, estados de movimento, teclado, toque, controle e layouts. Capturas em test-results/motion-v4-poses.png e test-results/ramp-v4.png.

