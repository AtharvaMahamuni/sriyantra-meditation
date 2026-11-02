export type AtmosphereId = 'galaxy' | 'divine-light' | 'quantum-atoms' | 'zen-void';

export type MantraMode = 'off' | 'om' | 'shreem' | 'sri-matre' | 'panchadasi';

export type SoundMode = 'om-136' | 'om-tanpura' | 'singing-bowl' | 'mute';

export type BreathingRhythm = 'tidal-16' | 'box-16' | 'relax-478' | 'static';

export type MotionMode = 'vortex' | 'harmonic';

export interface VisualState {
  atmosphere: AtmosphereId;
  mantra: MantraMode;
  breathing: BreathingRhythm;
  motionMode: MotionMode;      // 'vortex' (alternating counter-rotation) or 'harmonic' (sacred alignment)
  rotationSpeed: number;       // 0 to 2 (1 = default gentle celestial)
  glowIntensity: number;       // 0.5 to 2.0
  depth3D: number;             // 0.0 to 1.5 (Z-depth separation between layers)
  highlightAvarana: number | null; // 1 to 9 or null for all
}

export interface SoundState {
  mode: SoundMode;
  masterVolume: number;        // 0 to 1
  bellIntervalMinutes: number; // 0 (off), 3, 5, 10, 15, 20
}

export interface IVisualScene {
  id: AtmosphereId;
  name: string;
  init(ctx: CanvasRenderingContext2D, width: number, height: number, dpr: number): void;
  resize(width: number, height: number, dpr: number): void;
  render(ctx: CanvasRenderingContext2D, deltaTime: number, visualState: VisualState): void;
  onPointerMove?(x: number, y: number): void;
  destroy(): void;
}
