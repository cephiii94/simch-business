
export class SoundManager {
  private static instance: SoundManager | null = null;
  private ctx: AudioContext | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private bgmInterval: any = null;
  private isMuted: boolean = false;

  private constructor() {
    // Diinisialisasi secara malas (lazy) saat interaksi pertama user
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private initCtx(): void {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Master compressor/limiter agar suara tidak clip saat banyak sfx bersamaan
      this.masterCompressor = this.ctx.createDynamicsCompressor();
      this.masterCompressor.threshold.setValueAtTime(-6, this.ctx.currentTime);
      this.masterCompressor.knee.setValueAtTime(3, this.ctx.currentTime);
      this.masterCompressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.masterCompressor.release.setValueAtTime(0.15, this.ctx.currentTime);
      this.masterCompressor.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playCoin(): void {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.masterCompressor ?? this.ctx.destination);

    osc.type = 'square';
    
    // Mario Coin SFX: B5 (987.77Hz) -> E6 (1318.51Hz)
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.setValueAtTime(1318.51, now + 0.08);

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.start(now);
    osc.stop(now + 0.35);

    osc.onended = () => {
      osc.disconnect();
      gainNode.disconnect();
    };
  }

  public playBuzzer(): void {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.masterCompressor ?? this.ctx.destination);

    osc.type = 'sawtooth';
    const now = this.ctx.currentTime;
    
    // Frekuensi menurun (descending) untuk nada sedih/marah
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.4);

    gainNode.gain.setValueAtTime(0.10, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.start(now);
    osc.stop(now + 0.4);

    osc.onended = () => {
      osc.disconnect();
      gainNode.disconnect();
    };
  }

  public playLevelUp(): void {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.masterCompressor ?? this.ctx.destination);

    osc.type = 'triangle';
    const now = this.ctx.currentTime;
    
    // Arpeggio nada naik: C5, E5, G5, C6
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.07);
    osc.frequency.setValueAtTime(783.99, now + 0.14);
    osc.frequency.setValueAtTime(1046.50, now + 0.21);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.start(now);
    osc.stop(now + 0.45);

    osc.onended = () => {
      osc.disconnect();
      gainNode.disconnect();
    };
  }

  public playClick(): void {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.masterCompressor ?? this.ctx.destination);

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.06);

    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.start(now);
    osc.stop(now + 0.06);

    osc.onended = () => {
      osc.disconnect();
      gainNode.disconnect();
    };
  }

  public startBGM(): void {
    if (this.bgmInterval) return;
    this.initCtx();
    
    // Retro chord loop: soft C Major -> G Major -> A minor -> F Major
    const chords = [
      [261.63, 329.63, 392.00], // C4, E4, G4 (C Major)
      [196.00, 246.94, 293.66], // G3, B3, D4 (G Major)
      [220.00, 261.63, 329.63], // A3, C4, E4 (A minor)
      [174.61, 220.00, 261.63]  // F3, A3, C4 (F Major)
    ];

    let chordIdx = 0;
    let step = 0;

    const playNote = () => {
      if (this.isMuted || !this.ctx) return;
      if (this.ctx.state === 'suspended') return;

      const chord = chords[chordIdx];
      const noteFreq = chord[step % 3];

      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.masterCompressor ?? this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(noteFreq, this.ctx.currentTime);

      gainNode.gain.setValueAtTime(0.03, this.ctx.currentTime); // Volume yang sedikit lebih terdengar
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.85);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.9);

      osc.onended = () => {
        osc.disconnect();
        gainNode.disconnect();
      };

      step++;
      if (step % 4 === 0) {
        chordIdx = (chordIdx + 1) % chords.length;
      }
    };

    // Mainkan nada BGM retro setiap 550ms
    this.bgmInterval = setInterval(playNote, 550);
  }

  public stopBGM(): void {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.isMuted;
  }

  public get muted(): boolean {
    return this.isMuted;
  }
}
