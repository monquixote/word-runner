import Phaser from 'phaser';
import { createPixelArtTextures } from '../utils/pixelTextures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    createPixelArtTextures(this);
    this.scene.start('MenuScene');
  }
}
