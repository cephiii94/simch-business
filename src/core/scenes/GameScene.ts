import Phaser from 'phaser';
import { TimeSystem } from '../../shared/utils/TimeSystem.ts';
import { GameState } from '../../features/branches/GameState.ts';
import { EmployeeAgent } from '../../features/employees/EmployeeAgent.ts';
import { eventBus, EVENTS } from '../../shared/utils/event-bus.ts';
import type { Employee } from '../../shared/types/game.types.ts';

interface VisualCustomer {
  graphics: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  personality: 'Cheapskate' | 'Normal' | 'Big Spender';
  priceThreshold: number;
  qtyWanted: number;
}

export class GameScene extends Phaser.Scene {
  private timeSystem = TimeSystem.getInstance();
  private gameState = GameState.getInstance();
  private employeeAgents: Map<string, EmployeeAgent> = new Map();

  // Phaser Game Objects
  private registerGraphics?: Phaser.GameObjects.Graphics;
  private workerGraphics?: Phaser.GameObjects.Graphics;
  private workerLabel?: Phaser.GameObjects.Text;
  private workerEnergyBar?: Phaser.GameObjects.Graphics;
  private clickIndicator?: Phaser.GameObjects.Text;
  
  // Antrean pelanggan
  private queue: VisualCustomer[] = [];
  private customerSpawnTimer?: Phaser.Time.TimerEvent;
  private autoServeTimer?: Phaser.Time.TimerEvent;
  
  // Posisi-posisi koordinat
  private readonly ENTRY_X = -50;
  private readonly EXIT_X = -100;
  private readonly QUEUE_START_X = 520;
  private readonly QUEUE_SPACING = 60;
  private readonly BASE_Y = 480;
  
  private readonly REGISTER_X = 600;
  private readonly WORKER_WORKING_X = 660;
  private readonly WORKER_BREAK_X = 850;
  private readonly WORKER_BREAK_Y = 220;

  constructor() {
    super('GameScene');
  }

  create(): void {
    console.log('GameScene created');
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 1. Gambar Toko & Background Visual
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1b24);
    
    // Grid lantai toko kelontong
    const grid = this.add.grid(width / 2, height / 2 + 100, width, height - 200, 64, 64, 0x000000, 0, 0xffffff, 0.03);
    grid.setAlpha(0.6);

    // Meja Kasir (Cashier Counter)
    const counter = this.add.rectangle(this.REGISTER_X, this.BASE_Y, 80, 140, 0x5c4033);
    counter.setStrokeStyle(2, 0x8b5a2b);
    
    // Mesin Kasir (Register)
    this.registerGraphics = this.add.graphics();
    this.registerGraphics.fillStyle(0x7f8c8d, 1);
    this.registerGraphics.fillRect(this.REGISTER_X - 15, this.BASE_Y - 50, 30, 25);
    this.registerGraphics.fillStyle(0x34495e, 1);
    this.registerGraphics.fillRect(this.REGISTER_X - 10, this.BASE_Y - 45, 20, 10); // Layar kasir
    
    // Meja Istirahat / Sofa di Pojok Toko
    const breakZone = this.add.rectangle(this.WORKER_BREAK_X, this.WORKER_BREAK_Y, 120, 70, 0x2e4053);
    breakZone.setStrokeStyle(2, 0x34495e);
    this.add.text(this.WORKER_BREAK_X, this.WORKER_BREAK_Y, 'Area Istirahat', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#7f8c8d'
    }).setOrigin(0.5);

    // Teks Meja Kasir
    this.add.text(this.REGISTER_X, this.BASE_Y - 80, 'Kasir', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Indikator Klik Kasir (Mode Manual)
    this.clickIndicator = this.add.text(this.REGISTER_X, this.BASE_Y - 110, '🛎️ KLIK KASIR', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      color: '#f1c40f',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Buat indikator berdenyut (pulsing)
    this.tweens.add({
      targets: this.clickIndicator,
      alpha: { from: 1, to: 0.4 },
      duration: 800,
      yoyo: true,
      loop: -1
    });

    // Buat Meja Kasir interaktif untuk mode manual
    counter.setInteractive({ useHandCursor: true });
    counter.on('pointerdown', () => {
      this.serveCustomerManually();
    });

    // 2. Visualisasi Pekerja (Karyawan)
    this.workerGraphics = this.add.graphics();
    this.workerLabel = this.add.text(0, 0, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setVisible(false);

    this.workerEnergyBar = this.add.graphics();

    // 3. Muat Data Karyawan Awal dari GameState
    this.syncEmployeesFromState();

    // 4. Daftarkan Event Listeners
    eventBus.on(EVENTS.TIME_TICK, this.onTimeTick, this);
    eventBus.on(EVENTS.EMPLOYEE_HIRED, this.onEmployeeHired, this);
    eventBus.on(EVENTS.EMPLOYEE_STATE_CHANGED, this.onEmployeeStateChanged, this);

    // Hapus listener saat scene ditutup untuk menghindari kebocoran memori
    this.events.on('shutdown', () => {
      eventBus.off(EVENTS.TIME_TICK, this.onTimeTick, this);
      eventBus.off(EVENTS.EMPLOYEE_HIRED, this.onEmployeeHired, this);
      eventBus.off(EVENTS.EMPLOYEE_STATE_CHANGED, this.onEmployeeStateChanged, this);
      if (this.customerSpawnTimer) this.customerSpawnTimer.destroy();
      if (this.autoServeTimer) this.autoServeTimer.destroy();
    });

    // 5. Mulai Waktu Hari Kerja
    this.timeSystem.startDay();

    // Loop Spawner Pelanggan setiap 5 detik real-time
    this.customerSpawnTimer = this.time.addEvent({
      delay: 5000,
      callback: this.spawnCustomer,
      callbackScope: this,
      loop: true
    });
  }

  update(time: number, delta: number): void {
    // Jalankan detak waktu game
    this.timeSystem.update(time, delta);
    
    // Perbarui visualisasi status karyawan yang aktif
    this.updateWorkerVisuals();

    // Jalankan pemrosesan pelayanan otomatis jika ada karyawan yang bekerja
    this.checkAutoServe();
  }

  // --- LOGIKA KARYAWAN & STATE ---

  private syncEmployeesFromState(): void {
    const stateEmployees = this.gameState.employees;
    stateEmployees.forEach((emp: Employee) => {
      if (!this.employeeAgents.has(emp.id)) {
        this.employeeAgents.set(emp.id, new EmployeeAgent(emp));
      }
    });
  }

  private onEmployeeHired(employee: Employee): void {
    console.log(`GameScene: Hired employee detected in GameScene: ${employee.name}`);
    this.employeeAgents.set(employee.id, new EmployeeAgent(employee));
    this.syncEmployeesFromState();
  }

  private onEmployeeStateChanged(data: { employeeId: string, state: string }): void {
    console.log(`GameScene: Employee ${data.employeeId} changed state to ${data.state}`);
  }

  private onTimeTick(timeData: { hour: number, minute: number }): void {
    // Setiap menit game, perbarui state & kurangi energi karyawan
    this.employeeAgents.forEach(agent => {
      agent.updateStateByTime(timeData.hour);
      agent.processOperationalTick(1); // 1 game minute passed
    });
  }

  // Menggambar & menggerakkan visual karyawan di kasir/istirahat
  private updateWorkerVisuals(): void {
    if (!this.workerGraphics || !this.workerLabel || !this.workerEnergyBar) return;

    // Cari karyawan pertama yang ditugaskan (cabang default)
    const activeEmpId = this.gameState.branches[0].employeeIds[0];
    const agent = activeEmpId ? this.employeeAgents.get(activeEmpId) : null;

    if (!agent) {
      // Tidak ada karyawan disewa, sembunyikan visual pekerja
      this.workerGraphics.clear();
      this.workerLabel.setVisible(false);
      this.workerEnergyBar.clear();
      this.clickIndicator?.setVisible(true); // Pastikan petunjuk klik menyala
      return;
    }

    const emp = agent.data;
    this.workerGraphics.clear();
    this.workerEnergyBar.clear();

    if (emp.currentState === 'WORKING') {
      // Gambar lingkaran pekerja di meja kasir (warna ungu)
      this.workerGraphics.fillStyle(0xaa3bff, 1);
      this.workerGraphics.fillCircle(this.WORKER_WORKING_X, this.BASE_Y, 20);
      this.workerGraphics.lineStyle(2, 0xffffff, 1);
      this.workerGraphics.strokeCircle(this.WORKER_WORKING_X, this.BASE_Y, 20);

      // Label Nama
      this.workerLabel.setPosition(this.WORKER_WORKING_X, this.BASE_Y - 35);
      this.workerLabel.setText(`${emp.name} (Kerja)`).setVisible(true);

      // Bar Energi
      this.drawEnergyBar(this.WORKER_WORKING_X - 25, this.BASE_Y - 50, emp.energy);

      // Karena kasir terisi karyawan, matikan petunjuk klik manual
      this.clickIndicator?.setVisible(false);

    } else if (emp.currentState === 'BREAKING') {
      // Gambar lingkaran pekerja di area istirahat (warna abu-abu)
      this.workerGraphics.fillStyle(0x7f8c8d, 1);
      this.workerGraphics.fillCircle(this.WORKER_BREAK_X, this.WORKER_BREAK_Y, 20);
      this.workerGraphics.lineStyle(2, 0xbdc3c7, 1);
      this.workerGraphics.strokeCircle(this.WORKER_BREAK_X, this.WORKER_BREAK_Y, 20);

      // Label Nama
      this.workerLabel.setPosition(this.WORKER_BREAK_X, this.WORKER_BREAK_Y - 35);
      this.workerLabel.setText(`${emp.name} (Rehat)`).setVisible(true);

      // Bar Energi
      this.drawEnergyBar(this.WORKER_BREAK_X - 25, this.WORKER_BREAK_Y - 50, emp.energy);

      // Karena kasir kosong selama istirahat, hidupkan kembali klik manual
      this.clickIndicator?.setVisible(true);
    } else {
      // Jika pulang (LEAVING/SLEEPING), hilangkan visualnya
      this.workerLabel.setVisible(false);
      this.clickIndicator?.setVisible(true);
    }
  }

  private drawEnergyBar(x: number, y: number, energy: number): void {
    if (!this.workerEnergyBar) return;
    
    const barWidth = 50;
    const barHeight = 6;
    
    // Background merah (kosong)
    this.workerEnergyBar.fillStyle(0xc0392b, 1);
    this.workerEnergyBar.fillRect(x, y, barWidth, barHeight);

    // Foreground hijau (sesuai energi)
    const currentWidth = (energy / 100) * barWidth;
    this.workerEnergyBar.fillStyle(0x2ecc71, 1);
    this.workerEnergyBar.fillRect(x, y, currentWidth, barHeight);
  }

  // --- LOGIKA PELANGGAN & ANTRIAN ---

  private spawnCustomer(): void {
    // Jangan spawn pelanggan jika di luar jam operasional
    if (this.timeSystem.hour < 8 || this.timeSystem.hour >= 17 || this.timeSystem.isPaused) return;

    // Batasi antrean maksimal 6 orang
    if (this.queue.length >= 6) return;

    // Tipe kepribadian acak pelanggan
    const roll = Phaser.Math.Between(1, 100);
    let personality: 'Cheapskate' | 'Normal' | 'Big Spender' = 'Normal';
    let color = 0x2ecc71; // Hijau
    let threshold = 7500; // Harga dasar wajar
    
    if (roll <= 30) {
      personality = 'Cheapskate';
      color = 0xf1c40f; // Kuning
      threshold = Phaser.Math.Between(6000, 7600);
    } else if (roll >= 85) {
      personality = 'Big Spender';
      color = 0x3498db; // Biru
      threshold = Phaser.Math.Between(8500, 12000);
    } else {
      threshold = Phaser.Math.Between(7500, 9500);
    }

    const qtyWanted = Phaser.Math.Between(1, 3);

    // Buat Game Object visual pelanggan
    const graphics = this.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillCircle(0, 0, 18);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeCircle(0, 0, 18);
    graphics.setPosition(this.ENTRY_X, this.BASE_Y);

    const label = this.add.text(this.ENTRY_X, this.BASE_Y - 30, personality[0], {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const customer: VisualCustomer = {
      graphics,
      label,
      personality,
      priceThreshold: threshold,
      qtyWanted
    };

    this.queue.push(customer);
    
    // Animasikan pergerakan pelanggan ke posisi antreannya
    this.arrangeQueue();
  }

  // Mengatur ulang posisi tweens pelanggan di antrean
  private arrangeQueue(): void {
    this.queue.forEach((cust, index) => {
      const targetX = this.QUEUE_START_X - (index * this.QUEUE_SPACING);
      
      this.tweens.add({
        targets: [cust.graphics, cust.label],
        x: targetX,
        y: this.BASE_Y,
        duration: 800,
        ease: 'Power2'
      });
    });
  }

  // --- LOGIKA TRANSAKSI ---

  // Pelayanan manual (ketika pemain klik kasir)
  private serveCustomerManually(): void {
    // Periksa apakah kasir kosong (tidak ada karyawan aktif)
    const activeEmpId = this.gameState.branches[0].employeeIds[0];
    const agent = activeEmpId ? this.employeeAgents.get(activeEmpId) : null;
    const isWorkerAtRegister = agent && agent.data.currentState === 'WORKING';

    if (isWorkerAtRegister) {
      console.log('GameScene: Kasir sedang diotomatisasi karyawan, klik manual diabaikan.');
      return;
    }

    this.processTransaction();
  }

  // Pelayanan otomatis oleh Karyawan AI
  private checkAutoServe(): void {
    const activeEmpId = this.gameState.branches[0].employeeIds[0];
    const agent = activeEmpId ? this.employeeAgents.get(activeEmpId) : null;
    const isWorkerAtRegister = agent && agent.data.currentState === 'WORKING';

    if (isWorkerAtRegister && this.queue.length > 0 && !this.autoServeTimer) {
      // Karyawan memproses transaksi otomatis dengan delay (e.g. 1.5 detik)
      const emp = agent.data;
      const baseDelay = 2000;
      // Karyawan naik level memproses lebih cepat
      const speedModifier = Math.max(0.5, 1 - (emp.skillLevel * 0.05));
      
      this.autoServeTimer = this.time.addEvent({
        delay: baseDelay * speedModifier,
        callback: () => {
          this.processTransaction(agent);
          this.autoServeTimer = undefined; // Reset timer
        },
        callbackScope: this
      });
    }
  }

  private processTransaction(workerAgent?: EmployeeAgent): void {
    if (this.queue.length === 0) return;

    // Ambil pelanggan terdepan
    const cust = this.queue.shift()!;
    const branch = this.gameState.branches[0];

    // Animasi Kasir bergetar sedikit tanda memproses
    if (this.registerGraphics) {
      this.tweens.add({
        targets: this.registerGraphics,
        y: this.registerGraphics.y - 3,
        duration: 50,
        yoyo: true,
        repeat: 2
      });
    }

    let msgText = '';
    let msgColor = '#2ecc71';

    if (branch.stock <= 0) {
      // 1. Kasus Stok Habis
      msgText = '🚫 Stok Habis!';
      msgColor = '#e67e22';
    } else if (branch.sellingPrice > cust.priceThreshold) {
      // 2. Kasus Harga Kemahalan
      msgText = '😡 Kemahalan!';
      msgColor = '#e74c3c';
      // Mengurangi sedikit reputasi toko
      branch.reputation = Math.max(10, branch.reputation - 0.5);
    } else {
      // 3. Transaksi Sukses
      const qtyToBuy = Math.min(branch.stock, cust.qtyWanted);
      const totalEarned = branch.sellingPrice * qtyToBuy;
      
      // Mutasi GameState
      this.gameState.updateBranchStock(branch.id, -qtyToBuy);
      this.gameState.addCash(totalEarned);
      
      msgText = `💰 +Rp ${totalEarned.toLocaleString('id-ID')}`;
      msgColor = '#2ecc71';

      // Kurangi energi karyawan jika diproses secara otomatis
      if (workerAgent) {
        const emp = workerAgent.data;
        emp.energy = Math.max(0, emp.energy - (1.5 * qtyToBuy));
        emp.experience += qtyToBuy * 2;
        // Level up check
        if (emp.experience >= emp.skillLevel * 100) {
          emp.skillLevel++;
          console.log(`EmployeeAgent (${emp.name}) leveled up to Level ${emp.skillLevel}!`);
        }
      }
    }

    // Tampilkan teks melayang (Floating Text) di atas kasir
    this.showFloatingText(msgText, msgColor);

    // Animasi pelanggan keluar dari toko dan hancurkan
    this.tweens.add({
      targets: [cust.graphics, cust.label],
      x: this.EXIT_X,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        cust.graphics.destroy();
        cust.label.destroy();
      }
    });

    // Mengatur ulang sisa antrean agar maju ke kasir
    this.arrangeQueue();
  }

  // Membuat teks melayang naik dan menghilang
  private showFloatingText(text: string, color: string): void {
    const floatingText = this.add.text(this.REGISTER_X, this.BASE_Y - 70, text, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: floatingText,
      y: floatingText.y - 60,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        floatingText.destroy();
      }
    });
  }
}
