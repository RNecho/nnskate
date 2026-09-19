# Rodas, estrelas e Superbrilho

Nunu de skate e Nana de patins têm oito poses próprias cada: repouso, impulso, deslize, salto, queda e aterrissagem. A Nana também tem pose para o segundo pulo. Os pés e as rodas são alinhados pela transparência dos frames. Ao pegar equipamento, uma aura de estrelas marca a transformação durante 0,8 segundo.

As 12 antigas cruzes viraram estrelas douradas desenhadas em Canvas. Coletar todas concede **Superbrilho por 8 segundos**, uma vez por partida: aura dourada, estrelinhas orbitando, contador e música especial. Encostar em monstro comum o derrota; o guardião mantém três acertos separados por recuperação. Buracos continuam custando um coração e encerram o brilho. Pausa congela a duração; reiniciar limpa a recompensa.

A chave está em x=2240, y=135 (45 pixels acima da versão anterior), fora do alcance da colisão de coleta em um salto simples do chão com a física padrão. A coleta exige patins e segundo pulo. Caixas têm madeira, travessas, ferragens e fragmentos; skate e patins coletáveis ganharam desenhos com rodas, cadarços e volume.

A trilha original **Patinhas ao vento** usa sinos suaves, baixo e percussão sintetizados com Web Audio. Há sons distintos para equipamento, chave, caixas e Superbrilho. A fanfarra de resgate toca uma vez ao chegar ao cachorro após vencer o guardião e obter a chave; termina com dois pequenos latidos sintetizados. Silenciar e pausar continuam respeitados.

## Imagens e processo

Modo: ferramenta integrada **Imagegen**, geração com referência e edição de fundo. Originais preservados na pasta generated_images da sessão. Nenhum serviço externo é necessário para executar o jogo. Apenas os PNGs finais foram copiados para o projeto:

- [Nunu de skate](../public/art/nunu-skate-v3.png), 1536 × 1024, 4 × 2 poses.
- [Nana de patins](../public/art/nana-patins-v3.png), 1536 × 1024, 4 × 2 poses.

Referências: nunu-foot-v2.png e nana-foot-v2.png, mantendo rosto, óculos da Nunu, roupas e proporções. A primeira geração produziu fundos escuros; a edição seguinte trocou somente o fundo por verde, removido pelo carregador Canvas. A Nunu exigiu mais uma edição com a folha a pé como referência explícita de fundo. As versões de fundo escuro foram descartadas da seleção.

### Prompt Nunu

Create an improved professional GAME SPRITE SHEET of this EXACT girl Nunu now riding a skateboard. Use reference for exact identity: round glasses, brown ponytail, ivory sweatshirt with little mouse emblem, charcoal pants, pink sneakers. Preserve her face, clothes, proportions, warm illustrated style, clean dark plum outline. 1536x1024 landscape canvas, EXACT 4 columns by 2 rows, eight full body poses, each centered inside its 384x512 cell with generous gutters. One skateboard with wooden deck, purple grip, metal trucks and pink wheels must be physically attached under supporting feet in EVERY pose. Top row left to right: relaxed balanced stance with both feet on board; push stroke with front foot on deck and rear foot pushing ground; rolling with knees bent and both feet on board; alternate rolling crouch with arms balancing and ponytail flowing. Bottom row: rising ollie with knees tucked and board under feet; descending jump with board level and arms balancing; landing squash bent knees with wheels touching baseline; confident speed stance leaning forward on board. Face RIGHT in all poses, three-quarter side view suitable for platformer. Feet/lowest wheels around y470 within EACH cell, overall character including board around360px high, consistent scale. Do not draw normal running poses. Do not draw roller skates. Every empty pixel must be perfectly flat bright GREEN #00FF00 chroma key, just like reference. NO dark background, NO glow, NO gradient, NO floor or cast shadow, NO speed lines, NO labels. Exactly eight well separated sprites. Prioritize believable skating posture and consistent identity.

### Prompt Nana

Create an improved professional GAME SPRITE SHEET of this EXACT girl Nana now wearing roller skates. Use reference for exact identity: brown ponytail, NO glasses, black sweatshirt with brown teddy bear emblem, black pants. Preserve her face, clothes, proportions, warm illustrated style, clean dark plum outline. Replace sneakers with detailed pink and lavender QUAD ROLLER SKATES, boots with visible round wheels attached naturally underneath. 1536x1024 landscape canvas, EXACT 4 columns by 2 rows, eight full body poses centered inside 384x512 cells with generous gutters. Top row left to right: balanced idle on both skates; left-leg push stride, right leg supporting; smooth glide with knees bent, both skates grounded; alternate right-leg push stride, left leg supporting. Bottom row: first jump knees bending with skates under feet; second higher jump knees tucked, one arm raised, cheerful determined face; falling arms balancing, both skates extended ready to land; landing squash deeply bent knees and skate wheels level at baseline. Face RIGHT in all poses three-quarter side view. Lowest wheel around y470 within EACH cell, whole character including wheels about360px tall consistent scale. NO skateboard, no ordinary running shoes, no floating unattached wheels. Every empty pixel must be perfectly flat bright GREEN #00FF00 chroma key, just like reference. NO dark background, NO glow, NO gradients, NO floor or shadows, NO speed trails, NO labels. Exactly eight well separated sprites. Prioritize convincing roller-skating poses.

### Edição de fundo

Remove the dark colored background completely and replace it with ONE perfectly flat solid BRIGHT GREEN #00FF00 chroma-key background. Every empty pixel between and around the EIGHT girl sprites must be bright green. No shadows, no gradients, no glow, no black or brown backdrop. Preserve all eight girls and their equipment exactly, their colors, expressions, outlines, positions and size, the 4-column 2-row grid, and 1536x1024 resolution. This is a sprite atlas for extracting transparent skating characters. Do NOT alter the sprites at all. The ONLY change is background to pure bright green.

### Edição final da Nunu

Image 1 is the EDIT TARGET: the eight Nunu-on-skateboard sprites must remain the same. Image 2 is the BACKGROUND REFERENCE ONLY showing the correct flat GREEN chroma key. Recreate Image 1 with its exact eight skateboarding girls, same positions and 4x2 layout, but replace ALL brown/black backdrop and glow with the flat GREEN background of Image 2. The entire 1536x1024 rectangular canvas must have BRIGHT GREEN #00FF00 in every pixel not occupied by the girls or their skateboards. No brown, no black background, no cast shadows, no glow. Keep the girl's glasses, ivory shirt, gray pants, pink sneakers, brown hair and pink skateboard wheels, every original pose. Do not use the outfits or poses from Image 2. Do not change the skateboards. The result should look like the first image cut out and pasted onto a single solid bright green page.

## Validação

Testes determinísticos cobrem última estrela, duração e expiração, colisões protegidas, recuperação do guardião, queda, reinício, fanfarra única e alcance da chave. Chrome verifica as oito poses por atlas, fundo transparente, cenas com os dois equipamentos, áudio sem clipping, silêncio/pausa e a aventura completa por controles reais da aplicação. Capturas ficam em test-results/ (ignoradas no Git).

