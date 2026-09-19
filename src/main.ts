import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/silkscreen/400.css';
import './style.css';
import { Game } from './game/Game';
import { MUSIC_TITLE } from './game/audio/AudioManager';
import { POWER_LABELS, RESCUE_KEY, MAX_HEALTH } from './game/adventure/Adventure';
import { RESCUE_LEVEL } from './game/level/Level';
import { loadArtAssets } from './game/render/ArtAssets';
import { drawCharacterPortrait } from './game/character/Animation';
import { CHARACTERS, type CharacterId } from './game/character/characters';
import { DEFAULT_PHYSICS } from './game/config';
import type { CharacterState, PhysicsConfig } from './game/types';
import { icon, pixelStar, skateLogo } from './ui/icons';

const stateLabels: Record<CharacterState, string> = {
  IDLE: 'De boa', PUSH: 'Dando impulso', ROLL: 'Sobre rodas',
  JUMP: 'Lá vou eu!', FALL: 'Voltando ao chão', LAND: 'Pouso suave',
};
const states: CharacterState[] = ['IDLE', 'PUSH', 'ROLL', 'JUMP', 'FALL', 'LAND'];

const fields: { key: keyof PhysicsConfig; label: string; min: number; max: number; step: number; unit: string; hint: string }[] = [
  { key: 'maxSpeed', label: 'Velocidade máxima', min: 100, max: 450, step: 10, unit: 'px/s', hint: 'O limite de velocidade sobre rodas.' },
  { key: 'acceleration', label: 'Aceleração', min: 150, max: 1000, step: 10, unit: 'px/s²', hint: 'A rapidez para ganhar velocidade.' },
  { key: 'deceleration', label: 'Desaceleração', min: 50, max: 450, step: 10, unit: 'px/s²', hint: 'Menor valor deixa as rodas rolarem por mais tempo.' },
  { key: 'gravity', label: 'Gravidade', min: 600, max: 1800, step: 20, unit: 'px/s²', hint: 'A força que traz a personagem ao chão.' },
  { key: 'jumpForce', label: 'Força do pulo', min: 250, max: 650, step: 10, unit: 'px/s', hint: 'A velocidade inicial de cada pulo.' },
  { key: 'braking', label: 'Freio na troca de direção', min: 300, max: 1500, step: 20, unit: 'px/s²', hint: 'A resposta ao apertar a direção contrária.' },
];

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="site-header">
    <a class="brand" href="./" aria-label="Nunu e Nana: Skate Dreams, início">
      ${skateLogo}
      <span class="brand-type">Nunu <span class="ampersand">&</span> Nana<span class="brand-subtitle">SKATE DREAMS</span></span>
    </a>
    <div class="header-note"><span class="little-spark">✦</span> Uma pequena aventura. Uma grande amizade.</div>
    <span class="version"><span class="status-dot"></span> A aventura <span class="version-number">v0.2</span></span>
  </header>

  <main>
    <section class="play-section" aria-labelledby="level-heading">
      <div class="section-heading">
        <div><div class="eyebrow">NUNU & NANA · UMA MISSÃO ESPECIAL</div><h1 id="level-heading">Operação <span>Patinhas.</span>${pixelStar}</h1></div>
        <p>Encontre seus poderes. Vença os monstrinhos.<br>Traga nosso cachorrinho de volta para casa.</p>
      </div>

      <div class="character-picker" role="group" aria-label="Escolher personagem">
        <span class="picker-label">Quem vai salvar o amigo?</span>
        <div class="character-options">
          <button class="character-option" type="button" data-character="nana" aria-label="Selecionar Nana" aria-pressed="true" disabled>
            <canvas id="selector-portrait-nana" width="64" height="64" aria-hidden="true"></canvas>
            <span><strong>Nana</strong><small>Pronta para a aventura</small></span><span class="selection-check" aria-hidden="true">✓</span>
          </button>
          <button class="character-option" type="button" data-character="nunu" aria-label="Selecionar Nunu" aria-pressed="false" disabled>
            <canvas id="selector-portrait-nunu" width="64" height="64" aria-hidden="true"></canvas>
            <span><strong>Nunu</strong><small>Pronta para a aventura</small></span><span class="selection-check" aria-hidden="true">✓</span>
          </button>
        </div>
        <span class="picker-shortcuts"><kbd>1</kbd><kbd>2</kbd><span>ou <strong>LB / RB</strong> no controle</span></span>
      </div>

      <ol class="adventure-route" aria-label="Etapas da aventura">
        <li data-stage="0" aria-current="step"><span>01</span> Siga as patinhas</li>
        <li data-stage="1"><span>02</span> Poder do skate</li>
        <li data-stage="2"><span>03</span> Poder dos patins</li>
        <li data-stage="3"><span>04</span> Salve seu amigo</li>
      </ol>

      <div class="game-shell" id="game-shell">
        <div class="game-topbar">
          <div class="level-name"><span class="level-flower">✿</span><strong>Jardim dos sonhos</strong><span class="level-divider"></span><span class="level-mode">O resgate</span></div>
          <div class="game-tools">
            <button class="tool-button" id="sound-button" aria-label="Ativar som" aria-pressed="false" title="Som (M)">${icon('volume')}</button>
            <button class="tool-button" id="pause-button" aria-label="Pausar jogo" aria-pressed="false" title="Pausar (P)">${icon('pause')}</button>
            <button class="tool-button fullscreen-button" id="fullscreen-button" aria-label="Abrir tela cheia" title="Tela cheia (F)">${icon('expand')}</button>
          </div>
        </div>
        <div class="mission-strip"><strong id="mission-objective" role="status" aria-live="polite">O cachorrinho precisa de você!</strong><div class="mission-vitals"><div class="health-hud" role="status" aria-live="polite"><span class="sr-only" id="health-label">${MAX_HEALTH} de ${MAX_HEALTH} corações</span>${Array.from({ length: MAX_HEALTH }, (_, i) => `<svg data-heart="${i}" width="23" height="21" viewBox="0 0 23 21" aria-hidden="true"><path d="M2 3h3V1h4v2h5V1h4v2h3v9h-3v3h-3v3h-3v2h-2v-2H7v-3H4v-3H2Z"/></svg>`).join('')}</div><span id="checkpoint-label">Início da aventura</span></div></div>

        <div class="canvas-wrap">
          <canvas id="game" tabindex="0" aria-label="Pista de skate da Nana. Use setas ou analógico para andar. Espaço ou A do controle para pular. P ou Start para pausar." aria-describedby="controls-description gamepad-description">Seu navegador precisa oferecer suporte a Canvas 2D para jogar.</canvas>
          <button class="character-hud" id="character-toggle" type="button" aria-label="Personagem atual: Nana. Trocar para Nunu." title="Trocar para Nunu" disabled><canvas class="portrait" id="character-portrait" width="64" height="64" aria-hidden="true"></canvas><span><strong id="character-name">Nana</strong><span>TROCAR PERSONAGEM ↔</span></span></button>
          <div class="power-hud"><strong id="power-label">A pé</strong><span id="spark-count" title="Colete todas para ganhar 8 segundos de Superbrilho">★ 0 / 12</span><strong id="super-label" hidden>Superbrilho · 8s</strong></div>
          <div class="challenge-hud" aria-label="Desafios dos poderes"><span id="skate-challenge">◇ Skate: caixas</span><span id="patins-challenge">◇ Patins: chave</span></div>
          <div class="start-hint" id="start-hint" hidden></div>
          <div class="story-panel" id="intro-panel"><span class="story-kicker">NOSSO AMIGO PRECISA DE AJUDA</span><h2>Ei! Volta com ele!</h2><p>Quebre as caixas com o skate. Pegue a chave com os patins. Nosso cachorrinho espera por você!</p><button type="button" class="primary-button" id="begin-button">Vamos buscar!</button><small>Ou mova a personagem para começar</small></div>
          <div class="story-panel victory-panel" id="victory-panel" hidden><span class="story-kicker">MISSÃO CUMPRIDA</span><h2>Amigo resgatado!</h2><p id="victory-description">A melhor aventura termina com todo mundo junto.</p><button type="button" class="primary-button" id="play-again">Jogar de novo</button></div>
          <div class="story-panel victory-panel" id="defeat-panel" hidden><span class="story-kicker">AINDA DÁ PARA SALVAR NOSSO AMIGO</span><h2>Mais uma chance?</h2><p>Recomece a fase do início com cinco corações.</p><button type="button" class="primary-button" id="retry-checkpoint">Recomeçar do início</button><small>Ou aperte pular: Espaço / A / ✕</small></div>
          <div class="pause-overlay" id="pause-overlay" hidden><div class="pause-content">${pixelStar}<h2>Uma pausa no sonho.</h2><p>Suas rodas estão te esperando.</p><button class="primary-button" id="resume-button">${icon('play')} Continuar o rolê</button><span>ou pressione P / Start</span></div></div>
          <div class="touch-controls" id="touch-controls" aria-label="Controles por toque">
            <div class="touch-directions"><button type="button" data-control="left" aria-label="Mover para esquerda">←</button><button type="button" data-control="right" aria-label="Mover para direita">→</button></div>
            <button type="button" data-control="jump" class="touch-jump" aria-label="Pular">↑<span>PULO</span></button>
          </div>
          <div class="art-loading pause-overlay" id="art-loading" aria-busy="true">
            <div class="pause-content">
              ${pixelStar}
              <p id="art-status" role="status" aria-live="polite" aria-atomic="true">Preparando o sonho das irmãs…</p>
              <button class="primary-button" id="retry-art" type="button" hidden>Tentar novamente</button>
            </div>
          </div>
        </div>
        <div class="adventure-message" id="adventure-message" role="status" aria-live="polite">Você começa a pé. Os poderes estão pelo caminho.</div>

        <div class="game-statusbar">
          <div class="movement-status"><span class="status-dot"></span><span id="movement-label">De boa</span><code id="current-state">IDLE</code></div>
          <div class="speed-indicator"><span>VELOCIDADE</span><div class="speed-track" aria-hidden="true"><div id="speed-fill"></div></div><span id="speed-value">0</span><span class="speed-unit">px/s</span></div>
          <span class="world-note">Feito de pixels e possibilidades <span>✧</span></span>
        </div>
      </div>

      <div class="controls-strip" id="controls-description">
        <div class="controls-title">Bora andar?</div>
        <div class="control-guide"><span class="key-pair"><kbd>←</kbd><kbd>→</kbd><span class="key-alt">/ A D</span></span><span>Mover</span></div>
        <div class="control-guide"><kbd class="space-key">espaço</kbd><span>Pular <small>no ar de skate: ↑ + ↑ = giro 360°</small></span></div>
        <div class="control-guide pause-guide"><kbd>P</kbd><span>Pausar</span></div>
        <button class="restart-button" id="restart-button">${icon('reset')} Recomeçar<span class="shortcut">R</span></button>
      </div>

      <div class="gamepad-strip" id="gamepad-description">
        <span class="gamepad-indicator" id="gamepad-indicator">${icon('gamepad')}<span id="gamepad-status" role="status" aria-live="polite">Controle USB: aperte um botão para conectar</span></span>
        <span class="gamepad-guide" id="gamepad-guide"><span>Analógico / direcional <strong>mover</strong></span><span><kbd>A / ✕</kbd> pular</span><span><kbd>Start</kbd> pausar</span><span><kbd>LB / RB</kbd> trocar irmã</span></span>
      </div>

      <div class="below-game">
        <div class="friendly-tip"><span class="tip-spark">${pixelStar}</span><p><strong>12 estrelas = Superbrilho!</strong> Colete todas para brilhar e ficar protegida dos monstros por 8 segundos. Pule os buracos!</p></div>
        <span class="music-status">${icon('music')}<span id="audio-status">O som começa quando você jogar</span></span>
      </div>

      <details class="tuning-panel" id="tuning-panel">
        <summary><span>${icon('sliders')} Oficina do movimento <span class="tuning-badge">EXPERIMENTE</span></span>${icon('chevron', 'chevron')}</summary>
        <div class="tuning-body">
          <div class="tuning-intro"><p>Cada rolê tem seu jeito. Ajuste os valores e volte para a pista.</p><button class="text-button" id="restore-physics">${icon('reset')} Restaurar padrão</button></div>
          <div class="sliders-grid">${fields.map(field => `<div class="physics-field"><div class="field-heading"><label for="physics-${field.key}">${field.label}</label><span><output id="value-${field.key}" for="physics-${field.key}">${DEFAULT_PHYSICS[field.key]}</output> ${field.unit}</span></div><input id="physics-${field.key}" data-physics="${field.key}" type="range" min="${field.min}" max="${field.max}" step="${field.step}" value="${DEFAULT_PHYSICS[field.key]}" aria-describedby="hint-${field.key}"><p id="hint-${field.key}">${field.hint}</p></div>`).join('')}</div>
          <div class="state-machine"><span id="character-state-label">ESTADO DA NANA</span><div>${states.map(state => `<span class="state-pill ${state === 'IDLE' ? 'active' : ''}" data-state="${state}">${state}</span>`).join('<span class="state-arrow" aria-hidden="true">→</span>')}</div></div>
          <p class="tuning-footnote">Os ajustes valem para esta sessão. Reiniciar a pista mantém os valores.</p>
        </div>
      </details>
    </section>
  </main>

  <footer class="site-footer"><span>Nunu & Nana <span class="footer-separator">/</span> Skate Dreams</span><span>Um pequeno começo para uma grande aventura. ${icon('heart')}</span><span class="footer-version">EM DESENVOLVIMENTO · 2026</span></footer>
  <div class="sr-only" id="announcement" role="status" aria-live="polite"></div>
`;

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const result = document.getElementById(id);
  if (!result) throw new Error(`Elemento ausente: ${id}`);
  return result as T;
}

const canvas = element<HTMLCanvasElement>('game');
const characterToggle = element<HTMLButtonElement>('character-toggle');
const soundButton = element<HTMLButtonElement>('sound-button');
const pauseButton = element<HTMLButtonElement>('pause-button');
const shell = element('game-shell');
let soundReady = false;
let previousPhase = 'intro';

function setText(id: string, text: string) {
  const target = element(id);
  if (target.textContent !== text) target.textContent = text;
}

const game = new Game(canvas, element('touch-controls'), {
  onFrame(snapshot) {
    const adventure = game.adventure;
    element('movement-label').textContent = snapshot.equipment === 'foot' && (snapshot.state === 'PUSH' || snapshot.state === 'ROLL') ? 'Correndo' : stateLabels[snapshot.state];
    element('current-state').textContent = snapshot.state;
    element('speed-value').textContent = String(Math.round(Math.abs(snapshot.vx)));
    element('speed-fill').style.transform = `scaleX(${Math.min(1, Math.abs(snapshot.vx) / (game.config.maxSpeed * 1.4))})`;
    document.querySelectorAll<HTMLElement>('[data-state]').forEach(pill => pill.classList.toggle('active', pill.dataset.state === snapshot.state));
    setText('power-label', POWER_LABELS[snapshot.equipment ?? 'foot']);
    setText('spark-count', `★ ${adventure.collected} / ${adventure.sparks.length}`);
    element('super-label').hidden = adventure.superTime <= 0;
    setText('super-label', `Superbrilho · ${Math.ceil(adventure.superTime)}s`);
    setText('skate-challenge', `${adventure.barrierBroken && adventure.rampCleared ? '✓' : '◇'} Skate: caixas e rampa`);
    setText('patins-challenge', `${adventure.keyCollected ? '✓' : '◇'} Patins: chave`);
    setText('mission-objective', adventure.objective);
    setText('checkpoint-label', adventure.checkpoint ? `Checkpoint ${adventure.checkpoint} / 3` : 'Início da aventura');
    setText('health-label', `${adventure.health} de ${adventure.maxHealth} corações`);
    document.querySelectorAll<SVGElement>('[data-heart]').forEach(heart => heart.classList.toggle('empty', Number(heart.dataset.heart) >= adventure.health));
    setText('adventure-message', (snapshot.trickTime ?? 0) > 0 ? 'Giro 360°! Boa manobra!' : adventure.messageTime > 0 ? adventure.message : adventure.phase === 'playing' ? 'Setas: mover · Espaço: pular · No ar de skate: ↑ + ↑ faz giro 360° · 1 / 2: trocar irmã' : 'Uma amizade vale a aventura inteira.');
    element('intro-panel').hidden = adventure.phase !== 'intro';
    element('victory-panel').hidden = adventure.phase !== 'won';
    element('defeat-panel').hidden = adventure.phase !== 'defeated';
    if (adventure.phase === 'defeated' && previousPhase !== 'defeated') element('retry-checkpoint').focus({ preventScroll: true });
    document.querySelectorAll<HTMLElement>('[data-stage]').forEach(item => {
      const stage = Number(item.dataset.stage);
      item.classList.toggle('complete', stage < adventure.stage);
      if (stage === Math.min(3, adventure.stage)) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    if (adventure.phase === 'won' && previousPhase !== 'won') {
      setText('victory-description', `${CHARACTERS[game.selectedCharacter].label} trouxe o amigo de volta! ${adventure.collected} de ${adventure.sparks.length} estrelas encontradas.`);
      element('play-again').focus({ preventScroll: true });
    }
    previousPhase = adventure.phase;
  },
  onPause(paused) {
    element('pause-overlay').hidden = !paused;
    pauseButton.innerHTML = icon(paused ? 'play' : 'pause');
    pauseButton.setAttribute('aria-label', paused ? 'Continuar jogo' : 'Pausar jogo');
    pauseButton.setAttribute('aria-pressed', String(paused));
    element('announcement').textContent = paused ? 'Jogo pausado.' : 'De volta à pista.';
  },
  onAudio(ready, error) {
    soundReady = ready;
    soundButton.setAttribute('aria-label', ready && !game.audio.muted ? 'Desativar som' : 'Ativar som');
    element('audio-status').textContent = error ?? (game.audio.muted ? 'Som desativado' : `Tocando: ${MUSIC_TITLE}`);
  },
  onStarted() { element('start-hint').classList.add('has-started'); },
  onGamepadChange(connected, name, supported) {
    const indicator = element('gamepad-indicator');
    indicator.classList.toggle('connected', connected && supported);
    indicator.title = connected ? name : '';
    element('gamepad-status').textContent = connected
      ? supported ? 'Controle conectado' : 'Controle detectado: ative o modo XInput / padrão'
      : 'Controle USB: aperte um botão para conectar';
    element('gamepad-guide').hidden = connected && !supported;
    if (connected && supported) element('start-hint').innerHTML = '<span class="hint-keys">← →</span><span>Mova o analógico. O sonho é seu.</span>';
  },
  onGamepadAudioNeeded() { element('audio-status').textContent = 'Clique no som para ativar a música'; },
  onCharacterChanged(id) { updateCharacterSelection(id); },
});

function updateCharacterSelection(id: CharacterId) {
  const character = CHARACTERS[id];
  const nextCharacter = CHARACTERS[id === 'nana' ? 'nunu' : 'nana'];
  characterToggle.setAttribute('aria-label', `Personagem atual: ${character.label}. Trocar para ${nextCharacter.label}.`);
  characterToggle.title = `Trocar para ${nextCharacter.label}`;
  element('character-name').textContent = character.label;
  element('character-state-label').textContent = `ESTADO DA ${character.label.toUpperCase()}`;
  drawCharacterPortrait(element<HTMLCanvasElement>('character-portrait'), id);
  document.querySelectorAll<HTMLButtonElement>('[data-character]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.character === id));
  });
  canvas.setAttribute('aria-label', `Aventura da ${character.label}. Resgate o cachorrinho. Use setas ou analógico para andar. Espaço ou A para pular. Com patins, aperte novamente para pulo duplo. P ou Start para pausar. 1/2 ou LB/RB para trocar personagem.`);
  element('announcement').textContent = `${character.label} selecionada. As duas podem coletar skate e patins.`;
}

document.querySelectorAll<HTMLButtonElement>('[data-character]').forEach(button => {
  button.addEventListener('click', () => {
    const id = button.dataset.character;
    if (id !== 'nana' && id !== 'nunu') return;
    game.interact();
    game.selectCharacter(id);
    canvas.focus({ preventScroll: true });
  });
});

characterToggle.addEventListener('click', () => {
  game.interact();
  game.selectCharacter(game.selectedCharacter === 'nana' ? 'nunu' : 'nana');
  canvas.focus({ preventScroll: true });
});

async function prepareArt() {
  const overlay = element('art-loading');
  const retry = element<HTMLButtonElement>('retry-art');
  game.setArtReady(false);
  characterToggle.disabled = true;
  overlay.hidden = false;
  overlay.setAttribute('aria-busy', 'true');
  retry.hidden = true;
  element('art-status').textContent = 'Preparando o sonho das irmãs…';
  document.querySelectorAll<HTMLButtonElement>('[data-character]').forEach(button => { button.disabled = true; });
  try {
    await loadArtAssets();
    drawCharacterPortrait(element<HTMLCanvasElement>('selector-portrait-nana'), 'nana');
    drawCharacterPortrait(element<HTMLCanvasElement>('selector-portrait-nunu'), 'nunu');
    game.setArtReady(true);
    updateCharacterSelection(game.selectedCharacter);
    characterToggle.disabled = false;
    document.querySelectorAll<HTMLButtonElement>('[data-character]').forEach(button => { button.disabled = false; });
    overlay.hidden = true;
    element('announcement').textContent = 'Nunu e Nana estão prontas. Escolha sua personagem e salve o cachorrinho.';
  } catch (error) {
    console.warn('Falha ao carregar a arte:', error);
    element('art-status').textContent = 'A arte não carregou. Verifique a conexão e tente de novo.';
    retry.hidden = false;
  } finally {
    overlay.setAttribute('aria-busy', 'false');
  }
}
element('retry-art').addEventListener('click', () => { void prepareArt(); });
void prepareArt();

function togglePause() {
  game.interact();
  game.setPaused(!game.paused);
  if (!game.paused) canvas.focus({ preventScroll: true });
}

function toggleSound() {
  if (soundReady || game.audio.muted) game.audio.setMuted(!game.audio.muted);
  game.interact();
  soundButton.innerHTML = icon(game.audio.muted ? 'muted' : 'volume');
  soundButton.setAttribute('aria-label', game.audio.muted ? 'Ativar som' : 'Desativar som');
  soundButton.setAttribute('aria-pressed', String(game.audio.muted));
  element('audio-status').textContent = game.audio.muted ? 'Som desativado' : soundReady ? `Tocando: ${MUSIC_TITLE}` : 'O som começa quando você jogar';
  canvas.focus({ preventScroll: true });
}

async function toggleFullscreen() {
  game.interact();
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shell.requestFullscreen();
    canvas.focus({ preventScroll: true });
  } catch (error) {
    console.warn('Não foi possível abrir tela cheia:', error);
    element('announcement').textContent = 'Tela cheia não está disponível neste navegador.';
  }
}

pauseButton.addEventListener('click', togglePause);
element('resume-button').addEventListener('click', togglePause);
soundButton.addEventListener('click', toggleSound);
element('fullscreen-button').addEventListener('click', toggleFullscreen);
if (!document.fullscreenEnabled) element<HTMLButtonElement>('fullscreen-button').hidden = true;
element('restart-button').addEventListener('click', () => {
  game.interact(); game.reset();
  element('announcement').textContent = 'De volta ao início da pista.';
});
element('begin-button').addEventListener('click', () => game.startAdventure());
element('play-again').addEventListener('click', () => { game.reset(); game.startAdventure(); });
element('retry-checkpoint').addEventListener('click', () => { game.interact(); game.retryCheckpoint(); });
canvas.addEventListener('pointerdown', () => { game.interact(); canvas.focus(); });
window.addEventListener('keydown', event => {
  if (event.repeat || event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (event.code === 'KeyP' || event.code === 'Escape' && !document.fullscreenElement) { event.preventDefault(); togglePause(); }
  if (event.code === 'KeyM') { event.preventDefault(); toggleSound(); }
  if (event.code === 'KeyR') { event.preventDefault(); game.interact(); game.reset(); }
  if (event.code === 'KeyF') { event.preventDefault(); void toggleFullscreen(); }
  if (event.code === 'Digit1' || event.code === 'Numpad1' || event.code === 'Digit2' || event.code === 'Numpad2') {
    event.preventDefault();
    game.interact();
    game.selectCharacter(event.code.endsWith('1') ? 'nana' : 'nunu');
  }
});

document.querySelectorAll<HTMLInputElement>('[data-physics]').forEach(input => {
  input.addEventListener('input', () => {
    const key = input.dataset.physics as keyof PhysicsConfig;
    const field = fields.find(field => field.key === key)!;
    const value = Number(input.value);
    if (!Number.isFinite(value)) return;
    game.config[key] = Math.max(field.min, Math.min(field.max, value));
    element(`value-${key}`).textContent = String(game.config[key]);
  });
});
element('restore-physics').addEventListener('click', () => {
  game.resetConfig();
  fields.forEach(field => {
    element<HTMLInputElement>(`physics-${field.key}`).value = String(game.config[field.key]);
    element(`value-${field.key}`).textContent = String(game.config[field.key]);
  });
  element('announcement').textContent = 'Física restaurada para os valores originais.';
});

// Read-only diagnostics for local movement verification, omitted from production.
if (import.meta.env.DEV) {
  Object.defineProperty(window, '__SKATE__', { configurable: true, get: () => ({
    character: { ...game.character.snapshot }, camera: { ...game.camera.snapshot },
    config: { ...game.config }, paused: game.paused, muted: game.audio.muted,
    gamepad: { ...game.input.gamepadStatus },
    selectedCharacter: game.selectedCharacter,
    adventure: {
      phase: game.adventure.phase, stage: game.adventure.stage,
      checkpoint: game.adventure.checkpoint, collected: game.adventure.collected,
      bossHP: game.adventure.boss.hp, retries: game.adventure.retries,
      health: game.adventure.health, maxHealth: game.adventure.maxHealth,
      superTime: game.adventure.superTime, superAwarded: game.adventure.superAwarded,
      barrierBroken: game.adventure.barrierBroken, keyCollected: game.adventure.keyCollected,
      usedDoubleJump: game.character.usedDoubleJump,
      rescueKey: { ...RESCUE_KEY },
      skateRamp: { ...RESCUE_LEVEL.skateRamp },
      rampCleared: game.adventure.rampCleared,
      gaps: game.adventure.level.gaps?.map(gap => ({ ...gap })) ?? [],
      enemies: game.adventure.enemies.map(enemy => ({ ...enemy })),
      pickups: game.adventure.pickups.map(pickup => ({ ...pickup })),
    },
  }) });
}
if (import.meta.hot) import.meta.hot.dispose(() => game.dispose());
