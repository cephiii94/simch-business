import Phaser from 'phaser';
import { TimeSystem } from '../../shared/utils/TimeSystem.ts';
import { GameState } from '../../features/branches/GameState.ts';
import { EmployeeAgent } from '../../features/employees/EmployeeAgent.ts';
import { eventBus, EVENTS } from '../../shared/utils/event-bus.ts';
import { SoundManager } from '../../shared/utils/SoundManager.ts';
import type { Employee } from '../../shared/types/game.types.ts';
import { WarehouseVisual } from '../components/WarehouseVisual.ts';
import { ShelfGroup } from '../components/ShelfGroup.ts';

interface VisualCustomer {
  graphics: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  personality: 'Cheapskate' | 'Normal' | 'Big Spender';
  priceThreshold: number;
  qtyWanted: number;
  patience: number;
  maxPatience: number;
  patienceBar?: Phaser.GameObjects.Graphics;
}

interface VisualWorker {
  graphics: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  energyBar: Phaser.GameObjects.Graphics;
}

export class GameScene extends Phaser.Scene {
  private timeSystem = TimeSystem.getInstance();
  private gameState = GameState.getInstance();
  private employeeAgents: Map<string, EmployeeAgent> = new Map();

  // Phaser Game Objects
  private registerGraphics?: Phaser.GameObjects.Graphics;
  private clickIndicator?: Phaser.GameObjects.Text;

  // Modular visual components
  private shelfA?: ShelfGroup;
  private shelfB?: ShelfGroup;
  private shelfC?: ShelfGroup;
  private shelfD?: ShelfGroup;
  private warehouseVisual?: WarehouseVisual;

  // Customer queue
  private queue: VisualCustomer[] = [];
  private customerSpawnTimer?: Phaser.Time.TimerEvent;
  private autoServeTimers = new Map<string, Phaser.Time.TimerEvent>();
  private visualWorkers = new Map<string, VisualWorker>();

  // === TOP-DOWN STORE COORDINATE SYSTEM ===
  //  • Canvas: 1024 × 768  (Phaser)
  //  • Sidebar HTML overlay: x ≥ ~720  → keep game elements in x < 710
  //  • HUD HTML overlay: y < ~95       → keep game elements in y > 95
  //  • Customers enter from the bottom, walk up to shelves, then queue at cashier

  private readonly ENTRY_X_MIN = 150;   // Random spawn range
  private readonly ENTRY_X_MAX = 480;
  private readonly ENTRY_Y = 740;       // Bottom of store

  private readonly EXIT_X = 790;        // Off-screen right

  private readonly BASE_Y = 502;        // Queue / cashier row Y
  private readonly QUEUE_START_X = 488;
  private readonly QUEUE_SPACING = 54;

  private readonly REGISTER_X = 570;
  private readonly REGISTER_Y = 490;

  private readonly WORKER_WORKING_X = 548;
  private readonly WORKER_WORKING_Y = 468;
  private readonly WORKER_BREAK_X = 88;
  private readonly WORKER_BREAK_Y = 605;

  // Shelf positions
  private readonly SHELF_A_X = 240;
  private readonly SHELF_A_Y = 240;
  private readonly SHELF_B_X = 420;
  private readonly SHELF_B_Y = 240;
  private readonly SHELF_C_X = 240;
  private readonly SHELF_C_Y = 345;
  private readonly SHELF_D_X = 420;
  private readonly SHELF_D_Y = 345;

  // Stock visual dirty-check
  private lastStockPct: number = -1;

  constructor() {
    super('GameScene');
  }

  // ─────────────────────────────────────────────────────────────
  //  LIFECYCLE
  // ─────────────────────────────────────────────────────────────

  create(): void {
    const W = this.cameras.main.width;    // 1024
    const H = this.cameras.main.height;   // 768

    // 1. Floor & walls
    this.drawFloor(W, H);
    this.drawBackWall(W);

    // 2. Static store zones
    this.drawFridgeSection();
    this.drawBreakRoom();

    // 3. Shelves (paletteIdx drives product color theme)
    this.shelfA = new ShelfGroup(this, this.SHELF_A_X, this.SHELF_A_Y, '🍎 Buah & Sayur', 0);
    this.shelfB = new ShelfGroup(this, this.SHELF_B_X, this.SHELF_B_Y, '🥤 Minuman', 1);
    this.shelfC = new ShelfGroup(this, this.SHELF_C_X, this.SHELF_C_Y, '🍿 Snack', 2);
    this.shelfC.setVisible(false);
    this.shelfD = new ShelfGroup(this, this.SHELF_D_X, this.SHELF_D_Y, '🍞 Roti & Kue', 3);
    this.shelfD.setVisible(false);

    // 4. Warehouse visual component
    this.warehouseVisual = new WarehouseVisual(this);

    // 5. Cashier counter
    this.drawCashierCounter();

    // 6. Aisle decorations & floor markings
    this.drawDecorations();

    // 7. Click indicator (manual mode)
    this.clickIndicator = this.add.text(this.REGISTER_X, this.REGISTER_Y - 74, '🛎️ KLIK KASIR', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#f1c40f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: this.clickIndicator,
      alpha: { from: 1, to: 0.25 },
      duration: 700,
      yoyo: true,
      loop: -1,
    });

    // Invisible interactive area over counter
    const hitArea = this.add.rectangle(this.REGISTER_X, this.REGISTER_Y, 108, 64, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);
    hitArea.on('pointerdown', () => this.serveCustomerManually());

    // Register graphics placeholder (used for shake animation)
    this.registerGraphics = this.add.graphics();

    // 8. Employee agents & event bus
    this.syncEmployeesFromState();
    eventBus.on(EVENTS.TIME_TICK, this.onTimeTick, this);
    eventBus.on(EVENTS.EMPLOYEE_HIRED, this.onEmployeeHired, this);
    eventBus.on(EVENTS.EMPLOYEE_STATE_CHANGED, this.onEmployeeStateChanged, this);

    this.events.on('shutdown', () => {
      eventBus.off(EVENTS.TIME_TICK, this.onTimeTick, this);
      eventBus.off(EVENTS.EMPLOYEE_HIRED, this.onEmployeeHired, this);
      eventBus.off(EVENTS.EMPLOYEE_STATE_CHANGED, this.onEmployeeStateChanged, this);
      if (this.customerSpawnTimer) this.customerSpawnTimer.destroy();
      this.autoServeTimers.forEach(t => t.destroy());
      this.autoServeTimers.clear();
      this.visualWorkers.forEach(vw => {
        vw.graphics.destroy();
        vw.label.destroy();
        vw.energyBar.destroy();
      });
      this.visualWorkers.clear();
      this.shelfA?.destroy();
      this.shelfB?.destroy();
      this.shelfC?.destroy();
      this.shelfD?.destroy();
      this.warehouseVisual?.destroy();
    });

    // 9. Start game systems
    this.timeSystem.startDay();
    this.scheduleNextCustomerSpawn();
  }

  update(time: number, delta: number): void {
    this.timeSystem.update(time, delta);
    this.updateWorkerVisuals();
    this.checkAutoServe();
    this.updateCustomerPatience(delta);
    this.updateWarehouseVisuals();
    this.updateShelfVisuals();
  }

  // ─────────────────────────────────────────────────────────────
  //  STATIC DRAWING HELPERS
  // ─────────────────────────────────────────────────────────────

  private drawFloor(W: number, H: number): void {
    const TILE = 48;
    const g = this.add.graphics();

    // Checkerboard tile pattern
    for (let row = 0; row <= Math.ceil(H / TILE); row++) {
      for (let col = 0; col <= Math.ceil(W / TILE); col++) {
        g.fillStyle((row + col) % 2 === 0 ? 0xf5efde : 0xeae2cc, 1);
        g.fillRect(col * TILE, row * TILE, TILE, TILE);
      }
    }

    // Very subtle grid lines
    g.lineStyle(0.5, 0x000000, 0.04);
    for (let col = 0; col <= Math.ceil(W / TILE) + 1; col++) {
      g.moveTo(col * TILE, 0);
      g.lineTo(col * TILE, H);
    }
    for (let row = 0; row <= Math.ceil(H / TILE) + 1; row++) {
      g.moveTo(0, row * TILE);
      g.lineTo(W, row * TILE);
    }
    g.strokePath();
  }

  private drawBackWall(W: number): void {
    const g = this.add.graphics();
    const WALL_H = 100;

    // Sky-blue wall band
    g.fillStyle(0x7ec8e3, 1);
    g.fillRect(0, 0, W, WALL_H);

    // Baseboard strip
    g.fillStyle(0x4da6c8, 1);
    g.fillRect(0, WALL_H - 14, W, 14);

    // Decorative windows
    for (let i = 0; i < 5; i++) {
      const wx = 110 + i * 165;
      // Window pane
      g.fillStyle(0xb8e4f5, 1);
      g.fillRoundedRect(wx - 26, 10, 52, 58, 5);
      g.lineStyle(2.5, 0x2e86c1, 1);
      g.strokeRoundedRect(wx - 26, 10, 52, 58, 5);
      // Window cross
      g.lineStyle(1.5, 0x2e86c1, 0.65);
      g.moveTo(wx, 10); g.lineTo(wx, 68);
      g.moveTo(wx - 26, 40); g.lineTo(wx + 26, 40);
      g.strokePath();
      // Windowsill
      g.fillStyle(0xd9e8f2, 1);
      g.fillRect(wx - 30, 68, 60, 4);
    }

    // Side wall highlights
    g.fillStyle(0x5dade2, 0.18);
    g.fillRect(0, WALL_H, 10, 668);
    g.fillRect(710, WALL_H, 10, 668);
  }

  private drawFridgeSection(): void {
    const g = this.add.graphics();
    const FX = 608;
    const FY = 105;
    const FW = 90;
    const FH = 148;

    // Section backing
    g.fillStyle(0x1a2d3e, 0.78);
    g.fillRoundedRect(FX, FY, FW, FH, 6);

    // 2 fridge units side by side
    const FRIDGE_COLORS = [0xe74c3c, 0xf1c40f, 0x2ecc71, 0x3498db, 0xe67e22, 0x9b59b6];
    for (let i = 0; i < 2; i++) {
      const rx = FX + 6 + i * 42;
      // Fridge body
      g.fillStyle(0x7ec8e3, 0.9);
      g.fillRect(rx, FY + 6, 34, FH - 14);
      // Glass door effect
      g.fillStyle(0xb6def5, 0.75);
      g.fillRect(rx + 2, FY + 9, 30, FH - 20);
      // Products inside
      for (let j = 0; j < 5; j++) {
        g.fillStyle(FRIDGE_COLORS[(i * 3 + j) % FRIDGE_COLORS.length], 0.9);
        g.fillRoundedRect(rx + 4, FY + 13 + j * 24, 26, 19, 2);
      }
      g.lineStyle(1.5, 0x3498db, 1);
      g.strokeRect(rx, FY + 6, 34, FH - 14);
    }

    // Label
    this.add.text(FX + FW / 2, FY - 15, '🧊 Kulkas', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#aed6f1',
      backgroundColor: '#1a2d3e',
      padding: { x: 5, y: 2 },
    }).setOrigin(0.5);
  }

  private drawBreakRoom(): void {
    const g = this.add.graphics();
    const bx = this.WORKER_BREAK_X;
    const by = this.WORKER_BREAK_Y;
    const BW = 138;
    const BH = 118;

    // Room background
    g.fillStyle(0x1c2b3a, 0.82);
    g.fillRoundedRect(bx - BW / 2, by - BH / 2, BW, BH, 8);
    g.lineStyle(2, 0x2e4053, 1);
    g.strokeRoundedRect(bx - BW / 2, by - BH / 2, BW, BH, 8);

    // Sofa
    g.fillStyle(0x1f618d, 1);
    g.fillRoundedRect(bx - 42, by - 10, 84, 32, 7);
    // Cushions
    g.fillStyle(0x2e86c1, 0.85);
    g.fillRoundedRect(bx - 38, by - 7, 34, 24, 5);
    g.fillRoundedRect(bx + 4, by - 7, 34, 24, 5);
    // Sofa back
    g.fillStyle(0x154360, 1);
    g.fillRoundedRect(bx - 42, by - 22, 84, 14, 4);

    // Coffee table
    g.fillStyle(0x8d6e63, 1);
    g.fillRoundedRect(bx - 18, by + 26, 36, 22, 3);
    // Cup on table
    g.fillStyle(0xfafafa, 1);
    g.fillCircle(bx, by + 37, 5);
    g.fillStyle(0xa0522d, 1);
    g.fillCircle(bx, by + 37, 3);

    // Label
    this.add.text(bx, by - BH / 2 - 15, '☕ Area Istirahat', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#7f8c8d',
      backgroundColor: '#1a252f',
      padding: { x: 5, y: 2 },
    }).setOrigin(0.5);
  }

  private drawCashierCounter(): void {
    const g = this.add.graphics();
    const cx = this.REGISTER_X;
    const cy = this.REGISTER_Y;

    // Shadow
    g.fillStyle(0x000000, 0.22);
    g.fillRoundedRect(cx - 46, cy - 22, 92, 52, 6);

    // Counter body (supermarket green)
    g.fillStyle(0x1e8449, 1);
    g.fillRoundedRect(cx - 50, cy - 26, 100, 56, 7);

    // Counter top surface (lighter)
    g.fillStyle(0x27ae60, 1);
    g.fillRoundedRect(cx - 48, cy - 24, 96, 52, 6);

    // Conveyor belt
    g.fillStyle(0x7f8c8d, 0.92);
    g.fillRoundedRect(cx - 36, cy - 15, 54, 14, 3);
    // Belt lines
    g.lineStyle(1, 0x566573, 0.55);
    for (let i = 0; i < 5; i++) {
      g.moveTo(cx - 33 + i * 11, cy - 15);
      g.lineTo(cx - 33 + i * 11, cy - 1);
    }
    g.strokePath();

    // Cash register
    g.fillStyle(0x1c2833, 1);
    g.fillRoundedRect(cx + 20, cy - 18, 24, 20, 3);
    g.fillStyle(0x2980b9, 1);
    g.fillRoundedRect(cx + 22, cy - 16, 20, 12, 2);
    g.fillStyle(0xffffff, 0.55);
    g.fillCircle(cx + 25, cy - 5, 2);
    g.fillCircle(cx + 31, cy - 5, 2);
    g.fillCircle(cx + 37, cy - 5, 2);

    // Counter border
    g.lineStyle(2, 0x145a32, 1);
    g.strokeRoundedRect(cx - 50, cy - 26, 100, 56, 7);

    // "KASIR" sign above counter
    g.fillStyle(0x1c2833, 1);
    g.fillRoundedRect(cx - 32, cy - 52, 64, 20, 4);
    g.lineStyle(1.5, 0xf1c40f, 1);
    g.strokeRoundedRect(cx - 32, cy - 52, 64, 20, 4);

    this.add.text(cx, cy - 42, '💰 KASIR', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#f1c40f',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private drawDecorations(): void {
    const g = this.add.graphics();

    // Corner plants
    this.drawPlant(g, 682, 118);
    this.drawPlant(g, 682, 695);
    this.drawPlant(g, 22, 695);

    // Entry mat at the bottom
    g.fillStyle(0x154360, 0.55);
    g.fillRoundedRect(198, 720, 204, 28, 5);
    g.lineStyle(2, 0x1a5276, 0.8);
    g.strokeRoundedRect(198, 720, 204, 28, 5);
    // Mat stripes
    g.lineStyle(1.5, 0xffffff, 0.22);
    for (let i = 0; i < 6; i++) {
      g.moveTo(210 + i * 30, 720);
      g.lineTo(210 + i * 30 + 20, 748);
    }
    g.strokePath();

    this.add.text(300, 706, '🚪 MASUK', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#154360',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Aisle center lines (solid, low opacity — Phaser Graphics has no native dashes)
    g.lineStyle(2, 0xbdc3c7, 0.22);
    g.moveTo(330, 105); g.lineTo(330, 495);
    g.moveTo(510, 105); g.lineTo(510, 495);
    g.strokePath();

    // Floor direction arrows toward cashier
    for (let i = 0; i < 3; i++) {
      this.drawFloorArrow(g, 534, 400 + i * 28);
    }
  }

  private drawPlant(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    // Pot
    g.fillStyle(0xcd853f, 1);
    g.fillRect(x - 11, y, 22, 18);
    g.fillStyle(0x5d4037, 1);
    g.fillRect(x - 9, y - 4, 18, 7);
    // Leaves
    const colors = [0x27ae60, 0x1e8449, 0x2ecc71, 0x52be80];
    const leaves = [
      { dx: 0, dy: -16, r: 13 },
      { dx: -11, dy: -8, r: 9 },
      { dx: 11, dy: -8, r: 9 },
      { dx: -6, dy: -23, r: 8 },
      { dx: 6, dy: -23, r: 8 },
    ];
    leaves.forEach((l, i) => {
      g.fillStyle(colors[i % colors.length], 1);
      g.fillCircle(x + l.dx, y + l.dy, l.r);
    });
  }

  private drawFloorArrow(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0x95a5a6, 0.45);
    g.fillTriangle(x + 15, y, x - 1, y - 8, x - 1, y + 8);
    g.fillRect(x - 14, y - 4, 15, 8);
  }

  // ─────────────────────────────────────────────────────────────
  //  WORKER VISUALS
  // ─────────────────────────────────────────────────────────────

  private updateWorkerVisuals(): void {
    const stateEmployees = this.gameState.employees;

    this.visualWorkers.forEach(vw => {
      vw.graphics.clear();
      vw.label.setVisible(false);
      vw.energyBar.clear();
    });

    let anyWorking = false;

    stateEmployees.forEach((emp, index) => {
      let vw = this.visualWorkers.get(emp.id);
      if (!vw) {
        const graphics = this.add.graphics();
        const label = this.add.text(0, 0, '', {
          fontFamily: 'Outfit, sans-serif',
          fontSize: '10px',
          color: '#ffffff',
          backgroundColor: '#00000088',
          padding: { x: 4, y: 2 },
        }).setOrigin(0.5).setVisible(false).setDepth(8);
        const energyBar = this.add.graphics();
        vw = { graphics, label, energyBar };
        this.visualWorkers.set(emp.id, vw);
      }

      if (emp.currentState === 'WORKING') {
        anyWorking = true;
        const xPos = this.WORKER_WORKING_X + index * 28;
        const yPos = this.WORKER_WORKING_Y;
        this.drawWorkerChar(vw.graphics, xPos, yPos, true);
        this.drawEnergyBar(vw.energyBar, xPos - 24, yPos - 50, emp.energy);
        vw.label.setPosition(xPos, yPos - 44).setText(emp.name.split(' ')[0]).setVisible(true);

      } else if (emp.currentState === 'BREAKING') {
        const xPos = this.WORKER_BREAK_X + index * 28;
        const yPos = this.WORKER_BREAK_Y - 32;
        this.drawWorkerChar(vw.graphics, xPos, yPos, false);
        this.drawEnergyBar(vw.energyBar, xPos - 24, yPos - 50, emp.energy);
        vw.label.setPosition(xPos, yPos - 44).setText(`${emp.name.split(' ')[0]} 😴`).setVisible(true);
      }
    });

    this.clickIndicator?.setVisible(!anyWorking);
  }

  /** Draw a top-down 3/4 human figure for a worker using Phaser Graphics API. */
  private drawWorkerChar(g: Phaser.GameObjects.Graphics, ax: number, ay: number, isActive: boolean): void {
    const bodyColor = isActive ? 0x7d3c98 : 0x5d6d7e;

    // Drop shadow
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(ax + 2, ay + 18, 28, 10);

    // Body (uniform)
    g.fillStyle(bodyColor, 1);
    g.fillEllipse(ax, ay + 5, 24, 28);

    // Apron (only while working)
    if (isActive) {
      g.fillStyle(0xfafafa, 0.85);
      g.fillRect(ax - 5, ay - 2, 10, 18);
    }

    // Head
    g.fillStyle(0xf0c896, 1);
    g.fillCircle(ax, ay - 13, 11);

    // Hair
    g.fillStyle(0x3a2718, 1);
    g.fillEllipse(ax, ay - 19, 16, 8);

    // Outline
    g.lineStyle(1, 0x000000, 0.15);
    g.strokeCircle(ax, ay - 13, 11);
  }

  private drawEnergyBar(g: Phaser.GameObjects.Graphics, x: number, y: number, energy: number): void {
    const barW = 50;
    const barH = 6;
    const pct = energy / 100;
    const color = pct > 0.5 ? 0x2ecc71 : pct > 0.25 ? 0xf1c40f : 0xe74c3c;

    g.fillStyle(0x1c2833, 0.8);
    g.fillRoundedRect(x - 1, y - 1, barW + 2, barH + 2, 2);
    g.fillStyle(color, 1);
    g.fillRoundedRect(x, y, barW * pct, barH, 2);
  }

  // ─────────────────────────────────────────────────────────────
  //  WAREHOUSE & SHELF UPDATES
  // ─────────────────────────────────────────────────────────────

  private updateWarehouseVisuals(): void {
    const branch = this.gameState.branches[0];
    this.warehouseVisual?.update(branch.stock);
  }

  private updateShelfVisuals(): void {
    this.shelfC?.setVisible(this.gameState.hasShelfC);
    this.shelfD?.setVisible(this.gameState.hasShelfD);

    const branch = this.gameState.branches[0];
    const stockPct = branch.stock / branch.maxStock;

    if (Math.abs(stockPct - this.lastStockPct) > 0.009) {
      this.lastStockPct = stockPct;
      this.shelfA?.updateStockLevel(stockPct);
      this.shelfB?.updateStockLevel(stockPct);
      if (this.gameState.hasShelfC) this.shelfC?.updateStockLevel(stockPct);
      if (this.gameState.hasShelfD) this.shelfD?.updateStockLevel(stockPct);
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  CUSTOMER PATIENCE
  // ─────────────────────────────────────────────────────────────

  private updateCustomerPatience(delta: number): void {
    if (this.timeSystem.isPaused || this.queue.length === 0) {
      if (this.timeSystem.isPaused) this.queue.forEach(c => c.patienceBar?.clear());
      return;
    }

    let isWorkerWorking = false;
    for (const agent of this.employeeAgents.values()) {
      if (agent.data.currentState === 'WORKING') { isWorkerWorking = true; break; }
    }

    const actualDelta = delta * this.timeSystem.speed;
    const drainMultiplier = isWorkerWorking ? 1.0 : 2.5;
    const patienceDrain = actualDelta * drainMultiplier;
    let queueChanged = false;

    for (let i = this.queue.length - 1; i >= 0; i--) {
      const cust = this.queue[i];
      cust.patience -= patienceDrain;

      if (cust.patience <= 0) {
        cust.patienceBar?.destroy();
        cust.patienceBar = undefined;

        this.showFloatingText(isWorkerWorking ? '⌛ Lama!' : '😡 Kasir Kosong!', '#e74c3c');
        SoundManager.getInstance().playBuzzer();

        const branch = this.gameState.branches[0];
        this.gameState.updateBranchReputation(branch.id, -4);
        this.gameState.recordAngryCustomer();

        this.tweens.add({
          targets: [cust.graphics, cust.label],
          x: this.EXIT_X,
          duration: 1000,
          ease: 'Power2',
          onComplete: () => { cust.graphics.destroy(); cust.label.destroy(); },
        });

        this.queue.splice(i, 1);
        queueChanged = true;
      } else if (cust.patienceBar) {
        const pb = cust.patienceBar;
        pb.clear();
        const BAR_W = 30;
        const BAR_H = 5;
        const bx = cust.graphics.x - BAR_W / 2;
        const by = cust.graphics.y - 34;
        const pct = Math.max(0, cust.patience / cust.maxPatience);
        const fillColor = pct > 0.5 ? 0x2ecc71 : pct > 0.25 ? 0xf1c40f : 0xe74c3c;

        pb.fillStyle(0x2c3e50, 0.7);
        pb.fillRoundedRect(bx - 1, by - 1, BAR_W + 2, BAR_H + 2, 2);
        pb.fillStyle(fillColor, 1);
        pb.fillRoundedRect(bx, by, BAR_W * pct, BAR_H, 2);
      }
    }

    if (queueChanged) this.arrangeQueue();
  }

  // ─────────────────────────────────────────────────────────────
  //  EMPLOYEE AGENTS
  // ─────────────────────────────────────────────────────────────

  private syncEmployeesFromState(): void {
    this.gameState.employees.forEach((emp: Employee) => {
      if (!this.employeeAgents.has(emp.id)) {
        this.employeeAgents.set(emp.id, new EmployeeAgent(emp));
      }
    });
  }

  private onEmployeeHired(employee: Employee): void {
    this.employeeAgents.set(employee.id, new EmployeeAgent(employee));
    this.syncEmployeesFromState();
  }

  private onEmployeeStateChanged(_data: { employeeId: string; state: string }): void {
    // State tracked internally via employeeAgents — no extra action needed
  }

  private onTimeTick(timeData: { hour: number; minute: number }): void {
    this.employeeAgents.forEach(agent => {
      agent.updateStateByTime(timeData.hour);
      agent.processOperationalTick(1);
    });
  }

  // ─────────────────────────────────────────────────────────────
  //  CUSTOMER SPAWNING & MOVEMENT
  // ─────────────────────────────────────────────────────────────

  private spawnCustomer(): void {
    if (this.timeSystem.hour < 8 || this.timeSystem.hour >= 17 || this.timeSystem.isPaused) return;
    if (this.queue.length >= 6) return;

    const roll = Phaser.Math.Between(1, 100);
    let personality: 'Cheapskate' | 'Normal' | 'Big Spender' = 'Normal';
    let bodyColor = 0x52be80;
    let threshold = 7500;

    if (roll <= 30) {
      personality = 'Cheapskate';
      bodyColor = 0xf4d03f;
      threshold = Phaser.Math.Between(6000, 7600);
    } else if (roll >= 85) {
      personality = 'Big Spender';
      bodyColor = 0x5dade2;
      threshold = Phaser.Math.Between(8500, 12000);
    } else {
      threshold = Phaser.Math.Between(7500, 9500);
    }

    const qtyWanted = Phaser.Math.Between(1, 3);

    // Customer character drawn at local (0, 0)
    const graphics = this.add.graphics();
    this.drawCustomerCharLocal(graphics, bodyColor);
    graphics.setPosition(Phaser.Math.Between(this.ENTRY_X_MIN, this.ENTRY_X_MAX), this.ENTRY_Y);

    // Invisible label kept for tween/destroy symmetry
    const label = this.add.text(0, 0, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
    }).setOrigin(0.5).setVisible(false);

    const maxPatience = personality === 'Cheapskate' ? 15000 : personality === 'Big Spender' ? 30000 : 22000;
    const patienceBar = this.add.graphics().setDepth(6);

    const customer: VisualCustomer = {
      graphics, label, personality, priceThreshold: threshold,
      qtyWanted, patience: maxPatience, maxPatience, patienceBar,
    };

    // Available shelves to browse
    const availableShelves: { x: number; y: number }[] = [];
    if (this.shelfA) availableShelves.push({ x: this.shelfA.x, y: this.shelfA.y });
    if (this.shelfB) availableShelves.push({ x: this.shelfB.x, y: this.shelfB.y });
    if (this.gameState.hasShelfC && this.shelfC) availableShelves.push({ x: this.shelfC.x, y: this.shelfC.y });
    if (this.gameState.hasShelfD && this.shelfD) availableShelves.push({ x: this.shelfD.x, y: this.shelfD.y });

    const chosenShelf = Phaser.Utils.Array.GetRandom(availableShelves);
    const destX = chosenShelf.x + Phaser.Math.Between(-22, 22);
    const destY = chosenShelf.y + 52; // Just below the shelf

    // Walk from entry (bottom) up to shelf, then queue
    this.tweens.add({
      targets: [graphics, label],
      x: destX,
      y: destY,
      duration: 1400,
      ease: 'Power2',
      onComplete: () => {
        const thoughtBubble = this.add.text(destX, destY - 32, '💬', {
          fontFamily: 'Outfit, sans-serif',
          fontSize: '14px',
        }).setOrigin(0.5).setDepth(7);

        this.time.delayedCall(1500, () => {
          thoughtBubble.destroy();
          this.queue.push(customer);
          this.arrangeQueue();
        });
      },
    });
  }

  /** Draw a top-down 3/4 human customer figure at local origin (0, 0). */
  private drawCustomerCharLocal(g: Phaser.GameObjects.Graphics, bodyColor: number): void {
    g.clear();
    // Drop shadow
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(2, 17, 28, 10);
    // Body (shirt/clothes color = personality type)
    g.fillStyle(bodyColor, 1);
    g.fillEllipse(0, 4, 22, 26);
    // Head
    g.fillStyle(0xf0c896, 1);
    g.fillCircle(0, -12, 10);
    // Hair
    g.fillStyle(0x3a2718, 1);
    g.fillEllipse(0, -17, 14, 7);
    // Outline
    g.lineStyle(1, 0x000000, 0.15);
    g.strokeCircle(0, -12, 10);
  }

  private scheduleNextCustomerSpawn(): void {
    if (this.customerSpawnTimer) this.customerSpawnTimer.destroy();

    const branch = this.gameState.branches[0];
    const reputationFactor = branch.reputation / 100;
    let delay = 6000 - reputationFactor * 3000;
    if (this.gameState.currentDailyEvent === 'FESTIVAL') delay *= 0.65;

    this.customerSpawnTimer = this.time.addEvent({
      delay,
      callback: () => {
        this.spawnCustomer();
        this.scheduleNextCustomerSpawn();
      },
      callbackScope: this,
    });
  }

  /** Rearrange all queued customers toward the cashier (right-to-left horizontal line). */
  private arrangeQueue(): void {
    this.queue.forEach((cust, index) => {
      const targetX = this.QUEUE_START_X - index * this.QUEUE_SPACING;
      this.tweens.add({
        targets: [cust.graphics, cust.label],
        x: targetX,
        y: this.BASE_Y,
        duration: 800,
        ease: 'Power2',
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  //  TRANSACTION LOGIC
  // ─────────────────────────────────────────────────────────────

  private serveCustomerManually(): void {
    for (const agent of this.employeeAgents.values()) {
      if (agent.data.currentState === 'WORKING') return; // Blocked — worker is serving
    }
    this.processTransaction();
  }

  private checkAutoServe(): void {
    this.employeeAgents.forEach(agent => {
      const emp = agent.data;
      const isWorking = emp.currentState === 'WORKING';
      const hasTimer = this.autoServeTimers.has(emp.id);

      if (isWorking && this.queue.length > 0 && !hasTimer) {
        const skillModifier = Math.max(0.5, 1 - emp.skillLevel * 0.05);
        const speedFactor = emp.personality === 'AMBITIOUS' ? 0.70 : 1.0;
        const finalDelay = 2000 * skillModifier * speedFactor;

        const timer = this.time.addEvent({
          delay: finalDelay,
          callback: () => {
            if (this.queue.length > 0) this.processTransaction(agent);
            this.autoServeTimers.delete(emp.id);
          },
          callbackScope: this,
        });
        this.autoServeTimers.set(emp.id, timer);
      } else if (!isWorking && hasTimer) {
        this.autoServeTimers.get(emp.id)?.destroy();
        this.autoServeTimers.delete(emp.id);
      }
    });
  }

  private processTransaction(workerAgent?: EmployeeAgent): void {
    if (this.queue.length === 0) return;

    const cust = this.queue.shift()!;
    const branch = this.gameState.branches[0];

    cust.patienceBar?.destroy();
    cust.patienceBar = undefined;

    // Shake register animation
    if (this.registerGraphics) {
      this.tweens.add({
        targets: this.registerGraphics,
        y: this.registerGraphics.y - 3,
        duration: 50, yoyo: true, repeat: 2,
      });
    }

    let msgText = '';
    let msgColor = '#2ecc71';

    if (branch.stock <= 0) {
      msgText = '🚫 Stok Habis!';
      msgColor = '#e67e22';
      this.gameState.recordAngryCustomer();
      SoundManager.getInstance().playBuzzer();

    } else if (branch.sellingPrice > cust.priceThreshold) {
      msgText = '😡 Kemahalan!';
      msgColor = '#e74c3c';
      this.gameState.updateBranchReputation(branch.id, -2);
      this.gameState.recordAngryCustomer();
      SoundManager.getInstance().playBuzzer();

    } else {
      const qtyToBuy = Math.min(branch.stock, cust.qtyWanted);
      const totalEarned = branch.sellingPrice * qtyToBuy;

      this.gameState.updateBranchStock(branch.id, -qtyToBuy);
      this.gameState.recordSale(totalEarned, qtyToBuy);
      if (!workerAgent) this.gameState.progressQuest('SERVE_MANUAL', 1);

      msgText = `💰 +Rp ${totalEarned.toLocaleString('id-ID')}`;
      msgColor = '#2ecc71';
      SoundManager.getInstance().playCoin();

      if (workerAgent) {
        const emp = workerAgent.data;
        let energyDrain = 1.5 * qtyToBuy;
        if (emp.personality === 'LAZY') energyDrain *= 1.5;
        if (this.gameState.currentDailyEvent === 'ENERGY_CRISIS') energyDrain *= 1.20;
        emp.energy = Math.max(0, emp.energy - energyDrain);
        emp.experience += qtyToBuy * 2;
        if (emp.personality === 'FRIENDLY') this.gameState.updateBranchReputation(branch.id, 1);
        if (emp.experience >= emp.skillLevel * 100) {
          emp.skillLevel++;
          SoundManager.getInstance().playLevelUp();
        }
      }
    }

    this.showFloatingText(msgText, msgColor);

    this.tweens.add({
      targets: [cust.graphics, cust.label],
      x: this.EXIT_X,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => { cust.graphics.destroy(); cust.label.destroy(); },
    });

    this.arrangeQueue();
  }

  private showFloatingText(text: string, color: string): void {
    const floatingText = this.add.text(this.REGISTER_X, this.REGISTER_Y - 62, text, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15);

    this.tweens.add({
      targets: floatingText,
      y: floatingText.y - 55,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onComplete: () => floatingText.destroy(),
    });
  }
}
