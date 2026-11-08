import Phaser from 'phaser';
import { speechManager, AvailableVoice } from '../utils/pronunciation';
import { soundFx } from '../utils/soundEffects';

export class VoiceConfigScene extends Phaser.Scene {
  private returnTo: string = 'MenuScene';
  private currentPage: number = 0;
  private readonly itemsPerPage: number = 4;
  private listContainer!: Phaser.GameObjects.Container;
  private pageText!: Phaser.GameObjects.Text;
  private prevButton!: Phaser.GameObjects.Text;
  private nextButton!: Phaser.GameObjects.Text;
  private activeVoiceText!: Phaser.GameObjects.Text;

  constructor() {
    super('VoiceConfigScene');
  }

  init(data?: { returnTo?: string }): void {
    if (data?.returnTo) {
      this.returnTo = data.returnTo;
    }
    this.currentPage = 0;
  }

  create(): void {
    const { width, height } = this.scale;

    const bg = this.add.image(width / 2, height / 2, 'dojang_bg');
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.35);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x0a0c16, 0.9);
    overlay.fillRect(0, 0, width, height);

    this.add.text(width / 2, 34, '◆ VOICE CONFIGURATION ◆', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '20px',
      color: '#ffe135',
      stroke: '#b83000',
      strokeThickness: 5
    }).setOrigin(0.5);

    this.activeVoiceText = this.add.text(width / 2, 70, `ACTIVE: ${speechManager.getActiveVoiceLabel()}`, {
      fontFamily: "'Fredoka', 'Press Start 2P', sans-serif",
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#00ffaa'
    }).setOrigin(0.5);

    const soundToggle = this.add.text(width - 24, 20, soundFx.isEnabled() ? '🔊' : '🔇', {
      fontSize: '20px'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    soundToggle.on('pointerdown', () => {
      const enabled = soundFx.toggleSound();
      soundToggle.setText(enabled ? '🔊' : '🔇');
    });

    this.listContainer = this.add.container(0, 0);

    const pageY = 440;
    this.prevButton = this.add.text(width / 2 - 220, pageY, '◀ PREV', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '13px',
      color: '#ffe135'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.pageText = this.add.text(width / 2, pageY, 'PAGE 1 / 1', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '13px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.nextButton = this.add.text(width / 2 + 220, pageY, 'NEXT ▶', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '13px',
      color: '#ffe135'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.prevButton.on('pointerdown', () => {
      soundFx.playSelect();
      this.changePage(-1);
    });

    this.nextButton.on('pointerdown', () => {
      soundFx.playSelect();
      this.changePage(1);
    });

    const btnY = height - 48;
    const btnH = 46;
    const backBtnX = width / 2 - 160;
    const backBtnW = 280;

    const backBg = this.add.graphics();
    backBg.fillStyle(0x282848, 1);
    backBg.fillRect(backBtnX - backBtnW / 2, btnY - btnH / 2, backBtnW, btnH);
    backBg.lineStyle(2, 0x7777aa, 1);
    backBg.strokeRect(backBtnX - backBtnW / 2, btnY - btnH / 2, backBtnW, btnH);

    this.add.text(backBtnX, btnY, '◀ BACK TO MENU', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const backZone = this.add.zone(backBtnX, btnY, backBtnW, btnH).setInteractive({ useHandCursor: true });
    backZone.on('pointerdown', () => this.goBack());

    const pitchBtnX = width / 2 + 160;
    const pitchBtnW = 280;
    const pitchBg = this.add.graphics();
    pitchBg.fillStyle(0x1e2444, 1);
    pitchBg.fillRect(pitchBtnX - pitchBtnW / 2, btnY - btnH / 2, pitchBtnW, btnH);
    pitchBg.lineStyle(2, 0x4466aa, 1);
    pitchBg.strokeRect(pitchBtnX - pitchBtnW / 2, btnY - btnH / 2, pitchBtnW, btnH);

    const pitchSteps: (number | null)[] = [null, 0.9, 1.1];
    const pitchLabel = () => {
      const p = speechManager.getUserPitch();
      if (p === null) return 'PITCH: NATURAL (1.0)';
      return `PITCH: ${p.toFixed(1)}`;
    };

    const pitchText = this.add.text(pitchBtnX, btnY, pitchLabel(), {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '12px',
      color: '#ffe135'
    }).setOrigin(0.5);

    const pitchZone = this.add.zone(pitchBtnX, btnY, pitchBtnW, btnH).setInteractive({ useHandCursor: true });
    pitchZone.on('pointerdown', () => {
      soundFx.playSelect();
      const cur = speechManager.getUserPitch();
      const idx = pitchSteps.findIndex(s => s === cur);
      const next = pitchSteps[(idx + 1) % pitchSteps.length];
      speechManager.setUserPitch(next);
      pitchText.setText(pitchLabel());
      speechManager.testVoice();
    });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => this.goBack());
      this.input.keyboard.on('keydown-LEFT', () => this.changePage(-1));
      this.input.keyboard.on('keydown-RIGHT', () => this.changePage(1));
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.renderVoiceList();
      };
    }

    this.renderVoiceList();
  }

  private getVoiceItems(): (AvailableVoice | { isAuto: true })[] {
    return [{ isAuto: true }, ...speechManager.getAvailableVoices()];
  }

  private renderVoiceList(): void {
    this.listContainer.removeAll(true);
    const { width } = this.scale;
    const items = this.getVoiceItems();
    const totalPages = Math.max(1, Math.ceil(items.length / this.itemsPerPage));

    if (this.currentPage >= totalPages) {
      this.currentPage = totalPages - 1;
    }

    this.pageText.setText(`PAGE ${this.currentPage + 1} / ${totalPages}`);
    this.prevButton.setAlpha(this.currentPage > 0 ? 1 : 0.35);
    this.nextButton.setAlpha(this.currentPage < totalPages - 1 ? 1 : 0.35);

    if (this.activeVoiceText) {
      this.activeVoiceText.setText(`ACTIVE: ${speechManager.getActiveVoiceLabel()}`);
    }

    const startIndex = this.currentPage * this.itemsPerPage;
    const pageItems = items.slice(startIndex, startIndex + this.itemsPerPage);

    const startY = 125;
    const cardH = 58;
    const cardSpacing = 72;
    const cardW = 860;
    const selectedURI = speechManager.getSelectedVoiceURI();

    pageItems.forEach((item, index) => {
      const cardY = startY + index * cardSpacing;
      const isAuto = 'isAuto' in item;
      const voiceURI = isAuto ? null : item.voiceURI;
      const isSelected = isAuto ? (!selectedURI || selectedURI === 'auto') : selectedURI === voiceURI;

      const card = this.add.container(width / 2, cardY);
      const bg = this.add.graphics();

      if (isSelected) {
        bg.fillStyle(0x0e3820, 0.96);
        bg.fillRect(-cardW / 2, -cardH / 2, cardW, cardH);
        bg.lineStyle(2, 0x00ff88, 1);
        bg.strokeRect(-cardW / 2, -cardH / 2, cardW, cardH);
      } else {
        bg.fillStyle(0x121424, 0.96);
        bg.fillRect(-cardW / 2, -cardH / 2, cardW, cardH);
        bg.lineStyle(2, 0x2e3250, 1);
        bg.strokeRect(-cardW / 2, -cardH / 2, cardW, cardH);
      }

      const radioSymbol = isSelected ? '●' : '○';
      const radioColor = isSelected ? '#00ff88' : '#666688';
      const radioText = this.add.text(-cardW / 2 + 24, 0, radioSymbol, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '16px',
        color: radioColor
      }).setOrigin(0.5);

      const title = isAuto ? 'AUTO-DETECT (RECOMMENDED UK ENGLISH)' : item.friendlyName.substring(0, 36);
      const desc = isAuto ? 'Default high-clarity British English voice' : `${item.lang} | ${item.name.substring(0, 48)}`;

      const titleText = this.add.text(-cardW / 2 + 56, -10, title, {
        fontFamily: "'Fredoka', 'Press Start 2P', sans-serif",
        fontSize: '17px',
        fontStyle: 'bold',
        color: isSelected ? '#00ffaa' : '#ffffff'
      }).setOrigin(0, 0.5);

      const descText = this.add.text(-cardW / 2 + 56, 14, desc, {
        fontFamily: "'Fredoka', sans-serif",
        fontSize: '13px',
        color: isSelected ? '#88ffcc' : '#8888aa'
      }).setOrigin(0, 0.5);

      const testBtnW = 100;
      const testBtnH = 38;
      const testBtnX = cardW / 2 - 64;

      const testBg = this.add.graphics();
      testBg.fillStyle(0x283058, 1);
      testBg.fillRect(testBtnX - testBtnW / 2, -testBtnH / 2, testBtnW, testBtnH);
      testBg.lineStyle(2, 0x5566aa, 1);
      testBg.strokeRect(testBtnX - testBtnW / 2, -testBtnH / 2, testBtnW, testBtnH);

      const testText = this.add.text(testBtnX, 0, 'TEST 🔊', {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '11px',
        color: '#ffe135'
      }).setOrigin(0.5);

      const testZone = this.add.zone(testBtnX, 0, testBtnW, testBtnH).setInteractive({ useHandCursor: true });
      testZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event.stopPropagation();
        speechManager.testVoice(voiceURI || undefined);
      });

      const cardZone = this.add.zone(-testBtnW / 2, 0, cardW - testBtnW - 20, cardH).setInteractive({ useHandCursor: true });
      cardZone.on('pointerdown', () => {
        soundFx.playSelect();
        speechManager.setSelectedVoiceURI(isAuto ? null : item.voiceURI);
        speechManager.testVoice(voiceURI || undefined);
        this.renderVoiceList();
      });

      card.add([bg, radioText, titleText, descText, testBg, testText, testZone, cardZone]);
      this.listContainer.add(card);
    });
  }

  private changePage(delta: number): void {
    const items = this.getVoiceItems();
    const totalPages = Math.max(1, Math.ceil(items.length / this.itemsPerPage));
    const newPage = Phaser.Math.Clamp(this.currentPage + delta, 0, totalPages - 1);
    if (newPage !== this.currentPage) {
      this.currentPage = newPage;
      this.renderVoiceList();
    }
  }

  private goBack(): void {
    soundFx.playSelect();
    this.scene.start(this.returnTo);
  }
}
