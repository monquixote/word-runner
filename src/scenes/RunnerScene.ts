import Phaser from 'phaser';
import { WordLevel, WordItem, RuleQuestion, PlayerStats, QuizMode } from '../data/types';
import { loadPlayerStats, recordAnswerAttempt, savePlayerProgress } from '../data/progress';
import { soundFx } from '../utils/soundEffects';
import { buildEncounterDeck, EncounterCard } from '../utils/deckBuilder';
import { speechManager } from '../utils/pronunciation';

export interface RoundMistake {
  type: 'suffix' | 'spelling' | 'rule';
  word?: WordItem;
  rule?: RuleQuestion;
  prompt: string;
  correctAnswer: string;
  combinedWord?: string;
}

export interface RunnerSceneInitData {
  level: WordLevel;
  isHardMode?: boolean;
  isCumulativeExam?: boolean;
  isEndlessMode?: boolean;
  quizMode?: QuizMode;
  retryMistakes?: RoundMistake[];
}

interface BoardTarget {
  lane: number; // 0 = Left, 1 = Center, 2 = Right
  text: string;
  isCorrect: boolean;
  broken: boolean;
  highlightedWrong?: boolean;
  highlightedCorrect?: boolean;
  badgeObj: Phaser.GameObjects.Text;
}

interface GantrySign {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  badgeText: Phaser.GameObjects.Text;
  optionText: Phaser.GameObjects.Text;
}

interface WoodSplinter {
  worldX: number;
  worldY: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  sizeW: number;
  sizeH: number;
  color: number;
  alpha: number;
}

// 960x540 Razor-Sharp Scaled World Coordinates
const LANE_WORLD_X = [-260, 0, 260];
const GANTRY_SCREEN_X = [172, 480, 788];
const GANTRY_Y = 160;
const GANTRY_W = 292;
const GANTRY_H = 80;

const FOCAL_LENGTH = 500;
const HORIZON_Y = 212;
const GROUND_NEAR_Y = 488;
const SPAWN_Z = 1840;
const STRIKE_Z = 48;

export class RunnerScene extends Phaser.Scene {
  private level!: WordLevel;
  private stats!: PlayerStats;
  private isHardMode: boolean = false;
  private isCumulativeExam: boolean = false;
  private isEndlessMode: boolean = false;
  private quizMode: QuizMode = 'suffix';
  private isReviewMode: boolean = false;

  // Encounter Deck & State
  private encounterDeck: EncounterCard[] = [];
  private currentCard: EncounterCard | null = null;
  private currentWord: WordItem | null = null;
  private currentRule: RuleQuestion | null = null;
  private questionIndex: number = 0;
  private totalEncounters: number = 10;
  private roundMistakes: RoundMistake[] = [];
  private currentSpokenText: string | null = null;

  // 2.5D Runner World State
  private currentLane: number = 1;
  private playerWorldX: number = 0;
  private playerWorldY: number = 0;
  private scrollZ: number = 0;
  private waveZ: number = SPAWN_Z;
  private baseSpeed: number = 500; // Scaled for 960x540 depth
  private isDashing: boolean = false;
  private isProcessingImpact: boolean = false;
  private isTransitioning: boolean = false;
  private runAnimTimer: number = 0;
  private runFrame: number = 1;
  private playerPose: 'run' | 'kick' | 'hit' = 'run';
  private waveSpawnTimestamp: number = 0;

  // Scene Objects
  private corridorGraphics!: Phaser.GameObjects.Graphics;
  private boardsGraphics!: Phaser.GameObjects.Graphics;
  private particlesGraphics!: Phaser.GameObjects.Graphics;
  private playerSprite!: Phaser.GameObjects.Image;
  private boardTargets: BoardTarget[] = [];
  private gantrySigns: GantrySign[] = [];
  private splinters: WoodSplinter[] = [];
  private pillarZPositions: number[] = [];

  // HUD
  private hearts: Phaser.GameObjects.Image[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private promptBanner!: Phaser.GameObjects.Container;
  private promptText!: Phaser.GameObjects.Text;
  private categoryBadgeText!: Phaser.GameObjects.Text;
  private promptAudioBtn!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;

  // Touch swipe tracking
  private hasActivePointerDown: boolean = false;
  private pointerDownX: number = 0;
  private pointerDownY: number = 0;

  constructor() {
    super('RunnerScene');
  }

  init(data: RunnerSceneInitData): void {
    this.level = data.level;
    if (this.level?.id) {
      localStorage.setItem('word_runner_selected_level', this.level.id);
    }
    this.isHardMode = data.isHardMode !== undefined
      ? data.isHardMode
      : localStorage.getItem('word_runner_hard_mode') === 'true';
    this.isCumulativeExam = data.isCumulativeExam !== undefined
      ? data.isCumulativeExam
      : localStorage.getItem('word_runner_cumulative') === 'true';
    this.isEndlessMode = data.isEndlessMode !== undefined
      ? data.isEndlessMode
      : localStorage.getItem('word_runner_endless') === 'true';
    this.quizMode = data.quizMode || (localStorage.getItem('word_runner_quiz_mode') as QuizMode) || 'suffix';

    this.stats = loadPlayerStats();
    this.stats.health = this.stats.maxHealth;
    this.questionIndex = 0;
    this.currentLane = 1;
    this.playerWorldX = 0;
    this.playerWorldY = 0;
    this.scrollZ = 0;
    this.waveZ = SPAWN_Z;
    this.isDashing = false;
    this.isProcessingImpact = false;
    this.isTransitioning = false;
    this.hasActivePointerDown = false;
    this.playerPose = 'run';
    this.hearts = [];
    this.boardTargets = [];
    this.gantrySigns = [];
    this.splinters = [];
    this.roundMistakes = [];
    this.currentSpokenText = null;

    this.pillarZPositions = [240, 600, 960, 1320, 1680, 2040];

    this.isReviewMode = Boolean(data.retryMistakes && data.retryMistakes.length > 0);
    if (this.isReviewMode && data.retryMistakes) {
      this.isEndlessMode = false;
      this.totalEncounters = data.retryMistakes.length;
      this.encounterDeck = data.retryMistakes.map(m => ({
        type: m.type,
        word: m.word,
        rule: m.rule,
        levelTitle: this.level.title,
        isCurrentLevel: true
      }));
    } else {
      this.totalEncounters = 10;
      const { deck } = buildEncounterDeck({
        level: this.level,
        isCumulativeExam: this.isCumulativeExam,
        quizMode: this.quizMode,
        totalEncounters: this.totalEncounters,
        stats: this.stats
      });
      this.encounterDeck = deck;
    }
  }

  create(): void {
    const { width, height } = this.scale;

    // 1. Graphics Layers
    this.corridorGraphics = this.add.graphics().setDepth(1);
    this.boardsGraphics = this.add.graphics().setDepth(5);
    this.particlesGraphics = this.add.graphics().setDepth(12);

    // 2. Player Back-Facing Runner Sprite (Scaled up cleanly for blocky 8-bit look)
    this.playerSprite = this.add.image(width / 2, GROUND_NEAR_Y, `runner_run1_${this.level.id}`);
    this.playerSprite.setOrigin(0.5, 1);
    this.playerSprite.setScale(2.5);
    this.playerSprite.setDepth(10);

    // 3. Top HUD, Question Banner & Overhead Highway Gantry Signs
    this.createHUD();
    this.createGantrySigns();

    // 4. Large Floating Feedback Text
    this.feedbackText = this.add.text(width / 2, 290, '', {
      fontFamily: "'Fredoka', 'Press Start 2P', sans-serif",
      fontSize: '22px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 5,
      align: 'center',
      wordWrap: { width: width - 60 }
    }).setOrigin(0.5).setDepth(25).setAlpha(0);

    // 5. Bottom Controls Hint Bar
    const hintBg = this.add.graphics().setDepth(20);
    hintBg.fillStyle(0x060810, 0.9);
    hintBg.fillRect(0, height - 26, width, 26);

    this.add.text(
      width / 2,
      height - 13,
      '◀/▶ OR TAP SIGN: PICK SUFFIX LANE  |  ▲/SPACE OR TAP AGAIN: TURBO DASH!',
      {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '10px',
        color: '#ffdd66'
      }
    ).setOrigin(0.5).setDepth(21);

    // 6. Keyboard & Touch Controls
    this.setupControls();

    // 7. Spawn First Wave
    this.spawnNextWave();
  }

  private createHUD(): void {
    const { width } = this.scale;

    const topBar = this.add.graphics().setDepth(20);
    topBar.fillStyle(0x090a12, 0.96);
    topBar.fillRect(0, 0, width, 40);
    topBar.lineStyle(2, this.isHardMode ? 0xff3333 : 0x334477, 1);
    topBar.lineBetween(0, 40, width, 40);

    // Hearts (Health)
    for (let i = 0; i < this.stats.maxHealth; i++) {
      const heart = this.add.image(24 + i * 32, 20, 'heart_full').setScale(0.7).setDepth(21);
      this.hearts.push(heart);
    }

    // Score, Streak, Progress - Crisp 13px
    this.scoreText = this.add.text(196, 12, `SCORE:${this.stats.score}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: '#ffffff'
    }).setDepth(21);

    this.streakText = this.add.text(392, 12, `STREAK:${this.stats.currentStreak}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: '#ffe135'
    }).setDepth(21);

    const waveLabel = this.isEndlessMode ? 'WAVE:1 (∞)' : `WAVE:1/${this.totalEncounters}`;
    this.progressText = this.add.text(580, 12, waveLabel, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: '#00ffaa'
    }).setDepth(21);

    // Sound & Menu exit buttons
    const soundBtn = this.add.text(width - 120, 8, soundFx.isEnabled() ? '🔊' : '🔇', {
      fontSize: '18px'
    }).setDepth(21).setInteractive({ useHandCursor: true });

    soundBtn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      const enabled = soundFx.toggleSound();
      soundBtn.setText(enabled ? '🔊' : '🔇');
    });

    const menuBtn = this.add.text(width - 16, 12, this.isEndlessMode ? '✕ FINISH' : '✕ MENU', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: '#ff7777'
    }).setOrigin(1, 0).setDepth(21).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      if (this.isTransitioning) return;
      if (this.isEndlessMode && this.questionIndex > 0) {
        this.endSession(true);
        return;
      }
      this.isTransitioning = true;
      speechManager.stop();
      soundFx.playSelect();
      this.scene.start('MenuScene', { levelId: this.level.id });
    });

    // Question Prompt Banner (Y = 44..112, centerY = 78)
    this.promptBanner = this.add.container(width / 2, 78).setDepth(20);
    const bannerW = 912;
    const bannerH = 68;

    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0x0b0e1d, 0.96);
    bannerBg.fillRoundedRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 8);
    bannerBg.lineStyle(2, this.isHardMode ? 0xff4444 : 0xffe135, 1);
    bannerBg.strokeRoundedRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 8);

    this.categoryBadgeText = this.add.text(0, -18, 'WORD RUNNER', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '11px',
      color: '#ffe135'
    }).setOrigin(0.5);

    // Large, ultra-crisp word prompt (Easy to see from across the room!)
    this.promptText = this.add.text(0, 10, '', {
      fontFamily: "'Fredoka', 'Press Start 2P', sans-serif",
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
      align: 'center',
      wordWrap: { width: bannerW - 96 }
    }).setOrigin(0.5);

    this.promptAudioBtn = this.add.text(bannerW / 2 - 28, 0, '🔊', {
      fontSize: '22px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.promptAudioBtn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      if (this.currentSpokenText) {
        speechManager.speakWord(this.currentSpokenText);
      }
    });

    this.promptBanner.add([bannerBg, this.categoryBadgeText, this.promptText, this.promptAudioBtn]);
  }

  private createGantrySigns(): void {
    const laneTitles = ['◀ LANE 1', '▲ LANE 2', 'LANE 3 ▶'];

    for (let lane = 0; lane < 3; lane++) {
      const x = GANTRY_SCREEN_X[lane];
      const container = this.add.container(x, GANTRY_Y).setDepth(20);

      const bg = this.add.graphics();
      const badgeText = this.add.text(0, -24, laneTitles[lane], {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '11px',
        color: '#ffe135'
      }).setOrigin(0.5);

      // Suffix option text - massive 24px bold Fredoka font
      const optionText = this.add.text(0, 10, '', {
        fontFamily: "'Fredoka', 'Press Start 2P', sans-serif",
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
        wordWrap: { width: GANTRY_W - 24 }
      }).setOrigin(0.5);

      container.add([bg, badgeText, optionText]);

      this.gantrySigns.push({
        container,
        bg,
        badgeText,
        optionText
      });
    }

    this.updateGantryVisuals();
  }

  private updateGantryVisuals(): void {
    for (let lane = 0; lane < 3; lane++) {
      const sign = this.gantrySigns[lane];
      if (!sign) continue;

      const board = this.boardTargets[lane];
      const isSelected = this.currentLane === lane;

      sign.bg.clear();

      // Support struts
      sign.bg.lineStyle(3, 0x445577, 0.9);
      sign.bg.lineBetween(-GANTRY_W * 0.35, -GANTRY_H / 2 - 8, -GANTRY_W * 0.35, -GANTRY_H / 2);
      sign.bg.lineBetween(GANTRY_W * 0.35, -GANTRY_H / 2 - 8, GANTRY_W * 0.35, -GANTRY_H / 2);

      let fillColor = 0x101528;
      let borderColor = 0x3b486b;
      let borderAlpha = 0.9;
      let badgeColor = '#8899bb';
      let textColor = '#ffffff';

      if (board?.highlightedCorrect || (board?.broken && board?.isCorrect)) {
        fillColor = 0x0c3b24;
        borderColor = 0x00ff88;
        borderAlpha = 1;
        badgeColor = '#00ff88';
        textColor = '#ffffff';
      } else if (board?.highlightedWrong) {
        fillColor = 0x441118;
        borderColor = 0xff3344;
        borderAlpha = 1;
        badgeColor = '#ff6666';
        textColor = '#ffcccc';
      } else if (isSelected) {
        fillColor = 0x172446;
        borderColor = 0xffe135;
        borderAlpha = 1;
        badgeColor = '#ffe135';
        textColor = '#ffffff';
      }

      sign.bg.fillStyle(fillColor, 0.95);
      sign.bg.fillRoundedRect(-GANTRY_W / 2, -GANTRY_H / 2, GANTRY_W, GANTRY_H, 8);
      sign.bg.lineStyle(isSelected ? 3 : 2, borderColor, borderAlpha);
      sign.bg.strokeRoundedRect(-GANTRY_W / 2, -GANTRY_H / 2, GANTRY_W, GANTRY_H, 8);

      sign.badgeText.setColor(badgeColor);
      sign.optionText.setColor(textColor);
    }
  }

  private setupControls(): void {
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-LEFT', () => this.shiftLane(-1));
      this.input.keyboard.on('keydown-A', () => this.shiftLane(-1));
      this.input.keyboard.on('keydown-RIGHT', () => this.shiftLane(1));
      this.input.keyboard.on('keydown-D', () => this.shiftLane(1));

      this.input.keyboard.on('keydown-ONE', () => this.selectOrDashLane(0));
      this.input.keyboard.on('keydown-TWO', () => this.selectOrDashLane(1));
      this.input.keyboard.on('keydown-THREE', () => this.selectOrDashLane(2));

      this.input.keyboard.on('keydown-UP', () => this.triggerDashKick());
      this.input.keyboard.on('keydown-W', () => this.triggerDashKick());
      this.input.keyboard.on('keydown-SPACE', () => this.triggerDashKick());
      this.input.keyboard.on('keydown-ENTER', () => this.triggerDashKick());
      this.input.keyboard.on('keydown-R', () => {
        if (this.currentSpokenText) {
          speechManager.speakWord(this.currentSpokenText);
        }
      });
    }

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < 112 || this.isProcessingImpact || this.isTransitioning) return;
      this.hasActivePointerDown = true;
      this.pointerDownX = pointer.x;
      this.pointerDownY = pointer.y;
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.hasActivePointerDown) return;
      this.hasActivePointerDown = false;

      if (pointer.y < 112 || this.isProcessingImpact || this.isTransitioning) return;

      const dx = pointer.x - this.pointerDownX;
      const dy = pointer.y - this.pointerDownY;

      if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
        this.shiftLane(dx > 0 ? 1 : -1);
        return;
      }
      if (dy < -36 && Math.abs(dy) > Math.abs(dx)) {
        this.triggerDashKick();
        return;
      }

      const { width } = this.scale;
      let tappedLane = 1;
      if (pointer.x < width * 0.34) {
        tappedLane = 0;
      } else if (pointer.x > width * 0.66) {
        tappedLane = 2;
      } else {
        tappedLane = 1;
      }

      this.selectOrDashLane(tappedLane);
    });
  }

  private shiftLane(delta: number): void {
    if (this.isProcessingImpact || this.isTransitioning) return;
    const nextLane = Phaser.Math.Clamp(this.currentLane + delta, 0, 2);
    if (nextLane !== this.currentLane) {
      this.currentLane = nextLane;
      soundFx.playSelect();
      this.updateGantryVisuals();
    }
  }

  private selectOrDashLane(lane: number): void {
    if (this.isProcessingImpact || this.isTransitioning) return;
    if (this.currentLane === lane) {
      this.triggerDashKick();
    } else {
      this.currentLane = lane;
      soundFx.playSelect();
      this.updateGantryVisuals();
    }
  }

  private triggerDashKick(): void {
    if (this.isProcessingImpact || this.isTransitioning || this.isDashing) return;
    if (this.time.now - this.waveSpawnTimestamp < 320) return;

    this.isDashing = true;
    this.playerPose = 'kick';
    this.playerSprite.setTexture(`runner_kick_${this.level.id}`);
    soundFx.playKick();
  }

  private spawnNextWave(): void {
    for (const b of this.boardTargets) {
      b.badgeObj.destroy();
    }
    this.boardTargets = [];

    if (!this.isEndlessMode && this.questionIndex >= this.totalEncounters) {
      this.endSession(true);
      return;
    }

    if (this.isEndlessMode && this.questionIndex >= this.encounterDeck.length) {
      const { deck } = buildEncounterDeck({
        level: this.level,
        isCumulativeExam: this.isCumulativeExam,
        quizMode: this.quizMode,
        totalEncounters: 10,
        stats: this.stats
      });
      this.encounterDeck.push(...deck);
    }

    this.isProcessingImpact = false;
    this.isDashing = false;
    this.hasActivePointerDown = false;
    this.playerPose = 'run';
    this.playerWorldY = 0;
    this.waveZ = SPAWN_Z;
    this.waveSpawnTimestamp = this.time.now;

    if (this.isEndlessMode) {
      this.progressText.setText(`WAVE:${this.questionIndex + 1} (∞)`);
    } else {
      this.progressText.setText(`WAVE:${this.questionIndex + 1}/${this.totalEncounters}`);
    }

    const card = this.encounterDeck[this.questionIndex] || this.encounterDeck[0];
    this.currentCard = card;

    let promptStr = '';
    let badgeStr = '';
    let correctStr = '';
    let distractors: string[] = [];

    if (card.type === 'rule' && card.rule) {
      const rl = card.rule;
      this.currentRule = rl;
      this.currentWord = null;
      this.currentSpokenText = rl.spokenWord || rl.correctAnswer;
      this.promptAudioBtn.setVisible(true);

      badgeStr = `⭐ SPELLING RULE • ${card.levelTitle.toUpperCase()}`;
      promptStr = rl.prompt;
      correctStr = rl.correctAnswer;
      distractors = [...rl.distractors];
    } else if (card.type === 'spelling') {
      const word = card.word || this.level.words[0];
      this.currentWord = word;
      this.currentRule = null;
      this.currentSpokenText = word.combinedWord;
      this.promptAudioBtn.setVisible(true);

      badgeStr = `📝 SPELL WORD • ${(word.ruleNote || word.clue).toUpperCase()}`;
      promptStr = `${word.rootWord.toUpperCase()}  +  ${word.targetSuffix}  =  ?`;
      correctStr = word.combinedWord;
      distractors = [...word.spellingDistractors];

      this.time.delayedCall(140, () => {
        if (this.scene.isActive() && this.currentSpokenText) {
          speechManager.speakWord(this.currentSpokenText);
        }
      });
    } else {
      const word = card.word || this.level.words[0];
      this.currentWord = word;
      this.currentRule = null;
      this.currentSpokenText = word.rootWord;
      this.promptAudioBtn.setVisible(true);

      badgeStr = `🏃 PICK SUFFIX • ${word.clue.toUpperCase()}`;
      promptStr = `${word.rootWord.toUpperCase()}  +  ___`;
      correctStr = word.targetSuffix;
      distractors = Phaser.Utils.Array.Shuffle([...word.distractorSuffixes]).slice(0, 2);

      this.time.delayedCall(140, () => {
        if (this.scene.isActive() && this.currentWord) {
          speechManager.speakWord(this.currentWord.rootWord);
        }
      });
    }

    const fallbackDistractors = ['-ment', '-ness', '-ful', '-less', '-ly'];
    for (const fb of fallbackDistractors) {
      if (distractors.length >= 2) break;
      if (fb !== correctStr && !distractors.includes(fb)) {
        distractors.push(fb);
      }
    }

    this.categoryBadgeText.setText(badgeStr);
    this.promptText.setText(promptStr);
    this.promptText.setFontSize(promptStr.length > 28 ? '22px' : '28px');

    const laneOptions = Phaser.Utils.Array.Shuffle([
      { text: correctStr, isCorrect: true },
      { text: distractors[0], isCorrect: false },
      { text: distractors[1], isCorrect: false }
    ]);

    for (let lane = 0; lane < 3; lane++) {
      const opt = laneOptions[lane];

      const sign = this.gantrySigns[lane];
      if (sign) {
        sign.optionText.setText(opt.text);
        sign.optionText.setFontSize(opt.text.length > 10 ? '20px' : '24px');
      }

      // Large bold text directly on the approaching 3D gate
      const boardLabel = opt.text.length <= 12 ? opt.text : `${lane + 1}`;
      const badgeObj = this.add.text(0, 0, boardLabel, {
        fontFamily: "'Fredoka', 'Press Start 2P', sans-serif",
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#2b1406',
        stroke: '#fff6d6',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(7);

      this.boardTargets.push({
        lane,
        text: opt.text,
        isCorrect: opt.isCorrect,
        broken: false,
        badgeObj
      });
    }

    this.updateGantryVisuals();
  }

  private project3D(worldX: number, worldY: number, z: number): {
    screenX: number;
    screenY: number;
    scale: number;
  } {
    const { width } = this.scale;
    const vanishingX = width / 2 - this.playerWorldX * 0.12;
    const clampedZ = Math.max(-360, z);
    const scale = FOCAL_LENGTH / (FOCAL_LENGTH + clampedZ);
    const screenX = vanishingX + (worldX - this.playerWorldX * 0.18) * scale;
    const screenY = HORIZON_Y + (GROUND_NEAR_Y - HORIZON_Y) * scale - worldY * scale;
    return { screenX, screenY, scale };
  }

  update(_time: number, delta: number): void {
    if (this.isTransitioning) return;
    const dt = Math.min(delta / 1000, 0.05);

    // 1. Smoothly interpolate player X toward target lane X
    const targetX = LANE_WORLD_X[this.currentLane];
    this.playerWorldX = Phaser.Math.Linear(this.playerWorldX, targetX, Math.min(1, dt * 14));

    // 2. Determine forward running speed
    const streakBonus = Math.min(this.stats.currentStreak * 24, 190);
    let currentSpeed = this.baseSpeed + streakBonus;

    if (this.isHardMode) {
      currentSpeed *= 1.35;
    }

    if (this.isDashing) {
      currentSpeed = 2500;
      this.playerWorldY = Phaser.Math.Linear(this.playerWorldY, 36, Math.min(1, dt * 15));
    } else if (!this.isHardMode && !this.isProcessingImpact && this.waveZ < 720 && this.waveZ > STRIKE_Z) {
      // Focus Zone in Normal Mode: slow down gently near gates so text is easy to read
      const focusFactor = Phaser.Math.Clamp((this.waveZ - STRIKE_Z) / 672, 0.28, 1);
      currentSpeed *= focusFactor;
    }

    // 3. Advance environment scroll & wave Z
    if (!this.isProcessingImpact) {
      this.scrollZ = (this.scrollZ + currentSpeed * dt) % 320;
      this.waveZ -= currentSpeed * dt;

      for (let i = 0; i < this.pillarZPositions.length; i++) {
        this.pillarZPositions[i] -= currentSpeed * dt;
        if (this.pillarZPositions[i] < -120) {
          this.pillarZPositions[i] += 2160;
        }
      }

      if (this.waveZ <= STRIKE_Z) {
        this.waveZ = STRIKE_Z;
        this.handleWaveImpact();
      }
    }

    // 4. Animate player running stride
    if (this.playerPose === 'run') {
      this.runAnimTimer += dt * (this.isDashing ? 18 : 9);
      if (this.runAnimTimer >= 1) {
        this.runAnimTimer = 0;
        this.runFrame = this.runFrame === 1 ? 2 : 1;
        this.playerSprite.setTexture(`runner_run${this.runFrame}_${this.level.id}`);
      }
    }

    const playerProj = this.project3D(this.playerWorldX, this.playerWorldY, 0);
    const bobOffset = this.playerPose === 'run' ? Math.abs(Math.sin(this.runAnimTimer * Math.PI)) * 6 : 0;
    this.playerSprite.setPosition(playerProj.screenX, playerProj.screenY - bobOffset);

    this.renderCorridor();
    this.renderBoards();
    this.updateAndRenderParticles(dt);
  }

  private handleWaveImpact(): void {
    this.isProcessingImpact = true;
    const wasDashing = this.isDashing;
    this.isDashing = false;

    const chosenBoard = this.boardTargets[this.currentLane];
    const isCorrect = Boolean(chosenBoard && chosenBoard.isCorrect);

    const itemId = this.currentWord ? this.currentWord.id : this.currentRule?.id;
    if (itemId) {
      recordAnswerAttempt(this.stats, itemId, isCorrect);
    }

    if (isCorrect && chosenBoard) {
      chosenBoard.broken = true;
      chosenBoard.badgeObj.setVisible(false);

      this.playerPose = 'kick';
      this.playerSprite.setTexture(`runner_kick_${this.level.id}`);

      soundFx.playKick();
      soundFx.playEnemyKnockout();

      if (this.currentWord) {
        speechManager.speakWord(this.currentWord.combinedWord);
      } else if (this.currentRule?.spokenWord) {
        speechManager.speakWord(this.currentRule.spokenWord);
      }

      this.spawnBoardSplinters(LANE_WORLD_X[this.currentLane], this.waveZ);

      this.stats.currentStreak += 1;
      if (this.stats.currentStreak > this.stats.bestStreak) {
        this.stats.bestStreak = this.stats.currentStreak;
      }
      this.stats.totalWordsCompleted += 1;
      const dashBonus = wasDashing ? 50 : 0;
      const points = 100 + this.stats.currentStreak * 25 + dashBonus;
      this.stats.score += points;
      savePlayerProgress(this.stats);

      this.scoreText.setText(`SCORE:${this.stats.score}`);
      this.streakText.setText(`STREAK:${this.stats.currentStreak}`);
      this.updateGantryVisuals();

      const completedMsg = this.currentWord
        ? `✨ ${this.currentWord.combinedWord.toUpperCase()}! +${points}`
        : `✨ CORRECT! +${points}`;

      this.showFeedback(completedMsg, '#00ff88');

      this.questionIndex += 1;
      this.time.delayedCall(900, () => {
        if (!this.scene.isActive()) return;
        this.spawnNextWave();
      });
    } else {
      this.playerPose = 'hit';
      this.playerSprite.setTexture(`runner_hit_${this.level.id}`);
      this.playerWorldY = 0;

      soundFx.playPlayerHurt();
      this.cameras.main.shake(180, 0.012);

      if (chosenBoard) {
        chosenBoard.highlightedWrong = true;
      }
      const rightBoard = this.boardTargets.find(b => b.isCorrect);
      if (rightBoard) {
        rightBoard.highlightedCorrect = true;
      }
      this.updateGantryVisuals();

      const correctAns = rightBoard ? rightBoard.text : '';
      const combinedStr = this.currentWord ? this.currentWord.combinedWord : correctAns;

      if (this.currentWord) {
        speechManager.speakWord(this.currentWord.combinedWord);
      }

      this.roundMistakes.push({
        type: this.currentCard?.type || 'suffix',
        word: this.currentWord || undefined,
        rule: this.currentRule || undefined,
        prompt: this.currentWord
          ? `${this.currentWord.rootWord} + ?`
          : this.promptText.text,
        correctAnswer: this.currentWord
          ? `${this.currentWord.targetSuffix} (${this.currentWord.combinedWord})`
          : correctAns,
        combinedWord: combinedStr
      });

      this.stats.currentStreak = 0;
      this.stats.health = Math.max(0, this.stats.health - 1);
      savePlayerProgress(this.stats);
      this.streakText.setText('STREAK:0');
      this.updateHeartsHUD();

      const missMsg = this.currentWord
        ? `✗ ${this.currentWord.rootWord.toUpperCase()} + ${this.currentWord.targetSuffix} = ${this.currentWord.combinedWord.toUpperCase()}`
        : `✗ ANS: ${correctAns}`;
      this.showFeedback(missMsg, '#ff4444');

      this.questionIndex += 1;
      this.time.delayedCall(1700, () => {
        if (!this.scene.isActive()) return;
        if (this.stats.health <= 0) {
          this.endSession(false);
        } else {
          this.spawnNextWave();
        }
      });
    }
  }

  private spawnBoardSplinters(worldX: number, z: number): void {
    const colors = [0xffe135, 0x38bdf8, 0x4ade80, 0xf43f5e, 0xffffff];
    for (let i = 0; i < 28; i++) {
      this.splinters.push({
        worldX: worldX + Phaser.Math.Between(-70, 70),
        worldY: Phaser.Math.Between(24, 130),
        z: z + Phaser.Math.Between(-20, 40),
        vx: Phaser.Math.Between(-380, 380),
        vy: Phaser.Math.Between(120, 480),
        vz: Phaser.Math.Between(160, 640),
        sizeW: Phaser.Math.Between(10, 28),
        sizeH: Phaser.Math.Between(6, 16),
        color: colors[i % colors.length],
        alpha: 1
      });
    }
  }

  private updateAndRenderParticles(dt: number): void {
    this.particlesGraphics.clear();
    for (let i = this.splinters.length - 1; i >= 0; i--) {
      const s = this.splinters[i];
      s.worldX += s.vx * dt;
      s.worldY += s.vy * dt;
      s.z += s.vz * dt;
      s.vy -= 960 * dt;
      s.alpha -= dt * 1.35;

      if (s.alpha <= 0 || s.worldY < 0) {
        this.splinters.splice(i, 1);
        continue;
      }

      const proj = this.project3D(s.worldX, s.worldY, s.z);
      const w = Math.max(3, s.sizeW * proj.scale);
      const h = Math.max(3, s.sizeH * proj.scale);

      this.particlesGraphics.fillStyle(s.color, s.alpha);
      this.particlesGraphics.fillRect(proj.screenX - w / 2, proj.screenY - h / 2, w, h);
    }
  }

  private renderCorridor(): void {
    const { width, height } = this.scale;
    const g = this.corridorGraphics;
    g.clear();

    // 1. Horizon Backdrop
    g.fillStyle(this.isHardMode ? 0x1a060a : 0x0b1026, 1);
    g.fillRect(0, 0, width, HORIZON_Y);

    g.fillStyle(this.isHardMode ? 0x440a14 : 0x1e3a8a, 0.85);
    g.fillRect(0, HORIZON_Y - 12, width, 12);

    // 2. Track Floor Base
    const floorBaseColor = this.isHardMode ? 0x261015 : 0x172038;
    g.fillStyle(floorBaseColor, 1);
    g.fillRect(0, HORIZON_Y, width, height - HORIZON_Y);

    // 3. Alternating Perspective Depth Strips
    const stripSpacing = 160;
    for (let z = 0; z < 2080; z += stripSpacing) {
      const zNear = z - (this.scrollZ % stripSpacing);
      const zFar = zNear + stripSpacing * 0.5;
      if (zFar <= -240) continue;

      const pNearLeft = this.project3D(-440, 0, Math.max(-240, zNear));
      const pNearRight = this.project3D(440, 0, Math.max(-240, zNear));
      const pFarLeft = this.project3D(-440, 0, zFar);
      const pFarRight = this.project3D(440, 0, zFar);

      const stripColor = this.isHardMode ? 0x35141c : 0x1e2946;
      g.fillStyle(stripColor, 1);
      g.beginPath();
      g.moveTo(pFarLeft.screenX, pFarLeft.screenY);
      g.lineTo(pFarRight.screenX, pFarRight.screenY);
      g.lineTo(pNearRight.screenX, pNearRight.screenY);
      g.lineTo(pNearLeft.screenX, pNearLeft.screenY);
      g.closePath();
      g.fillPath();
    }

    // 4. Highlight Active Player Lane
    const activeLeftX = LANE_WORLD_X[this.currentLane] - 124;
    const activeRightX = LANE_WORLD_X[this.currentLane] + 124;
    const laneFarL = this.project3D(activeLeftX, 0, 1920);
    const laneFarR = this.project3D(activeRightX, 0, 1920);
    const laneNearL = this.project3D(activeLeftX, 0, -80);
    const laneNearR = this.project3D(activeRightX, 0, -80);

    g.fillStyle(this.isHardMode ? 0xff4444 : 0x38bdf8, 0.18);
    g.beginPath();
    g.moveTo(laneFarL.screenX, laneFarL.screenY);
    g.lineTo(laneFarR.screenX, laneFarR.screenY);
    g.lineTo(laneNearR.screenX, laneNearR.screenY);
    g.lineTo(laneNearL.screenX, laneNearL.screenY);
    g.closePath();
    g.fillPath();

    // 5. Perspective Lane Divider Lines
    const boundaryXs = [-390, -130, 130, 390];
    for (let i = 0; i < boundaryXs.length; i++) {
      const bx = boundaryXs[i];
      const pFar = this.project3D(bx, 0, 2000);
      const pNear = this.project3D(bx, 0, -120);
      const isOuter = i === 0 || i === boundaryXs.length - 1;
      g.lineStyle(isOuter ? 3 : 2, isOuter ? 0xffe135 : 0x475569, isOuter ? 0.9 : 0.65);
      g.lineBetween(pFar.screenX, pFar.screenY, pNear.screenX, pNear.screenY);
    }

    // 6. Scrolling 3D Pillars
    const sortedPillars = [...this.pillarZPositions].sort((a, b) => b - a);
    for (const pz of sortedPillars) {
      if (pz < -80 || pz > 2040) continue;
      for (const side of [-1, 1]) {
        const baseProj = this.project3D(side * 430, 0, pz);
        const topProj = this.project3D(side * 430, 200, pz);
        const pillarW = Math.max(4, 32 * baseProj.scale);
        const pillarH = Math.max(8, baseProj.screenY - topProj.screenY);

        g.fillStyle(0x1e293b, 0.95);
        g.fillRect(baseProj.screenX - pillarW / 2, topProj.screenY, pillarW, pillarH);

        const lanternH = Math.max(3, 18 * baseProj.scale);
        g.fillStyle(this.isHardMode ? 0xff3333 : 0x38bdf8, 0.85);
        g.fillRect(baseProj.screenX - pillarW * 0.6, topProj.screenY + pillarH * 0.18, pillarW * 1.2, lanternH);
      }
    }
  }

  private renderBoards(): void {
    const g = this.boardsGraphics;
    g.clear();

    if (this.boardTargets.length === 0) return;

    const boardWorldW = 224;
    const boardWorldH = 124;

    for (const board of this.boardTargets) {
      if (board.broken) continue;

      const laneCenterX = LANE_WORLD_X[board.lane];
      const baseProj = this.project3D(laneCenterX, 0, this.waveZ);
      const topProj = this.project3D(laneCenterX, boardWorldH, this.waveZ);

      const screenW = boardWorldW * baseProj.scale;
      const screenH = Math.max(16, baseProj.screenY - topProj.screenY);
      const leftX = baseProj.screenX - screenW / 2;
      const topY = topProj.screenY;

      // Ground Shadow
      g.fillStyle(0x000000, 0.45);
      g.fillRect(leftX + 4, baseProj.screenY - 4, screenW, Math.max(3, 10 * baseProj.scale));

      // Support Posts
      const postW = Math.max(3, 20 * baseProj.scale);
      const postH = Math.max(5, 26 * baseProj.scale);
      g.fillStyle(0x475569, 1);
      g.fillRect(leftX, baseProj.screenY - postH, postW, postH);
      g.fillRect(leftX + screenW - postW, baseProj.screenY - postH, postW, postH);

      // 3D Bevel
      const depthExtrude = Math.max(3, 12 * baseProj.scale);
      g.fillStyle(0x92400e, 1);
      g.fillRect(leftX + depthExtrude * 0.5, topY - depthExtrude, screenW, depthExtrude);
      g.fillRect(leftX + screenW, topY - depthExtrude, depthExtrude, screenH);

      // Main Suffix Gate Face
      let faceColor = 0xfde68a;
      let borderColor = 0xb45309;

      if (board.highlightedCorrect) {
        faceColor = 0x66ffaa;
        borderColor = 0x00ff66;
      } else if (board.highlightedWrong) {
        faceColor = 0xff7777;
        borderColor = 0xff0000;
      } else if (board.lane === this.currentLane) {
        faceColor = 0xfef08a;
        borderColor = 0xffe135;
      }

      const boardFaceH = screenH - postH * 0.4;
      g.fillStyle(faceColor, 1);
      g.fillRect(leftX, topY, screenW, boardFaceH);

      g.lineStyle(Math.max(1.5, 3 * baseProj.scale), borderColor, 1);
      g.strokeRect(leftX, topY, screenW, boardFaceH);

      // Inner banner plate
      const centerY = topY + boardFaceH * 0.5;
      const plateW = screenW * 0.86;
      const plateH = boardFaceH * 0.64;
      g.fillStyle(board.lane === this.currentLane ? 0xfffbeb : 0xfef3c7, 0.94);
      g.fillRect(baseProj.screenX - plateW / 2, centerY - plateH / 2, plateW, plateH);

      // Update Suffix Text on 3D Gate (scales dynamically with distance)
      const badgeScale = Phaser.Math.Clamp(baseProj.scale * 1.6, 0.35, 1.4);
      board.badgeObj.setPosition(baseProj.screenX, centerY);
      board.badgeObj.setScale(badgeScale);
    }
  }

  private showFeedback(msg: string, color: string): void {
    this.feedbackText.setText(msg);
    this.feedbackText.setColor(color);
    this.feedbackText.setAlpha(1);
    this.feedbackText.setY(290);

    this.tweens.killTweensOf(this.feedbackText);
    this.tweens.add({
      targets: this.feedbackText,
      y: 250,
      alpha: 0,
      duration: 1400,
      ease: 'Cubic.easeOut'
    });
  }

  private updateHeartsHUD(): void {
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setTexture(i < this.stats.health ? 'heart_full' : 'heart_empty');
    }
  }

  private endSession(passed: boolean): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    speechManager.stop();

    if (passed) {
      soundFx.playFanfare();
    } else {
      soundFx.playPlayerHurt();
    }

    this.time.delayedCall(450, () => {
      this.scene.start('ResultScene', {
        level: this.level,
        stats: this.stats,
        passed,
        isCumulativeExam: this.isCumulativeExam,
        isEndlessMode: this.isEndlessMode,
        quizMode: this.quizMode,
        roundMistakes: this.roundMistakes
      });
    });
  }
}
