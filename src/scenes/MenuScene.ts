import Phaser from 'phaser';
import { ALL_LEVELS, getDefaultLevel } from '../data/levels';
import { WordLevel, QuizMode } from '../data/types';
import { loadPlayerStats } from '../data/progress';
import { soundFx } from '../utils/soundEffects';

export class MenuScene extends Phaser.Scene {
  private selectedLevelIndex: number = 0;
  private levelText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private badgeIconGraphics!: Phaser.GameObjects.Graphics;
  private playerPreview!: Phaser.GameObjects.Image;

  constructor() {
    super('MenuScene');
  }

  init(data?: { levelId?: string }): void {
    if (data?.levelId) {
      const idx = ALL_LEVELS.findIndex(l => l.id === data.levelId);
      if (idx !== -1) {
        this.selectedLevelIndex = idx;
        localStorage.setItem('word_runner_selected_level', data.levelId);
        return;
      }
    }

    const savedLevelId = localStorage.getItem('word_runner_selected_level');
    if (savedLevelId) {
      const savedIdx = ALL_LEVELS.findIndex(l => l.id === savedLevelId);
      if (savedIdx !== -1) {
        this.selectedLevelIndex = savedIdx;
        return;
      }
    }

    const defaultLevel = getDefaultLevel();
    const foundIdx = ALL_LEVELS.findIndex(l => l.id === defaultLevel.id);
    if (foundIdx !== -1) {
      this.selectedLevelIndex = foundIdx;
    }
  }

  create(): void {
    const { width, height } = this.scale;
    const stats = loadPlayerStats();

    // 1. Background
    const bg = this.add.image(width / 2, height / 2, 'dojang_bg');
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.65);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x0a0a14, 0.75);
    overlay.fillRect(0, 0, width, height);

    // 2. Title Banner
    const titleText = this.add.text(width / 2, 58, 'WORD RUNNER', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '34px',
      color: '#ffe135',
      stroke: '#b83000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, 102, '8-BIT RETRO SUFFIX CHALLENGE', {
      fontFamily: "'Fredoka', 'Press Start 2P', sans-serif",
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#38bdf8',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // 3. Characters Flanking (Crisp blocky sprites)
    const groundY = 320;
    const initialLevel = ALL_LEVELS[this.selectedLevelIndex] || ALL_LEVELS[0];
    this.playerPreview = this.add.image(90, groundY, `player_idle_${initialLevel.id}`);
    this.playerPreview.setOrigin(0.5, 1);
    this.playerPreview.setScale(2.5);

    this.add.text(90, groundY + 16, 'RUNNER', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '11px',
      color: '#ffe135',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    const guardianPreview = this.add.image(width - 90, groundY, 'word_guardian');
    guardianPreview.setOrigin(0.5, 1);
    guardianPreview.setScale(2.5);

    this.add.text(width - 90, groundY + 16, 'SCHOLAR', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '11px',
      color: '#38bdf8',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // 4. Level Selector Box
    const boxY = 236;
    const boxW = 600;
    const boxH = 136;

    const selectorBox = this.add.graphics();
    selectorBox.fillStyle(0x0a0c18, 0.96);
    selectorBox.fillRoundedRect(width / 2 - boxW / 2, boxY - boxH / 2, boxW, boxH, 8);
    selectorBox.lineStyle(2, 0xffe135, 1);
    selectorBox.strokeRoundedRect(width / 2 - boxW / 2, boxY - boxH / 2, boxW, boxH, 8);

    this.add.text(width / 2, boxY - 42, '◆ SELECT WORD SHEET ◆', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: '#ffe135'
    }).setOrigin(0.5);

    this.levelText = this.add.text(width / 2, boxY - 14, '', {
      fontFamily: "'Fredoka', 'Press Start 2P', sans-serif",
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 480 }
    }).setOrigin(0.5);

    this.subtitleText = this.add.text(width / 2, boxY + 18, '', {
      fontFamily: "'Fredoka', sans-serif",
      fontSize: '16px',
      color: '#38bdf8',
      align: 'center'
    }).setOrigin(0.5);

    const leftArrow = this.add.text(width / 2 - boxW / 2 + 30, boxY, '◀', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '24px',
      color: '#ffe135'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const rightArrow = this.add.text(width / 2 + boxW / 2 - 30, boxY, '▶', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '24px',
      color: '#ffe135'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    leftArrow.on('pointerdown', () => this.changeLevel(-1));
    rightArrow.on('pointerdown', () => this.changeLevel(1));

    this.badgeIconGraphics = this.add.graphics();
    this.updateLevelDisplay();

    // 5. High Scores / Stats Summary
    this.add.text(width / 2, 342, `BEST STREAK: ${stats.bestStreak}  |  WORDS MASTERED: ${stats.totalWordsCompleted}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: '#00ff88'
    }).setOrigin(0.5);

    // 6. Action Buttons
    let isTransitioning = false;
    let isHardMode = localStorage.getItem('word_runner_hard_mode') === 'true';
    let isEndlessMode = localStorage.getItem('word_runner_endless') === 'true';
    const quizModes: QuizMode[] = ['suffix', 'spelling', 'mixed'];
    let currentQuizMode: QuizMode = (localStorage.getItem('word_runner_quiz_mode') as QuizMode) || 'suffix';
    if (!quizModes.includes(currentQuizMode)) {
      currentQuizMode = 'suffix';
    }

    const btnY = 420;
    const btnW = 280;
    const btnH = 60;

    // Start Button Container
    const startContainer = this.add.container(width / 2 - 160, btnY);
    const startBg = this.add.graphics();
    const startText = this.add.text(0, 0, 'START RUNNER', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '15px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const startZone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
    startContainer.add([startBg, startText, startZone]);

    const updateStartButton = (hover: boolean = false) => {
      startBg.clear();
      if (isHardMode) {
        startBg.fillStyle(hover ? 0x991111 : 0x770a0a, 1);
        startBg.lineStyle(3, hover ? 0xff5555 : 0xff0000, 1);
      } else {
        startBg.fillStyle(hover ? 0x189e52 : 0x0e7e3e, 1);
        startBg.lineStyle(3, hover ? 0x55ff99 : 0x00ff66, 1);
      }
      startBg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
      startBg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);
    };
    updateStartButton(false);

    const updateTitleTheme = () => {
      if (isHardMode) {
        titleText.setColor('#ff3333');
        titleText.setStroke('#660000', 6);
        bg.setTexture('dojang_bg_hard');
      } else {
        titleText.setColor('#ffe135');
        titleText.setStroke('#b83000', 6);
        bg.setTexture('dojang_bg');
      }
    };
    updateTitleTheme();

    this.tweens.add({
      targets: startText,
      alpha: 0.35,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    const startGame = () => {
      if (isTransitioning) return;
      isTransitioning = true;
      soundFx.playSelect();

      this.time.delayedCall(50, () => {
        const currentLevel = ALL_LEVELS[this.selectedLevelIndex];
        localStorage.setItem('word_runner_selected_level', currentLevel.id);
        this.scene.start('RunnerScene', {
          level: currentLevel,
          isHardMode,
          isEndlessMode,
          quizMode: currentQuizMode
        });
      });
    };

    startZone.on('pointerdown', startGame);
    startZone.on('pointerover', () => updateStartButton(true));
    startZone.on('pointerout', () => updateStartButton(false));

    // Stats Button Container
    const statsContainer = this.add.container(width / 2 + 160, btnY);
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x282848, 1);
    statsBg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
    statsBg.lineStyle(3, 0x7777aa, 1);
    statsBg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);

    const statsText = this.add.text(0, 0, 'VIEW STATS', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '15px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const statsZone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
    statsContainer.add([statsBg, statsText, statsZone]);

    const viewStats = () => {
      if (isTransitioning) return;
      isTransitioning = true;
      soundFx.playSelect();
      this.time.delayedCall(50, () => {
        this.scene.start('StatsScene');
      });
    };

    statsZone.on('pointerdown', viewStats);
    statsZone.on('pointerover', () => {
      statsBg.clear();
      statsBg.fillStyle(0x3d3d6e, 1);
      statsBg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
      statsBg.lineStyle(3, 0xaaaae0, 1);
      statsBg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);
    });
    statsZone.on('pointerout', () => {
      statsBg.clear();
      statsBg.fillStyle(0x282848, 1);
      statsBg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
      statsBg.lineStyle(3, 0x7777aa, 1);
      statsBg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);
    });

    // Bottom Mode Toggles
    const getQuizModeLabel = (m: QuizMode): string => {
      if (m === 'suffix') return 'QUIZ: PICK SUFFIX';
      if (m === 'spelling') return 'QUIZ: SPELL WORD';
      return 'QUIZ: MIXED';
    };

    const toggleHardMode = () => {
      isHardMode = !isHardMode;
      localStorage.setItem('word_runner_hard_mode', isHardMode.toString());
      hardModeToggle.setText(`SPEED: ${isHardMode ? 'FAST' : 'NORMAL'}`);
      hardModeToggle.setColor(isHardMode ? '#ff4444' : '#888888');
      updateStartButton(false);
      updateTitleTheme();
      if (isHardMode) {
        soundFx.playHardMode();
      } else {
        soundFx.playSelect();
      }
    };

    const toggleQuizMode = () => {
      const nextIdx = (quizModes.indexOf(currentQuizMode) + 1) % quizModes.length;
      currentQuizMode = quizModes[nextIdx];
      localStorage.setItem('word_runner_quiz_mode', currentQuizMode);
      quizToggle.setText(getQuizModeLabel(currentQuizMode));
      soundFx.playSelect();
    };

    const toggleEndlessMode = () => {
      isEndlessMode = !isEndlessMode;
      localStorage.setItem('word_runner_endless', isEndlessMode.toString());
      endlessToggle.setText(`RUN: ${isEndlessMode ? 'ENDLESS ∞' : '10 WORDS'}`);
      endlessToggle.setColor(isEndlessMode ? '#00ffaa' : '#ffe135');
      soundFx.playSelect();
    };

    const toggleY = 495;
    const hardModeToggle = this.add.text(140, toggleY, `SPEED: ${isHardMode ? 'FAST' : 'NORMAL'}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: isHardMode ? '#ff4444' : '#888888'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    hardModeToggle.on('pointerdown', toggleHardMode);

    const quizToggle = this.add.text(width / 2, toggleY, getQuizModeLabel(currentQuizMode), {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: '#38bdf8'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    quizToggle.on('pointerdown', toggleQuizMode);

    const endlessToggle = this.add.text(width - 150, toggleY, `RUN: ${isEndlessMode ? 'ENDLESS ∞' : '10 WORDS'}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: isEndlessMode ? '#00ffaa' : '#ffe135'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    endlessToggle.on('pointerdown', toggleEndlessMode);

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', startGame);
      this.input.keyboard.on('keydown-ENTER', startGame);
      this.input.keyboard.on('keydown-S', viewStats);
      this.input.keyboard.on('keydown-H', toggleHardMode);
      this.input.keyboard.on('keydown-M', toggleQuizMode);
      this.input.keyboard.on('keydown-E', toggleEndlessMode);
      this.input.keyboard.on('keydown-V', () => {
        soundFx.playSelect();
        this.scene.start('VoiceConfigScene', { returnTo: 'MenuScene' });
      });
      this.input.keyboard.on('keydown-LEFT', () => this.changeLevel(-1));
      this.input.keyboard.on('keydown-RIGHT', () => this.changeLevel(1));
    }

    // 7. Voice Configuration & Sound Toggle buttons in top right
    const soundToggle = this.add.text(width - 24, 20, soundFx.isEnabled() ? '🔊' : '🔇', {
      fontSize: '20px'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    soundToggle.on('pointerdown', () => {
      const enabled = soundFx.toggleSound();
      soundToggle.setText(enabled ? '🔊' : '🔇');
    });

    const voiceBtn = this.add.text(width - 70, 22, '⚙️ VOICE', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: '#ffe135'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    voiceBtn.on('pointerdown', () => {
      soundFx.playSelect();
      this.scene.start('VoiceConfigScene', { returnTo: 'MenuScene' });
    });
    voiceBtn.on('pointerover', () => voiceBtn.setColor('#ffffff'));
    voiceBtn.on('pointerout', () => voiceBtn.setColor('#ffe135'));
  }

  private changeLevel(direction: number): void {
    soundFx.playSelect();
    this.selectedLevelIndex = (this.selectedLevelIndex + direction + ALL_LEVELS.length) % ALL_LEVELS.length;
    const level = ALL_LEVELS[this.selectedLevelIndex];
    if (level) {
      localStorage.setItem('word_runner_selected_level', level.id);
    }
    this.updateLevelDisplay();
  }

  private updateLevelDisplay(): void {
    const level: WordLevel = ALL_LEVELS[this.selectedLevelIndex];
    this.levelText.setText(level.title);
    this.subtitleText.setText(level.subtitle);

    if (this.playerPreview) {
      this.playerPreview.setTexture(`player_idle_${level.id}`);
    }

    this.badgeIconGraphics.clear();
    const bx = this.scale.width / 2 - 70;
    const by = 270;

    const colorInt = parseInt(level.badgeColor.replace('#', '0x'), 16);
    this.badgeIconGraphics.fillStyle(colorInt, 1);
    this.badgeIconGraphics.fillRect(bx, by, 140, 10);
    this.badgeIconGraphics.lineStyle(2, 0x222222, 1);
    this.badgeIconGraphics.strokeRect(bx, by, 140, 10);

    if (level.accentColor) {
      const stripeInt = parseInt(level.accentColor.replace('#', '0x'), 16);
      this.badgeIconGraphics.fillStyle(stripeInt, 1);
      this.badgeIconGraphics.fillRect(bx + 96, by, 16, 10);
    }
  }
}
