import type { Employee, AgentState } from '../../shared/types/game.types.ts';
import { eventBus, EVENTS } from '../../shared/utils/event-bus.ts';

export class EmployeeAgent {
  private employee: Employee;

  constructor(employee: Employee) {
    this.employee = employee;
  }

  public get data(): Employee {
    return this.employee;
  }

  // Menentukan state berdasarkan waktu operasional
  public updateStateByTime(hour: number): void {
    const previousState = this.employee.currentState;
    let targetState: AgentState = 'SLEEPING';

    if (hour >= 22 || hour < 7) {
      targetState = 'SLEEPING';
    } else if (hour === 7) {
      targetState = 'COMMUTING';
    } else if (hour >= 8 && hour < 17) {
      // Jika jam kerja, tetapi energi kritis, ambil istirahat
      if (this.employee.energy <= 15) {
        targetState = 'BREAKING';
      } else if (previousState === 'BREAKING' && this.employee.energy < 80) {
        // Lanjutkan istirahat sampai energi cukup terisi
        targetState = 'BREAKING';
      } else {
        targetState = 'WORKING';
      }
    } else if (hour === 17) {
      targetState = 'WORKING'; // Masih membereskan toko
    } else if (hour >= 18 && hour < 22) {
      targetState = 'LEAVING';
    }

    if (previousState !== targetState) {
      this.employee.currentState = targetState;
      eventBus.emit(EVENTS.EMPLOYEE_STATE_CHANGED, {
        employeeId: this.employee.id,
        state: targetState
      });
      console.log(`EmployeeAgent (${this.employee.name}): State changed from ${previousState} to ${targetState}`);
    }
  }

  // Dipanggil setiap menit game berjalan untuk menguras/memulihkan energi
  public processOperationalTick(deltaMinutes: number): void {
    const currentState = this.employee.currentState;
    
    // Perhitungan pengurasan/pemulihan energi berdasarkan state
    if (currentState === 'WORKING') {
      let energyDrain = 0.5 * deltaMinutes; // Base drain rate
      
      // Modifier kepribadian
      if (this.employee.personality === 'LAZY') {
        energyDrain *= 1.3; // Lebih cepat lelah
      } else if (this.employee.personality === 'DILIGENT') {
        energyDrain *= 0.8; // Lebih hemat energi
      }
      
      this.employee.energy = Math.max(0, this.employee.energy - energyDrain);
      
    } else if (currentState === 'BREAKING') {
      const recoveryRate = 2.0 * deltaMinutes; // Pemulihan cepat
      this.employee.energy = Math.min(this.employee.maxEnergy, this.employee.energy + recoveryRate);
      
    } else if (currentState === 'SLEEPING') {
      // Pemulihan penuh saat tidur
      this.employee.energy = this.employee.maxEnergy;
    }
  }
}
