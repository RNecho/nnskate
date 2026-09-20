# Registro histórico: Juju, giros de patins e cenário — V5

> A Juju foi removida do jogo a pedido do usuário. Suas artes foram preservadas em `archive/art/juju/`, fora dos arquivos publicados. Nunu e Nana continuam disponíveis, com os giros e as correções de recorte descritos aqui. Os números de testes abaixo registram aquela revisão, antes da remoção.

## Entrega

- Juju como terceira personagem; botão próprio, tecla 3 e ciclo Nana → Nunu → Juju pelo retrato ou controle.
- Juju segue a referência em `archive/art/juju/juju-reference.png`: cabelo solto ondulado, óculos lilás, camiseta rosa e saia sobre legging preta.
- Doze poses a pé, oito de skate, oito de patins, oito de giro de skate e oito de mortal de patins para a Juju.
- Nunu, Nana e Juju executam o mortal automaticamente no segundo pulo dos patins. Solte e pressione novamente o botão de pulo no ar. A animação dura até 0,5 s; pousar ou perder os patins a encerra. Não acrescenta um terceiro pulo.
- Solo ilustrado com pedras, raízes, grãos e sombra de profundidade; grama e rampas continuam acompanhando as colisões existentes.
- Bandeira com tecido ondulante, costuras e patinha. Ao ativar o checkpoint, fica dourada e exibe um símbolo de confirmação.
- Gaiola com moldura, manta, barras metálicas, dobradiças e cadeado; a porta abre ao ter a chave e derrotar o guardião.

## Geração e integração

Modo **ImageGen integrado (built-in)**. As imagens foram geradas usando as referências do projeto e copiadas para `public/art/`; originais gerados foram preservados. Os sprites têm canal alfa real; cores RGB ocultas sob pixels transparentes não são o fundo do jogo. O atlas a pé da Juju é 1254 × 1254, grade 4 × 3; os demais sprites são 1536 × 1024, grade 4 × 2. A textura da terra é 1536 × 1024, opaca.

O carregador separa cada silhueta completa pela transparência antes de montar as células usadas na animação. Isso preserva poses que ultrapassam as divisões do arquivo original, sem cortar cabelo, mãos ou patins e sem mostrar partes de poses vizinhas. A preparação acontece uma vez, em memória, com margem transparente de 32 pixels e escala uniforme por folha. Os PNGs originais permanecem intactos. O mortal usa o centro da célula como eixo visual.

O tamanho de referência da Juju foi ajustado para 124 pixels em pé; o mortal tem diâmetro máximo de 118 pixels. A terra ilustrada agora cobre também a rampa e as plataformas suspensas. Os detalhes da grama mantêm coordenadas fixas no mundo durante a rolagem da câmera.

Bandeira e gaiola são desenhos nativos em Canvas em `src/game/render/RescueProps.ts`, com animação pela linha de tempo da aventura.

Foram inspecionadas capturas das animações e dos cinco trechos do mapa. A validação automatizada cobre recorte de silhuetas que atravessam células, ausência de fragmentos nas margens, tamanho da Juju, textura da rampa e das plataformas, estabilidade visual ao rolar a câmera, seleção das três personagens e mortal no segundo pulo.

Validação em 19/09/2026: **48 testes de lógica aprovados**, **24 casos de navegador aprovados** e **build de produção concluído**. Nana, Nunu e Juju completaram a fase por entradas de controle, passando pelos poderes, rampa, chave, resgate e reinício. A rodada completa do navegador aprovou 23 casos; o caso restante foi reexecutado e aprovado após permitir arredondamento de um nível de cor em menos de 16 canais na comparação de Canvas (foram observados apenas dois canais). Não houve alteração no código do jogo após essa rodada. As verificações de tamanho, recorte, seleção e responsividade passaram na rodada completa.

Arquivos principais da correção: `src/game/render/SpriteAtlas.ts`, `src/game/render/ArtAssets.ts`, `src/game/character/Animation.ts` e `src/game/render/TerrainArt.ts`. As capturas locais da inspeção estão em `.playwright/inspection/` (pasta ignorada pelo Git).

## Arquivos e prompts finais

### juju-foot-v1.png

Arquivo: [archive/art/juju/juju-foot-v1.png](../archive/art/juju/juju-foot-v1.png).

Referência: `archive/art/juju/juju-reference.png`.

Prompt:

> Use the attached sheet ONLY as the character identity/style reference. This is JUJU: long loose wavy chestnut-brown hair (NEVER ponytail), large LILAC/PURPLE eyeglass frames with tiny white heart details, purple-brown eyes, pink short sleeve T-shirt with a tiny group-of-girls illustration, black tiered ruffle skirt OVER opaque black leggings, white lace-up sneakers. Keep exact face, outfit, glasses, proportions, vibrant illustrated chibi style with warm shading. Child-friendly happy confident expressions, no grimacing or pain in ordinary movement. Create a production GAME SPRITE SHEET 1536x1536, EXACT 4 columns x3 rows, twelve cells384x512. Full body height around360px, foot baseline y470 inside each cell. Faces RIGHT 3/4 view. Row1: idle relaxed; same idle gentle happy blink; walk left foot forward/right foot back with opposing arms; passing walking pose right knee under hip left leg supporting. Row2: walk right foot forward/left foot back arms reverse; passing walking pose left knee under hip right leg supporting; joyful ascending jump knees tucked eyes open; descending ready to land arms balancing eyes open smiling. Row3: landing squat knees bent; briefly surprised by a bump eyes open hand raised (damage pose, no injury); victory hands up cheering; relaxed idle small wave. NO skateboard, NO roller skates, just white sneakers. BACKGROUND MUST BE REAL TRANSPARENT PNG ALPHA, not black, not brown, not a checkerboard painted into image. No ground, no cast shadow, no glow, no labels, no extra objects. Each whole sprite fits its cell with generous 25px clear gutters and identical scale. Clean isolated silhouettes, no loose pixels.

### juju-skate-v1.png

Arquivo: [archive/art/juju/juju-skate-v1.png](../archive/art/juju/juju-skate-v1.png).

Referência: `archive/art/juju/juju-reference.png`.

Prompt:

> Use the attached sheet ONLY as the character identity/style reference. This is JUJU: long loose wavy chestnut-brown hair (NEVER ponytail), large LILAC/PURPLE eyeglass frames with tiny white heart details, purple-brown eyes, pink short sleeve T-shirt with a tiny group-of-girls illustration, black tiered ruffle skirt OVER opaque black leggings, white lace-up sneakers. Keep exact face, outfit, glasses, proportions, vibrant illustrated chibi style with warm shading. Child-friendly happy confident expressions, no grimacing or pain in ordinary movement. Create a production GAME SPRITE SHEET 1536x1024, EXACT4 columns x2rows, eight384x512cells. Juju riding a real wooden skateboard with lavender deck art, metal trucks and lilac wheels attached beneath feet in EVERY pose. FULL body and board around360px tall, wheels baseline y470 per cell, facing RIGHT3/4. Toprow: idle balanced both feet on deck; pushing rear foot against ground and front foot on deck; rolling knees bent both feet on deck; crouched rolling arms balancing. Bottomrow: ollie jump knees tucked board under feet; falling board level arms balancing HAPPY confident open eyes; landing squat with wheels at baseline; speed stance leaning forward. Loose flowing wavy hair stays consistent. No rollers. BACKGROUND MUST BE REAL TRANSPARENT PNG ALPHA, not black, not brown, not a checkerboard painted into image. No ground, no cast shadow, no glow, no labels, no extra objects. Each whole sprite fits its cell with generous 25px clear gutters and identical scale. Clean isolated silhouettes, no loose pixels.

### juju-patins-v1.png

Arquivo: [archive/art/juju/juju-patins-v1.png](../archive/art/juju/juju-patins-v1.png).

Referência: `archive/art/juju/juju-reference.png`.

Prompt:

> Use the attached sheet ONLY as the character identity/style reference. This is JUJU: long loose wavy chestnut-brown hair (NEVER ponytail), large LILAC/PURPLE eyeglass frames with tiny white heart details, purple-brown eyes, pink short sleeve T-shirt with a tiny group-of-girls illustration, black tiered ruffle skirt OVER opaque black leggings, white lace-up sneakers. Keep exact face, outfit, glasses, proportions, vibrant illustrated chibi style with warm shading. Child-friendly happy confident expressions, no grimacing or pain in ordinary movement. Create a production GAME SPRITE SHEET1536x1024 EXACT4 columns x2rows eight384x512cells. Replace sneakers with WHITE quad roller skate boots with lilac laces and lavender wheels. No skateboard. All sprites face RIGHT3/4, fullbody360px high, lowest wheels y470 per cell. Toprow: relaxed idle; left leg push right skate supporting; smooth glide both skates aligned knees bent; opposite right leg push left skate supporting. Bottomrow: first ascending jump cheerful knees bent; second higher jump knees tucked one hand raised eyes OPEN happy; descending arms balancing skates extended eyes OPEN happy smile not painful; landing knees bent both skates at baseline. BACKGROUND MUST BE REAL TRANSPARENT PNG ALPHA, not black, not brown, not a checkerboard painted into image. No ground, no cast shadow, no glow, no labels, no extra objects. Each whole sprite fits its cell with generous 25px clear gutters and identical scale. Clean isolated silhouettes, no loose pixels.

### juju-360-v1.png

Arquivo: [archive/art/juju/juju-360-v1.png](../archive/art/juju/juju-360-v1.png).

Referência: `archive/art/juju/juju-reference.png`.

Prompt:

> Use the attached sheet ONLY as the character identity/style reference. This is JUJU: long loose wavy chestnut-brown hair (NEVER ponytail), large LILAC/PURPLE eyeglass frames with tiny white heart details, purple-brown eyes, pink short sleeve T-shirt with a tiny group-of-girls illustration, black tiered ruffle skirt OVER opaque black leggings, white lace-up sneakers. Keep exact face, outfit, glasses, proportions, vibrant illustrated chibi style with warm shading. Child-friendly happy confident expressions, no grimacing or pain in ordinary movement. Create production GAME SPRITE SHEET1536x1024 EXACT4 columns x2rows eight384x512cells for ONE360-degree skateboard spin around vertical body axis. Juju stays UPRIGHT airborne, knees tucked, arms balancing, real wood skateboard with LILAC deck and wheels under feet; NEVER roller skates. Eight sequential orientations row-major: right3/4front0deg; rightprofile45deg; right3/4back90deg; fullback135deg; left3/4back180deg; leftprofile225deg; left3/4front270deg; frontal315deg. Loose long wavy hair turns with head, back views show HAIR/back of shirt and skirt, NO face on back of head. Keep white sneakers and black leggings under black ruffle skirt. Lavender eyeglasses whenever face visible. Whole character withboard about300px high, wheels baseline y455 insideeverycell. Consistent headsize across all eight orientations. BACKGROUND MUST BE REAL TRANSPARENT PNG ALPHA, not black, not brown, not a checkerboard painted into image. No ground, no cast shadow, no glow, no labels, no extra objects. Each whole sprite fits its cell with generous 25px clear gutters and identical scale. Clean isolated silhouettes, no loose pixels.

### nunu-flip-v1.png

Arquivo: [public/art/nunu-flip-v1.png](../public/art/nunu-flip-v1.png).

Referência: `public/art/nunu-foot-v2.png`.

Prompt:

> Reference is NUNU: preserve round glasses, brown ponytail, ivory mouse sweatshirt, charcoal pants. Add PINK quad roller skate boots/wheels. GAME ANIMATION SPRITE SHEET of an AIRBORNE BACKFLIP/SOMERSAULT wearing quad ROLLER SKATES. This is an end-over-end flip in the image plane: the head is physically BELOW the feet in the middle frames. NOT a turntable spin, NOT eight upright poses. Exactly8frames in4columns x2rows on1536x1024, cells384x512. Each sprite centered exactly at cellcenter192,256 with fixed scale and generous35pxgutters. Compact tucked body, every limb/skate/hair contained inside cell, about280px total radius diameter. Sequence ROW MAJOR: 0deg upright airborne knees tucked;45deg leaning backward;90deg horizontal head to left feet to right;135deg diagonally upside down;180deg FULLY UPSIDE DOWN head at bottom and skates at top;225deg diagonally inverted other side;270deg horizontal head to right feet to left;315deg almost upright preparing to finish. Character and attached skates rotate together around bodycenter, with hair and arms naturally following somersault. Eyes open HAPPY/confident, no pain or fear. NO skateboard, no floor, no shadows, no speed trails, no labels. Real TRANSPARENT PNG background with ALPHA, not a painted checkerboard, no dark backdrop. Match detailed warm chibi illustration style of reference.

### nana-flip-v1.png

Arquivo: [public/art/nana-flip-v1.png](../public/art/nana-flip-v1.png).

Referência: `public/art/nana-patins-v3.png`.

Prompt:

> Reference is NANA: preserve brown ponytail, NO glasses, black teddy bear sweatshirt and black pants, pink/lavender quad roller skates. GAME ANIMATION SPRITE SHEET of an AIRBORNE BACKFLIP/SOMERSAULT wearing quad ROLLER SKATES. This is an end-over-end flip in the image plane: the head is physically BELOW the feet in the middle frames. NOT a turntable spin, NOT eight upright poses. Exactly8frames in4columns x2rows on1536x1024, cells384x512. Each sprite centered exactly at cellcenter192,256 with fixed scale and generous35pxgutters. Compact tucked body, every limb/skate/hair contained inside cell, about280px total radius diameter. Sequence ROW MAJOR: 0deg upright airborne knees tucked;45deg leaning backward;90deg horizontal head to left feet to right;135deg diagonally upside down;180deg FULLY UPSIDE DOWN head at bottom and skates at top;225deg diagonally inverted other side;270deg horizontal head to right feet to left;315deg almost upright preparing to finish. Character and attached skates rotate together around bodycenter, with hair and arms naturally following somersault. Eyes open HAPPY/confident, no pain or fear. NO skateboard, no floor, no shadows, no speed trails, no labels. Real TRANSPARENT PNG background with ALPHA, not a painted checkerboard, no dark backdrop. Match detailed warm chibi illustration style of reference.

### juju-flip-v1.png

Arquivo: [archive/art/juju/juju-flip-v1.png](../archive/art/juju/juju-flip-v1.png).

Referência: `archive/art/juju/juju-reference.png`.

Prompt:

> Reference is JUJU: preserve LONG LOOSE WAVY BROWN HAIR (no ponytail), LILAC glasses with tiny hearts, pink T-shirt with group-of-girls illustration, black tiered ruffle skirt OVER opaque BLACK LEGGINGS. Add WHITE quad roller skate boots with LILAC wheels. Leggings fully cover legs throughout the flip. GAME ANIMATION SPRITE SHEET of an AIRBORNE BACKFLIP/SOMERSAULT wearing quad ROLLER SKATES. This is an end-over-end flip in the image plane: the head is physically BELOW the feet in the middle frames. NOT a turntable spin, NOT eight upright poses. Exactly8frames in4columns x2rows on1536x1024, cells384x512. Each sprite centered exactly at cellcenter192,256 with fixed scale and generous35pxgutters. Compact tucked body, every limb/skate/hair contained inside cell, about280px total radius diameter. Sequence ROW MAJOR: 0deg upright airborne knees tucked;45deg leaning backward;90deg horizontal head to left feet to right;135deg diagonally upside down;180deg FULLY UPSIDE DOWN head at bottom and skates at top;225deg diagonally inverted other side;270deg horizontal head to right feet to left;315deg almost upright preparing to finish. Character and attached skates rotate together around bodycenter, with hair and arms naturally following somersault. Eyes open HAPPY/confident, no pain or fear. NO skateboard, no floor, no shadows, no speed trails, no labels. Real TRANSPARENT PNG background with ALPHA, not a painted checkerboard, no dark backdrop. Match detailed warm chibi illustration style of reference.

### terrain-earth-v5.png

Arquivo: [public/art/terrain-earth-v5.png](../public/art/terrain-earth-v5.png).

Prompt:

> Create a polished 2D PLATFORMER GAME TERRAIN TEXTURE, a seamless repeating underground soil cross-section.1536x1024 landscape full-bleed tile. Orthographic FRONT VIEW of dense warm earth, not overhead ground. Detailed hand-painted children's adventure game style with clean warm plum outlines, soft painted highlights, rich layered ochre/caramel/terracotta soil, irregular embedded rounded stones in warm beige muted mauve and honey, fine granular speckling, thin branching tree roots, subtle cracked clay strata. Small moss flecks in occasional crevices. Lots of carefully drawn small details, cohesive material volume, no large empty flat areas, no regular bricks or rectangular tile grid. Consistent texture density across wholeimage, smallandmediumstones distributed naturally, irregular subtle strata undulation but NO big horizontal bands. Seamless repeat LEFT/RIGHT and TOP/BOTTOM, edges must match. NO grass surface, no sky, no water, no trees, no characters, no objects, no text, no UI, no frame, no 3D perspective, no transparency. This fills the earth beneath grassy platform edges drawn separately in the game. Appealing readable game asset, medium contrast so it stays secondary to chibi characters.
