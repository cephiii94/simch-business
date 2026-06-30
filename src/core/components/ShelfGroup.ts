import Phaser from 'phaser';

// Product slot colors per row (3 rows × 6 columns) — seeded per shelf for variety
const PRODUCT_PALETTES: number[][][] = [
  // Palette 0 — warm (buah & sayur)
  [
    [0xe74c3c, 0xf39c12, 0x2ecc71, 0xf1c40f, 0xe67e22, 0x27ae60],
    [0xc0392b, 0xd68910, 0x1e8449, 0xd4ac0d, 0xca6f1e, 0x1d8348],
    [0xe59866, 0xf9e79f, 0xa9dfbf, 0xfad7a0, 0xfdebd0, 0xa9cce3],
  ],
  // Palette 1 — cool (minuman)
  [
    [0x3498db, 0x9b59b6, 0x1abc9c, 0x2980b9, 0x8e44ad, 0x16a085],
    [0x85c1e9, 0xd7bde2, 0xa3e4d7, 0x7fb3d3, 0xc39bd3, 0x76d7c4],
    [0x5dade2, 0xa569bd, 0x45b39d, 0x5499c7, 0x9b59b6, 0x52be80],
  ],
  // Palette 2 — mixed (snack)
  [
    [0xe74c3c, 0xf1c40f, 0x3498db, 0x2ecc71, 0xe67e22, 0x9b59b6],
    [0xec7063, 0xf7dc6f, 0x7fb3d3, 0x82e0aa, 0xf0a500, 0xbb8fce],
    [0xfabebc, 0xfef9e7, 0xd6eaf8, 0xd5f5e3, 0xfde8d8, 0xebdef0],
  ],
  // Palette 3 — warm beige (roti & kue)
  [
    [0xd4ac0d, 0xe59866, 0xca6f1e, 0xf0e68c, 0xdeb887, 0xcd853f],
    [0xf9e79f, 0xfad7a0, 0xf5cba7, 0xfef9e7, 0xfdebd0, 0xfef5e4],
    [0xd5d8dc, 0xecf0f1, 0xfdfefe, 0xd7dbdd, 0xe5e8e8, 0xfbfcfc],
  ],
];

/**
 * Renders a supermarket shelf unit in a 3/4 top-down perspective using Phaser Graphics API.
 * Products deplete visually as stock level decreases.
 */
export class ShelfGroup {
  private readonly bodyG: Phaser.GameObjects.Graphics;
  private readonly productG: Phaser.GameObjects.Graphics;
  private readonly signLabel: Phaser.GameObjects.Text;
  private stockFillPct: number = 1.0;
  private readonly paletteIdx: number;

  public readonly x: number;
  public readonly y: number;

  constructor(scene: Phaser.Scene, x: number, y: number, name: string, paletteIdx: number = 0) {
    this.x = x;
    this.y = y;
    this.paletteIdx = paletteIdx % PRODUCT_PALETTES.length;

    this.bodyG = scene.add.graphics();
    this.productG = scene.add.graphics();

    this.signLabel = scene.add.text(x, y - 59, name, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#1c2833',
      padding: { x: 7, y: 3 },
    }).setOrigin(0.5).setDepth(5);

    this.drawBody();
    this.drawProducts();
  }

  private drawBody(): void {
    // Dikosongkan karena sudah memakai asset PNG shelf-rack.png dari GameScene
    const g = this.bodyG;
    g.clear();
  }

  private drawProducts(): void {
    const g = this.productG;
    g.clear();
    const { x, y } = this;

    const NUM_ROWS = 3;
    const NUM_COLS = 6;
    
    // Y base offset untuk masing-masing dari 3 rak di asset isometrik
    const BASE_Y = [-23, 2, 25];
    
    // Slant slope isometrik untuk shelf-rack.png
    const SLOPE = -0.255;

    const palette = PRODUCT_PALETTES[this.paletteIdx];
    const totalSlots = NUM_ROWS * NUM_COLS;
    const filledSlots = Math.ceil(this.stockFillPct * totalSlots);

    for (let row = 0; row < NUM_ROWS; row++) {
      const baseY = BASE_Y[row];
      for (let col = 0; col < NUM_COLS; col++) {
        const slotIdx = row * NUM_COLS + col;
        
        // Interpolasi posisi X dari kiri ke kanan rak
        const t = col / (NUM_COLS - 1);
        const px = x - 48 + t * 90;
        
        // Hitung Y sesuai kemiringan isometrik
        const py = y + baseY + SLOPE * (px - x);

        const prodW = 8;
        const prodH = 18;

        if (slotIdx >= filledSlots) {
          // Slot kosong — tampilkan siluet abu-abu transparan/shadow minimal
          g.fillStyle(0xd5d8dc, 0.2);
          g.fillRect(px - prodW / 2, py - prodH, prodW, prodH);
        } else {
          const color = palette[row][col];
          
          // Drop shadow kaki produk di rak
          g.fillStyle(0x000000, 0.12);
          g.fillEllipse(px, py, prodW + 2, 4);

          // Body produk
          g.fillStyle(color, 1);
          g.fillRect(px - prodW / 2, py - prodH, prodW, prodH);
          
          // Highlight kilau di bagian kiri produk agar 3D look
          g.fillStyle(0xffffff, 0.25);
          g.fillRect(px - prodW / 2 + 1, py - prodH + 1, 2, prodH - 2);
        }
      }
    }
  }

  /** Update product fill level based on stock percentage (0–1). */
  public updateStockLevel(stockPct: number): void {
    this.stockFillPct = Math.max(0, Math.min(1, stockPct));
    this.drawProducts();
  }

  public setVisible(visible: boolean): void {
    this.bodyG.setVisible(visible);
    this.productG.setVisible(visible);
    this.signLabel.setVisible(visible);
  }

  public destroy(): void {
    this.bodyG.destroy();
    this.productG.destroy();
    this.signLabel.destroy();
  }
}
