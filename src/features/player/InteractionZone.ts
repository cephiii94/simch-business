import Phaser from 'phaser';

/**
 * InteractionZone — Area interaksi berbasis radius di sekitar objek toko.
 * Menampilkan prompt saat player masuk radius, dan memanggil callback saat diklik.
 */
export class InteractionZone {
  private readonly scene: Phaser.Scene;
  private readonly cx: number;
  private readonly cy: number;
  private readonly radius: number;
  private readonly onInteract: () => void;

  // Visual prompt
  private readonly promptText: Phaser.GameObjects.Text;
  private readonly promptBg: Phaser.GameObjects.Graphics;
  private readonly debugCircle: Phaser.GameObjects.Graphics;
  private readonly hitArea: Phaser.GameObjects.Arc;

  private _isPlayerInRange: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    label: string,
    onInteract: () => void
  ) {
    this.scene = scene;
    this.cx = x;
    this.cy = y;
    this.radius = radius;
    this.onInteract = onInteract;

    // Debug circle (sangat transparan — hanya untuk dev)
    this.debugCircle = scene.add.graphics().setDepth(1);
    this.debugCircle.lineStyle(1, 0xffffff, 0.06);
    this.debugCircle.strokeCircle(x, y, radius);

    // Prompt background
    this.promptBg = scene.add.graphics().setDepth(12).setVisible(false);

    // Prompt text
    this.promptText = scene.add.text(x, y - radius - 18, `🖱️ ${label}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: '#1c2833ee',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(13).setVisible(false).setAlpha(0);

    // Hit area (invisible clickable circle over the object)
    this.hitArea = scene.add.arc(x, y, radius, 0, 360, false, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(15);

    this.hitArea.on('pointerdown', () => {
      if (this._isPlayerInRange) {
        this.onInteract();
        // Flash feedback
        scene.tweens.add({
          targets: this.promptText,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 80,
          yoyo: true,
        });
      }
    });
  }

  /**
   * Dipanggil setiap frame dari GameScene.update().
   * Cek apakah player dalam radius, show/hide prompt.
   */
  public update(playerX: number, playerY: number): void {
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.cx, this.cy);
    const inRange = dist <= this.radius;

    if (inRange !== this._isPlayerInRange) {
      this._isPlayerInRange = inRange;
      this.setPromptVisible(inRange);
    }
  }

  public get isPlayerInRange(): boolean {
    return this._isPlayerInRange;
  }

  /** Nonaktifkan zona (misal saat rak belum di-unlock). */
  public setActive(active: boolean): void {
    this.hitArea.setInteractive(active);
    if (!active) this.setPromptVisible(false);
  }

  public destroy(): void {
    this.promptText.destroy();
    this.promptBg.destroy();
    this.debugCircle.destroy();
    this.hitArea.destroy();
  }

  // ─── Private ────────────────────────────────────────────────

  private setPromptVisible(visible: boolean): void {
    this.promptText.setVisible(visible);

    this.scene.tweens.add({
      targets: this.promptText,
      alpha: visible ? 1 : 0,
      y: visible ? this.cy - this.radius - 18 : this.cy - this.radius - 10,
      duration: 180,
      ease: 'Quad.easeOut',
    });
  }
}
