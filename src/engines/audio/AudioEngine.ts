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
  private mantraLoopTimerId: number | null = null;

  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private activeMantraSource: AudioBufferSourceNode | null = null;

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

      // Master Dynamics Compressor to prevent clipping
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

      // Channel: OM Synthesizer Drone
      this.omGain = this.ctx.createGain();
      this.omGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.omGain.connect(this.masterGain);

      // Channel: Tanpura Strings
      this.tanpuraGain = this.ctx.createGain();
      this.tanpuraGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.tanpuraGain.connect(this.masterGain);

      // Channel: Mantra Vocal Chanting (High Priority)
      this.mantraGain = this.ctx.createGain();
      this.mantraGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.mantraGain.connect(this.masterGain);

      this.setupVocalOmSynthesizer();
      this.setupTanpuraScheduler();

      // Preload vocal chanting audio files
      this.preloadMantraAudio();
    }

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('[SriYantra] AudioContext resume failed:', err);
      }
    }
  }

  /**
   * Preload authentic vocal chanting audio files into Web Audio Buffers
   */
  private async preloadMantraAudio(): Promise<void> {
    if (!this.ctx) return;
    const files = [
      { id: 'om', url: '/audio/om.mp3' },
      { id: 'shreem', url: '/audio/shreem.mp3' },
      { id: 'sri-matre', url: '/audio/sri-matre.mp3' },
    ];

    for (const f of files) {
      try {
        const resp = await fetch(f.url);
        if (resp.ok) {
          const ab = await resp.arrayBuffer();
          const decoded = await this.ctx.decodeAudioData(ab);
          this.audioBuffers.set(f.id, decoded);
        }
      } catch (err) {
        console.warn(`[SriYantra Audio] Could not preload ${f.id} audio:`, err);
      }
    }
  }

  public async setMode(mode: SoundMode): Promise<void> {
    await this.init();
    if (!this.ctx || !this.omGain || !this.tanpuraGain || !this.mantraGain) return;

    this.currentMode = mode;
    const now = this.ctx.currentTime;
    const fade = 0.8;

    // Anchor scheduled values to prevent Web Audio exceptions
    this.omGain.gain.cancelScheduledValues(now);
    this.omGain.gain.setValueAtTime(this.omGain.gain.value, now);

    this.tanpuraGain.gain.cancelScheduledValues(now);
    this.tanpuraGain.gain.setValueAtTime(this.tanpuraGain.gain.value, now);

    this.mantraGain.gain.cancelScheduledValues(now);
    this.mantraGain.gain.setValueAtTime(this.mantraGain.gain.value, now);

    if (mode === 'mute') {
      this.omGain.gain.linearRampToValueAtTime(0, now + fade);
      this.tanpuraGain.gain.linearRampToValueAtTime(0, now + fade);
      this.mantraGain.gain.linearRampToValueAtTime(0, now + fade);
      this.stopMantraLoop();
      this.isRunning = false;
    } else {
      this.isRunning = true;
      this.mantraGain.gain.linearRampToValueAtTime(1.0, now + fade);

      if (mode === 'om-136') {
        // If current mantra is Shreem or Sri Matre, don't let OM drown it out
        const omLevel = (this.currentMantra === 'shreem' || this.currentMantra === 'sri-matre') ? 0.20 : 0.85;
        this.omGain.gain.linearRampToValueAtTime(omLevel, now + fade);
        this.tanpuraGain.gain.linearRampToValueAtTime(0, now + fade);
      } else if (mode === 'om-tanpura') {
        const omLevel = (this.currentMantra === 'shreem' || this.currentMantra === 'sri-matre') ? 0.15 : 0.65;
        this.omGain.gain.linearRampToValueAtTime(omLevel, now + fade);
        this.tanpuraGain.gain.linearRampToValueAtTime(0.65, now + fade);
        this.pluckTanpuraString(136.10 * 1.5);
      } else if (mode === 'singing-bowl') {
        this.omGain.gain.linearRampToValueAtTime(0.15, now + fade);
        this.tanpuraGain.gain.linearRampToValueAtTime(0, now + fade);
        this.playSingingBowl(272.2);
      }

      // Resume chanting loop for currently active mantra
      if (this.currentMantra !== 'off') {
        this.startMantraLoop(this.currentMantra);
      }
    }

    this.notifyState();
  }

  /**
   * Play specific sacred vocal chanting and adjust acoustic levels
   */
  public async setMantraMode(mantra: MantraMode): Promise<void> {
    await this.init();
    this.currentMantra = mantra;

    // Automatically unmute if user chooses a mantra so they hear it immediately!
    if (this.currentMode === 'mute') {
      await this.setMode('om-136');
      return;
    }

    if (!this.ctx || !this.omGain) return;
    const now = this.ctx.currentTime;

    // Adjust OM drone volume based on selected mantra
    this.omGain.gain.cancelScheduledValues(now);
    this.omGain.gain.setValueAtTime(this.omGain.gain.value, now);

    if (mantra === 'om') {
      // Restore full OM formant drone
      this.omGain.gain.linearRampToValueAtTime(0.85, now + 0.6);
      this.playChime(136.10, 'sine', 0.45, 4.0);
    } else if (mantra === 'shreem') {
      // Lower OM drone to 0.18 so it doesn't drown out the Shreem voice!
      this.omGain.gain.linearRampToValueAtTime(0.18, now + 0.6);
      this.playSingingBowl(432.0); // Golden Lakshmi Frequency Chime
    } else if (mantra === 'sri-matre') {
      // Lower OM drone to 0.18 so the Mahamantra chanting voice is crystal clear!
      this.omGain.gain.linearRampToValueAtTime(0.18, now + 0.6);
      this.playSingingBowl(528.0); // Transformation 528 Hz Chime
      this.pluckTanpuraString(136.10 * 2);
    } else if (mantra === 'off') {
      this.omGain.gain.linearRampToValueAtTime(0.40, now + 0.6);
      this.stopMantraLoop();
    }

    // Start immediate vocal chanting and cyclical breathing loop
    if (mantra !== 'off') {
      this.startMantraLoop(mantra);
    }

    this.notifyState();
  }

  /**
   * Play the authentic vocal chanting audio file for the mantra
   */
  public playMantraVoice(mantra: MantraMode): void {
    if (!this.ctx || !this.mantraGain || this.currentMode === 'mute' || mantra === 'off') return;

    // Stop previous vocal playback
    if (this.activeMantraSource) {
      try {
        this.activeMantraSource.stop();
        this.activeMantraSource.disconnect();
      } catch (_) {}
      this.activeMantraSource = null;
    }

    const buffer = this.audioBuffers.get(mantra);
    if (buffer) {
      const now = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;

      // Vocal warmth filter
      const warmth = this.ctx.createBiquadFilter();
      warmth.type = 'lowshelf';
      warmth.frequency.setValueAtTime(320, now);
      warmth.gain.setValueAtTime(3.5, now);

      src.connect(warmth);
      warmth.connect(this.mantraGain);

      src.start(now);
      this.activeMantraSource = src;
    } else {
      // Fallback: Web Speech API synthesis with deep resonant voice
      this.speechSynthesisFallback(mantra);
    }
  }

  /**
   * Cyclic mantra looper (chants on 12s - 16s breathing cycles)
   */
  private startMantraLoop(mantra: MantraMode): void {
    this.stopMantraLoop();
    if (mantra === 'off' || this.currentMode === 'mute') return;

    // Immediate playback on click
    this.playMantraVoice(mantra);

    // Loop interval based on mantra length
    const intervalMs = mantra === 'sri-matre' ? 14000 : 10000;
    this.mantraLoopTimerId = window.setInterval(() => {
      if (this.currentMode !== 'mute' && this.currentMantra === mantra) {
        this.playMantraVoice(mantra);
      }
    }, intervalMs);
  }

  private stopMantraLoop(): void {
    if (this.mantraLoopTimerId) {
      clearInterval(this.mantraLoopTimerId);
      this.mantraLoopTimerId = null;
    }
    if (this.activeMantraSource) {
      try {
        this.activeMantraSource.stop();
        this.activeMantraSource.disconnect();
      } catch (_) {}
      this.activeMantraSource = null;
    }
  }

  /**
   * Browser Web Speech Synthesis Fallback (guarantees voice sound if audio buffers haven't loaded)
   */
  private speechSynthesisFallback(mantra: MantraMode): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    let text = '';
    if (mantra === 'om') text = 'ॐ... ॐ...';
    else if (mantra === 'shreem') text = 'श्रीं... ॐ श्रीं महालक्ष्म्यै नमः';
    else if (mantra === 'sri-matre') text = 'ॐ ऐं ह्रीं श्रीं श्री मात्रे नमः';
    else return;

    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.75;  // Slow, serene cadence
      utter.pitch = 0.85; // Deep resonant vocal pitch
      utter.volume = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN') || v.lang.includes('sa'));
      if (indianVoice) utter.voice = indianVoice;

      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.warn('[SriYantra Audio] Speech synthesis fallback error:', err);
    }
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
   * Multi-harmonic Vocal Formant Synthesizer
   */
  private setupVocalOmSynthesizer(): void {
    if (!this.ctx || !this.omGain) return;

    const FUNDAMENTAL = 136.10; // Cosmic Octave (Earth Year C#3)

    // Vocal Tract Formant Filter 1 (F1: Throat & Chest Resonance ~500 Hz)
    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(500, this.ctx.currentTime);
    f1.Q.setValueAtTime(3.8, this.ctx.currentTime);

    // Vocal Tract Formant Filter 2 (F2: Mouth Cavity "O-M" Transition ~920 Hz)
    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(920, this.ctx.currentTime);
    f2.Q.setValueAtTime(4.5, this.ctx.currentTime);

    // Vocal Tract Formant Filter 3 (F3: Cranial Ringing ~2400 Hz)
    const f3 = this.ctx.createBiquadFilter();
    f3.type = 'bandpass';
    f3.frequency.setValueAtTime(2400, this.ctx.currentTime);
    f3.Q.setValueAtTime(6.0, this.ctx.currentTime);

    // Deep Sub-Bass Filter
    const warmSub = this.ctx.createBiquadFilter();
    warmSub.type = 'lowpass';
    warmSub.frequency.setValueAtTime(340, this.ctx.currentTime);
    warmSub.Q.setValueAtTime(1.8, this.ctx.currentTime);

    f1.connect(this.omGain);
    f2.connect(this.omGain);
    f3.connect(this.omGain);
    warmSub.connect(this.omGain);

    // Chorused Oscillators
    this.createOsc(FUNDAMENTAL, 'sawtooth', 0.26, f1);
    this.createOsc(FUNDAMENTAL + 0.25, 'sawtooth', 0.20, f1);
    this.createOsc(FUNDAMENTAL - 0.25, 'sawtooth', 0.18, f2);
    this.createOsc(FUNDAMENTAL, 'sawtooth', 0.12, f3);

    this.createOsc(FUNDAMENTAL, 'sine', 0.50, warmSub);
    this.createOsc(FUNDAMENTAL + 0.15, 'sine', 0.35, warmSub);
    this.createOsc(FUNDAMENTAL / 2, 'sine', 0.45, warmSub);
    this.createOsc(FUNDAMENTAL * 1.5, 'triangle', 0.24, f1);
    this.createOsc(FUNDAMENTAL * 2.0, 'sine', 0.18, f2);

    // Slow 16-Second Breathing Modulation
    this.vocalLfo = this.ctx.createOscillator();
    const lfoGain1 = this.ctx.createGain();
    const lfoGain2 = this.ctx.createGain();

    this.vocalLfo.frequency.setValueAtTime(1 / 16, this.ctx.currentTime);
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
   * Tibetan Singing Bowl Bell
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
    this.stopMantraLoop();
    if (this.tanpuraTimerId) clearInterval(this.tanpuraTimerId);
    if (this.bellIntervalId) clearInterval(this.bellIntervalId);
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}
