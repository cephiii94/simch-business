import { eventBus, EVENTS } from './event-bus.ts';

export class TimeSystem {
  private static instance: TimeSystem | null = null;

  private _hour: number = 8;
  private _minute: number = 0;
  private _speed: number = 1; // 0: pause, 1: normal, 3: fast-forward
  private _isPaused: boolean = false;
  
  // Akumulator milidetik real-time
  private msAccumulator: number = 0;
  
  // 1 jam game = 10 detik real-time = 10000 ms
  // 1 menit game = 10000 / 60 = 166.67 ms
  private readonly MS_PER_GAME_MINUTE = 166.67;
  private readonly START_HOUR = 8;
  private readonly END_HOUR = 17;

  private constructor() {}

  public static getInstance(): TimeSystem {
    if (!TimeSystem.instance) {
      TimeSystem.instance = new TimeSystem();
    }
    return TimeSystem.instance;
  }

  public get hour(): number {
    return this._hour;
  }

  public get minute(): number {
    return this._minute;
  }

  public get speed(): number {
    return this._speed;
  }

  public get isPaused(): boolean {
    return this._isPaused;
  }

  public setSpeed(value: number): void {
    if (value === 0) {
      this._isPaused = true;
    } else {
      this._isPaused = false;
      this._speed = value;
    }
    console.log(`TimeSystem: Speed set to ${value}x (Paused: ${this._isPaused})`);
  }

  public pause(): void {
    this._isPaused = true;
    console.log('TimeSystem: Paused');
  }

  public resume(): void {
    this._isPaused = false;
    console.log('TimeSystem: Resumed');
  }

  public startDay(): void {
    this._hour = this.START_HOUR;
    this._minute = 0;
    this.msAccumulator = 0;
    this._isPaused = false;
    console.log(`TimeSystem: Day started at ${this.formatTime()}`);
    eventBus.emit(EVENTS.TIME_TICK, { hour: this._hour, minute: this._minute });
  }

  // Fungsi update dipanggil di dalam loop update Phaser Scene
  public update(_time: number, delta: number): void {
    if (this._isPaused) return;

    // Tambahkan akumulator berdasarkan delta frame Phaser dikali kecepatan
    this.msAccumulator += delta * this._speed;

    // Konversi akumulasi milidetik ke menit game
    while (this.msAccumulator >= this.MS_PER_GAME_MINUTE) {
      this.msAccumulator -= this.MS_PER_GAME_MINUTE;
      this.incrementMinute();
      
      if (this._hour >= this.END_HOUR) {
        this.endDay();
        break;
      }
    }
  }

  private incrementMinute(): void {
    this._minute++;
    if (this._minute >= 60) {
      this._minute = 0;
      this._hour++;
    }
    // Emit event time tick untuk pembaruan UI
    eventBus.emit(EVENTS.TIME_TICK, { hour: this._hour, minute: this._minute });
  }

  private endDay(): void {
    this._hour = this.END_HOUR;
    this._minute = 0;
    this._isPaused = true;
    console.log('TimeSystem: Store closed. End of operational day.');
    eventBus.emit(EVENTS.KPI_UPDATED); // Memicu update KPI harian
  }

  // Helper untuk formatting string HH:MM
  public formatTime(): string {
    const hh = this._hour.toString().padStart(2, '0');
    const mm = this._minute.toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }
}
