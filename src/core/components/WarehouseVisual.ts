import Phaser from 'phaser';

/**
 * Renders the warehouse storage zone (top-left of store) using Phaser Graphics API.
 * Shows stacked cardboard boxes that scale with current stock level.
 */
export class WarehouseVisual {
  private readonly zoneG: Phaser.GameObjects.Graphics;
  private readonly boxG: Phaser.GameObjects.Graphics;
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly stockText: Phaser.GameObjects.Text;

  // Zone center coordinates
  private static readonly CX = 88;
  private static readonly CY = 168;
  private static readonly W = 140;
  private static readonly H = 118;

  constructor(scene: Phaser.Scene) {
    this.zoneG = scene.add.graphics();
    this.boxG = scene.add.graphics();

    this.drawZone();

    const { CX, CY, H } = WarehouseVisual;

    this.titleText = scene.add.text(CX, CY - H / 2 - 15, '📦 GUDANG', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#a9cce3',
      fontStyle: 'bold',
      backgroundColor: '#1a252f',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5);

    this.stockText = scene.add.text(CX, CY + H / 2 + 10, '0 unit', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#7f8c8d',
    }).setOrigin(0.5);
  }

  private drawZone(): void {
    const g = this.zoneG;
    g.clear();
    const { CX: cx, CY: cy, W: w, H: h } = WarehouseVisual;

    // Zone background
    g.fillStyle(0x1a252f, 0.88);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);

    // Zone border
    g.lineStyle(2, 0x2e4053, 1);
    g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);

    // Corner dots (decoration)
    g.fillStyle(0x2e4053, 1);
    const corners = [
      [cx - w / 2 + 5, cy - h / 2 + 5],
      [cx + w / 2 - 5, cy - h / 2 + 5],
      [cx - w / 2 + 5, cy + h / 2 - 5],
      [cx + w / 2 - 5, cy + h / 2 - 5],
    ];
    corners.forEach(([dx, dy]) => g.fillCircle(dx, dy, 3));
  }

  public update(stock: number): void {
    const g = this.boxG;
    g.clear();
    this.stockText.setText(`${stock} unit`);

    if (stock <= 0) return;

    const { CX: cx, CY: cy, W: w, H: h } = WarehouseVisual;
    const BASE_Y = cy + h / 2 - 8;
    const piles = stock > 75 ? 4 : stock > 45 ? 3 : stock > 15 ? 2 : 1;
    const STEP = (w - 24) / (piles + 1);
    const BOX_W = 28;
    const BOX_H = 19;

    for (let i = 0; i < piles; i++) {
      const px = cx - w / 2 + 12 + (i + 0.5) * STEP + BOX_W / 2;
      const stackH = Math.min(3, Math.max(1, Math.ceil(stock / (piles * 10))));

      for (let j = stackH - 1; j >= 0; j--) {
        const py = BASE_Y - j * (BOX_H + 2);

        // Box body
        g.fillStyle(0xcd853f, 1);
        g.fillRect(px - BOX_W / 2, py - BOX_H, BOX_W, BOX_H);

        // Box top highlight
        g.fillStyle(0xdaa520, 1);
        g.fillRect(px - BOX_W / 2, py - BOX_H, BOX_W, 4);

        // Tape cross markings
        g.lineStyle(1.5, 0x8b6914, 0.9);
        g.moveTo(px - BOX_W / 2, py - BOX_H + 4);
        g.lineTo(px + BOX_W / 2, py);
        g.moveTo(px + BOX_W / 2, py - BOX_H + 4);
        g.lineTo(px - BOX_W / 2, py);
        g.strokePath();

        // Box border
        g.lineStyle(1.2, 0x7a5c1e, 0.85);
        g.strokeRect(px - BOX_W / 2, py - BOX_H, BOX_W, BOX_H);
      }
    }
  }

  public destroy(): void {
    this.zoneG.destroy();
    this.boxG.destroy();
    this.titleText.destroy();
    this.stockText.destroy();
  }
}
