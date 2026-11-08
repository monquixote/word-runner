import Phaser from 'phaser';
import { WordLevel, PlayerStats, QuizMode } from '../data/types';
import { soundFx } from '../utils/soundEffects';
import { RoundMistake } from './RunnerScene';
import { speechManager } from '../utils/pronunciation';

interface ResultSceneInitData {
  level: WordLevel;
  stats: PlayerStats;
  passed: boolean;
  isCumulativeExam?: boolean;
  isEndlessMode?: boolean;
  quizMode?: QuizMode;
  roundMistakes?: RoundMistake[];
}

export class ResultScene extends Phaser.Scene {
  private level!: WordLevel;
  private stats!: PlayerStats;
  private passed!: boolean;
  private isCumulativeExam: boolean = false;
  private isEndlessMode: boolean = false;
  private quizMode: QuizMode = 'suffix';
  private roundMistakes: RoundMistake[] = [];

  constructor() {
    super('ResultScene');
  }

  init(data: ResultSceneInitData): void {
    this.level = data.level;
    this.stats = data.stats;
    this.passed = data.passed;
    this.isCumulativeExam = Boolean(data.isCumulativeExam);
    this.isEndlessMode = Boolean(data.isEndlessMode);
    this.quizMode = data.quizMode || 'suffix';
    this.roundMistakes = data.roundMistakes || [];
  }

  create(): void {
    const { width, height } = this.scale;

    this.input.on('pointerdown', () => {
      soundFx.primeAudio();
      speechManager.primeSpeech();
    });

    const siteBg = this.add.image(width / 2, height / 2, 'dojang_bg');
    siteBg.setDisplaySize(width, height);
    siteBg.setAlpha(0.35);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0c14, 0.88);
    bg.fillRect(0, 0, width, height);

    bg.lineStyle(3, this.passed ? 0xf59e0b : 0xff3333, 1);
    bg.strokeRect(16, 16, width - 32, height - 32);

    let titleText = 'KEEP PRACTICING!';
    let titleColor = '#ff4444';
    if (this.roundMistakes.length === 0 && this.passed) {
      titleText = 'FLAWLESS DEMOLITION!';
      titleColor = '#ffe135';
    } else if (this.passed) {
      titleText = 'SITE CLEARED!';
      titleColor = '#00ff66';
    }

    this.add.text(width / 2, 48, titleText, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '26px',
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(width / 2, 84, `${this.level.title} (${this.level.subtitle})`, {
      fontFamily: "'Fredoka', 'Press Start 2P', sans-serif",
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffe135'
    }).setOrigin(0.5);

    this.add.text(
      width / 2,
      116,
      `SCORE: ${this.stats.score}   |   STREAK: ${this.stats.bestStreak}   |   WALLS SMASHED: ${this.stats.totalWordsCompleted}`,
      {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '12px',
        color: '#cccccc'
      }
    ).setOrigin(0.5);

    const boxX = 32;
    const boxY = 140;
    const boxW = width - 64;
    const boxH = 280;

    const reviewBg = this.add.graphics();
    reviewBg.fillStyle(0x101420, 0.94);
    reviewBg.fillRoundedRect(boxX, boxY, boxW, boxH, 8);
    reviewBg.lineStyle(2, this.roundMistakes.length > 0 ? 0xff4444 : 0x00ff88, 1);
    reviewBg.strokeRoundedRect(boxX, boxY, boxW, boxH, 8);

    if (this.roundMistakes.length === 0) {
      this.add.text(width / 2, boxY + 70, '🚜 AMAZING! ZERO MISTAKES! 🧱', {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '18px',
        color: '#ffe135'
      }).setOrigin(0.5);

      this.add.text(width / 2, boxY + 130, 'Every brick wall and suffix barrier was smashed', {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: '18px',
        color: '#ffffff'
      }).setOrigin(0.5);

      this.add.text(width / 2, boxY + 170, 'with 100% spelling accuracy!', {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: '18px',
        color: '#00ff88'
      }).setOrigin(0.5);
    } else {
      this.add.text(boxX + 24, boxY + 30, `WORDS TO REVIEW (${this.roundMistakes.length} MISSED):`, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '14px',
        color: '#ff6666'
      }).setOrigin(0, 0.5);

      const maxToDisplay = 4;
      const displayCount = Math.min(this.roundMistakes.length, maxToDisplay);
      const hasOverflow = this.roundMistakes.length > maxToDisplay;

      for (let i = 0; i < (hasOverflow ? maxToDisplay - 1 : displayCount); i++) {
        const m = this.roundMistakes[i];
        const rowY = boxY + 74 + i * 44;

        const promptDisplay = m.prompt.length > 24 ? m.prompt.substring(0, 22) + '..' : m.prompt;
        const answerDisplay = m.correctAnswer.length > 28 ? m.correctAnswer.substring(0, 26) + '..' : m.correctAnswer;

        this.add.text(boxX + 28, rowY, `✗ ${promptDisplay}`, {
          fontFamily: "'Fredoka', 'Press Start 2P', sans-serif",
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#ffffff'
        }).setOrigin(0, 0.5);

        this.add.text(boxX + 380, rowY, `➔ ${answerDisplay}`, {
          fontFamily: "'Fredoka', 'Press Start 2P', sans-serif",
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#00ff88'
        }).setOrigin(0, 0.5);

        const spokenWord = m.combinedWord || m.word?.combinedWord || m.correctAnswer;
        if (spokenWord) {
          const speaker = this.add.text(boxX + boxW - 36, rowY, '🔊', {
            fontSize: '22px'
          }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

          speaker.on('pointerdown', () => {
            speechManager.speakWord(spokenWord);
            this.tweens.add({
              targets: speaker,
              scale: 1.35,
              duration: 100,
              yoyo: true,
              ease: 'Quad.easeOut'
            });
          });
        }
      }

      if (hasOverflow) {
        const remaining = this.roundMistakes.length - (maxToDisplay - 1);
        this.add.text(boxX + 28, boxY + 74 + (maxToDisplay - 1) * 44, `... and ${remaining} more missed word(s).`, {
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '12px',
          color: '#aaaaaa'
        }).setOrigin(0, 0.5);
      }

      this.add.text(width / 2, boxY + boxH - 24, '💡 Click 🔊 to hear word | RETRY MISSED to practice!', {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '11px',
        color: '#ffbb44'
      }).setOrigin(0.5);
    }

    let isTransitioning = false;
    const btnY = height - 52;
    const btnH = 52;

    const handleFullRetry = () => {
      if (isTransitioning) return;
      isTransitioning = true;
      speechManager.stop();
      soundFx.playSelect();
      this.time.delayedCall(50, () => {
        this.scene.start('RunnerScene', {
          level: this.level,
          isCumulativeExam: this.isCumulativeExam,
          isEndlessMode: this.isEndlessMode,
          quizMode: this.quizMode
        });
      });
    };

    const handleRetryMissed = () => {
      if (isTransitioning) return;
      isTransitioning = true;
      speechManager.stop();
      soundFx.playSelect();
      this.time.delayedCall(50, () => {
        this.scene.start('RunnerScene', {
          level: this.level,
          isCumulativeExam: this.isCumulativeExam,
          quizMode: this.quizMode,
          retryMistakes: this.roundMistakes
        });
      });
    };

    const handleMenu = () => {
      if (isTransitioning) return;
      isTransitioning = true;
      speechManager.stop();
      soundFx.playSelect();
      this.time.delayedCall(50, () => {
        this.scene.start('MenuScene', { levelId: this.level.id });
      });
    };

    if (this.roundMistakes.length > 0) {
      const btnW = 270;

      // 1. Retry Missed
      const btn1X = width / 2 - 290;
      const btn1Container = this.add.container(btn1X, btnY);
      const btn1Bg = this.add.graphics();
      btn1Bg.fillStyle(0x7a3a00, 1);
      btn1Bg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
      btn1Bg.lineStyle(2, 0xff9900, 1);
      btn1Bg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);

      const btn1Text = this.add.text(0, 0, `RETRY MISSED (${this.roundMistakes.length})`, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '12px',
        color: '#ffffff'
      }).setOrigin(0.5);

      const btn1Zone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
      btn1Container.add([btn1Bg, btn1Text, btn1Zone]);
      btn1Zone.on('pointerdown', handleRetryMissed);

      // 2. Full Round
      const btn2X = width / 2;
      const btn2Container = this.add.container(btn2X, btnY);
      const btn2Bg = this.add.graphics();
      btn2Bg.fillStyle(0x0e7e3e, 1);
      btn2Bg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
      btn2Bg.lineStyle(2, 0x00ff66, 1);
      btn2Bg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);

      const btn2Text = this.add.text(0, 0, 'FULL ROUND', {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '12px',
        color: '#ffffff'
      }).setOrigin(0.5);

      const btn2Zone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
      btn2Container.add([btn2Bg, btn2Text, btn2Zone]);
      btn2Zone.on('pointerdown', handleFullRetry);

      // 3. Main Menu
      const btn3X = width / 2 + 290;
      const btn3Container = this.add.container(btn3X, btnY);
      const btn3Bg = this.add.graphics();
      btn3Bg.fillStyle(0x282848, 1);
      btn3Bg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
      btn3Bg.lineStyle(2, 0x7777aa, 1);
      btn3Bg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);

      const btn3Text = this.add.text(0, 0, 'MAIN MENU', {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '12px',
        color: '#ffffff'
      }).setOrigin(0.5);

      const btn3Zone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
      btn3Container.add([btn3Bg, btn3Text, btn3Zone]);
      btn3Zone.on('pointerdown', handleMenu);
    } else {
      const btnW = 320;

      const btn1X = width / 2 - 190;
      const btn1Container = this.add.container(btn1X, btnY);
      const btn1Bg = this.add.graphics();
      btn1Bg.fillStyle(0x0e7e3e, 1);
      btn1Bg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
      btn1Bg.lineStyle(3, 0x00ff66, 1);
      btn1Bg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);

      const btn1Text = this.add.text(0, 0, 'PLAY AGAIN', {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '14px',
        color: '#ffffff'
      }).setOrigin(0.5);

      const btn1Zone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
      btn1Container.add([btn1Bg, btn1Text, btn1Zone]);
      btn1Zone.on('pointerdown', handleFullRetry);

      const btn2X = width / 2 + 190;
      const btn2Container = this.add.container(btn2X, btnY);
      const btn2Bg = this.add.graphics();
      btn2Bg.fillStyle(0x282848, 1);
      btn2Bg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
      btn2Bg.lineStyle(3, 0x7777aa, 1);
      btn2Bg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);

      const btn2Text = this.add.text(0, 0, 'MAIN MENU', {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '14px',
        color: '#ffffff'
      }).setOrigin(0.5);

      const btn2Zone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
      btn2Container.add([btn2Bg, btn2Text, btn2Zone]);
      btn2Zone.on('pointerdown', handleMenu);
    }

    if (this.input.keyboard) {
      if (this.roundMistakes.length > 0) {
        this.input.keyboard.on('keydown-R', handleRetryMissed);
        this.input.keyboard.on('keydown-SPACE', handleRetryMissed);
        this.input.keyboard.on('keydown-ENTER', handleRetryMissed);
        this.input.keyboard.on('keydown-F', handleFullRetry);
      } else {
        this.input.keyboard.on('keydown-SPACE', handleFullRetry);
        this.input.keyboard.on('keydown-ENTER', handleFullRetry);
      }
      this.input.keyboard.on('keydown-ESC', handleMenu);
      this.input.keyboard.on('keydown-M', handleMenu);
    }
  }
}
