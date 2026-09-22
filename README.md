# Nunu & Nana: Skate Dreams

Jogo de plataforma em 2D com uma fase de resgate: **Operação Patinhas**. Nunu e Nana começam a pé, encontram skate e patins como poderes, enfrentam monstros e salvam um cachorrinho. Uma personagem fica ativa por vez; a troca preserva o progresso. O percurso do MVP agora tem um jardim ilustrado, monstros com cara de vilão, cachorro animado e uma área de jogo maior.

**Jogar online:** [Nunu & Nana · Operação Patinhas](https://rnecho.github.io/nnskate/). Cada atualização da branch `main` é publicada pelo workflow de GitHub Pages.

## A aventura

Clique em **Vamos buscar!** ou mova a personagem. Caia na cabeça dos monstros para derrotá-los. O skate quebra as caixas ao acelerar e derruba monstros comuns em alta velocidade. Na descida, ganhe embalo e pule na faixa dourada da rampa para atravessar o vão. **No ar de skate, dê dois novos toques em ↑ para girar 360°**; Espaço, W e o botão de pulo do celular/controle também funcionam. Os patins liberam um segundo pulo: solte e aperte pular novamente no ar para coletar a chave dourada. Os mesmos poderes funcionam com as duas personagens.

A personagem tem **cinco corações**. Encostar de lado num monstro tira um coração e o equipamento; acertar a cabeça ou atacar com skate em alta velocidade é seguro. Há 1,8 segundo de proteção após o dano. **Skate e patins permanecem disponíveis nos pontos de coleta**: saia e volte para pegar o poder novamente.

Há **cinco buracos** no chão. Cair custa um coração, remove o equipamento e retorna ao checkpoint **a pé**. Quando os cinco corações acabam, **Recomeçar do início** (ou o botão de pulo) reinicia a fase inteira com cinco corações, a pé, limpando o progresso da tentativa. Skate e patins podem ser coletados novamente. O guardião final recebe três pulos separados na cabeça; com a chave coletada, aproxime-se da gaiola para resgatar o cachorrinho e assistir ao reencontro. **Jogar de novo** reinicia a aventura com a personagem selecionada.

As 12 estrelas são opcionais para o resgate. Coletar todas concede **Superbrilho por 8 segundos**: a personagem brilha e derrota monstros por contato, com música especial e contador. O guardião mantém três acertos; buracos ainda custam um coração e encerram o poder. A recompensa acontece uma vez por partida. Existem quatro checkpoints, dois tipos de monstros comuns e um guardião. Não há persistência: recarregar a página começa uma nova partida. Mais detalhes técnicos e de validação em [docs/RESCUE.md](docs/RESCUE.md).

## Abrir o jogo

Requer Node.js 22.12+ ou 24 e npm.

```sh
npm install
npm run dev
```

Abra o endereço mostrado no terminal. Para escolher uma porta:

```sh
npm run dev -- --port 5175
```

Para gerar e conferir a versão estática:

```sh
npm run build
npm run preview
```

O resultado fica em `dist/`. Sirva essa pasta por HTTP; abrir `index.html` diretamente por `file://` não é suportado.

## Jogar

| Controle | Ação |
| --- | --- |
| ← / → ou A / D | Andar; apertar o sentido contrário freia e depois inverte |
| Espaço, ↑ ou W | Pular; segurar permite um pulo mais alto |
| P ou Esc | Pausar / continuar |
| R | Voltar ao início da pista |
| M | Ativar / desativar som |
| F | Alternar tela cheia, se o navegador oferecer suporte |
| Analógico esquerdo / direcional do controle | Andar |
| Botão inferior A / ✕ do controle | Pular; segure para subir mais |
| Start do controle | Pausar / continuar |
| 1 / 2 | Selecionar Nana / Nunu |
| LB / RB (L1 / R1) do controle | Trocar a personagem |

Celulares têm botões de direção e pulo que podem ser pressionados simultaneamente. Os botões também aceitam Espaço/Enter quando estão com foco. Ao ajustar um slider, as setas controlam o slider.

A Nana aparece a pé em `IDLE` após carregar as quinze imagens locais. Falhas de carregamento exibem uma opção para tentar novamente. A primeira interação por teclado/mouse/toque ativa a trilha original em loop. Navegadores condicionam o início do áudio à interação do usuário. Sair da aba/janela pausa o jogo e o áudio; retome pelo botão, P ou Start.

### Escolher a personagem

Clique ou toque no retrato no canto superior esquerdo da pista para alternar entre **Nana e Nunu**. Também funcionam os dois botões acima da pista, as teclas **1/2** ou LB/RB no controle. A Nunu mantém óculos, blusa clara e calça escura; a Nana mantém a roupa preta com ursinho. Retrato, nome e animações acompanham a escolha. Ambas começam a pé e podem coletar os dois poderes.

A troca funciona durante a aventura ou a pausa e mantém posição, velocidade, equipamento, estado do salto e ajustes de física. Reiniciar mantém a personagem selecionada; recarregar a página volta à Nana. As duas usam as mesmas regras de movimento. Não há multiplayer.

O **segundo pulo de patins faz um giro de ponta-cabeça** automaticamente, com oito poses próprias para Nana e Nunu. As animações preservam as silhuetas inteiras, sem recortes de poses vizinhas. O chão, as rampas e as plataformas usam terra com pedras e raízes; as bandeiras têm tecido animado e a gaiola abre após obter a chave e vencer o guardião.

Os quatro checkpoints ficam em chão plano: perto das caixas, antes da descida de skate, perto do desafio dos patins e antes do guardião. São ativados ao pousar em chão firme; cair antes disso mantém o ponto de retorno anterior. Os equipamentos continuam acessíveis a pé. Detalhes em [docs/RESCUE.md](docs/RESCUE.md).

### Controle USB

Com o jogo em foco, pressione um botão do controle e aguarde **Controle conectado** abaixo da pista. Não é preciso recarregar ao conectar/desconectar. Há uma zona morta de 20% no analógico para evitar movimento involuntário; soltar Start antes de pressionar novamente evita pausas repetidas. Após pausa/perda de foco, solte os botões e centralize o analógico antes de retomar.

O jogo usa o mapeamento `standard` da [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API). Layouts não reconhecidos são informados na interface, sem assumir botões incorretos. O USB encontrado durante o desenvolvimento reportou Logitech `046d:c216`; o [mapeamento do Chromium para Windows](https://chromium.googlesource.com/chromium/src/+/HEAD/device/gamepad/gamepad_standard_mappings_win.cc) inclui esse identificador.

O controle funciona para jogar sem mouse; para iniciar a música pela primeira vez, clique uma vez no ícone de som. A leitura do controle não concede ativação de áudio em todos os navegadores.

## Movimento

Os estados são `IDLE`, `PUSH`, `ROLL`, `JUMP`, `FALL` e `LAND`. Cada um tem uma pose/animação própria. A aterrissagem é curta e não bloqueia um novo pulo. A direção visual acompanha a velocidade real, inclusive durante a frenagem.

Abra **Oficina do movimento** abaixo da pista para ajustar a física ao vivo. As mudanças valem para a sessão e são mantidas ao reiniciar a pista. **Restaurar padrão** repõe os valores originais.

Os padrões ficam em `src/game/config.ts`, em pixels e segundos:

| Parâmetro | Padrão | Efeito |
| --- | ---: | --- |
| `maxSpeed` | 280 px/s | Limite de velocidade horizontal |
| `acceleration` | 510 px/s² | Ganho de velocidade |
| `deceleration` | 190 px/s² | Desaceleração sem input; menor valor aumenta a inércia |
| `braking` | 900 px/s² | Freio ao inverter a direção |
| `gravity` | 1100 px/s² | Gravidade na subida do pulo |
| `jumpForce` | 430 px/s | Velocidade inicial do pulo |
| `airControl` | 0,65 | Proporção da aceleração disponível no ar |
| `fallMultiplier` | 1,18 | Gravidade adicional na descida |
| `coyoteTime` | 0,11 s | Tolerância para pular após sair de uma plataforma |
| `jumpBuffer` | 0,12 s | Guarda um pulo apertado pouco antes da aterrissagem |

A física usa passos fixos de 1/120 s, independentemente da taxa de desenho. A inércia é controlada por aceleração, desaceleração e freio. No trecho especial da descida, a inclinação acelera o skate e o limite sobe para 600 px/s. Pular com embalo na faixa dourada ganha o impulso necessário para atravessar o vão de 500 px. O giro é visual e não altera a trajetória.

A fase de resgate é um único trecho de 4.600 px, com cinco buracos, rampas e cinco plataformas. As plataformas são unidirecionais: é possível atravessá-las por baixo e pousar por cima. A chave foi elevada e exige o segundo pulo dos patins com a física padrão. Alterar gravidade/pulo pode mudar o alcance dos desafios. A pista original de 2.800 px continua disponível internamente para os testes da física.

## Estrutura

```text
src/
  main.ts                 Interface, atalhos e ajustes da sessão
  style.css               Layout responsivo e tokens visuais
  ui/icons.ts             Ícones da interface
  game/
    Game.ts               Loop fixo, integração e ciclo de vida
    config.ts             Parâmetros da física
    types.ts              Contratos pequenos compartilhados
    character/
      Character.ts        Máquina dos seis estados
      characters.ts       Identificadores e nomes das duas irmãs
      Movement.ts         Velocidade, salto e colisão
      Animation.ts        Sprite pixel art e poses por estado
    input/Input.ts        Combinação de teclado, toque e controle
    input/GamepadInput.ts Leitura do controle, zona morta e bordas de botões
    camera/Camera.ts      Acompanhamento suave e limites
    audio/AudioManager.ts Trilha e efeitos sintetizados
    level/Level.ts        Geometria da pista e superfícies
    render/Renderer.ts    Desenho do cenário e da personagem
    render/ArtAssets.ts   Carregamento e preparação das imagens
public/art/
  dream-garden-v2.png    Jardim ilustrado atual (dream-city.png preservado)
  monsters-v2.png        Monstros com expressões hostis, 12 poses
  puppy-v2.png           Cachorro, quatro poses
  nana-sprites-keyed.png  Atlas das seis poses da Nana
  nunu-sprites-keyed.png  Atlas original fornecido da Nunu de patins
  nunu-skate-v3.png       Oito poses próprias da Nunu no skate
  nana-patins-v3.png      Oito poses próprias da Nana nos patins
  nunu-motion-v4.png      Caminhada alternada, repouso e saltos da Nunu
  nana-motion-v4.png      Repouso e saltos alegres da Nana
  skate-360-v4.png        Oito ângulos da manobra por irmã, com transparência
tests/
  movement.test.ts         Verificação determinística da física
  browser.spec.ts          Fluxos reais no Chrome
  gamepad.test.ts          Mapeamento, botões, pausa e desconexão
  art-gamepad.spec.ts      Assets, recuperação de erro e controle no jogo
  character-selection.spec.ts Seleção, retratos, preservação do rolê e mobile
```

Canvas 2D e TypeScript, sem engine, backend ou serviço externo em execução. Vite cuida apenas do desenvolvimento e build. Fontes e imagens são empacotadas localmente. O terreno usa a mesma geometria das colisões. As seis poses detalhadas da Nana e o panorama foram gerados com image_gen a partir da referência; os recortes, pontos de apoio e animações continuam configuráveis em código. A cor verde do atlas vira transparência uma única vez no carregamento. Prompts, arquivos e processo estão em [docs/ART.md](docs/ART.md).

O atlas original da Nunu foi copiado diretamente da imagem enviada pelo usuário; as poses de patins foram preservadas. Duas novas folhas `nana-foot-v2.png` e `nunu-foot-v2.png` acrescentam oito poses a pé por irmã. O carregador alinha os pés por célula. Prompts e processo das novas imagens estão em [docs/SPRITES-V2.md](docs/SPRITES-V2.md).

A atualização atual adiciona caminhada alternada da Nunu, repouso com piscadas, saltos confiantes da Nana, manobra 360° e terreno com terra, pedras arredondadas e raízes. Novas folhas, prompts e controles estão em [docs/RAMP-MOTION-V4.md](docs/RAMP-MOTION-V4.md).

O áudio usa Web Audio: a nova trilha original **Patinhas ao vento**, sons de equipamento, chave e caixas, música de Superbrilho e uma fanfarra exclusiva no reencontro com o cachorro, além dos efeitos de movimento. Não há downloads de música nem arquivos temporários ausentes. Artes, prompts e regras desta atualização estão em [docs/POWER-POLISH.md](docs/POWER-POLISH.md).

## Verificar

```sh
npm test
npm run test:browser
npm run build
```

Os testes de navegador usam Google Chrome instalado e iniciam um servidor local na porta 5175 quando necessário. Para usar o Chromium do Playwright, instale-o com `npx playwright install chromium` e remova `channel: 'chrome'` de `playwright.config.ts`.

Cobertura: seis estados e seus sons, inércia, reversão, rampas, plataformas, alcance do pulo padrão, tolerância após bordas, buffer de pulo, pulo variável, colisão em velocidade alta, equivalência entre 30/60/120 Hz, ajustes ao vivo, pausa, reinício, áudio, câmera, controles de toque e ausência de overflow horizontal. As capturas dos testes ficam em `test-results/` e não entram no Git.

Teste manual principal: escolher irmã → começar a pé → pular no primeiro monstro → coletar skate → usar a rampa → coletar patins → testar o segundo pulo → derrotar o guardião → buscar o cachorro → jogar de novo. Teste também dano, checkpoints e troca de irmã durante um salto. A oficina de movimento continua disponível para experimentar ajustes.

## Limites desta versão

Esta versão tem uma única fase, sem loja, multiplayer ou seleção de fases. Há estrelas coletáveis além das estrelas decorativas do cenário original. Partida e ajustes de física não persistem após recarregar. Monstros, cachorro e cenário usam [novas artes criadas com Imagegen](docs/GARDEN-V3.md). O cachorro tem quatro poses e os monstros têm 12; gaiola, itens e plataformas são desenhados em Canvas. Os novos sprites das irmãs complementam as folhas originais. Nunu de skate e Nana de patins agora usam folhas próprias de oito poses, com equipamento integrado ao desenho.

O jogo tem controles de teclado, toque e gamepad, pausa, foco visível e redução de movimento ambiente conforme a preferência do sistema. O cenário em Canvas ainda depende de visão para jogar; esta versão não oferece navegação espacial por leitor de tela. O Windows e o Chrome reconheceram o dispositivo físico como Logitech Dual Action, com mapeamento padrão. A suíte automatizada usa controle simulado para ser reproduzível e não receber os comandos do jogador durante os testes; a conferência de todos os botões físicos ainda depende do jogador.
