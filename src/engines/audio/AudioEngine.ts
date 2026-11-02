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
  private mantraGain: GainNode | null = null;

  private isRunning: boolean = false;
  private currentMode: SoundMode = 'mute';
  private currentMantra: MantraMode = 'om';
  private masterVolume: number = 0.85;

  private tanpuraTimerId: number | null = null;
  private bellIntervalId: number | null = null;
  private vocalLfo: OscillatorNode | null = null;

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
    // Initial notification
    listener({
      isRunning: this.isRunning,
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

      // Master Compressor to prevent any clipping distortion
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      compressor.knee.setValueAtTime(10, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
      compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
      compressor.connect(this.ctx.destination);

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(compressor);

      // Channel Gains
      this.omGain = this.ctx.createGain();
      this.omGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.omGain.connect(this.masterGain);

      this.tanpuraGain = this.ctx.createGain();
      this.tanpuraGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.tanpuraGain.connect(this.masterGain);

      this.mantraGain = this.ctx.createGain();
      this.mantraGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.mantraGain.connect(this.masterGain);

      this.setupVocalOmSynthesizer();
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
    if (!this.ctx || !this.omGain || !this.tanpuraGain) return;

    this.currentMode = mode;
    const now = this.ctx.currentTime;
    const fade = 0.8;

    // Anchor scheduled values to prevent Web Audio exceptions
    this.omGain.gain.cancelScheduledValues(now);
    this.omGain.gain.setValueAtTime(this.omGain.gain.value, now);

    this.tanpuraGain.gain.cancelScheduledValues(now);
    this.tanpuraGain.gain.setValueAtTime(this.tanpuraGain.gain.value, now);

    if (mode === 'mute') {
      this.omGain.gain.linearRampToValueAtTime(0, now + fade);
      this.tanpuraGain.gain.linearRampToValueAtTime(0, now + fade);
      this.isRunning = false;
    } else if (mode === 'om-136') {
      this.omGain.gain.linearRampToValueAtTime(0.9, now + fade);
      this.tanpuraGain.gain.linearRampToValueAtTime(0, now + fade);
      this.isRunning = true;
    } else if (mode === 'om-tanpura') {
      this.omGain.gain.linearRampToValueAtTime(0.75, now + fade);
      this.tanpuraGain.gain.linearRampToValueAtTime(0.65, now + fade);
      this.isRunning = true;
      this.pluckTanpuraString(136.10 * 1.5);
    } else if (mode === 'singing-bowl') {
      this.omGain.gain.linearRampToValueAtTime(0.25, now + fade);
      this.tanpuraGain.gain.linearRampToValueAtTime(0, now + fade);
      this.playSingingBowl(272.2);
      this.isRunning = true;
    }

    this.notifyState();
  }

  /**
   * Play specific sacred seed sound for mantra selection
   */
  public async setMantraMode(mantra: MantraMode): Promise<void> {
    await this.init();
    this.currentMantra = mantra;

    // If currently muted, unmute into om-136 automatically so sound is heard!
    if (this.currentMode === 'mute') {
      await this.setMode('om-136');
    }

    if (!this.ctx) return;

    if (mantra === 'om') {
      // Deep 136.10 Hz cosmic resonant wave
      this.playChime(136.10, 'sine', 0.5, 4.0);
    } else if (mantra === 'shreem') {
      // Golden 432 Hz Lakshmi seed frequency + Tibetan bell
      this.playSingingBowl(432.0);
      this.playChime(216.0, 'triangle', 0.45, 3.5);
    } else if (mantra === 'sri-matre') {
      // Sri Vidya Maha Mantra sacred 528 Hz chord
      this.playSingingBowl(528.0);
      this.playChime(264.0, 'sine', 0.5, 5.0);
      this.pluckTanpuraString(136.10 * 2);
    }

    this.notifyState();
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

  /**
   * Authentic Vocal OM Synthesizer (Human Formant Filtering & Multi-Harmonic Chorus)
   */
  private setupVocalOmSynthesizer(): void {
    if (!this.ctx || !this.omGain) return;

    const FUNDAMENTAL = 136.10; // Cosmic Octave (Earth Year C#3)

    // Vocal Tract Formant Filter 1 (F1: Throat & Chest Resonance ~450-600 Hz)
    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(500, this.ctx.currentTime);
    f1.Q.setValueAtTime(3.8, this.ctx.currentTime);

    // Vocal Tract Formant Filter 2 (F2: Mouth Cavity "O-M" Transition ~850-1100 Hz)
    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(920, this.ctx.currentTime);
    f2.Q.setValueAtTime(4.5, this.ctx.currentTime);

    // Vocal Tract Formant Filter 3 (F3: Cranial Ringing Singer's Formant ~2200-2600 Hz)
    const f3 = this.ctx.createBiquadFilter();
    f3.type = 'bandpass';
    f3.frequency.setValueAtTime(2400, this.ctx.currentTime);
    f3.Q.setValueAtTime(6.0, this.ctx.currentTime);

    // Deep Sub-Bass Filter (Vocal chest cavity foundation)
    const warmSub = this.ctx.createBiquadFilter();
    warmSub.type = 'lowpass';
    warmSub.frequency.setValueAtTime(340, this.ctx.currentTime);
    warmSub.Q.setValueAtTime(1.8, this.ctx.currentTime);

    // Connect all formant branches in parallel to omGain
    f1.connect(this.omGain);
    f2.connect(this.omGain);
    f3.connect(this.omGain);
    warmSub.connect(this.omGain);

    // Multi-voice Chorused Oscillators (Simulating human choir chanting)
    // 1. Warm Sawtooth (rich in all integer harmonics for vocal cords) with gentle micro-detuning
    this.createOsc(FUNDAMENTAL, 'sawtooth', 0.26, f1);
    this.createOsc(FUNDAMENTAL + 0.25, 'sawtooth', 0.20, f1);
    this.createOsc(FUNDAMENTAL - 0.25, 'sawtooth', 0.18, f2);
    this.createOsc(FUNDAMENTAL, 'sawtooth', 0.12, f3);

    // 2. Fundamental Warm Sine
    this.createOsc(FUNDAMENTAL, 'sine', 0.50, warmSub);
    this.createOsc(FUNDAMENTAL + 0.15, 'sine', 0.35, warmSub);

    // 3. Deep Sub-Harmonic (68.05 Hz - Chest rumble)
    this.createOsc(FUNDAMENTAL / 2, 'sine', 0.45, warmSub);

    // 4. Perfect Fifth (204.15 Hz - Pancham overtone)
    this.createOsc(FUNDAMENTAL * 1.5, 'triangle', 0.24, f1);

    // 5. Octave (272.20 Hz)
    this.createOsc(FUNDAMENTAL * 2.0, 'sine', 0.18, f2);

    // Slow 16-Second Breathing Modulation simulating the "Aaaaa-Uuuuu-Mmmmm" vocal morph
    this.vocalLfo = this.ctx.createOscillator();
    const lfoGain1 = this.ctx.createGain();
    const lfoGain2 = this.ctx.createGain();

    this.vocalLfo.frequency.setValueAtTime(1 / 16, this.ctx.currentTime); // 16s cycle
    lfoGain1.gain.setValueAtTime(140, this.ctx.currentTime);
    lfoGain2.gain.setValueAtTime(220, this.ctx.currentTime);

    this.vocalLfo.connect(lfoGain1);
    this.vocalLfo.connect(lfoGain2);

    lfoGain1.connect(f1.frequency);
    lfoGain2.connect(f2.frequency);

    this.vocalLfo.start();
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
   * Procedural Tanpura (4-string sequence: Pa - Sa - Sa - Sa)
   */
  private setupTanpuraScheduler(): void {
    const freqs = [
      136.10 * 1.5, // Pa (204.15 Hz)
      136.10 * 2.0, // Sa (272.20 Hz)
      136.10 * 2.0, // Sa (272.20 Hz)
      136.10 * 1.0, // Kharaj Sa (136.10 Hz)
    ];

    let stringIndex = 0;
    const pluckInterval = 2800;

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

    // Natural plucked string amplitude envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.30, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 5.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.tanpuraGain);

    osc.start(now);
    osc.stop(now + 5.6);
  }

  /**
   * Tibetan Singing Bowl Bell (FM Synthesis with long resonant chime)
   */
  public playSingingBowl(fundamental: number = 272.2): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const carrier = this.ctx.createOscillator();
    const carrierGain = this.ctx.createGain();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(fundamental, now);

    mod.type = 'sine';
    mod.frequency.setValueAtTime(fundamental * 2.76, now);
    modGain.gain.setValueAtTime(fundamental * 0.40, now);
    modGain.gain.exponentialRampToValueAtTime(0.05, now + 5.0);

    mod.connect(carrier.frequency);

    // 8.5-second soothing exponential decay
    carrierGain.gain.setValueAtTime(0, now);
    carrierGain.gain.linearRampToValueAtTime(0.45, now + 0.08);
    carrierGain.gain.exponentialRampToValueAtTime(0.0001, now + 8.5);

    carrier.connect(carrierGain);
    carrierGain.connect(this.masterGain);

    mod.start(now);
    carrier.start(now);
    mod.stop(now + 8.6);
    carrier.stop(now + 8.6);
  }

  private playChime(freq: number, type: OscillatorType, maxGain: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(maxGain, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(g);
    g.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  public setBellInterval(minutes: number): void {
    if (this.bellIntervalId) {
      clearInterval(this.bellIntervalId);
      this.bellIntervalId = null;
    }

    if (minutes > 0) {
      this.bellIntervalId = window.setInterval(() => {
        this.playSingingBowl(272.2);
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
