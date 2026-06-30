export type RoleId = 'EMPLOYEE' | 'LEADER' | 'MANAGER' | 'UNASSIGNED';
export type PersonalityType = 'DILIGENT' | 'FRIENDLY' | 'AMBITIOUS' | 'LAZY';
export type AgentState = 'COMMUTING' | 'WORKING' | 'BREAKING' | 'LEAVING' | 'SLEEPING';
export type PlayerState = 'IDLE' | 'WALKING' | 'INTERACTING';


export interface Employee {
  id: string;
  name: string;
  roleId: RoleId;
  personality: PersonalityType;
  skillLevel: number;
  experience: number;
  energy: number;
  maxEnergy: number;
  mood: number; // Skala 0 s.d. 100
  salary: number; // Gaji harian
  currentBranchId: string | null;
  kpiHistory: number[]; // Riwayat efisiensi harian (0% - 100%)
  currentState: AgentState;
}

export interface Branch {
  id: string;
  name: string;
  stock: number;
  maxStock: number;
  sellingPrice: number;
  reputation: number; // Skala 0 s.d. 100 (Daya Tarik Toko)
  managerId: string | null;
  leaderId: string | null;
  employeeIds: string[];
  operationalCost: number; // Biaya operasional harian cabang
  dailyRevenueHistory: number[];
}

export type QuestTargetType = 'BUY_STOCK' | 'SERVE_MANUAL' | 'HIRE_EMPLOYEE' | 'SET_PRICE';

export interface Quest {
  id: string;
  title: string;
  description: string;
  targetType: QuestTargetType;
  targetValue: number;
  currentValue: number;
  rewardCash: number;
  isCompleted: boolean;
}
