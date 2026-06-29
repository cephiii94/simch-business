import './style.css';
import Phaser from 'phaser';
import { gameConfig } from './core/config/game-config.ts';
import { eventBus, EVENTS } from './shared/utils/event-bus.ts';
import { GameState } from './features/branches/GameState.ts';
import { TimeSystem } from './shared/utils/TimeSystem.ts';
import heroImg from './assets/hero.png';

// Inisialisasi game Phaser
const game = new Phaser.Game(gameConfig);

const gameState = GameState.getInstance();
const timeSystem = TimeSystem.getInstance();

// Ambil referensi ke UI layer
const uiLayer = document.querySelector<HTMLDivElement>('#ui-layer');

// Memulai aplikasi dengan Menu Utama
showMainMenu();

// --- MENU UTAMA HTML OVERLAY ---

function showMainMenu(): void {
  if (!uiLayer) return;

  uiLayer.innerHTML = `
    <div class="menu-container">
      <div class="menu-card animate-fade-in">
        <div class="menu-logo-wrapper">
          <img src="${heroImg}" class="menu-logo" alt="SimCH Business Logo" />
        </div>
        <h1 class="menu-title">SimCH Business</h1>
        <p class="menu-subtitle">Tycoon & AI-Worker Simulator</p>
        
        <div class="menu-actions">
          <button id="btn-start" class="btn btn-primary">Start Game</button>
          <button id="btn-load" class="btn btn-secondary" disabled>Load Game</button>
        </div>
        
        <div class="menu-footer">
          <span class="game-version">v0.1.0 (Alpha)</span>
        </div>
      </div>
    </div>
  `;

  const btnStart = document.querySelector<HTMLButtonElement>('#btn-start');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      handleStartGame();
    });
  }
}

function handleStartGame(): void {
  if (!uiLayer) return;

  const menuCard = uiLayer.querySelector('.menu-card');
  if (menuCard) {
    menuCard.classList.remove('animate-fade-in');
    menuCard.classList.add('animate-fade-out');
  }

  setTimeout(() => {
    // Reset GameState ke kondisi awal sebelum bermain
    gameState.resetState();
    
    // Kirim event transisi game ke Phaser
    eventBus.emit(EVENTS.START_GAME);
    
    // Render Dashboard HUD Utama
    renderGameplayHUD();
  }, 300);
}

// --- DASHBOARD PLAY / GAMEPLAY HUD ---

function renderGameplayHUD(): void {
  if (!uiLayer) return;

  const branch = gameState.branches[0];

  uiLayer.innerHTML = `
    <!-- Top HUD Bar -->
    <div class="hud-top animate-fade-in">
      <div class="hud-item brand">
        <span class="hud-label">🏢 CABANG</span>
        <span class="hud-value" id="hud-branch-name">${branch.name}</span>
      </div>
      <div class="hud-item money">
        <span class="hud-label">💰 KAS PERUSAHAAN</span>
        <span class="hud-value" id="hud-cash">Rp ${gameState.cash.toLocaleString('id-ID')}</span>
      </div>
      <div class="hud-item time">
        <span class="hud-label" id="hud-day">HARI ${gameState.day}</span>
        <span class="hud-value clock" id="hud-clock">${timeSystem.formatTime()}</span>
      </div>
      <div class="time-controls">
        <button id="btn-speed-pause" class="time-btn" title="Pause">⏸️</button>
        <button id="btn-speed-1x" class="time-btn active" title="1x Speed">▶️</button>
        <button id="btn-speed-3x" class="time-btn" title="3x Speed">⏩</button>
      </div>
    </div>

    <!-- Sidebar Management Control -->
    <div class="hud-sidebar animate-fade-in">
      <!-- Section Stock -->
      <div class="sidebar-section">
        <h3>📦 Manajemen Stok</h3>
        <div class="progress-container">
          <div class="progress-bar-bg">
            <div id="stock-progress" class="progress-bar-fill" style="width: ${branch.stock}%"></div>
          </div>
          <span class="progress-label" id="lbl-stock-volume">Stok: ${branch.stock} / ${branch.maxStock} Unit</span>
        </div>
        <button id="btn-buy-stock" class="btn btn-secondary btn-sm" style="margin-top: 10px;">
          Beli Stok Grosir (+10 Unit - Rp 50.000)
        </button>
      </div>

      <!-- Section Pricing -->
      <div class="sidebar-section">
        <h3>🏷️ Pengaturan Harga</h3>
        <div class="pricing-slider-wrapper">
          <div class="slider-header">
            <span>Harga Jual</span>
            <strong id="lbl-selling-price" class="text-purple">Rp ${branch.sellingPrice.toLocaleString('id-ID')}</strong>
          </div>
          <input type="range" id="slider-price" min="5000" max="15000" step="100" value="${branch.sellingPrice}" class="slider" />
          <div class="slider-footer">
            <small>HPP: Rp 5.000</small>
            <small>Harga Pasar: Rp 7.500</small>
          </div>
        </div>
      </div>

      <!-- Section HR / Karyawan -->
      <div class="sidebar-section">
        <h3>👥 Manajemen Karyawan</h3>
        <div id="hr-recruit-container">
          <p class="section-desc">Minta Karyawan AI melayani kasir secara otomatis.</p>
          <button id="btn-hire-worker" class="btn btn-primary btn-sm" style="margin-top: 8px;">
            Sewa Karyawan Budi (Rp 100.000)
          </button>
        </div>
        
        <div id="employee-list-container" style="display: none; margin-top: 10px;">
          <!-- List karyawan aktif akan dirender di sini secara dinamis -->
        </div>
      </div>
    </div>
  `;

  // Bind Event Listeners untuk interaksi HUD
  setupHUDEventListeners();
}

function setupHUDEventListeners(): void {
  const branch = gameState.branches[0];

  // 1. Kecepatan Waktu
  const btnPause = document.querySelector<HTMLButtonElement>('#btn-speed-pause');
  const btn1x = document.querySelector<HTMLButtonElement>('#btn-speed-1x');
  const btn3x = document.querySelector<HTMLButtonElement>('#btn-speed-3x');

  const setTimeBtnActive = (activeBtn: HTMLButtonElement) => {
    [btnPause, btn1x, btn3x].forEach(btn => btn?.classList.remove('active'));
    activeBtn.classList.add('active');
  };

  btnPause?.addEventListener('click', () => {
    timeSystem.pause();
    setTimeBtnActive(btnPause);
  });
  btn1x?.addEventListener('click', () => {
    timeSystem.setSpeed(1);
    setTimeBtnActive(btn1x);
  });
  btn3x?.addEventListener('click', () => {
    timeSystem.setSpeed(3);
    setTimeBtnActive(btn3x);
  });

  // 2. Pembelian Stok Manual
  const btnBuyStock = document.querySelector<HTMLButtonElement>('#btn-buy-stock');
  btnBuyStock?.addEventListener('click', () => {
    const currentStock = branch.stock;
    const maxStock = branch.maxStock;
    const cost = 50000;

    if (currentStock + 10 > maxStock) {
      alert('Gudang sudah penuh! Tidak dapat membeli stok tambahan.');
      return;
    }

    if (gameState.cash < cost) {
      alert('Uang Perusahaan tidak cukup untuk membeli stok grosir.');
      return;
    }

    gameState.spendCash(cost);
    gameState.updateBranchStock(branch.id, 10);
  });

  // 3. Slider Harga
  const sliderPrice = document.querySelector<HTMLInputElement>('#slider-price');
  const lblSellingPrice = document.querySelector<HTMLElement>('#lbl-selling-price');
  sliderPrice?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value);
    branch.sellingPrice = value;
    if (lblSellingPrice) {
      lblSellingPrice.textContent = `Rp ${value.toLocaleString('id-ID')}`;
    }
  });

  // 4. Sewa Karyawan Budi
  const btnHire = document.querySelector<HTMLButtonElement>('#btn-hire-worker');
  btnHire?.addEventListener('click', () => {
    const hireCost = 100000;
    if (gameState.cash < hireCost) {
      alert('Uang Perusahaan tidak cukup untuk menyewa Karyawan AI.');
      return;
    }

    const hiredEmp = gameState.hireEmployee('Budi', 'DILIGENT', branch.id);
    if (hiredEmp) {
      updateHRPanel();
    }
  });

  // Sinkronkan panel HR di awal (jika loading game)
  updateHRPanel();
}

// Perbarui bagian HR (rekrutmen & status karyawan)
function updateHRPanel(): void {
  const hrRecruitContainer = document.querySelector<HTMLDivElement>('#hr-recruit-container');
  const employeeListContainer = document.querySelector<HTMLDivElement>('#employee-list-container');

  if (!hrRecruitContainer || !employeeListContainer) return;

  const employees = gameState.employees;
  
  if (employees.length > 0) {
    // Sembunyikan tombol rekrutmen
    hrRecruitContainer.style.display = 'none';

    // Render daftar staf aktif
    employeeListContainer.style.display = 'block';
    
    let listHTML = '';
    employees.forEach(emp => {
      const energyPercent = Math.max(0, emp.energy);
      const moodText = emp.mood >= 80 ? '😍 Senang' : emp.mood >= 50 ? '😐 Normal' : '😡 Mogok';
      const stateLabels: Record<string, string> = {
        SLEEPING: 'Tidur',
        COMMUTING: 'Perjalanan',
        WORKING: 'Bekerja',
        BREAKING: 'Istirahat',
        LEAVING: 'Pulang'
      };

      listHTML += `
        <div class="employee-card">
          <div class="emp-header">
            <strong>👤 ${emp.name}</strong>
            <span class="emp-role">Level ${emp.skillLevel} Kasir</span>
          </div>
          <div class="emp-row">
            <span>Status:</span>
            <span class="emp-state badge badge-purple">${stateLabels[emp.currentState] || emp.currentState}</span>
          </div>
          <div class="emp-row">
            <span>Energi:</span>
            <div class="bar-container-sm">
              <div class="bar-fill-sm bar-energy" style="width: ${energyPercent}%"></div>
            </div>
            <span class="bar-value">${Math.round(emp.energy)}%</span>
          </div>
          <div class="emp-row">
            <span>Mood / Kepuasan:</span>
            <strong>${moodText}</strong>
          </div>
        </div>
      `;
    });

    employeeListContainer.innerHTML = listHTML;
  } else {
    hrRecruitContainer.style.display = 'block';
    employeeListContainer.style.display = 'none';
  }
}

// --- EVENT BUS BINDINGS UNTUK MENG-UPDATE TAMPILAN DASHBOARD ---

eventBus.on(EVENTS.CASH_CHANGED, (cash: number) => {
  const hudCash = document.querySelector<HTMLElement>('#hud-cash');
  if (hudCash) {
    hudCash.textContent = `Rp ${cash.toLocaleString('id-ID')}`;
  }
});

eventBus.on(EVENTS.STOCK_CHANGED, (data: { branchId: string, stock: number }) => {
  const branch = gameState.branches[0];
  const stockProgress = document.querySelector<HTMLDivElement>('#stock-progress');
  const lblStockVolume = document.querySelector<HTMLElement>('#lbl-stock-volume');

  if (stockProgress) {
    const percent = (data.stock / branch.maxStock) * 100;
    stockProgress.style.width = `${percent}%`;
  }
  if (lblStockVolume) {
    lblStockVolume.textContent = `Stok: ${data.stock} / ${branch.maxStock} Unit`;
  }
});

eventBus.on(EVENTS.TIME_TICK, (timeData: { hour: number, minute: number }) => {
  const hudClock = document.querySelector<HTMLElement>('#hud-clock');
  if (hudClock) {
    const hh = timeData.hour.toString().padStart(2, '0');
    const mm = timeData.minute.toString().padStart(2, '0');
    hudClock.textContent = `${hh}:${mm}`;
  }
  
  // Update status karyawan dinamis per menit berjalan
  updateHRPanel();
});

// --- LAPORAN KEUANGAN OPERASIONAL HARIAN (END DAY REPORT) ---

eventBus.on(EVENTS.KPI_UPDATED, () => {
  showEndDayReport();
});

function showEndDayReport(): void {
  if (!uiLayer) return;

  const branch = gameState.branches[0];
  const rentCost = branch.operationalCost;
  
  // Hitung gaji seluruh karyawan
  let employeeSalaries = 0;
  const hiredCount = gameState.employees.length;
  if (hiredCount > 0) {
    gameState.employees.forEach(emp => {
      employeeSalaries += emp.salary;
    });
  }

  const totalExpense = rentCost + employeeSalaries;
  const initialCash = gameState.cash;
  
  uiLayer.innerHTML = `
    <div class="menu-container">
      <div class="report-card animate-fade-in">
        <h2 class="report-title">📊 Laporan Harian (Hari ${gameState.day})</h2>
        <p class="report-subtitle">Evaluasi Arus Kas Perusahaan</p>
        
        <div class="report-table">
          <div class="table-row">
            <span>Sisa Kas Awal Hari</span>
            <strong>Rp ${(initialCash + totalExpense).toLocaleString('id-ID')}</strong>
          </div>
          <div class="table-row divider">
            <span>Operasional Toko (Sewa & Listrik)</span>
            <span class="text-red">-Rp ${rentCost.toLocaleString('id-ID')}</span>
          </div>
          <div class="table-row divider">
            <span>Total Gaji Karyawan (${hiredCount} Staf)</span>
            <span class="text-red">-Rp ${employeeSalaries.toLocaleString('id-ID')}</span>
          </div>
          <div class="table-row total">
            <span>Total Pengeluaran Harian</span>
            <span class="text-red"><strong>-Rp ${totalExpense.toLocaleString('id-ID')}</strong></span>
          </div>
          <div class="table-row total" style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 12px;">
            <span>Sisa Kas Akhir Hari</span>
            <span class="text-purple"><strong>Rp ${initialCash.toLocaleString('id-ID')}</strong></span>
          </div>
        </div>
        
        <button id="btn-next-day" class="btn btn-primary" style="margin-top: 24px;">
          Mulai Hari Berikutnya (Hari ${gameState.day + 1})
        </button>
      </div>
    </div>
  `;

  const btnNextDay = document.querySelector<HTMLButtonElement>('#btn-next-day');
  btnNextDay?.addEventListener('click', () => {
    // Selesaikan pemotongan kas biaya harian di GameState
    const successCharge = gameState.spendCash(totalExpense);
    if (!successCharge) {
      alert('Perusahaan Anda Bangkrut! Uang perusahaan tidak cukup membayar sewa dan gaji.');
      gameState.resetState();
      showMainMenu();
      return;
    }
    
    // Naikkan siklus hari
    gameState.incrementDay();
    
    // Bersihkan overlay dan kembalikan HUD
    uiLayer.innerHTML = '';
    renderGameplayHUD();

    // Mulai ulang scene visual Phaser
    game.scene.keys['GameScene'].scene.restart();
  });
}

console.log('SimCH Business bootstrap script loaded');
