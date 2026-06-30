import type { Employee, Branch, Quest, QuestTargetType } from '../../shared/types/game.types.ts';
import { eventBus, EVENTS } from '../../shared/utils/event-bus.ts';

export class GameState {
  private static instance: GameState | null = null;

  private _cash: number = 500000; // Modal Awal Rp 500.000
  private _day: number = 1;
  private _employees: Employee[] = [];
  private _branches: Branch[] = [];
  private _dailySalesRevenue: number = 0;
  private _dailyItemsSold: number = 0;
  private _dailyAngryCustomers: number = 0;
  private _quests: Quest[] = [];
  private _currentDailyEvent: string | null = null;
  private _recruitsPool: Employee[] = [];
  private _warehouseLevel: number = 1;
  private _hasShelfC: boolean = false;
  private _hasShelfD: boolean = false;

  private constructor() {
    this.initializeDefaultBranch();
    this.initializeQuests();
    this.initializeRecruitsPool();
  }

  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  // Menginisialisasi cabang default pertama
  private initializeDefaultBranch(): void {
    const mainBranch: Branch = {
      id: 'branch_01',
      name: 'Toko Kelontong Utama',
      stock: 20, // 20 unit stok gratis di hari pertama
      maxStock: 30, // Mulai dengan kapasitas gudang Level 1 (30 Unit)
      sellingPrice: 7500, // Harga pasar awal
      reputation: 50, // Nilai default daya tarik
      managerId: null,
      leaderId: null,
      employeeIds: [],
      operationalCost: 10000, // Biaya operasional Rp 10.000 / hari
      dailyRevenueHistory: []
    };
    this._branches.push(mainBranch);
  }

  // Getters
  public get cash(): number {
    return this._cash;
  }

  public get day(): number {
    return this._day;
  }

  public get employees(): Employee[] {
    return this._employees;
  }

  public get branches(): Branch[] {
    return this._branches;
  }

  public get dailySalesRevenue(): number {
    return this._dailySalesRevenue;
  }

  public get dailyItemsSold(): number {
    return this._dailyItemsSold;
  }

  public get dailyAngryCustomers(): number {
    return this._dailyAngryCustomers;
  }

  public get quests(): Quest[] {
    return this._quests;
  }

  public get currentDailyEvent(): string | null {
    return this._currentDailyEvent;
  }

  public get recruitsPool(): Employee[] {
    return this._recruitsPool;
  }

  public get warehouseLevel(): number {
    return this._warehouseLevel;
  }

  public get hasShelfC(): boolean {
    return this._hasShelfC;
  }

  public get hasShelfD(): boolean {
    return this._hasShelfD;
  }

  // Setters & Mutators
  public setCash(value: number): void {
    this._cash = value;
    eventBus.emit(EVENTS.CASH_CHANGED, this._cash);
  }

  public addCash(amount: number): void {
    if (amount <= 0) return;
    this.setCash(this._cash + amount);
  }

  public spendCash(amount: number): boolean {
    if (amount <= 0) return false;
    this.setCash(this._cash - amount);
    return true;
  }

  public incrementDay(): void {
    this._day++;
    console.log(`GameState: Day advanced to Day ${this._day}`);
  }

  public addEmployee(employee: Employee): void {
    this._employees.push(employee);
    eventBus.emit(EVENTS.EMPLOYEE_HIRED, employee);
  }

  public addBranch(branch: Branch): void {
    this._branches.push(branch);
    eventBus.emit(EVENTS.BRANCH_CREATED, branch);
  }

  public updateBranchStock(branchId: string, quantityChange: number): void {
    const branch = this._branches.find(b => b.id === branchId);
    if (branch) {
      const newStock = Math.max(0, Math.min(branch.maxStock, branch.stock + quantityChange));
      branch.stock = newStock;
      eventBus.emit(EVENTS.STOCK_CHANGED, { branchId, stock: branch.stock });
    }
  }

  public updateBranchReputation(branchId: string, change: number): void {
    const branch = this._branches.find(b => b.id === branchId);
    if (branch) {
      const newRep = Math.max(0, Math.min(100, branch.reputation + change));
      branch.reputation = newRep;
      eventBus.emit(EVENTS.REPUTATION_CHANGED, { branchId, reputation: branch.reputation });
    }
  }

  public hireEmployee(employeeId: string, branchId: string): Employee | null {
    const HIRE_COST = 100000;
    if (this._cash < HIRE_COST) {
      console.log(`GameState: Cannot hire employee. Insufficient cash (Required: Rp ${HIRE_COST})`);
      return null;
    }

    if (this._employees.length >= 3) {
      console.log('GameState: Cannot hire employee. Maximum limit of 3 employees reached');
      return null;
    }

    const recruitIndex = this._recruitsPool.findIndex(e => e.id === employeeId);
    if (recruitIndex === -1) {
      console.log(`GameState: Recruit with ID ${employeeId} not found in pool`);
      return null;
    }

    const recruit = this._recruitsPool[recruitIndex];
    this.spendCash(HIRE_COST);
    
    // Hapus dari calon rekrutmen
    this._recruitsPool.splice(recruitIndex, 1);

    // Atur data cabang karyawan
    recruit.currentBranchId = branchId;
    this._employees.push(recruit);

    // Tambahkan ID karyawan ke cabang
    const branch = this._branches.find(b => b.id === branchId);
    if (branch) {
      branch.employeeIds.push(recruit.id);
    }

    eventBus.emit(EVENTS.EMPLOYEE_HIRED, recruit);
    this.progressQuest('HIRE_EMPLOYEE', 1);
    console.log(`GameState: Hired employee ${recruit.name} for branch ${branchId}`);
    return recruit;
  }

  public recordSale(revenue: number, quantity: number): void {
    this._dailySalesRevenue += revenue;
    this._dailyItemsSold += quantity;
    this.addCash(revenue);
  }

  public recordAngryCustomer(): void {
    this._dailyAngryCustomers++;
  }

  public resetDailyStats(): void {
    this._dailySalesRevenue = 0;
    this._dailyItemsSold = 0;
    this._dailyAngryCustomers = 0;
    this._currentDailyEvent = null;
    console.log('GameState: Daily stats reset to zero');
  }

  public triggerRandomEvent(): string | null {
    // 35% peluang memicu event harian acak
    const roll = Math.random();
    if (roll <= 0.35) {
      const events = ['INFLATION', 'FESTIVAL', 'ENERGY_CRISIS'];
      this._currentDailyEvent = events[Math.floor(Math.random() * events.length)];
      eventBus.emit(EVENTS.EVENT_TRIGGERED, { eventType: this._currentDailyEvent });
      console.log(`GameState: Random Event Triggered: ${this._currentDailyEvent}`);
    } else {
      this._currentDailyEvent = null;
      eventBus.emit(EVENTS.EVENT_TRIGGERED, { eventType: null });
      console.log('GameState: No Random Event today');
    }
    return this._currentDailyEvent;
  }

  public initializeQuests(): void {
    this._quests = [
      {
        id: 'quest_01',
        title: 'Kulakan Pertama',
        description: 'Beli stok grosir pertama kali untuk rak pajangan.',
        targetType: 'BUY_STOCK',
        targetValue: 10,
        currentValue: 0,
        rewardCash: 10000,
        isCompleted: false
      },
      {
        id: 'quest_02',
        title: 'Layanan Mandiri',
        description: 'Layani 5 pelanggan secara manual di meja kasir.',
        targetType: 'SERVE_MANUAL',
        targetValue: 5,
        currentValue: 0,
        rewardCash: 20000,
        isCompleted: false
      },
      {
        id: 'quest_03',
        title: 'Bos Besar',
        description: 'Sewa Karyawan AI Budi seharga Rp 100.000.',
        targetType: 'HIRE_EMPLOYEE',
        targetValue: 1,
        currentValue: 0,
        rewardCash: 50000,
        isCompleted: false
      },
      {
        id: 'quest_04',
        title: 'Strategi Harga',
        description: 'Ubah harga jual menjadi Rp 8.000.',
        targetType: 'SET_PRICE',
        targetValue: 8000,
        currentValue: 0,
        rewardCash: 15000,
        isCompleted: false
      }
    ];
  }

  public progressQuest(type: QuestTargetType, value: number, isSet: boolean = false): void {
    this._quests.forEach(quest => {
      if (quest.targetType === type && !quest.isCompleted) {
        if (isSet) {
          quest.currentValue = value;
        } else {
          quest.currentValue += value;
        }
        
        if (quest.currentValue >= quest.targetValue) {
          quest.currentValue = quest.targetValue;
          quest.isCompleted = true;
          this.addCash(quest.rewardCash);
          eventBus.emit(EVENTS.QUEST_COMPLETED, quest);
          console.log(`Quest Completed: ${quest.title} (+Rp ${quest.rewardCash})`);
        } else {
          eventBus.emit(EVENTS.QUEST_PROGRESS, quest);
        }
      }
    });
  }

  public initializeRecruitsPool(): void {
    this._recruitsPool = [
      {
        id: 'emp_budi',
        name: 'Budi',
        roleId: 'EMPLOYEE',
        personality: 'DILIGENT',
        skillLevel: 1,
        experience: 0,
        energy: 100,
        maxEnergy: 100,
        mood: 80,
        salary: 30000,
        currentBranchId: null,
        kpiHistory: [],
        currentState: 'WORKING'
      },
      {
        id: 'emp_citra',
        name: 'Citra',
        roleId: 'EMPLOYEE',
        personality: 'FRIENDLY',
        skillLevel: 1,
        experience: 0,
        energy: 100,
        maxEnergy: 100,
        mood: 80,
        salary: 35000,
        currentBranchId: null,
        kpiHistory: [],
        currentState: 'WORKING'
      },
      {
        id: 'emp_dedi',
        name: 'Dedi',
        roleId: 'EMPLOYEE',
        personality: 'LAZY',
        skillLevel: 1,
        experience: 0,
        energy: 100,
        maxEnergy: 100,
        mood: 80,
        salary: 15000,
        currentBranchId: null,
        kpiHistory: [],
        currentState: 'WORKING'
      },
      {
        id: 'emp_eka',
        name: 'Eka',
        roleId: 'EMPLOYEE',
        personality: 'AMBITIOUS',
        skillLevel: 1,
        experience: 0,
        energy: 100,
        maxEnergy: 100,
        mood: 80,
        salary: 45000,
        currentBranchId: null,
        kpiHistory: [],
        currentState: 'WORKING'
      }
    ];
  }

  public trainEmployee(employeeId: string): boolean {
    const TRAINING_COST = 50000;
    if (this._cash < TRAINING_COST) {
      console.log('GameState: Cannot train. Insufficient cash');
      return false;
    }

    const emp = this._employees.find(e => e.id === employeeId);
    if (!emp) {
      console.log(`GameState: Employee with ID ${employeeId} not found`);
      return false;
    }

    this.spendCash(TRAINING_COST);
    emp.experience += 150;

    // Naik Level jika XP mencukupi
    if (emp.experience >= emp.skillLevel * 100) {
      emp.skillLevel++;
      console.log(`EmployeeAgent (${emp.name}) leveled up to Level ${emp.skillLevel} via training!`);
    }

    eventBus.emit(EVENTS.KPI_UPDATED);
    return true;
  }

  public upgradeWarehouse(): boolean {
    const level = this._warehouseLevel;
    if (level >= 3) return false;

    const cost = level === 1 ? 150000 : 300000;
    if (this._cash < cost) return false;

    this.spendCash(cost);
    this._warehouseLevel++;

    const newMax = this._warehouseLevel === 2 ? 60 : 100;
    const branch = this._branches[0];
    if (branch) {
      branch.maxStock = newMax;
      eventBus.emit(EVENTS.STOCK_CHANGED, { branchId: branch.id, stock: branch.stock });
    }

    console.log(`GameState: Warehouse upgraded to Level ${this._warehouseLevel} (Max Stock: ${newMax})`);
    return true;
  }

  public buyShelf(shelfId: 'C' | 'D'): boolean {
    const cost = 200000;
    if (this._cash < cost) return false;

    if (shelfId === 'C') {
      if (this._hasShelfC) return false;
      this.spendCash(cost);
      this._hasShelfC = true;
    } else if (shelfId === 'D') {
      if (this._hasShelfD) return false;
      this.spendCash(cost);
      this._hasShelfD = true;
    }

    console.log(`GameState: Shelf ${shelfId} purchased successfully`);
    return true;
  }

  public saveGame(): void {
    const saveData = {
      cash: this._cash,
      day: this._day,
      warehouseLevel: this._warehouseLevel,
      hasShelfC: this._hasShelfC,
      hasShelfD: this._hasShelfD,
      employees: this._employees,
      branches: this._branches,
      quests: this._quests,
      recruitsPool: this._recruitsPool
    };

    localStorage.setItem('simch_business_save', JSON.stringify(saveData));
    console.log('GameState: Game saved to localStorage');
  }

  public loadGame(): boolean {
    const rawData = localStorage.getItem('simch_business_save');
    if (!rawData) {
      console.log('GameState: No save game found');
      return false;
    }

    try {
      const data = JSON.parse(rawData);
      this._cash = data.cash ?? 500000;
      this._day = data.day ?? 1;
      this._warehouseLevel = data.warehouseLevel ?? 1;
      this._hasShelfC = data.hasShelfC ?? false;
      this._hasShelfD = data.hasShelfD ?? false;
      this._employees = data.employees ?? [];
      this._branches = data.branches ?? [];
      this._quests = data.quests ?? [];
      this._recruitsPool = data.recruitsPool ?? [];

      // Memicu event sinkronisasi kas & stok ke HUD
      eventBus.emit(EVENTS.CASH_CHANGED, this._cash);
      const branch = this._branches[0];
      if (branch) {
        eventBus.emit(EVENTS.STOCK_CHANGED, { branchId: branch.id, stock: branch.stock });
        eventBus.emit(EVENTS.REPUTATION_CHANGED, { branchId: branch.id, reputation: branch.reputation });
      }

      console.log('GameState: Game loaded successfully from localStorage');
      return true;
    } catch (err) {
      console.error('GameState: Failed to parse save data', err);
      return false;
    }
  }

  public hasSaveGame(): boolean {
    return localStorage.getItem('simch_business_save') !== null;
  }

  // Mereset state (untuk kebutuhan testing/new game)
  public resetState(): void {
    this._cash = 500000;
    this._day = 1;
    this._employees = [];
    this._branches = [];
    this._warehouseLevel = 1;
    this._hasShelfC = false;
    this._hasShelfD = false;
    this.resetDailyStats();
    this.initializeDefaultBranch();
    this.initializeQuests();
    this.initializeRecruitsPool();
    eventBus.emit(EVENTS.CASH_CHANGED, this._cash);
    console.log('GameState reset complete');
  }
}
