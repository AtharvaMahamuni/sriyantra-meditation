export type AtmosphereId = 'galaxy' | 'divine-light' | 'quantum-atoms' | 'zen-void';

export type MantraMode = 'off' | 'om' | 'shreem' | 'sri-matre' | 'panchadasi';

export type SoundMode = 'om-136' | 'om-tanpura' | 'singing-bowl' | 'mute';

export type BreathingRhythm = 'tidal-16' | 'box-16' | 'relax-478' | 'static';

export type MotionStyle = 'alternating' | 'unified' | 'still';

export type PaletteId = 'cursor-gold' | 'amethyst-rose' | 'emerald-copper' | 'pure-platinum';

export interface VisualState {
  atmosphere: AtmosphereId;
  mantra: MantraMode;
  breathing: BreathingRhythm;
  motionStyle: MotionStyle;    // 'alternating' (layers counter-rotate, core clean), 'unified', 'still'
  palette: PaletteId;          // Color theme palette
  rotationSpeed: number;       // 0 to 3 (0 = still, 0.5 = gentle, 1 = normal, 2 = fast)
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
