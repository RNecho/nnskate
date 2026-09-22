# Operação Patinhas

Uma única fase lateral baseada no percurso do MVP, para jogar com Nana ou Nunu. A troca de irmã preserva a posição, velocidade, equipamento, salto e checkpoint. Não há multiplayer, backend ou salvamento entre sessões.

## Percurso

1. Introdução: um monstro leva o cachorro, deixando a bolinha para trás. A personagem espera a ação do jogador, a pé.
2. Primeiro monstro: ensina o ataque por cima. Colete o skate depois da primeira subida.
3. Skate: quebre as caixas em x=1250 acelerando (220 px/s). Monstros comuns caem ao contato acima de 250 px/s. A descida em x=1400–1730 permite chegar a 600 px/s; pule na faixa dourada antes de x=1850 para alcançar x=2350. Dois novos toques em pular no ar fazem o giro 360°. Mais detalhes em [RAMP-MOTION-V4.md](RAMP-MOTION-V4.md).
4. Patins: substituem o skate, voltam à velocidade base e concedem um salto adicional no ar. Colete a chave dourada em x=3140, y=135 durante um pulo duplo. A região de coleta é ampla e fica sobre chão seguro.
5. Guardião: três acertos por cima, com recuperação entre acertos. Não pode ser derrotado pela colisão lateral do skate. Derrotá-lo com a chave coletada abre a gaiola; chegar perto do cachorro inicia o reencontro, seguido da tela de vitória.

## Regras de recuperação

- Há três bandeiras, tentativas ilimitadas e 1,8 segundo de proteção após receber dano.
- A partida começa com cinco corações. Contato lateral inválido tira um coração e o equipamento; um ataque correto não tira vida. Trocar de irmã mantém a vida atual.
- Cinco buracos reais em x=450 (65 px), x=930 (90 px), x=1850 (500 px), x=2840 (70 px) e x=3485 (120 px) interrompem o chão. Cair tira um coração, remove o equipamento e devolve ao último checkpoint a pé, com os corações restantes.
- Ao zerar os corações, o movimento para e aparece **Recomeçar do início**. Botão, Espaço ou A/✕ reiniciam a fase inteira com cinco corações e progresso zerado. Não há limite de tentativas.
- A retomada restaura os inimigos que estão à frente do checkpoint. Estrelas, chave e caixas quebradas mantêm seu progresso durante a mesma partida.
- Skate e patins sempre permanecem visíveis e disponíveis nos mesmos pontos. A coleta acontece ao entrar no ponto; sair e entrar novamente permite recuperar ou trocar o equipamento.
- Reiniciar limpa monstros, estrelas, poderes, checkpoints e vitória, mantendo apenas a irmã escolhida e os ajustes de física.

## Código

- `src/game/adventure/Adventure.ts`: progressão, itens, combate, checkpoints, resgate; sem dependência de DOM.
- `src/game/character/Movement.ts`: segundo salto, limites de velocidade e impulso da rampa.
- `src/game/character/Animation.ts`: poses das folhas originais e oito posições adicionais por irmã.
- `src/game/render/AdventureArt.ts`: animação de monstros e cachorro por atlas; gaiola, caixas, chave, itens e bandeiras em Canvas. A folha tem quatro poses para cada um dos três tipos; o golpe exibe a pose de dano e a derrota faz o sprite desaparecer gradualmente. Arte atual, desafios e prompts em [GARDEN-V3.md](GARDEN-V3.md); folha anterior em [MONSTERS.md](MONSTERS.md).
- `src/main.ts` e `src/style.css`: objetivo, poder ativo, estrelas, etapas, introdução e vitória.

As folhas originais continuam disponíveis. Nana de skate e Nunu de patins usam suas animações originais; a pé usam as novas folhas. Nunu de skate e Nana de patins têm folhas próprias de oito poses com o equipamento integrado, descritas em [POWER-POLISH.md](POWER-POLISH.md). Pés e rodas são alinhados a partir dos pixels opacos de cada célula, evitando flutuar acima da superfície.

## Validação

`npm test` cobre coleta, pulo duplo e limite de saltos, dano e proteção, checkpoints, ataque por cima, skate, três golpes no chefe, bloqueio de resgate prematuro e uma partida inteira com os controles normais, sem teletransporte. Mantém também os testes anteriores de física e gamepad.

`npm run test:browser` verifica carregamento e recuperação dos assets, teclado, toque, gamepad, escolha e troca das irmãs, pausa, reinício, responsividade e a jornada completa no navegador. O controle da partida completa é simulado pela API de gamepad e usa apenas os diagnósticos de leitura do modo de desenvolvimento. Não altera posição, vida do chefe ou estado da aventura. Capturas ficam em `test-results/`.

Teste manual: escolha uma irmã, comece, pule no primeiro monstro, pegue skate, atravesse a rampa, pegue patins, solte e pressione novamente o pulo no ar, atinja o guardião três vezes e caminhe até o cachorro. Teste a perda do poder, a retomada por checkpoint, a troca de irmã durante um salto e o botão Jogar de novo.

O Canvas exige visão para orientação espacial. A interface conserva foco visível, atalhos, controles por toque, anúncios de objetivo e redução de movimento ambiente. Som e arte carregam localmente; não há publicação automática nesta alteração.



## Checkpoints reposicionados

Existem quatro bandeiras, além do início (x=150): x=1120 perto das caixas, x=1340 no trecho plano antes da descida de skate, x=3075 antes do desafio da chave com patins e x=3890 antes do guardião. A bandeira inteira fica sobre o chão plano. Todos os retornos ficam a mais de 60 pixels das bordas de buracos e fora das patrulhas dos inimigos. O antigo ponto x=2900 ficava dentro do buraco x=2840–2910 e foi removido.

A ativação exige que a personagem esteja apoiada em chão firme. Passar pela bandeira no ar e cair no buraco não altera o retorno salvo. Uma queda devolve a personagem a pé, mantendo o progresso. Há um único skate em x=1080, antes das caixas; do checkpoint na rampa, basta voltar pelo chão para recuperá-lo. Os patins continuam perto do retorno do seu desafio. A seleção e os atalhos ficam restritos a Nana e Nunu (1/2, retrato e LB/RB).

Validação desta revisão: `npm test` aprovou 52 testes e `npm run build` concluiu sem erros. Na suíte de navegador, 22 testes passaram; o teste de travessia por teclado foi ajustado para saltar perto do segundo buraco e passou em execução isolada. Os resgates completos com Nana e Nunu passaram. Capturas das quatro bandeiras foram inspecionadas. As artes removidas da Juju estão preservadas em `archive/art/juju/` e não fazem parte do carregamento nem do build publicado.
