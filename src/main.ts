import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { RunnerScene } from './scenes/RunnerScene';
import { ResultScene } from './scenes/ResultScene';
import { StatsScene } from './scenes/StatsScene';
import { VoiceConfigScene } from './scenes/VoiceConfigScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 960,
  height: 540,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#0b0b0f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, RunnerScene, ResultScene, StatsScene, VoiceConfigScene]
};

export const game = new Phaser.Game(config);

function resizeApp() {
  const container = document.getElementById('game-container');
  if (container) {
    container.style.width = window.innerWidth + 'px';
    container.style.height = window.innerHeight + 'px';
  }
  if (game && game.scale) {
    game.scale.refresh();
  }
}

import { soundFx } from './utils/soundEffects';
import { speechManager } from './utils/pronunciation';

function unlockAudioAndSpeech() {
  soundFx.primeAudio();
  speechManager.primeSpeech();
}

if (typeof window !== 'undefined') {
  window.addEventListener('touchstart', unlockAudioAndSpeech, { passive: true });
  window.addEventListener('touchend', unlockAudioAndSpeech, { passive: true });
  window.addEventListener('pointerup', unlockAudioAndSpeech, { passive: true });
  window.addEventListener('pointerdown', unlockAudioAndSpeech, { passive: true });
  window.addEventListener('click', unlockAudioAndSpeech, { passive: true });
  window.addEventListener('keydown', unlockAudioAndSpeech, { passive: true });
}

window.addEventListener('resize', resizeApp);
window.addEventListener('orientationchange', () => {
  setTimeout(resizeApp, 100);
  setTimeout(resizeApp, 300);
});

resizeApp();
