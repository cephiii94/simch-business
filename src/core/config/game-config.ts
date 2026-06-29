import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene.ts';
import { MainMenuScene } from '../scenes/MainMenuScene.ts';
import { GameScene } from '../scenes/GameScene.ts';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#16171d',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  dom: {
    createContainer: true
  },
  scene: [BootScene, MainMenuScene, GameScene]
};
