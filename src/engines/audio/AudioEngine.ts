import type { MantraMode, SoundMode } from '../../types';

export interface AudioEngineState {
  isRunning: boolean;
  mode: SoundMode;
  mantra: MantraMode;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private omGain: GainNode | null = null;
  private tanpuraGain: GainNode | null = null;
  private bellGain: GainNode | null = null;

  private isRunning: boolean = false;
  private currentMode: SoundMode = 'mute';
  private currentMantra: MantraMode = 'om';
  private masterVolume: number = 0.85;

  private tanpuraTimerId: number | null = null;
  private bellIntervalId: number | null = null;
  private mantraLoopTimerId: number | null = null;

  private stateListeners: ((state: AudioEngineState) => void)[] = [];

  constructor() {}

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getCurrentMode(): SoundMode {
    return this.currentMode;
  }

  public getCurrentMantra(): MantraMode {
    return this.currentMantra;
  }

  public onStateChange(listener: (state: AudioEngineState) => void): () => void {
    this.stateListeners.push(listener);
    listener({
      isRunning: this.isRunning && this.currentMode !== 'mute',
      mode: this.currentMode,
      mantra: this.currentMantra,
    });
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== listener);
    };
  }

  private notifyState(): void {
    const state: AudioEngineState = {
      isRunning: this.isRunning && this.currentMode !== 'mute',
      mode: this.currentMode,
      mantra: this.currentMantra,
    };
    for (const listener of this.stateListeners) {
      try {
        listener(state);
      } catch (err) {
        console.warn('[SriYantra Audio] Listener error:', err);
      }
    }
  }

  public async init(): Promise<void> {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('[SriYantra] Web Audio API is not supported in this browser.');
      return;
    }

    if (!this.ctx) {
      this.ctx = new AudioContextClass();

      // Master Dynamics Compressor for smooth, studio-grade analog sound
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
      compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(3.5, this.ctx.currentTime);
      compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
      compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
      compressor.connect(this.ctx.destination);

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(compressor);

      // Channel 1: Warm 136.10 Hz Cosmic Octave Foundation Drone
      this.omGain = this.ctx.createGain();
      this.omGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.omGain.connect(this.masterGain);

      // Channel 2: Indian 4-String Plucked Tanpura
      this.tanpuraGain = this.ctx.createGain();
      this.tanpuraGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.tanpuraGain.connect(this.masterGain);

      // Channel 3: Sacred Meditative Singing Bowls & Bells (Option 4)
      this.bellGain = this.ctx.createGain();
      this.bellGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.bellGain.connect(this.masterGain);

      this.setupCosmicDrone();
      this.setupTanpuraScheduler();
    }

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('[SriYantra] AudioContext resume failed:', err);
      }
    }
  }

  public async setMode(mode: SoundMode): Promise<void> {
    await this.init();
    if (!this.ctx || !this.omGain || !this.tanpuraGain || !this.bellGain) return;

    this.currentMode = mode;
    const now = this.ctx.currentTime;
    const fade = 0.8;

    this.omGain.gain.cancelScheduledValues(now);
    this.omGain.gain.setValueAtTime(this.omGain.gain.value, now);

    this.tanpuraGain.gain.cancelScheduledValues(now);
    this.tanpuraGain.gain.setValueAtTime(this.tanpuraGain.gain.value, now);

    this.bellGain.gain.cancelScheduledValues(now);
    this.bellGain.gain.setValueAtTime(this.bellGain.gain.value, now);

    if (mode === 'mute') {
      this.omGain.gain.linearRampToValueAtTime(0, now + fade);
      this.tanpuraGain.gain.linearRampToValueAtTime(0, now + fade);
      this.bellGain.gain.linearRampToValueAtTime(0, now + fade);
      this.stopMantraLoop();
      this.isRunning = false;
    } else {
      this.isRunning = true;
      this.bellGain.gain.linearRampToValueAtTime(0.85, now + fade);

      if (mode === 'om-136') {
        this.omGain.gain.linearRampToValueAtTime(0.60, now + fade);
        this.tanpuraGain.gain.linearRampToValueAtTime(0, now + fade);
      } else if (mode === 'om-tanpura') {
        this.omGain.gain.linearRampToValueAtTime(0.45, now + fade);
        this.tanpuraGain.gain.linearRampToValueAtTime(0.60, now + fade);
        this.pluckTanpuraString(136.10 * 1.5);
      } else if (mode === 'singing-bowl') {
        this.omGain.gain.linearRampToValueAtTime(0.12, now + fade);
        this.tanpuraGain.gain.linearRampToValueAtTime(0, now + fade);
        this.playTibetanBowl(136.10);
      }

      // Resume cyclic instrument strike for active mantra
      if (this.currentMantra !== 'off') {
        this.startMantraLoop(this.currentMantra);
      }
    }

    this.notifyState();
  }

  /**
   * Option 4: Pure Meditative Instruments for Each Sacred Mantra
   */
  public async setMantraMode(mantra: MantraMode): Promise<void> {
    await this.init();
    this.currentMantra = mantra;

    // Automatically unmute if user chooses a mantra mode
    if (this.currentMode === 'mute') {
      await this.setMode('om-136');
      return;
    }

    if (!this.ctx || !this.bellGain) return;

    if (mantra === 'off') {
      this.stopMantraLoop();
    } else {
      this.startMantraLoop(mantra);
    }

    this.notifyState();
  }

  /**
   * Trigger the specific sacred instrument strike for the mantra
   */
  public triggerMantraInstrument(mantra: MantraMode): void {
    if (!this.ctx || !this.bellGain || this.currentMode === 'mute' || mantra === 'off') return;

    if (mantra === 'om') {
      // OM: Deep 136.10 Hz Tibetan Bronze Full Moon Singing Bowl
      this.playTibetanBowl(136.10);
    } else if (mantra === 'shreem') {
      // SHREEM: Luminous 432 Hz Quartz Crystal Singing Bowl + Tingsha Bell
      this.playCrystalBowl(432.0);
    } else if (mantra === 'sri-matre') {
      // SRI MATRE: Sacred Solfeggio Temple Chord (528 Hz Transformation + 396 Hz + 264 Hz)
      this.playTempleChord([264.0, 396.0, 528.0]);
    }
  }

  /**
   * Cyclic instrument loop harmonized with the 16s Pranayama breathing rhythm
   */
  private startMantraLoop(mantra: MantraMode): void {
    this.stopMantraLoop();
    if (mantra === 'off' || this.currentMode === 'mute') return;

    // Immediate strike on selection
    this.triggerMantraInstrument(mantra);

    // Striking gently every 16 seconds (in rhythm with complete breath cycle)
    const intervalMs = 16000;
    this.mantraLoopTimerId = window.setInterval(() => {
      if (this.currentMode !== 'mute' && this.currentMantra === mantra) {
        this.triggerMantraInstrument(mantra);
      }
    }, intervalMs);
  }

  private stopMantraLoop(): void {
    if (this.mantraLoopTimerId) {
      clearInterval(this.mantraLoopTimerId);
      this.mantraLoopTimerId = null;
    }
  }

  /**
   * 1. Authentic Tibetan Bronze Singing Bowl Physical Model (FM Inharmonic Synthesis)
   * Fundamental: 136.10 Hz (Earth Year C#3) with non-integer bronze rim modes and rim beating
   */
  public playTibetanBowl(fundamental: number = 136.10): void {
    if (!this.ctx || !this.bellGain) return;
    const now = this.ctx.currentTime;

    // Multi-modal inharmonic partials of hand-hammered bronze
    const partials = [
      { ratio: 1.00, gain: 0.55, decay: 9.0, lfoRate: 0.65 }, // Fundamental
      { ratio: 2.76, gain: 0.28, decay: 7.5, lfoRate: 1.10 }, // 1st Inharmonic
      { ratio: 5.40, gain: 0.14, decay: 5.5, lfoRate: 1.80 }, // Rim Resonance
      { ratio: 8.92, gain: 0.06, decay: 3.5, lfoRate: 0.00 }, // Mallet Strike Chime
    ];

    for (const p of partials) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * p.ratio, now);

      // Amplitude Envelope: Soft wooden mallet strike (30ms rise) -> exponential ring
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(p.gain * 0.75, now + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      // Acoustic rim beating modulation (simulating sound revolving around circular bronze rim)
      if (p.lfoRate > 0) {
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(p.lfoRate, now);
        lfoGain.gain.setValueAtTime(fundamental * 0.015, now);
        lfo.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + p.decay);
      }

      osc.connect(gain);
      gain.connect(this.bellGain);

      osc.start(now);
      osc.stop(now + p.decay + 0.1);
    }
  }

  /**
   * 2. Luminous Quartz Crystal Singing Bowl (Pure 432 Hz + Tingsha Bell Shimmer)
   * Pristine crystalline purity, long exponential sustain, and delicate bronze tingsha ring
   */
  public playCrystalBowl(fundamental: number = 432.0): void {
    if (!this.ctx || !this.bellGain) return;
    const now = this.ctx.currentTime;
    const duration = 10.5;

    // Crystal Bowl Pair: Pure 432 Hz + 432.5 Hz creating a gentle 0.5 Hz meditative binaural pulse
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const crystalGain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(fundamental, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(fundamental + 0.5, now);

    crystalGain.gain.setValueAtTime(0.0001, now);
    crystalGain.gain.linearRampToValueAtTime(0.45, now + 0.08);
    crystalGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(crystalGain);
    osc2.connect(crystalGain);
    crystalGain.connect(this.bellGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.1);
    osc2.stop(now + duration + 0.1);

    // Bronze Tingsha Bell Shimmer (High delicate chime at 2160 Hz)
    const tingsha = this.ctx.createOscillator();
    const tingshaGain = this.ctx.createGain();
    tingsha.type = 'sine';
    tingsha.frequency.setValueAtTime(fundamental * 5.0, now); // 2160 Hz

    tingshaGain.gain.setValueAtTime(0.0001, now);
    tingshaGain.gain.linearRampToValueAtTime(0.08, now + 0.01);
    tingshaGain.gain.exponentialRampToValueAtTime(0.0001, now + 6.0);

    tingsha.connect(tingshaGain);
    tingshaGain.connect(this.bellGain);

    tingsha.start(now);
    tingsha.stop(now + 6.1);
  }

  /**
   * 3. Sacred Temple Solfeggio Triad (528 Hz Miracle Tone + 396 Hz Liberation + 264 Hz Ground)
   * Three tuned Himalayan bowls struck in harmony with gentle wind chime harmonics
   */
  public playTempleChord(frequencies: number[] = [264.0, 396.0, 528.0]): void {
    if (!this.ctx || !this.bellGain) return;
    const now = this.ctx.currentTime;
    const duration = 12.0;

    frequencies.forEach((freq, idx) => {
      // Gentle stagger between strikes (0ms, 120ms, 260ms) like a monk striking three bowls
      const strikeTime = now + idx * 0.14;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, strikeTime);

      gain.gain.setValueAtTime(0.0001, strikeTime);
      gain.gain.linearRampToValueAtTime(0.32 - idx * 0.04, strikeTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, strikeTime + duration);

      osc.connect(gain);
      gain.connect(this.bellGain!);

      osc.start(strikeTime);
      osc.stop(strikeTime + duration + 0.1);
    });

    // Wind Chime High Shimmer (1584 Hz and 2112 Hz)
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(528.0 * 3.0, now + 0.3); // 1584 Hz

    chimeGain.gain.setValueAtTime(0.0001, now + 0.3);
    chimeGain.gain.linearRampToValueAtTime(0.05, now + 0.32);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);

    chime.connect(chimeGain);
    chimeGain.connect(this.bellGain);

    chime.start(now + 0.3);
    chime.stop(now + 5.6);
  }

  /**
   * Warm Analog 136.10 Hz Cosmic Octave Drone (Earth Year / C#3)
   * Pure soothing sine & triangle waves through warm low-pass filters (Zero harshness)
   */
  private setupCosmicDrone(): void {
    if (!this.ctx || !this.omGain) return;

    const FUNDAMENTAL = 136.10;

    // Warm Low-Pass Filter at 320 Hz to ensure round, warm, soothing bass
    const warmLpf = this.ctx.createBiquadFilter();
    warmLpf.type = 'lowpass';
    warmLpf.frequency.setValueAtTime(320, this.ctx.currentTime);
    warmLpf.Q.setValueAtTime(1.2, this.ctx.currentTime);
    warmLpf.connect(this.omGain);

    // 1. Earth Year Fundamental Sine (136.10 Hz)
    this.createDroneOsc(FUNDAMENTAL, 'sine', 0.45, warmLpf);
    this.createDroneOsc(FUNDAMENTAL + 0.2, 'sine', 0.25, warmLpf);

    // 2. Warm Sub-Octave (68.05 Hz)
    this.createDroneOsc(FUNDAMENTAL / 2, 'sine', 0.35, warmLpf);

    // 3. Perfect Fifth Pancham Harmonic (204.15 Hz)
    this.createDroneOsc(FUNDAMENTAL * 1.5, 'triangle', 0.15, warmLpf);

    // Slow 16s breathing amplitude swell
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(1 / 16, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(this.omGain.gain);
    lfo.start();
  }

  private createDroneOsc(freq: number, type: OscillatorType, gainVal: number, dest: AudioNode): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    osc.connect(g);
    g.connect(dest);
    osc.start();
  }

  /**
   * Procedural Indian Tanpura (Pa - Sa - Sa - Sa 4-String Pluck Cycle)
   */
  private setupTanpuraScheduler(): void {
    const freqs = [
      136.10 * 1.5, // Pa (204.15 Hz)
      136.10 * 2.0, // Sa (272.20 Hz)
      136.10 * 2.0, // Sa (272.20 Hz)
      136.10 * 1.0, // Kharaj Sa (136.10 Hz)
    ];

    let stringIndex = 0;
    const pluckInterval = 3200; // Peaceful 3.2s cadence

    this.tanpuraTimerId = window.setInterval(() => {
      if (this.currentMode === 'om-tanpura' && this.ctx && this.tanpuraGain) {
        this.pluckTanpuraString(freqs[stringIndex]);
        stringIndex = (stringIndex + 1) % freqs.length;
      }
    }, pluckInterval);
  }

  private pluckTanpuraString(freq: number): void {
    if (!this.ctx || !this.tanpuraGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.8, now);
    filter.Q.setValueAtTime(5.5, now);

    // Natural plucked silk string amplitude envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.tanpuraGain);

    osc.start(now);
    osc.stop(now + 5.6);
  }

  public async toggleMute(): Promise<boolean> {
    if (this.currentMode === 'mute' || !this.isRunning) {
      await this.setMode('om-136');
      return true;
    } else {
      await this.setMode('mute');
      return false;
    }
  }

  public async unlockAndStart(): Promise<boolean> {
    if (this.currentMode === 'mute' || !this.isRunning) {
      await this.setMode('om-136');
      return true;
    }
    return false;
  }

  public setMasterVolume(val: number): void {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.masterVolume, now + 0.1);
    }
  }

  public setBellInterval(minutes: number): void {
    if (this.bellIntervalId) {
      clearInterval(this.bellIntervalId);
      this.bellIntervalId = null;
    }

    if (minutes > 0) {
      this.bellIntervalId = window.setInterval(() => {
        this.playTibetanBowl(136.10);
      }, minutes * 60 * 1000);
    }
  }

  public destroy(): void {
    this.stopMantraLoop();
    if (this.tanpuraTimerId) clearInterval(this.tanpuraTimerId);
    if (this.bellIntervalId) clearInterval(this.bellIntervalId);
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}
