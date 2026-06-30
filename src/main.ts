import './style.css';
import Phaser from 'phaser';
import { gameConfig } from './core/config/game-config.ts';
import { eventBus, EVENTS } from './shared/utils/event-bus.ts';
import { GameState } from './features/branches/GameState.ts';
import { TimeSystem } from './shared/utils/TimeSystem.ts';
import { SoundManager } from './shared/utils/SoundManager.ts';
import heroImg from './assets/hero.png';

// Inisialisasi game Phaser
const game = new Phaser.Game(gameConfig);

const gameState = GameState.getInstance();
const timeSystem = TimeSystem.getInstance();

// Ambil referensi ke UI layer
const uiLayer = document.querySelector<HTMLDivElement>('#ui-layer');

let activeTab: 'ops' | 'hr' | 'upgrade' = 'ops';

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
      SoundManager.getInstance().playClick();
      handleStartGame(false);
    });
  }

  const btnLoad = document.querySelector<HTMLButtonElement>('#btn-load');
  if (btnLoad) {
    if (gameState.hasSaveGame()) {
      btnLoad.disabled = false;
    }
    btnLoad.addEventListener('click', () => {
      SoundManager.getInstance().playClick();
      const success = gameState.loadGame();
      if (success) {
        handleStartGame(true);
      } else {
        alert('Gagal memuat save game!');
      }
    });
  }
}

function handleStartGame(isLoadedGame: boolean = false): void {
  if (!uiLayer) return;

  const menuCard = uiLayer.querySelector('.menu-card');
  if (menuCard) {
    menuCard.classList.remove('animate-fade-in');
    menuCard.classList.add('animate-fade-out');
  }

  setTimeout(() => {
    if (!isLoadedGame) {
      // Reset GameState ke kondisi awal sebelum bermain
      gameState.resetState();
    }
    
    // Kirim event transisi game ke Phaser
    eventBus.emit(EVENTS.START_GAME);

    // Mulai musik BGM retro
    SoundManager.getInstance().startBGM();
    
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
      <div class="hud-item rating">
        <span class="hud-label">⭐ RATING TOKO</span>
        <span class="hud-value" id="hud-rating">${((branch.reputation / 100) * 5).toFixed(1)} / 5.0</span>
      </div>
      <div class="hud-item time">
        <span class="hud-label" id="hud-day">HARI ${gameState.day}</span>
        <span class="hud-value clock" id="hud-clock">${timeSystem.formatTime()}</span>
      </div>
      <div class="time-controls" style="display: flex; gap: 6px;">
        <button id="btn-mute" class="time-btn" title="Toggle Sound" style="margin-right: 8px;">
          ${SoundManager.getInstance().muted ? '🔇' : '🔊'}
        </button>
        <button id="btn-speed-pause" class="time-btn" title="Pause">⏸️</button>
        <button id="btn-speed-1x" class="time-btn active" title="1x Speed">▶️</button>
        <button id="btn-speed-3x" class="time-btn" title="3x Speed">⏩</button>
      </div>
    </div>

    <!-- Sidebar Management Control -->
    <div class="hud-sidebar animate-fade-in">
      <!-- Tabs Header -->
      <div class="hud-tabs">
        <button id="tab-btn-ops" class="tab-btn ${activeTab === 'ops' ? 'active' : ''}">Ops</button>
        <button id="tab-btn-hr" class="tab-btn ${activeTab === 'hr' ? 'active' : ''}">SDM</button>
        <button id="tab-btn-upgrade" class="tab-btn ${activeTab === 'upgrade' ? 'active' : ''}">Upgrade</button>
      </div>
      
      <!-- Tab Content Area -->
      <div id="tab-content-container">
        <!-- Content will be rendered here dynamically -->
      </div>
    </div>
  `;

  // Bind top HUD time controls
  setupTopHUDTimeControls();
  
  // Render tab content
  renderActiveTab();

  // Bind tab header listeners ONCE here — tab buttons persist across tab switches,
  // so registering in renderActiveTab() would stack listeners on every switch.
  setupTabHeaderListeners();
  
  checkAndShowEventPopup();
}

function setupTopHUDTimeControls(): void {
  const btnMute = document.querySelector<HTMLButtonElement>('#btn-mute');
  const btnPause = document.querySelector<HTMLButtonElement>('#btn-speed-pause');
  const btn1x = document.querySelector<HTMLButtonElement>('#btn-speed-1x');
  const btn3x = document.querySelector<HTMLButtonElement>('#btn-speed-3x');

  btnMute?.addEventListener('click', () => {
    SoundManager.getInstance().playClick();
    const isMuted = SoundManager.getInstance().toggleMute();
    if (btnMute) {
      btnMute.textContent = isMuted ? '🔇' : '🔊';
    }
  });

  const setTimeBtnActive = (activeBtn: HTMLButtonElement) => {
    [btnPause, btn1x, btn3x].forEach(btn => btn?.classList.remove('active'));
    activeBtn.classList.add('active');
  };

  btnPause?.addEventListener('click', () => {
    SoundManager.getInstance().playClick();
    timeSystem.pause();
    setTimeBtnActive(btnPause);
  });
  btn1x?.addEventListener('click', () => {
    SoundManager.getInstance().playClick();
    timeSystem.setSpeed(1);
    setTimeBtnActive(btn1x);
  });
  btn3x?.addEventListener('click', () => {
    SoundManager.getInstance().playClick();
    timeSystem.setSpeed(3);
    setTimeBtnActive(btn3x);
  });
}

function renderActiveTab(): void {
  const container = document.querySelector<HTMLElement>('#tab-content-container');
  if (!container) return;

  const branch = gameState.branches[0];

  // Set active tab buttons highlight
  document.querySelector('#tab-btn-ops')?.classList.toggle('active', activeTab === 'ops');
  document.querySelector('#tab-btn-hr')?.classList.toggle('active', activeTab === 'hr');
  document.querySelector('#tab-btn-upgrade')?.classList.toggle('active', activeTab === 'upgrade');

  if (activeTab === 'ops') {
    container.innerHTML = `
      <!-- Section Stock -->
      <div class="sidebar-section">
        <h3>📦 Manajemen Stok</h3>
        <div class="progress-container">
          <div class="progress-bar-bg">
            <div id="stock-progress" class="progress-bar-fill" style="width: ${(branch.stock / branch.maxStock) * 100}%"></div>
          </div>
          <span class="progress-label" id="lbl-stock-volume">Stok: ${branch.stock} / ${branch.maxStock} Unit</span>
        </div>
        <button id="btn-buy-stock" class="btn btn-secondary btn-sm" style="margin-top: 10px;">
          Beli Stok Grosir (+10 Unit - ${gameState.currentDailyEvent === 'INFLATION' ? 'Rp 65.000 📈' : 'Rp 50.000'})
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

      <!-- Section Main Quest -->
      <div class="sidebar-section">
        <h3>🏆 Misi Utama</h3>
        <div id="quest-list-container">
          <!-- Diisi oleh updateQuestPanel() -->
        </div>
      </div>
    `;

    // Bind stock buy button
    const btnBuyStock = document.querySelector<HTMLButtonElement>('#btn-buy-stock');
    btnBuyStock?.addEventListener('click', () => {
      SoundManager.getInstance().playClick();
      const currentStock = branch.stock;
      const maxStock = branch.maxStock;
      const isInflation = gameState.currentDailyEvent === 'INFLATION';
      const cost = isInflation ? 65000 : 50000;

      if (currentStock + 10 > maxStock) {
        SoundManager.getInstance().playBuzzer();
        alert('Gudang sudah penuh! Tidak dapat membeli stok tambahan.');
        return;
      }

      if (gameState.cash < cost) {
        SoundManager.getInstance().playBuzzer();
        alert(`Uang Perusahaan tidak cukup untuk membeli stok grosir${isInflation ? ' yang sedang inflasi' : ''}.`);
        return;
      }

      gameState.spendCash(cost);
      gameState.updateBranchStock(branch.id, 10);
      gameState.progressQuest('BUY_STOCK', 10);
      SoundManager.getInstance().playCoin();
    });

    // Bind pricing slider
    const sliderPrice = document.querySelector<HTMLInputElement>('#slider-price');
    const lblSellingPrice = document.querySelector<HTMLElement>('#lbl-selling-price');
    sliderPrice?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = parseInt(target.value);
      branch.sellingPrice = value;
      gameState.progressQuest('SET_PRICE', value, true);
      if (lblSellingPrice) {
        lblSellingPrice.textContent = `Rp ${value.toLocaleString('id-ID')}`;
      }
    });

    // Render Quest panel
    updateQuestPanel();

  } else if (activeTab === 'hr') {
    container.innerHTML = `
      <!-- Section Active Employees -->
      <div class="sidebar-section">
        <h3>👥 Karyawan Aktif (${gameState.employees.length} / 3)</h3>
        <div id="active-employees-list" style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
          <!-- Diisi dinamis -->
        </div>
      </div>

      <!-- Section HR Recruitment -->
      <div class="sidebar-section" id="recruits-section" style="${gameState.employees.length >= 3 ? 'display: none;' : ''}">
        <h3>💼 Calon Karyawan</h3>
        <div id="recruits-pool-container" style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
          <!-- Diisi dinamis -->
        </div>
      </div>
    `;

    // Render lists
    updateActiveEmployeesList();
    updateRecruitsPool();

  } else if (activeTab === 'upgrade') {
    const level = gameState.warehouseLevel;
    const capacityText = level === 1 ? '30 Unit' : level === 2 ? '60 Unit' : '100 Unit';
    
    let whBtnHTML = '';
    if (level === 1) {
      whBtnHTML = `<button id="btn-upgrade-wh" class="btn btn-primary btn-sm" style="margin-top: 10px; width: 100%;">Upgrade ke Lv 2 (Rp 150.000)</button>`;
    } else if (level === 2) {
      whBtnHTML = `<button id="btn-upgrade-wh" class="btn btn-primary btn-sm" style="margin-top: 10px; width: 100%;">Upgrade ke Lv 3 (Rp 300.000)</button>`;
    } else {
      whBtnHTML = `<button class="btn btn-secondary btn-sm" style="margin-top: 10px; width: 100%;" disabled>Level Maksimal (100 Unit)</button>`;
    }

    const shelfCBtnHTML = gameState.hasShelfC
      ? `<button class="btn btn-secondary btn-sm" style="margin-top: 10px; width: 100%;" disabled>Slot Terbuka (Aktif)</button>`
      : `<button id="btn-buy-shelf-c" class="btn btn-primary btn-sm" style="margin-top: 10px; width: 100%;">Buka Slot Rak C (Rp 200.000)</button>`;

    const shelfDBtnHTML = gameState.hasShelfD
      ? `<button class="btn btn-secondary btn-sm" style="margin-top: 10px; width: 100%;" disabled>Slot Terbuka (Aktif)</button>`
      : `<button id="btn-buy-shelf-d" class="btn btn-primary btn-sm" style="margin-top: 10px; width: 100%;">Buka Slot Rak D (Rp 200.000)</button>`;

    container.innerHTML = `
      <!-- Section Shop Upgrade -->
      <div class="sidebar-section">
        <h3>🏢 Upgrade Toko</h3>
        <p class="section-desc">Peningkatan kapasitas gudang & slot rak visual.</p>
        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
          
          <div class="upgrade-item-card" style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <strong style="font-size: 13px; display: block;">📦 Kapasitas Gudang (Lv ${level})</strong>
            <small style="color: var(--text-secondary); display: block; margin-top: 2px;">Kapasitas Saat Ini: ${capacityText}</small>
            ${whBtnHTML}
          </div>
          
          <div class="upgrade-item-card" style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <strong style="font-size: 13px; display: block;">🛒 Slot Rak C</strong>
            <small style="color: var(--text-secondary); display: block; margin-top: 2px;">Membuka Rak C visual baru untuk pembeli keliling.</small>
            ${shelfCBtnHTML}
          </div>

          <div class="upgrade-item-card" style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <strong style="font-size: 13px; display: block;">🛒 Slot Rak D</strong>
            <small style="color: var(--text-secondary); display: block; margin-top: 2px;">Membuka Rak D visual baru untuk pembeli keliling.</small>
            ${shelfDBtnHTML}
          </div>

        </div>
      </div>
    `;

    // Bind event handlers
    const btnUpgradeWh = document.querySelector<HTMLButtonElement>('#btn-upgrade-wh');
    btnUpgradeWh?.addEventListener('click', () => {
      SoundManager.getInstance().playClick();
      const currentLevel = gameState.warehouseLevel;
      const cost = currentLevel === 1 ? 150000 : 300000;
      if (gameState.cash < cost) {
        SoundManager.getInstance().playBuzzer();
        alert('Uang perusahaan tidak cukup untuk upgrade gudang.');
        return;
      }
      const success = gameState.upgradeWarehouse();
      if (success) {
        SoundManager.getInstance().playLevelUp();
        showToast(`🏢 Gudang ditingkatkan ke Level ${gameState.warehouseLevel}!`);
        renderActiveTab();
      }
    });

    const btnBuyShelfC = document.querySelector<HTMLButtonElement>('#btn-buy-shelf-c');
    btnBuyShelfC?.addEventListener('click', () => {
      SoundManager.getInstance().playClick();
      if (gameState.cash < 200000) {
        SoundManager.getInstance().playBuzzer();
        alert('Uang perusahaan tidak cukup untuk membuka Rak C.');
        return;
      }
      const success = gameState.buyShelf('C');
      if (success) {
        SoundManager.getInstance().playLevelUp();
        showToast(`🛒 Rak C visual berhasil dibuka!`);
        renderActiveTab();
      }
    });

    const btnBuyShelfD = document.querySelector<HTMLButtonElement>('#btn-buy-shelf-d');
    btnBuyShelfD?.addEventListener('click', () => {
      SoundManager.getInstance().playClick();
      if (gameState.cash < 200000) {
        SoundManager.getInstance().playBuzzer();
        alert('Uang perusahaan tidak cukup untuk membuka Rak D.');
        return;
      }
      const success = gameState.buyShelf('D');
      if (success) {
        SoundManager.getInstance().playLevelUp();
        showToast(`🛒 Rak D visual berhasil dibuka!`);
        renderActiveTab();
      }
    });
  }
}

function setupTabHeaderListeners(): void {
  const btnOps = document.querySelector<HTMLButtonElement>('#tab-btn-ops');
  const btnHR = document.querySelector<HTMLButtonElement>('#tab-btn-hr');
  const btnUpgrade = document.querySelector<HTMLButtonElement>('#tab-btn-upgrade');

  btnOps?.addEventListener('click', () => {
    SoundManager.getInstance().playClick();
    activeTab = 'ops';
    renderActiveTab();
  });
  btnHR?.addEventListener('click', () => {
    SoundManager.getInstance().playClick();
    activeTab = 'hr';
    renderActiveTab();
  });
  btnUpgrade?.addEventListener('click', () => {
    SoundManager.getInstance().playClick();
    activeTab = 'upgrade';
    renderActiveTab();
  });
}

function updateActiveEmployeesList(): void {
  const listContainer = document.querySelector<HTMLElement>('#active-employees-list');
  if (!listContainer) return;

  const employees = gameState.employees;

  if (employees.length === 0) {
    listContainer.innerHTML = `
      <div style="font-size: 12px; color: var(--text-secondary); text-align: center; padding: 16px;">
        Belum ada karyawan aktif. Bekerjalah secara manual atau rekrut staf baru.
      </div>
    `;
    return;
  }

  let html = '';
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

    const personalityLabels: Record<string, string> = {
      DILIGENT: 'Rajin',
      FRIENDLY: 'Ramah',
      LAZY: 'Malas',
      AMBITIOUS: 'Ambisius'
    };

    html += `
      <div class="employee-card">
        <div class="emp-header">
          <strong>👤 ${emp.name}</strong>
          <span class="emp-role">Level ${emp.skillLevel} (${personalityLabels[emp.personality] || emp.personality})</span>
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
          <span>Mood:</span>
          <strong>${moodText}</strong>
        </div>
        <div class="emp-row" style="margin-top: 6px;">
          <small style="color: var(--text-secondary);">XP: ${emp.experience} / ${emp.skillLevel * 100}</small>
          <button class="btn btn-secondary btn-sm btn-train" data-emp-id="${emp.id}" style="padding: 4px 8px; font-size: 11px;">
            Latih (+150 XP - Rp 50.000)
          </button>
        </div>
      </div>
    `;
  });

  listContainer.innerHTML = html;

  // Bind Training Buttons click
  listContainer.querySelectorAll<HTMLButtonElement>('.btn-train').forEach(btn => {
    btn.addEventListener('click', (e) => {
      SoundManager.getInstance().playClick();
      const target = e.currentTarget as HTMLButtonElement;
      const empId = target.getAttribute('data-emp-id');
      if (empId) {
        if (gameState.cash < 50000) {
          SoundManager.getInstance().playBuzzer();
          alert('Uang perusahaan tidak cukup untuk mengadakan training.');
          return;
        }
        const success = gameState.trainEmployee(empId);
        if (success) {
          SoundManager.getInstance().playLevelUp();
          showToast(`🎓 Training berhasil! Karyawan mendapat +150 XP.`);
          updateActiveEmployeesList(); // Refresh list
        }
      }
    });
  });
}

function updateRecruitsPool(): void {
  const container = document.querySelector<HTMLElement>('#recruits-pool-container');
  const recruitsSection = document.querySelector<HTMLElement>('#recruits-section');
  if (!container) return;

  const pool = gameState.recruitsPool;
  const activeCount = gameState.employees.length;

  if (activeCount >= 3 || pool.length === 0) {
    if (recruitsSection) recruitsSection.style.display = 'none';
    return;
  }

  if (recruitsSection) recruitsSection.style.display = 'block';

  let html = '';
  pool.forEach(recruit => {
    const personalityDescs: Record<string, string> = {
      DILIGENT: 'Sangat rajin, stamina kuat dan jarang malas.',
      FRIENDLY: 'Sangat ramah, menaikkan rating reputasi toko saat melayani.',
      LAZY: 'Gaji sangat murah, namun lambat bekerja dan cepat lelah.',
      AMBITIOUS: 'Bekerja super cepat, namun mood cepat anjlok jika tidak dihargai.'
    };

    const personalityLabels: Record<string, string> = {
      DILIGENT: 'Rajin 💼',
      FRIENDLY: 'Ramah 😄',
      LAZY: 'Lambat 💤',
      AMBITIOUS: 'Ambisius ⚡'
    };

    html += `
      <div class="recruit-card employee-card" style="border: 1px dashed rgba(255,255,255,0.1); background: rgba(255,255,255,0.01);">
        <div class="emp-header">
          <strong>👤 ${recruit.name}</strong>
          <span class="badge badge-purple" style="font-size: 10px;">${personalityLabels[recruit.personality]}</span>
        </div>
        <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; margin: 4px 0;">
          ${personalityDescs[recruit.personality]}
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
          <span style="font-size: 11px; font-weight: 700;">Gaji: Rp ${recruit.salary.toLocaleString('id-ID')}/hari</span>
          <button class="btn btn-primary btn-sm btn-hire-recruit" data-rec-id="${recruit.id}" style="padding: 6px 12px; font-size: 11px;">
            Sewa (Rp 100k)
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Bind Hire Buttons click
  container.querySelectorAll<HTMLButtonElement>('.btn-hire-recruit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      SoundManager.getInstance().playClick();
      const target = e.currentTarget as HTMLButtonElement;
      const recId = target.getAttribute('data-rec-id');
      if (recId) {
        if (gameState.cash < 100000) {
          SoundManager.getInstance().playBuzzer();
          alert('Uang perusahaan tidak cukup untuk menyewa staf baru.');
          return;
        }
        
        const branch = gameState.branches[0];
        const hired = gameState.hireEmployee(recId, branch.id);
        if (hired) {
          SoundManager.getInstance().playLevelUp();
          showToast(`👤 Karyawan ${hired.name} berhasil disewa!`);
          renderActiveTab(); // Refresh active tab
        }
      }
    });
  });
}

// --- EVENT BUS BINDINGS UNTUK MENG-UPDATE TAMPILAN DASHBOARD ---

eventBus.on(EVENTS.CASH_CHANGED, (cash: number) => {
  const hudCash = document.querySelector<HTMLElement>('#hud-cash');
  if (hudCash) {
    hudCash.textContent = `Rp ${cash.toLocaleString('id-ID')}`;
  }
});

eventBus.on(EVENTS.REPUTATION_CHANGED, (data: { branchId: string, reputation: number }) => {
  const hudRating = document.querySelector<HTMLElement>('#hud-rating');
  if (hudRating) {
    const stars = ((data.reputation / 100) * 5).toFixed(1);
    hudRating.textContent = `${stars} / 5.0`;
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
  
  // Perbarui visual staf aktif secara berkala jika tab SDM sedang dibuka
  if (activeTab === 'hr') {
    updateActiveEmployeesList();
  }
});

eventBus.on(EVENTS.QUEST_PROGRESS, () => {
  updateQuestPanel();
});

eventBus.on(EVENTS.QUEST_COMPLETED, (quest: any) => {
  updateQuestPanel();
  showToast(`🏆 Misi Selesai: ${quest.title}! Reward Rp ${quest.rewardCash.toLocaleString('id-ID')} ditambahkan.`);
});

// --- LAPORAN KEUANGAN OPERASIONAL HARIAN (END DAY REPORT) ---

eventBus.on(EVENTS.KPI_UPDATED, () => {
  showEndDayReport();
});

function showEndDayReport(): void {
  if (!uiLayer) return;

  const branch = gameState.branches[0];
  const rentCost = branch.operationalCost;
  const dailyRevenue = gameState.dailySalesRevenue;
  const dailyItems = gameState.dailyItemsSold;
  const dailyAngry = gameState.dailyAngryCustomers;
  
  // Hitung gaji seluruh karyawan
  let employeeSalaries = 0;
  const hiredCount = gameState.employees.length;
  if (hiredCount > 0) {
    gameState.employees.forEach(emp => {
      employeeSalaries += emp.salary;
    });
  }

  const totalExpense = rentCost + employeeSalaries;
  const currentCash = gameState.cash;
  const initialCash = currentCash - dailyRevenue;
  const netChange = dailyRevenue - totalExpense;
  const finalCash = currentCash - totalExpense;

  const netColorClass = netChange >= 0 ? 'text-purple' : 'text-red';
  const netSign = netChange >= 0 ? '+' : '';

  uiLayer.innerHTML = `
    <div class="menu-container">
      <div class="report-card animate-fade-in">
        <h2 class="report-title">📊 Laporan Harian (Hari ${gameState.day})</h2>
        <p class="report-subtitle">Evaluasi Arus Kas Perusahaan</p>
        
        <div class="report-table">
          <div class="table-row">
            <span>Kas Awal Hari</span>
            <strong>Rp ${initialCash.toLocaleString('id-ID')}</strong>
          </div>
          <div class="table-row divider">
            <span>(+) Pendapatan Kotor</span>
            <span class="text-purple">+Rp ${dailyRevenue.toLocaleString('id-ID')} <small>(${dailyItems} unit terjual)</small></span>
          </div>
          <div class="table-row divider">
            <span>(-) Sewa & Listrik Toko</span>
            <span class="text-red">-Rp ${rentCost.toLocaleString('id-ID')}</span>
          </div>
          <div class="table-row divider">
            <span>(-) Gaji Karyawan (${hiredCount} Staf)</span>
            <span class="text-red">-Rp ${employeeSalaries.toLocaleString('id-ID')}</span>
          </div>
          <div class="table-row total" style="border-top: 1px dashed rgba(255,255,255,0.15);">
            <span>Untung / Rugi Bersih</span>
            <span class="${netColorClass}"><strong>${netSign}Rp ${netChange.toLocaleString('id-ID')}</strong></span>
          </div>
          <div class="table-row" style="font-size: 12px; color: var(--text-secondary); opacity: 0.8; padding-top: 4px; padding-bottom: 8px;">
            <span>Pelanggan Kecewa / Pergi</span>
            <strong>😡 ${dailyAngry} orang</strong>
          </div>
          <div class="table-row total" style="border-top: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02);">
            <span>Estimasi Kas Hari Baru</span>
            <span class="text-purple"><strong>Rp ${finalCash.toLocaleString('id-ID')}</strong></span>
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
    
    // Reset statistik harian
    gameState.resetDailyStats();
    
    // Naikkan siklus hari
    gameState.incrementDay();

    // Picu event acak harian
    gameState.triggerRandomEvent();

    // Auto-save game di awal hari baru
    gameState.saveGame();
    showToast('💾 Auto-save berhasil...');
    
    // Bersihkan overlay dan kembalikan HUD
    uiLayer.innerHTML = '';
    renderGameplayHUD();

    // Mulai ulang scene visual Phaser
    game.scene.keys['GameScene'].scene.restart();
  });
}

function updateQuestPanel(): void {
  const container = document.querySelector<HTMLElement>('#quest-list-container');
  if (!container) return;

  const activeQuest = gameState.quests.find(q => !q.isCompleted);

  if (!activeQuest) {
    container.innerHTML = `
      <div class="quest-card completed">
        <div class="quest-title-row">
          <strong>🏆 Semua Misi Selesai!</strong>
        </div>
        <p class="quest-desc" style="font-size: 11px; margin-top: 4px; color: var(--text-secondary);">
          Selamat, Anda telah menguasai operasional toko dasar!
        </p>
      </div>
    `;
    return;
  }

  const progressPercent = Math.min(100, (activeQuest.currentValue / activeQuest.targetValue) * 100);
  const isSetPrice = activeQuest.targetType === 'SET_PRICE';
  
  let progressText = `${activeQuest.currentValue.toLocaleString('id-ID')} / ${activeQuest.targetValue.toLocaleString('id-ID')}`;
  if (isSetPrice) {
    progressText = `Harga: Rp ${activeQuest.currentValue.toLocaleString('id-ID')} (Target: Rp ${activeQuest.targetValue.toLocaleString('id-ID')})`;
  }

  container.innerHTML = `
    <div class="quest-card">
      <div class="quest-title-row">
        <strong>${activeQuest.title}</strong>
        <span class="quest-reward">+Rp ${activeQuest.rewardCash.toLocaleString('id-ID')}</span>
      </div>
      <p class="quest-desc">${activeQuest.description}</p>
      <div class="quest-progress-container" style="margin-top: 8px;">
        <div class="progress-bar-bg" style="height: 6px;">
          <div class="progress-bar-fill" style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #f1c40f 0%, #f39c12 100%);"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-secondary); margin-top: 4px;">
          <span>Progres</span>
          <span>${progressText}</span>
        </div>
      </div>
    </div>
  `;
}

function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'toast-notification animate-fade-in';
  toast.innerHTML = `
    <div class="toast-body">
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.remove('animate-fade-in');
    toast.classList.add('animate-fade-out');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

function checkAndShowEventPopup(): void {
  const activeEvent = gameState.currentDailyEvent;
  if (!activeEvent || !uiLayer) return;

  let title = '';
  let desc = '';
  let icon = '';

  if (activeEvent === 'INFLATION') {
    icon = '📈';
    title = 'Inflasi Grosir!';
    desc = 'Harga pokok beli stok grosir naik menjadi Rp 65.000 hari ini akibat kendala distribusi nasional!';
  } else if (activeEvent === 'FESTIVAL') {
    icon = '🎉';
    title = 'Festival Belanja!';
    desc = 'Warga sekitar sedang merayakan festival tahunan! Pelanggan datang 35% lebih cepat hari ini!';
  } else if (activeEvent === 'ENERGY_CRISIS') {
    icon = '⚡';
    title = 'Krisis Energi!';
    desc = 'Suhu toko panas karena AC pusat mati. Energi karyawan berkurang 20% lebih cepat hari ini!';
  }

  // Jeda waktu game ketika modal dibaca
  timeSystem.pause();

  const modal = document.createElement('div');
  modal.className = 'menu-container';
  modal.id = 'event-modal-popup';
  modal.style.zIndex = '999';
  modal.innerHTML = `
    <div class="report-card animate-fade-in" style="width: 400px; border: 1px solid var(--accent-purple); text-align: center;">
      <div style="font-size: 56px; margin-bottom: 16px;">${icon}</div>
      <h2 class="report-title text-purple" style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">${title}</h2>
      <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 12px 0;">${desc}</p>
      
      <button id="btn-close-event-modal" class="btn btn-primary" style="margin-top: 24px; width: 100%;">
        Saya Mengerti
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  const btnClose = modal.querySelector<HTMLButtonElement>('#btn-close-event-modal');
  btnClose?.addEventListener('click', () => {
    // Jalankan waktu kembali di 1x Speed
    timeSystem.setSpeed(1);
    
    // Setel tombol speed aktif ke 1x di HUD
    const btn1x = document.querySelector<HTMLButtonElement>('#btn-speed-1x');
    if (btn1x) {
      document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
      btn1x.classList.add('active');
    }
    
    modal.remove();
  });
}

console.log('SimCH Business bootstrap script loaded');
