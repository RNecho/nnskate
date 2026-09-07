# Nunu & Nana: Skate Dreams

Protótipo jogável de plataforma em 2D, com seleção entre Nana de skate e Nunu de patins, uma pista de teste e pixel art baseada nas imagens fornecidas. Uma personagem fica ativa por vez. O foco desta versão é experimentar a movimentação.

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

A Nana aparece em `IDLE` após carregar os três assets locais. Falhas de carregamento exibem uma opção para tentar novamente. A primeira interação por teclado/mouse/toque ativa a trilha original em loop. Navegadores condicionam o início do áudio à interação do usuário; veja a [documentação de autoplay do MDN](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay). Sair da aba/janela pausa o jogo e o áudio; retome pelo botão, P ou Start.

### Escolher a personagem

Clique ou toque no retrato no canto superior esquerdo da pista para alternar entre as irmãs. Também funcionam os botões **Nana · Skate** e **Nunu · Patins** acima da pista, as teclas 1/2 ou LB/RB no controle. A Nunu usa a imagem fornecida pelo usuário: óculos, blusa clara, calça escura e patins rosa. Retrato, nome e animações acompanham a escolha.

A troca funciona durante o rolê ou a pausa e mantém posição, velocidade, estado do salto e ajustes de física. Reiniciar a pista mantém a irmã selecionada; recarregar a página volta à Nana. Ambas usam os mesmos parâmetros de movimento nesta versão. Não há multiplayer ou habilidades adicionais.

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

A física usa passos fixos de 1/120 s, independentemente da taxa de desenho. A inércia é controlada por aceleração, desaceleração e freio, sem outro sistema de forças. O skate acompanha a inclinação do terreno, mas a gravidade ainda não acelera o skate nas descidas: nesta versão, ela controla o salto e a queda.

A fase é um único trecho de 2.800 px, com chão contínuo, subida/descida suave, uma rampa menor, uma depressão para testar saltos e três pequenas plataformas. As plataformas são unidirecionais: é possível atravessá-las por baixo e pousar por cima. Todas são alcançáveis com a física padrão. Alterar gravidade/pulo pode mudar essa condição.

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
  dream-city.png          Panorama da cidade e do lago
  nana-sprites-keyed.png  Atlas das seis poses da Nana
  nunu-sprites-keyed.png  Atlas original fornecido da Nunu de patins
tests/
  movement.test.ts         Verificação determinística da física
  browser.spec.ts          Fluxos reais no Chrome
  gamepad.test.ts          Mapeamento, botões, pausa e desconexão
  art-gamepad.spec.ts      Assets, recuperação de erro e controle no jogo
  character-selection.spec.ts Seleção, retratos, preservação do rolê e mobile
```

Canvas 2D e TypeScript, sem engine, backend ou serviço externo em execução. Vite cuida apenas do desenvolvimento e build. Fontes e imagens são empacotadas localmente. O terreno usa a mesma geometria das colisões. As seis poses detalhadas da Nana e o panorama foram gerados com image_gen a partir da referência; os recortes, pontos de apoio e animações continuam configuráveis em código. A cor verde do atlas vira transparência uma única vez no carregamento. Prompts, arquivos e processo estão em [docs/ART.md](docs/ART.md).

O atlas da Nunu foi copiado diretamente da imagem enviada pelo usuário, sem nova geração. Seus recortes descartam as outras poses e os rastros da folha. JUMP/FALL usam a pose de salto com uma pequena variação de extensão na descida; as demais animações usam poses próprias.

O áudio usa Web Audio: melodia original de oito compassos e efeitos separados para pulo, impulso e aterrissagem. Não há downloads de música nem arquivos temporários ausentes.

## Verificar

```sh
npm test
npm run test:browser
npm run build
```

Os testes de navegador usam Google Chrome instalado e iniciam um servidor local na porta 5175 quando necessário. Para usar o Chromium do Playwright, instale-o com `npx playwright install chromium` e remova `channel: 'chrome'` de `playwright.config.ts`.

Cobertura: seis estados e seus sons, inércia, reversão, rampas, plataformas, alcance do pulo padrão, tolerância após bordas, buffer de pulo, pulo variável, colisão em velocidade alta, equivalência entre 30/60/120 Hz, ajustes ao vivo, pausa, reinício, áudio, câmera, controles de toque e ausência de overflow horizontal. As capturas dos testes ficam em `test-results/` e não entram no Git.

Teste manual principal: abrir → dar impulso → soltar e observar a inércia → segurar pulo → cair → aterrissar → continuar andando → testar plataformas à direita. Abrir a oficina, mudar desaceleração e comparar o tempo até parar.

## Limites desta versão

Arte e áudio são provisórios. Gatos, corações e estrelas são decoração. Não há inimigos, história, chefes, sistema de fases, loja, multiplayer, pontuação ou habilidades especiais. Não há persistência de ajustes após recarregar.

O jogo tem controles de teclado, toque e gamepad, pausa, foco visível e redução de movimento ambiente conforme a preferência do sistema. O cenário em Canvas ainda depende de visão para jogar; esta versão não oferece navegação espacial por leitor de tela. O Windows e o Chrome reconheceram o dispositivo físico como Logitech Dual Action, com mapeamento padrão. A suíte automatizada usa controle simulado para ser reproduzível e não receber os comandos do jogador durante os testes; a conferência de todos os botões físicos ainda depende do jogador.
