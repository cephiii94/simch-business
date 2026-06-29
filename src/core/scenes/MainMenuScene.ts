import Phaser from 'phaser';
import { eventBus, EVENTS } from '../../shared/utils/event-bus.ts';

export class MainMenuScene extends Phaser.Scene {
  private particles?: Phaser.GameObjects.Graphics[];

  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    console.log('MainMenuScene created');
    
    // Membuat latar belakang dengan efek partikel melayang yang premium di Canvas
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Menggambar grid futuristik tipis di latar belakang canvas
    const grid = this.add.grid(width / 2, height / 2, width, height, 64, 64, 0x000000, 0, 0xaa3bff, 0.08);
    grid.setAlpha(0.5);

    // Menambahkan gelembung cahaya / partikel mengambang halus
    this.particles = [];
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const radius = Phaser.Math.Between(4, 12);
      const graphics = this.add.graphics();
      
      graphics.fillStyle(0xaa3bff, 0.15);
      graphics.fillCircle(0, 0, radius);
      graphics.setPosition(x, y);
      
      // Simpan referensi dan tambahkan metadata kecepatan melayang
      (graphics as any).vx = Phaser.Math.FloatBetween(-0.2, 0.2);
      (graphics as any).vy = Phaser.Math.FloatBetween(-0.3, -0.05);
      (graphics as any).radius = radius;
      
      this.particles.push(graphics);
    }

    // Beri tahu HTML Overlay untuk memunculkan antarmuka Menu Utama
    eventBus.emit(EVENTS.SHOW_MAIN_MENU);

    // Jalankan scene game ketika event START_GAME dipancarkan
    eventBus.once(EVENTS.START_GAME, () => {
      this.scene.start('GameScene');
    });
  }

  update(_time: number, delta: number): void {
    // Animasi pergerakan partikel melayang di latar belakang
    if (this.particles) {
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;

      this.particles.forEach((p: any) => {
        p.x += p.vx * (delta / 16.67);
        p.y += p.vy * (delta / 16.67);

        // Jika keluar dari batas atas layar, reset ke bawah
        if (p.y < -p.radius * 2) {
          p.y = height + p.radius * 2;
          p.x = Phaser.Math.Between(0, width);
        }
        // Jika keluar batas samping, reset
        if (p.x < -p.radius * 2 || p.x > width + p.radius * 2) {
          p.vx *= -1;
        }
      });
    }
  }
}
