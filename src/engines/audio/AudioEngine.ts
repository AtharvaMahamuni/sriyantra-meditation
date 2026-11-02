import type { SoundMode } from '../../types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private omGain: GainNode | null = null;
  private tanpuraGain: GainNode | null = null;

  private isRunning: boolean = false;
  private currentMode: SoundMode = 'mute';
  private masterVolume: number = 0.75;

  private tanpuraTimerId: number | null = null;
  private bellIntervalId: number | null = null;

  constructor() {}

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public async init(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
      return;
    }
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('[SriYantra] Web Audio API is not supported in this browser.');
      return;
    }

    this.ctx = new AudioContextClass();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Channel Gains
    this.omGain = this.ctx.createGain();
    this.omGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.omGain.connect(this.masterGain);

    this.tanpuraGain = this.ctx.createGain();
    this.tanpuraGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.tanpuraGain.connect(this.masterGain);

    this.setupOmSynthesizer();
    this.setupTanpuraScheduler();
  }

  public async setMode(mode: SoundMode): Promise<void> {
    await this.init();
    if (!this.ctx || !this.omGain || !this.tanpuraGain) return;

    this.currentMode = mode;
    const now = this.ctx.currentTime;
    const fade = 2.5;

    if (mode === 'mute') {
      this.omGain.gain.linearRampToValueAtTime(0, now + fade);
      this.tanpuraGain.gain.linearRampToValueAtTime(0, now + fade);
      this.isRunning = false;
    } else if (mode === 'om-136') {
      this.omGain.gain.linearRampToValueAtTime(0.70, now + fade);
      this.tanpuraGain.gain.linearRampToValueAtTime(0, now + fade);
      this.isRunning = true;
    } else if (mode === 'om-tanpura') {
      this.omGain.gain.linearRampToValueAtTime(0.60, now + fade);
      this.tanpuraGain.gain.linearRampToValueAtTime(0.40, now + fade);
      this.isRunning = true;
    } else if (mode === 'singing-bowl') {
      this.omGain.gain.linearRampToValueAtTime(0.20, now + fade);
      this.tanpuraGain.gain.linearRampToValueAtTime(0, now + fade);
      this.playSingingBowl(280); // Strike bell immediately
      this.isRunning = true;
    }
  }

  public setMasterVolume(val: number): void {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(this.masterVolume, this.ctx.currentTime + 0.1);
    }
  }

  /**
   * 136.10 Hz Cosmic Octave Procedural Drone Synthesizer
   */
  private setupOmSynthesizer(): void {
    if (!this.ctx || !this.omGain) return;

    const FUNDAMENTAL = 136.10; // Earth Year / C#3

    // Formant filter (simulates vocal AUM resonant cavity)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.5, this.ctx.currentTime);
    filter.connect(this.omGain);

    // Oscillator 1: Fundamental Sine (136.1 Hz)
    this.createOsc(FUNDAMENTAL, 'sine', 0.45, filter);

    // Oscillator 2: Fundamental Warm Sawtooth (136.1 Hz with soft high cut)
    this.createOsc(FUNDAMENTAL, 'sawtooth', 0.15, filter);

    // Oscillator 3: Sub-Octave (68.05 Hz)
    this.createOsc(FUNDAMENTAL / 2, 'sine', 0.35, filter);

    // Oscillator 4: Harmonic Fifth (Pancham / 204.15 Hz)
    this.createOsc(FUNDAMENTAL * 1.5, 'sine', 0.14, filter);

    // Oscillator 5: Upper Octave (272.2 Hz)
    this.createOsc(FUNDAMENTAL * 2, 'triangle', 0.08, filter);

    // Subtle LFO breathing filter modulation (16-second cycle)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(1 / 16, this.ctx.currentTime); // 16s period
    lfoGain.gain.setValueAtTime(90, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
  }

  private createOsc(freq: number, type: OscillatorType, gainVal: number, dest: AudioNode): void {
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
   * Procedural Tanpura (4-string plucking sequence: Pa - Sa - Sa - Sa)
   */
  private setupTanpuraScheduler(): void {
    const freqs = [
      136.10 * 1.5, // Pa (204.15 Hz)
      136.10 * 2.0, // Sa (272.20 Hz)
      136.10 * 2.0, // Sa (272.20 Hz)
      136.10 * 1.0, // Kharaj Sa (136.10 Hz)
    ];

    let stringIndex = 0;
    const pluckInterval = 2800; // Pluck every 2.8 seconds

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
    filter.Q.setValueAtTime(6.0, now);

    // Natural plucked string amplitude envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 5.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.tanpuraGain);

    osc.start(now);
    osc.stop(now + 5.6);
  }

  /**
   * Tibetan Singing Bowl Bell (FM Synthesis with rich non-harmonic shimmer)
   */
  public playSingingBowl(fundamental: number = 280): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Carrier
    const carrier = this.ctx.createOscillator();
    const carrierGain = this.ctx.createGain();

    // Modulator (FM for metallic shimmer)
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(fundamental, now);

    mod.type = 'sine';
    mod.frequency.setValueAtTime(fundamental * 2.76, now); // Non-harmonic ratio
    modGain.gain.setValueAtTime(fundamental * 0.4, now);
    modGain.gain.exponentialRampToValueAtTime(0.1, now + 4.0);

    mod.connect(carrier.frequency);

    // Long soothing 8-second decay
    carrierGain.gain.setValueAtTime(0, now);
    carrierGain.gain.linearRampToValueAtTime(0.35, now + 0.08);
    carrierGain.gain.exponentialRampToValueAtTime(0.0001, now + 8.5);

    carrier.connect(carrierGain);
    carrierGain.connect(this.masterGain);

    mod.start(now);
    carrier.start(now);
    mod.stop(now + 8.6);
    carrier.stop(now + 8.6);
  }

  public setBellInterval(minutes: number): void {
    if (this.bellIntervalId) {
      clearInterval(this.bellIntervalId);
      this.bellIntervalId = null;
    }

    if (minutes > 0) {
      this.bellIntervalId = window.setInterval(() => {
        this.playSingingBowl(240);
      }, minutes * 60 * 1000);
    }
  }

  public destroy(): void {
    if (this.tanpuraTimerId) clearInterval(this.tanpuraTimerId);
    if (this.bellIntervalId) clearInterval(this.bellIntervalId);
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}
