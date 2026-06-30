import Phaser from 'phaser';
import heroImg from '../../assets/hero.png';
import viteLogo from '../../assets/vite.svg';
import typescriptLogo from '../../assets/typescript.svg';
import shelfRackImg from '../../assets/shelf-rack.png';
import cashierCounterImg from '../../assets/cashier-counter.png';
import ownerImg from '../../assets/char-owner.png';
import fridgeImg from '../../assets/fridge-unit.png';
import breakRoomImg from '../../assets/break-room.png';
import plantImg from '../../assets/plant-pot.png';
import warehouseImg from '../../assets/warehouse-bg.png';
import doorImg from '../../assets/store-door.png';
import { ASSETS } from '../config/assets.ts';
import { eventBus, EVENTS } from '../../shared/utils/event-bus.ts';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  init(): void {
    console.log('BootScene initialized');
  }

  preload(): void {
    // Menampilkan visual loading progress dasar di console (atau text jika dibutuhkan)
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    // Memuat aset melalui modul import Vite agar ter-bundle dengan benar
    this.load.image(ASSETS.IMAGES.LOGO, heroImg);
    this.load.image(ASSETS.IMAGES.VITE, viteLogo);
    this.load.image(ASSETS.IMAGES.TYPESCRIPT, typescriptLogo);
    this.load.image(ASSETS.IMAGES.SHELF, shelfRackImg);
    this.load.image(ASSETS.IMAGES.CASHIER, cashierCounterImg);
    this.load.image(ASSETS.IMAGES.OWNER, ownerImg);
    this.load.image(ASSETS.IMAGES.FRIDGE, fridgeImg);
    this.load.image(ASSETS.IMAGES.BREAK_ROOM, breakRoomImg);
    this.load.image(ASSETS.IMAGES.PLANT, plantImg);
    this.load.image(ASSETS.IMAGES.WAREHOUSE, warehouseImg);
    this.load.image(ASSETS.IMAGES.DOOR, doorImg);
    
    this.load.on('complete', () => {
      loadingText.destroy();
    });
  }

  create(): void {
    console.log('BootScene assets loaded');
    eventBus.emit(EVENTS.BOOT_COMPLETE);
    this.scene.start('MainMenuScene');
  }
}
