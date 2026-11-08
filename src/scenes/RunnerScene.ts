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

type WallStyle = 'brick' | 'cinderblock' | 'barricade';

interface BoardTarget {
  lane: number; // 0 = Left, 1 = Center, 2 = Right
  text: string;
  isCorrect: boolean;
  broken: boolean;
  wallStyle: WallStyle;
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

interface BrickDebris {
  worldX: number;
  worldY: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  sizeW: number;
  sizeH: number;
  color: number;
  borderColor: number;
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
const GROUND_NEAR_Y = 492;
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

  // 2.5D Bulldozer World State
  private currentLane: number = 1;
  private playerWorldX: number = 0;
  private playerWorldY: number = 0;
  private scrollZ: number = 0;
  private waveZ: number = SPAWN_Z;
  private baseSpeed: number = 500;
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
  private splinters: BrickDebris[] = [];
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

    // 2. Player Rear-Facing Bulldozer Sprite (Blocky 8-bit pixel art)
    this.playerSprite = this.add.image(width / 2, GROUND_NEAR_Y, `runner_run1_${this.level.id}`);
    this.playerSprite.setOrigin(0.5, 1);
    this.playerSprite.setScale(2.5);
    this.playerSprite.setDepth(10);

    // 3. Top HUD, Question Banner & Overhead Steel Truss Gantry Signs
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
    hintBg.fillStyle(0x090b10, 0.94);
    hintBg.fillRect(0, height - 26, width, 26);
    hintBg.lineStyle(2, 0xf59e0b, 0.8);
    hintBg.lineBetween(0, height - 26, width, height - 26);

    this.add.text(
      width / 2,
      height - 13,
      '◀/▶ OR TAP SIGN: STEER DOZER  |  ▲/SPACE OR TAP AGAIN: FULL THROTTLE SMASH!',
      {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '10px',
        color: '#ffe135'
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
    topBar.fillStyle(0x0c0f17, 0.96);
    topBar.fillRect(0, 0, width, 40);
    topBar.lineStyle(2, this.isHardMode ? 0xff3333 : 0xf59e0b, 1);
    topBar.lineBetween(0, 40, width, 40);

    // Hearts (Armor / Health)
    for (let i = 0; i < this.stats.maxHealth; i++) {
      const heart = this.add.image(24 + i * 32, 20, 'heart_full').setScale(0.7).setDepth(21);
      this.hearts.push(heart);
    }

    // Score, Streak, Progress
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

    const waveLabel = this.isEndlessMode ? 'WALL:1 (∞)' : `WALL:1/${this.totalEncounters}`;
    this.progressText = this.add.text(580, 12, waveLabel, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: '#4ade80'
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

    const menuBtn = this.add.text(width - 16, 12, this.isEndlessMode ? '✕ FINISH' : '✕ SITE MENU', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '11px',
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
    bannerBg.fillStyle(0x111522, 0.96);
    bannerBg.fillRoundedRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 8);
    bannerBg.lineStyle(3, this.isHardMode ? 0xff4444 : 0xf59e0b, 1);
    bannerBg.strokeRoundedRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 8);

    // Corner steel rivets on prompt banner
    bannerBg.fillStyle(0x9ca3af, 1);
    bannerBg.fillRect(-bannerW / 2 + 8, -bannerH / 2 + 8, 5, 5);
    bannerBg.fillRect(bannerW / 2 - 13, -bannerH / 2 + 8, 5, 5);
    bannerBg.fillRect(-bannerW / 2 + 8, bannerH / 2 - 13, 5, 5);
    bannerBg.fillRect(bannerW / 2 - 13, bannerH / 2 - 13, 5, 5);

    this.categoryBadgeText = this.add.text(0, -18, 'BULLDOZER DEMOLITION', {
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

      // Overhead Steel Truss Support Struts
      sign.bg.lineStyle(4, 0x64748b, 0.95);
      sign.bg.lineBetween(-GANTRY_W * 0.35, -GANTRY_H / 2 - 10, -GANTRY_W * 0.35, -GANTRY_H / 2);
      sign.bg.lineBetween(GANTRY_W * 0.35, -GANTRY_H / 2 - 10, GANTRY_W * 0.35, -GANTRY_H / 2);

      let fillColor = 0x141824;
      let borderColor = 0x475569;
      let borderAlpha = 0.95;
      let badgeColor = '#94a3b8';
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
        fillColor = 0x261c0a;
        borderColor = 0xf59e0b;
        borderAlpha = 1;
        badgeColor = '#ffe135';
        textColor = '#ffffff';
      }

      sign.bg.fillStyle(fillColor, 0.96);
      sign.bg.fillRoundedRect(-GANTRY_W / 2, -GANTRY_H / 2, GANTRY_W, GANTRY_H, 8);
      sign.bg.lineStyle(isSelected ? 3.5 : 2, borderColor, borderAlpha);
      sign.bg.strokeRoundedRect(-GANTRY_W / 2, -GANTRY_H / 2, GANTRY_W, GANTRY_H, 8);

      // Small yellow hazard stripe tabs on top corners of active gantry sign
      if (isSelected) {
        sign.bg.fillStyle(0xffe135, 1);
        sign.bg.fillRect(-GANTRY_W / 2 + 10, -GANTRY_H / 2, 24, 4);
        sign.bg.fillRect(GANTRY_W / 2 - 34, -GANTRY_H / 2, 24, 4);
      }

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
      this.progressText.setText(`WALL:${this.questionIndex + 1} (∞)`);
    } else {
      this.progressText.setText(`WALL:${this.questionIndex + 1}/${this.totalEncounters}`);
    }

    const card = this.encounterDeck[this.questionIndex] || this.encounterDeck[0];
    this.currentCard = card;

    let promptStr = '';
    let badgeStr = '';
    let correctStr = '';
    let distractors: string[] = [];
    let wallStyle: WallStyle = 'brick';

    if (card.type === 'rule' && card.rule) {
      const rl = card.rule;
      this.currentRule = rl;
      this.currentWord = null;
      this.currentSpokenText = rl.spokenWord || rl.correctAnswer;
      this.promptAudioBtn.setVisible(true);

      badgeStr = `🏗️ SITE SPELLING RULE • ${card.levelTitle.toUpperCase()}`;
      promptStr = rl.prompt;
      correctStr = rl.correctAnswer;
      distractors = [...rl.distractors];
      wallStyle = 'cinderblock';
    } else if (card.type === 'spelling') {
      const word = card.word || this.level.words[0];
      this.currentWord = word;
      this.currentRule = null;
      this.currentSpokenText = word.combinedWord;
      this.promptAudioBtn.setVisible(true);

      badgeStr = `🧱 BRICK WALL SPELLING • ${(word.ruleNote || word.clue).toUpperCase()}`;
      promptStr = `${word.rootWord.toUpperCase()}  +  ${word.targetSuffix}  =  ?`;
      correctStr = word.combinedWord;
      distractors = [...word.spellingDistractors];
      wallStyle = this.questionIndex % 3 === 2 ? 'barricade' : 'brick';

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

      badgeStr = `🚜 SMASH SUFFIX WALL • ${word.clue.toUpperCase()}`;
      promptStr = `${word.rootWord.toUpperCase()}  +  ___`;
      correctStr = word.targetSuffix;
      distractors = Phaser.Utils.Array.Shuffle([...word.distractorSuffixes]).slice(0, 2);
      wallStyle = this.questionIndex % 4 === 3 ? 'barricade' : 'brick';

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

      // Large bold text directly on the approaching 3D brick wall signplate
      const boardLabel = opt.text.length <= 12 ? opt.text : `${lane + 1}`;
      const badgeObj = this.add.text(0, 0, boardLabel, {
        fontFamily: "'Fredoka', 'Press Start 2P', sans-serif",
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#111827',
        stroke: '#fffbeb',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(7);

      this.boardTargets.push({
        lane,
        text: opt.text,
        isCorrect: opt.isCorrect,
        broken: false,
        wallStyle,
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

    // 1. Smoothly steer bulldozer X toward target lane X
    const targetX = LANE_WORLD_X[this.currentLane];
    this.playerWorldX = Phaser.Math.Linear(this.playerWorldX, targetX, Math.min(1, dt * 14));

    // 2. Determine forward driving speed
    const streakBonus = Math.min(this.stats.currentStreak * 24, 190);
    let currentSpeed = this.baseSpeed + streakBonus;

    if (this.isHardMode) {
      currentSpeed *= 1.35;
    }

    if (this.isDashing) {
      currentSpeed = 2500;
      this.playerWorldY = Phaser.Math.Linear(this.playerWorldY, 10, Math.min(1, dt * 15));
    } else if (!this.isHardMode && !this.isProcessingImpact && this.waveZ < 720 && this.waveZ > STRIKE_Z) {
      // Focus Zone in Normal Mode: slow down gently near walls so text is easy to read
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

    // 4. Animate bulldozer caterpillar tracks & engine vibration
    if (this.playerPose === 'run') {
      this.runAnimTimer += dt * (this.isDashing ? 22 : 12);
      if (this.runAnimTimer >= 1) {
        this.runAnimTimer = 0;
        this.runFrame = this.runFrame === 1 ? 2 : 1;
        this.playerSprite.setTexture(`runner_run${this.runFrame}_${this.level.id}`);
      }
    }

    const playerProj = this.project3D(this.playerWorldX, this.playerWorldY, 0);
    // Subtle heavy diesel engine vibration
    const rumbleOffset = this.playerPose === 'run' ? (this.runFrame === 1 ? 2 : 0) : 0;
    this.playerSprite.setPosition(playerProj.screenX, playerProj.screenY - rumbleOffset);

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
      this.cameras.main.shake(110, 0.006);

      if (this.currentWord) {
        speechManager.speakWord(this.currentWord.combinedWord);
      } else if (this.currentRule?.spokenWord) {
        speechManager.speakWord(this.currentRule.spokenWord);
      }

      this.spawnBrickDebris(LANE_WORLD_X[this.currentLane], this.waveZ, chosenBoard.wallStyle);

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
        ? `💥 ${this.currentWord.combinedWord.toUpperCase()}! +${points}`
        : `💥 SMASHED! +${points}`;

      this.showFeedback(completedMsg, '#4ade80');

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
      this.cameras.main.shake(200, 0.014);

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

  private spawnBrickDebris(worldX: number, z: number, wallStyle: WallStyle): void {
    const brickPalette =
      wallStyle === 'cinderblock'
        ? [0x64748b, 0x475569, 0x94a3b8, 0xf59e0b, 0x334155]
        : wallStyle === 'barricade'
          ? [0xf97316, 0xfef08a, 0xd97706, 0x78350f, 0xffffff]
          : [0xdc2626, 0xb91c1c, 0x991b1b, 0x9ca3af, 0xf59e0b];

    for (let i = 0; i < 34; i++) {
      this.splinters.push({
        worldX: worldX + Phaser.Math.Between(-85, 85),
        worldY: Phaser.Math.Between(18, 135),
        z: z + Phaser.Math.Between(-20, 45),
        vx: Phaser.Math.Between(-420, 420),
        vy: Phaser.Math.Between(140, 520),
        vz: Phaser.Math.Between(140, 680),
        sizeW: Phaser.Math.Between(14, 32),
        sizeH: Phaser.Math.Between(8, 18),
        color: brickPalette[i % brickPalette.length],
        borderColor: 0x111827,
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
      s.vy -= 980 * dt;
      s.alpha -= dt * 1.25;

      if (s.alpha <= 0 || s.worldY < 0) {
        this.splinters.splice(i, 1);
        continue;
      }

      const proj = this.project3D(s.worldX, s.worldY, s.z);
      const w = Math.max(4, s.sizeW * proj.scale);
      const h = Math.max(3, s.sizeH * proj.scale);

      this.particlesGraphics.fillStyle(s.color, s.alpha);
      this.particlesGraphics.fillRect(proj.screenX - w / 2, proj.screenY - h / 2, w, h);
      this.particlesGraphics.lineStyle(1, s.borderColor, s.alpha * 0.8);
      this.particlesGraphics.strokeRect(proj.screenX - w / 2, proj.screenY - h / 2, w, h);
    }
  }

  private renderCorridor(): void {
    const { width, height } = this.scale;
    const g = this.corridorGraphics;
    g.clear();

    // 1. Construction Site Sky & Horizon Backdrop
    g.fillStyle(this.isHardMode ? 0x16070b : 0x0f172a, 1);
    g.fillRect(0, 0, width, HORIZON_Y);

    // Warm industrial glow above horizon
    g.fillStyle(this.isHardMode ? 0x4c111b : 0x1e293b, 1);
    g.fillRect(0, HORIZON_Y - 48, width, 48);
    g.fillStyle(this.isHardMode ? 0x7f1d1d : 0x78350f, 0.7);
    g.fillRect(0, HORIZON_Y - 14, width, 14);

    // Distant Building Site Skyline & Tower Cranes (with subtle parallax)
    const parallaxOffset = -this.playerWorldX * 0.05;
    const craneColor = this.isHardMode ? 0xef4444 : 0xf59e0b;

    // Left Distant Tower Crane
    const leftCraneX = 110 + parallaxOffset;
    g.fillStyle(craneColor, 0.75);
    g.fillRect(leftCraneX, 118, 10, HORIZON_Y - 118);
    g.fillRect(leftCraneX - 36, 122, 130, 5);
    g.fillStyle(0x9ca3af, 0.7);
    g.fillRect(leftCraneX + 74, 127, 2, 28);
    g.fillStyle(0x991b1b, 0.85);
    g.fillRect(leftCraneX + 58, 155, 34, 6);

    // Right Distant Tower Crane
    const rightCraneX = width - 130 + parallaxOffset;
    g.fillStyle(craneColor, 0.75);
    g.fillRect(rightCraneX, 124, 10, HORIZON_Y - 124);
    g.fillRect(rightCraneX - 90, 128, 130, 5);

    // Distant Unfinished Steel Buildings along Horizon
    const skylinePositions = [40, 230, 380, 550, 710, 860];
    for (let i = 0; i < skylinePositions.length; i++) {
      const bx = skylinePositions[i] + parallaxOffset;
      const bh = 22 + (i % 3) * 12;
      g.fillStyle(0x1e293b, 0.9);
      g.fillRect(bx, HORIZON_Y - bh, 48, bh);
      g.lineStyle(2, 0x7f1d1d, 0.75);
      g.strokeRect(bx, HORIZON_Y - bh, 48, bh);
    }

    // Horizon Yellow & Black Hazard Barrier Wall
    g.fillStyle(0xf59e0b, 1);
    g.fillRect(0, HORIZON_Y - 8, width, 8);
    g.fillStyle(0x111827, 1);
    for (let hx = 0; hx < width; hx += 24) {
      g.fillRect(hx, HORIZON_Y - 8, 12, 8);
    }

    // 2. Construction Haul Road Base (Compacted Dirt, Gravel & Asphalt)
    const floorBaseColor = this.isHardMode ? 0x241215 : 0x26211d;
    g.fillStyle(floorBaseColor, 1);
    g.fillRect(0, HORIZON_Y, width, height - HORIZON_Y);

    // 3. Alternating Perspective Depth Road Strips
    const stripSpacing = 160;
    for (let z = 0; z < 2080; z += stripSpacing) {
      const zNear = z - (this.scrollZ % stripSpacing);
      const zFar = zNear + stripSpacing * 0.5;
      if (zFar <= -240) continue;

      const pNearLeft = this.project3D(-440, 0, Math.max(-240, zNear));
      const pNearRight = this.project3D(440, 0, Math.max(-240, zNear));
      const pFarLeft = this.project3D(-440, 0, zFar);
      const pFarRight = this.project3D(440, 0, zFar);

      const stripColor = this.isHardMode ? 0x33181c : 0x322b26;
      g.fillStyle(stripColor, 1);
      g.beginPath();
      g.moveTo(pFarLeft.screenX, pFarLeft.screenY);
      g.lineTo(pFarRight.screenX, pFarRight.screenY);
      g.lineTo(pNearRight.screenX, pNearRight.screenY);
      g.lineTo(pNearLeft.screenX, pNearLeft.screenY);
      g.closePath();
      g.fillPath();
    }

    // 4. Bulldozer Headlight Beam Highlighting Active Lane
    const activeLeftX = LANE_WORLD_X[this.currentLane] - 124;
    const activeRightX = LANE_WORLD_X[this.currentLane] + 124;
    const laneFarL = this.project3D(activeLeftX, 0, 1920);
    const laneFarR = this.project3D(activeRightX, 0, 1920);
    const laneNearL = this.project3D(activeLeftX, 0, -80);
    const laneNearR = this.project3D(activeRightX, 0, -80);

    g.fillStyle(this.isHardMode ? 0xff4444 : 0xfbbf24, 0.18);
    g.beginPath();
    g.moveTo(laneFarL.screenX, laneFarL.screenY);
    g.lineTo(laneFarR.screenX, laneFarR.screenY);
    g.lineTo(laneNearR.screenX, laneNearR.screenY);
    g.lineTo(laneNearL.screenX, laneNearL.screenY);
    g.closePath();
    g.fillPath();

    // 5. Perspective Construction Zone Lane Markings
    const boundaryXs = [-390, -130, 130, 390];
    for (let i = 0; i < boundaryXs.length; i++) {
      const bx = boundaryXs[i];
      const pFar = this.project3D(bx, 0, 2000);
      const pNear = this.project3D(bx, 0, -120);
      const isOuter = i === 0 || i === boundaryXs.length - 1;
      g.lineStyle(isOuter ? 4 : 2, isOuter ? 0xf59e0b : 0x78716c, isOuter ? 0.95 : 0.7);
      g.lineBetween(pFar.screenX, pFar.screenY, pNear.screenX, pNear.screenY);
    }

    // 6. Scrolling 3D Roadside Steel I-Beam Girders & Construction Drums
    const sortedPillars = [...this.pillarZPositions].sort((a, b) => b - a);
    for (let idx = 0; idx < sortedPillars.length; idx++) {
      const pz = sortedPillars[idx];
      if (pz < -80 || pz > 2040) continue;

      const isGirder = Math.floor((pz + this.scrollZ) / 360) % 2 === 0;

      for (const side of [-1, 1]) {
        const baseProj = this.project3D(side * 435, 0, pz);

        if (isGirder) {
          // Red-Oxide Steel I-Beam Column with Flashing Hazard Beacon
          const topProj = this.project3D(side * 435, 210, pz);
          const pillarW = Math.max(5, 34 * baseProj.scale);
          const pillarH = Math.max(10, baseProj.screenY - topProj.screenY);
          const leftX = baseProj.screenX - pillarW / 2;

          // Concrete footing
          const footH = Math.max(3, 18 * baseProj.scale);
          g.fillStyle(0x64748b, 1);
          g.fillRect(leftX - pillarW * 0.15, baseProj.screenY - footH, pillarW * 1.3, footH);

          // Red-oxide steel beam web & flanges
          g.fillStyle(0x7f1d1d, 0.98);
          g.fillRect(leftX, topProj.screenY, pillarW, pillarH - footH);
          g.fillStyle(0xb91c1c, 1);
          g.fillRect(leftX, topProj.screenY, pillarW * 0.25, pillarH - footH);
          g.fillRect(leftX + pillarW * 0.75, topProj.screenY, pillarW * 0.25, pillarH - footH);

          // Amber Warning Beacon on top
          const beaconS = Math.max(3, 14 * baseProj.scale);
          g.fillStyle(this.isHardMode ? 0xff3333 : 0xffe135, 0.95);
          g.fillRect(baseProj.screenX - beaconS / 2, topProj.screenY - beaconS, beaconS, beaconS);
        } else {
          // Orange & White Striped Construction Hazard Barrel / Cone
          const topProj = this.project3D(side * 435, 85, pz);
          const barrelW = Math.max(4, 38 * baseProj.scale);
          const barrelH = Math.max(6, baseProj.screenY - topProj.screenY);
          const leftX = baseProj.screenX - barrelW / 2;

          g.fillStyle(0xf97316, 1);
          g.fillRect(leftX, topProj.screenY, barrelW, barrelH);
          // White reflective stripes
          g.fillStyle(0xffffff, 0.95);
          g.fillRect(leftX, topProj.screenY + barrelH * 0.22, barrelW, barrelH * 0.2);
          g.fillRect(leftX, topProj.screenY + barrelH * 0.62, barrelW, barrelH * 0.2);
        }
      }
    }
  }

  private renderBoards(): void {
    const g = this.boardsGraphics;
    g.clear();

    if (this.boardTargets.length === 0) return;

    const boardWorldW = 228;
    const boardWorldH = 128;

    for (const board of this.boardTargets) {
      if (board.broken) continue;

      const laneCenterX = LANE_WORLD_X[board.lane];
      const baseProj = this.project3D(laneCenterX, 0, this.waveZ);
      const topProj = this.project3D(laneCenterX, boardWorldH, this.waveZ);

      const screenW = boardWorldW * baseProj.scale;
      const screenH = Math.max(18, baseProj.screenY - topProj.screenY);
      const leftX = baseProj.screenX - screenW / 2;
      const topY = topProj.screenY;

      // Ground Shadow
      g.fillStyle(0x000000, 0.5);
      g.fillRect(leftX + 4, baseProj.screenY - 4, screenW, Math.max(4, 12 * baseProj.scale));

      // Concrete Foundation Curb at Bottom of Wall
      const curbH = Math.max(3, 14 * baseProj.scale);
      g.fillStyle(0x64748b, 1);
      g.fillRect(leftX - 2, baseProj.screenY - curbH, screenW + 4, curbH);

      const wallFaceH = screenH - curbH * 0.6;
      const depthExtrude = Math.max(3, 14 * baseProj.scale);

      // Determine wall colors based on style & highlight state
      let mainWallColor = 0xb91c1c; // Classic red brick
      let altBrickColor = 0x991b1b;
      let mortarColor = 0xd1d5db;
      let extrudeColor = 0x450a0a;
      let borderColor = 0xf59e0b;

      if (board.wallStyle === 'cinderblock') {
        mainWallColor = 0x475569;
        altBrickColor = 0x334155;
        mortarColor = 0x94a3b8;
        extrudeColor = 0x1e293b;
        borderColor = 0x38bdf8;
      } else if (board.wallStyle === 'barricade') {
        mainWallColor = 0xd97706;
        altBrickColor = 0x92400e;
        mortarColor = 0xfef08a;
        extrudeColor = 0x451a03;
        borderColor = 0xffe135;
      }

      if (board.highlightedCorrect) {
        mainWallColor = 0x15803d;
        altBrickColor = 0x166534;
        borderColor = 0x00ff88;
      } else if (board.highlightedWrong) {
        mainWallColor = 0x7f1d1d;
        altBrickColor = 0x450a0a;
        borderColor = 0xff0000;
      } else if (board.lane === this.currentLane) {
        if (board.wallStyle === 'brick') {
          mainWallColor = 0xdc2626;
        }
        borderColor = 0xffe135;
      }

      // 3D Top & Right Extrusion Bevel (Thickness of the brick wall)
      g.fillStyle(extrudeColor, 1);
      g.fillRect(leftX + depthExtrude * 0.4, topY - depthExtrude, screenW, depthExtrude);
      g.fillRect(leftX + screenW, topY - depthExtrude, depthExtrude, wallFaceH + depthExtrude);

      // Main Brick Wall Face
      g.fillStyle(mainWallColor, 1);
      g.fillRect(leftX, topY, screenW, wallFaceH);

      // Draw Mortar Lines & Staggered Brick Courses!
      const courses = 5;
      const courseH = wallFaceH / courses;
      const mortarThickness = Math.max(1, 2 * baseProj.scale);

      // Alternating darker bricks for authentic 8-bit brickwork texture
      g.fillStyle(altBrickColor, 0.85);
      for (let r = 0; r < courses; r++) {
        const ry = topY + r * courseH;
        const offset = (r % 2) * (screenW * 0.125);
        for (let c = 0; c < 4; c++) {
          if ((r + c) % 2 === 0) {
            const bx = leftX + offset + c * (screenW * 0.25);
            const bw = Math.min(screenW * 0.22, leftX + screenW - bx);
            if (bw > 2) {
              g.fillRect(bx, ry + mortarThickness, bw, courseH - mortarThickness * 1.5);
            }
          }
        }
      }

      // Horizontal & Vertical Cement Mortar Lines
      g.lineStyle(mortarThickness, mortarColor, 0.75);
      for (let r = 1; r < courses; r++) {
        const ly = topY + r * courseH;
        g.lineBetween(leftX, ly, leftX + screenW, ly);
      }
      for (let r = 0; r < courses; r++) {
        const ry = topY + r * courseH;
        const offset = (r % 2) * (screenW * 0.125);
        for (let c = 1; c < 4; c++) {
          const vx = leftX + offset + c * (screenW * 0.25);
          if (vx > leftX + 2 && vx < leftX + screenW - 2) {
            g.lineBetween(vx, ry, vx, ry + courseH);
          }
        }
      }

      // Top Hazard / Concrete Coping Cap on the Wall
      const capH = Math.max(2, 8 * baseProj.scale);
      g.fillStyle(board.lane === this.currentLane ? 0xffe135 : 0x9ca3af, 1);
      g.fillRect(leftX - 1, topY, screenW + 2, capH);

      // Outer Wall Frame
      g.lineStyle(Math.max(1.5, 3 * baseProj.scale), borderColor, 1);
      g.strokeRect(leftX, topY, screenW, wallFaceH);

      // Bolted High-Contrast Signplate in Center of Brick Wall for Maximum Text Legibility
      const centerY = topY + wallFaceH * 0.52;
      const plateW = screenW * 0.84;
      const plateH = wallFaceH * 0.58;
      const plateLeft = baseProj.screenX - plateW / 2;
      const plateTop = centerY - plateH / 2;

      g.fillStyle(board.lane === this.currentLane ? 0xfffbeb : 0xfef3c7, 0.96);
      g.fillRect(plateLeft, plateTop, plateW, plateH);
      g.lineStyle(Math.max(1, 2.5 * baseProj.scale), 0x1f2937, 1);
      g.strokeRect(plateLeft, plateTop, plateW, plateH);

      // Update Suffix Text on 3D Brick Wall Signplate
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
