import type { Employee, Branch, PersonalityType } from '../../shared/types/game.types.ts';
import { eventBus, EVENTS } from '../../shared/utils/event-bus.ts';

export class GameState {
  private static instance: GameState | null = null;

  private _cash: number = 500000; // Modal Awal Rp 500.000
  private _day: number = 1;
  private _employees: Employee[] = [];
  private _branches: Branch[] = [];

  private constructor() {
    this.initializeDefaultBranch();
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
      maxStock: 100,
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

  public hireEmployee(name: string, personality: PersonalityType, branchId: string): Employee | null {
    const HIRE_COST = 100000;
    if (this._cash < HIRE_COST) {
      console.log(`GameState: Cannot hire employee. Insufficient cash (Required: Rp ${HIRE_COST})`);
      return null;
    }

    this.spendCash(HIRE_COST);

    const newEmployee: Employee = {
      id: `emp_${Date.now()}`,
      name: name,
      roleId: 'EMPLOYEE',
      personality: personality,
      skillLevel: 1,
      experience: 0,
      energy: 100,
      maxEnergy: 100,
      mood: 80,
      salary: 30000,
      currentBranchId: branchId,
      kpiHistory: [],
      currentState: 'WORKING'
    };

    this._employees.push(newEmployee);

    // Tambahkan ID karyawan ke cabang
    const branch = this._branches.find(b => b.id === branchId);
    if (branch) {
      branch.employeeIds.push(newEmployee.id);
    }

    eventBus.emit(EVENTS.EMPLOYEE_HIRED, newEmployee);
    console.log(`GameState: Hired employee ${name} (${personality}) for branch ${branchId}`);
    return newEmployee;
  }

  // Mereset state (untuk kebutuhan testing/new game)
  public resetState(): void {
    this._cash = 500000;
    this._day = 1;
    this._employees = [];
    this._branches = [];
    this.initializeDefaultBranch();
    eventBus.emit(EVENTS.CASH_CHANGED, this._cash);
    console.log('GameState reset complete');
  }
}
