import Phaser from 'phaser';
import type { PlayerState } from '../../shared/types/game.types.ts';
import { ASSETS } from '../../core/config/assets.ts';

/**
 * PlayerCharacter — Karakter owner yang dikontrol pemain dengan WASD/Arrow Keys.
 *
 * Arsitektur:
 *  - `container` = posisi logis (x,y) untuk collision & interaction check
 *  - `visual`    = Graphics child di dalam container — hanya ini yang di-tween (bob)
 *  - Tween TIDAK menyentuh container.y, sehingga gerakan 4 arah berfungsi penuh.
 */
export class PlayerCharacter {
  // Posisi logis — dipakai untuk collision & getter x/y
  private readonly container: Phaser.GameObjects.Container;
  // Visual child — di-tween untuk idle bob, TIDAK dipakai untuk posisi logis
  private readonly visual: Phaser.GameObjects.Image;
  private readonly nameLabel: Phaser.GameObjects.Text;

  private currentState: PlayerState = 'IDLE';

  private readonly keys: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    UP: Phaser.Input.Keyboard.Key;
    LEFT: Phaser.Input.Keyboard.Key;
    DOWN: Phaser.Input.Keyboard.Key;
    RIGHT: Phaser.Input.Keyboard.Key;
  };

  // Kecepatan gerak dalam px/detik
  private readonly SPEED = 120;

  // Batas area toko (hindari masuk sidebar & HUD)
  private readonly BOUNDS = {
    minX: 22,
    maxX: 698,
    minY: 102,
    maxY: 748,
  };

  public get x(): number { return this.container.x; }
  public get y(): number { return this.container.y; }
  public get state(): PlayerState { return this.currentState; }

  constructor(scene: Phaser.Scene, startX: number, startY: number) {
    // Visual sprite image (child — hanya untuk tampilan)
    this.visual = scene.add.image(0, 0, ASSETS.IMAGES.OWNER)
      .setDisplaySize(64, 64)
      .setOrigin(0.5, 0.7); // Set origin ke area kaki agar depth sorting alami

    // Label nama (juga child, posisi relatif terhadap container)
    this.nameLabel = scene.add.text(0, -30, '👔 Owner', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#f1c40f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Container = posisi logis. Berisi visual + label sebagai children.
    this.container = scene.add.container(startX, startY, [this.visual, this.nameLabel]);
    this.container.setDepth(7);

    // Idle bob — hanya tween visual child (local y offset), container.y TIDAK berubah
    scene.tweens.add({
      targets: this.visual,
      y: 3,          // bergerak dari 0 ke 3 (local offset di dalam container)
      duration: 900,
      yoyo: true,
      loop: -1,
      ease: 'Sine.easeInOut',
    });

    // Setup keyboard input
    const kb = scene.input.keyboard!;
    this.keys = {
      W:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      UP:    kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      LEFT:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      DOWN:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      RIGHT: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
    };
  }

  /** Dipanggil di GameScene.update() setiap frame. */
  public update(delta: number, colliders: Phaser.Geom.Rectangle[]): void {
    const speed = this.SPEED * (delta / 1000);

    const movingLeft  = this.keys.A.isDown || this.keys.LEFT.isDown;
    const movingRight = this.keys.D.isDown || this.keys.RIGHT.isDown;
    const movingUp    = this.keys.W.isDown || this.keys.UP.isDown;
    const movingDown  = this.keys.S.isDown || this.keys.DOWN.isDown;

    const isMoving = movingLeft || movingRight || movingUp || movingDown;

    // Hitung posisi baru dari container (posisi logis)
    let nx = this.container.x;
    let ny = this.container.y;

    if (movingLeft) {
      nx -= speed;
      this.visual.scaleX = -1; // Hadap kiri
    }
    if (movingRight) {
      nx += speed;
      this.visual.scaleX = 1;  // Hadap kanan
    }
    if (movingUp)    ny -= speed;
    if (movingDown)  ny += speed;

    // Hitbox player di bagian kaki/bawah (lebar 16px, tinggi 10px, offset Y +10px)
    // Ini membuat pergerakan melewati celah sempit rak jauh lebih mulus (feet-only collision)
    const HALF_W = 8;
    const HALF_H = 5;
    const OFFSET_Y = 10;
    
    const xRect = new Phaser.Geom.Rectangle(nx - HALF_W, this.container.y + OFFSET_Y - HALF_H, HALF_W * 2, HALF_H * 2);
    const yRect = new Phaser.Geom.Rectangle(this.container.x - HALF_W, ny + OFFSET_Y - HALF_H, HALF_W * 2, HALF_H * 2);

    let canMoveX = true;
    let canMoveY = true;

    for (const col of colliders) {
      if (Phaser.Geom.Intersects.RectangleToRectangle(xRect, col)) canMoveX = false;
      if (Phaser.Geom.Intersects.RectangleToRectangle(yRect, col)) canMoveY = false;
    }

    // Terapkan ke container (posisi logis) — visual child mengikuti otomatis
    if (canMoveX) {
      this.container.x = Phaser.Math.Clamp(nx, this.BOUNDS.minX, this.BOUNDS.maxX);
    }
    if (canMoveY) {
      this.container.y = Phaser.Math.Clamp(ny, this.BOUNDS.minY, this.BOUNDS.maxY);
    }

    // Update state
    const newState: PlayerState = isMoving ? 'WALKING' : 'IDLE';
    if (newState !== this.currentState) {
      this.currentState = newState;
    }
  }

  /** Ganti state ke INTERACTING saat sedang berinteraksi dengan objek. */
  public setInteracting(value: boolean): void {
    this.currentState = value ? 'INTERACTING' : 'IDLE';
  }

  public destroy(): void {
    this.container.destroy(true); // true = destroy semua children
  }
}
