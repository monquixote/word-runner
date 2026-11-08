import Phaser from 'phaser';
import { ALL_LEVELS, getDefaultLevel } from '../data/levels';
import { WordLevel, QuizMode } from '../data/types';
import { loadPlayerStats } from '../data/progress';
import { soundFx } from '../utils/soundEffects';
import { speechManager } from '../utils/pronunciation';

export class MenuScene extends Phaser.Scene {
  private selectedLevelIndex: number = 0; // Default to Level 1 (School Suffix Sheet)
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

    this.input.on('pointerdown', () => {
      soundFx.primeAudio();
      speechManager.primeSpeech();
    });

    // 1. Building Site Pixel-Art Panorama Background
    const bg = this.add.image(width / 2, height / 2, 'dojang_bg');
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.92);

    // Subtle dark industrial tint so text pops while keeping cranes & bricks visible
    const overlay = this.add.graphics();
    overlay.fillStyle(0x090b12, 0.48);
    overlay.fillRect(0, 0, width, height);

    // Top & Bottom Diagonal Yellow/Black Construction Hazard Bars
    const hazardBar = this.add.graphics();
    const drawHazardStrip = (yPos: number, barH: number) => {
      hazardBar.fillStyle(0xf59e0b, 1);
      hazardBar.fillRect(0, yPos, width, barH);
      hazardBar.fillStyle(0x111827, 1);
      for (let x = -16; x < width + 16; x += 24) {
        hazardBar.beginPath();
        hazardBar.moveTo(x, yPos);
        hazardBar.lineTo(x + 12, yPos);
        hazardBar.lineTo(x + 4, yPos + barH);
        hazardBar.lineTo(x - 8, yPos + barH);
        hazardBar.closePath();
        hazardBar.fillPath();
      }
    };
    drawHazardStrip(0, 10);
    drawHazardStrip(height - 10, 10);

    // 2. Title Banner (Heavy Construction / Demolition Style)
    const titleBannerBg = this.add.graphics();
    titleBannerBg.fillStyle(0x111827, 0.85);
    titleBannerBg.fillRoundedRect(width / 2 - 310, 26, 620, 96, 8);
    titleBannerBg.lineStyle(3, 0xf59e0b, 1);
    titleBannerBg.strokeRoundedRect(width / 2 - 310, 26, 620, 96, 8);

    const titleText = this.add.text(width / 2, 58, 'WORD RUNNER', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '34px',
      color: '#ffe135',
      stroke: '#991b1b',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, 100, '🚜 BULLDOZER SUFFIX DEMOLITION 🧱', {
      fontFamily: "'Fredoka', 'Press Start 2P', sans-serif",
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#fb923c',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 3. Flanking Site Vehicles & Crew (Crisp blocky pixel art)
    const groundY = 330;
    const initialLevel = ALL_LEVELS[this.selectedLevelIndex] || ALL_LEVELS[0];

    // Left: Rubble / Brick Pad under Bulldozer
    const sitePadGraphics = this.add.graphics();
    sitePadGraphics.fillStyle(0x1f2937, 0.9);
    sitePadGraphics.fillRoundedRect(22, groundY - 6, 168, 16, 4);
    sitePadGraphics.lineStyle(2, 0xf59e0b, 0.8);
    sitePadGraphics.strokeRoundedRect(22, groundY - 6, 168, 16, 4);

    // Right: Rubble / Brick Pad under Site Foreman
    sitePadGraphics.fillStyle(0x1f2937, 0.9);
    sitePadGraphics.fillRoundedRect(width - 190, groundY - 6, 168, 16, 4);
    sitePadGraphics.lineStyle(2, 0xf97316, 0.8);
    sitePadGraphics.strokeRoundedRect(width - 190, groundY - 6, 168, 16, 4);

    this.playerPreview = this.add.image(106, groundY, `player_idle_${initialLevel.id}`);
    this.playerPreview.setOrigin(0.5, 1);
    this.playerPreview.setScale(2.4);

    this.add.text(106, groundY + 22, 'BULLDOZER', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '11px',
      color: '#ffe135',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    const guardianPreview = this.add.image(width - 106, groundY, 'word_guardian');
    guardianPreview.setOrigin(0.5, 1);
    guardianPreview.setScale(2.5);

    this.add.text(width - 106, groundY + 22, 'FOREMAN', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '11px',
      color: '#fb923c',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // 4. Center Level Selector Box (Bolted Steel Construction Signboard)
    const boxY = 236;
    const boxW = 540;
    const boxH = 142;
    const boxLeft = width / 2 - boxW / 2;
    const boxTop = boxY - boxH / 2;

    const selectorBox = this.add.graphics();
    // Main steel plate
    selectorBox.fillStyle(0x0f1420, 0.96);
    selectorBox.fillRoundedRect(boxLeft, boxTop, boxW, boxH, 8);
    selectorBox.lineStyle(3, 0xf59e0b, 1);
    selectorBox.strokeRoundedRect(boxLeft, boxTop, boxW, boxH, 8);

    // Inner blueprint border
    selectorBox.lineStyle(1, 0x38bdf8, 0.4);
    selectorBox.strokeRect(boxLeft + 8, boxTop + 8, boxW - 16, boxH - 16);

    // Corner Steel Rivets
    selectorBox.fillStyle(0x9ca3af, 1);
    const rivetOffsets = [
      [boxLeft + 14, boxTop + 14],
      [boxLeft + boxW - 14, boxTop + 14],
      [boxLeft + 14, boxTop + boxH - 14],
      [boxLeft + boxW - 14, boxTop + boxH - 14]
    ];
    for (const [rx, ry] of rivetOffsets) {
      selectorBox.fillRect(rx - 3, ry - 3, 6, 6);
    }

    this.add.text(width / 2, boxY - 44, '🚧 SELECT SITE CONTRACT 🚧', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: '#ffe135'
    }).setOrigin(0.5);

    this.levelText = this.add.text(width / 2, boxY - 14, '', {
      fontFamily: "'Fredoka', 'Press Start 2P', sans-serif",
      fontSize: '21px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 430 }
    }).setOrigin(0.5);

    this.subtitleText = this.add.text(width / 2, boxY + 16, '', {
      fontFamily: "'Fredoka', sans-serif",
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#38bdf8',
      align: 'center'
    }).setOrigin(0.5);

    const leftArrow = this.add.text(width / 2 - boxW / 2 + 28, boxY, '◀', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '24px',
      color: '#ffe135'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const rightArrow = this.add.text(width / 2 + boxW / 2 - 28, boxY, '▶', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '24px',
      color: '#ffe135'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    leftArrow.on('pointerdown', () => this.changeLevel(-1));
    rightArrow.on('pointerdown', () => this.changeLevel(1));

    this.badgeIconGraphics = this.add.graphics();
    this.updateLevelDisplay();

    // 5. High Scores / Demolition Stats Summary
    const statsBanner = this.add.graphics();
    statsBanner.fillStyle(0x0b0f19, 0.9);
    statsBanner.fillRoundedRect(width / 2 - 280, 330, 560, 28, 6);
    statsBanner.lineStyle(1.5, 0x334155, 0.9);
    statsBanner.strokeRoundedRect(width / 2 - 280, 330, 560, 28, 6);

    this.add.text(width / 2, 344, `BEST STREAK: ${stats.bestStreak}  |  WALLS SMASHED: ${stats.totalWordsCompleted}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '11px',
      color: '#4ade80'
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

    const btnY = 416;
    const btnW = 280;
    const btnH = 58;

    // Start Bulldozer Button Container
    const startContainer = this.add.container(width / 2 - 160, btnY);
    const startBg = this.add.graphics();
    const startText = this.add.text(0, 0, 'START DOZER', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '15px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    const startZone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
    startContainer.add([startBg, startText, startZone]);

    const updateStartButton = (hover: boolean = false) => {
      startBg.clear();
      if (isHardMode) {
        startBg.fillStyle(hover ? 0xb91c1c : 0x7f1d1d, 1);
        startBg.lineStyle(3, hover ? 0xff6666 : 0xef4444, 1);
      } else {
        startBg.fillStyle(hover ? 0xd97706 : 0xb45309, 1);
        startBg.lineStyle(3, hover ? 0xfef08a : 0xffe135, 1);
      }
      startBg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
      startBg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);
    };
    updateStartButton(false);

    const updateTitleTheme = () => {
      if (isHardMode) {
        titleText.setColor('#ff4444');
        titleText.setStroke('#450a0a', 6);
        bg.setTexture('dojang_bg_hard');
      } else {
        titleText.setColor('#ffe135');
        titleText.setStroke('#991b1b', 6);
        bg.setTexture('dojang_bg');
      }
    };
    updateTitleTheme();

    this.tweens.add({
      targets: startText,
      alpha: 0.4,
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

    // Site Stats Button Container
    const statsContainer = this.add.container(width / 2 + 160, btnY);
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x1e293b, 1);
    statsBg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
    statsBg.lineStyle(3, 0x64748b, 1);
    statsBg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);

    const statsText = this.add.text(0, 0, 'SITE STATS', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '15px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
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
      statsBg.fillStyle(0x334155, 1);
      statsBg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
      statsBg.lineStyle(3, 0x94a3b8, 1);
      statsBg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);
    });
    statsZone.on('pointerout', () => {
      statsBg.clear();
      statsBg.fillStyle(0x1e293b, 1);
      statsBg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
      statsBg.lineStyle(3, 0x64748b, 1);
      statsBg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);
    });

    // Bottom Mode Toggles Bar
    const toggleBarBg = this.add.graphics();
    toggleBarBg.fillStyle(0x090c14, 0.92);
    toggleBarBg.fillRect(0, 468, width, 62);
    toggleBarBg.lineStyle(2, 0x334155, 1);
    toggleBarBg.lineBetween(0, 468, width, 468);

    const getQuizModeLabel = (m: QuizMode): string => {
      if (m === 'suffix') return 'MODE: PICK SUFFIX';
      if (m === 'spelling') return 'MODE: SPELL WORD';
      return 'MODE: MIXED';
    };

    const toggleHardMode = () => {
      isHardMode = !isHardMode;
      localStorage.setItem('word_runner_hard_mode', isHardMode.toString());
      hardModeToggle.setText(`GEAR: ${isHardMode ? 'TURBO' : 'NORMAL'}`);
      hardModeToggle.setColor(isHardMode ? '#ff4444' : '#94a3b8');
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
      endlessToggle.setText(`SHIFT: ${isEndlessMode ? 'ENDLESS ∞' : '10 WALLS'}`);
      endlessToggle.setColor(isEndlessMode ? '#4ade80' : '#ffe135');
      soundFx.playSelect();
    };

    const toggleY = 498;
    const hardModeToggle = this.add.text(145, toggleY, `GEAR: ${isHardMode ? 'TURBO' : 'NORMAL'}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: isHardMode ? '#ff4444' : '#94a3b8'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    hardModeToggle.on('pointerdown', toggleHardMode);

    const quizToggle = this.add.text(width / 2, toggleY, getQuizModeLabel(currentQuizMode), {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: '#38bdf8'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    quizToggle.on('pointerdown', toggleQuizMode);

    const endlessToggle = this.add.text(width - 155, toggleY, `SHIFT: ${isEndlessMode ? 'ENDLESS ∞' : '10 WALLS'}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: isEndlessMode ? '#4ade80' : '#ffe135'
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
    const soundToggle = this.add.text(width - 20, 22, soundFx.isEnabled() ? '🔊' : '🔇', {
      fontSize: '20px'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    soundToggle.on('pointerdown', () => {
      const enabled = soundFx.toggleSound();
      soundToggle.setText(enabled ? '🔊' : '🔇');
    });

    const voiceBtn = this.add.text(width - 62, 24, '⚙️ VOICE', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: '#ffe135',
      stroke: '#000000',
      strokeThickness: 3
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

    // Draw mini brick wall + level livery bar inside the selector box
    this.badgeIconGraphics.clear();
    const bx = this.scale.width / 2 - 90;
    const by = 274;
    const bw = 180;
    const bh = 14;

    // Brick wall base
    this.badgeIconGraphics.fillStyle(0x991b1b, 1);
    this.badgeIconGraphics.fillRect(bx, by, bw, bh);

    // Level badge color center plate
    const colorInt = parseInt(level.badgeColor.replace('#', '0x'), 16);
    this.badgeIconGraphics.fillStyle(colorInt, 1);
    this.badgeIconGraphics.fillRect(bx + 28, by + 2, bw - 56, bh - 4);

    if (level.accentColor) {
      const stripeInt = parseInt(level.accentColor.replace('#', '0x'), 16);
      this.badgeIconGraphics.fillStyle(stripeInt, 1);
      this.badgeIconGraphics.fillRect(bx + bw - 52, by + 2, 16, bh - 4);
    }

    this.badgeIconGraphics.lineStyle(2, 0xf59e0b, 1);
    this.badgeIconGraphics.strokeRect(bx, by, bw, bh);
  }
}
