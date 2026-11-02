import type { AtmosphereId, IVisualScene, VisualState, MantraMode, MotionStyle, PaletteId } from '../../types';
import { CosmicGalaxyScene } from './scenes/CosmicGalaxy';
import { DivineLightScene } from './scenes/DivineLight';
import { QuantumAtomsScene } from './scenes/QuantumAtoms';
import { ZenVoidScene } from './scenes/ZenVoid';

export class SceneManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scenes: Map<AtmosphereId, IVisualScene> = new Map();
  private activeScene: IVisualScene;

  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private isSuspended: boolean = false;

  private width: number = 0;
  private height: number = 0;
  private dpr: number = 1;

  public state: VisualState = {
    atmosphere: 'galaxy',
    mantra: 'om',
    breathing: 'tidal-16',
    motionStyle: 'alternating',
    palette: 'cursor-gold',
    rotationSpeed: 1.0,
    glowIntensity: 1.0,
    depth3D: 1.0,
    showYantra: true,
    highlightAvarana: null,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('[SriYantra] Unable to acquire 2D Canvas Context');
    }
    this.ctx = context;

    // Register Scenes
    this.scenes.set('galaxy', new CosmicGalaxyScene());
    this.scenes.set('divine-light', new DivineLightScene());
    this.scenes.set('quantum-atoms', new QuantumAtomsScene());
    this.scenes.set('zen-void', new ZenVoidScene());

    this.activeScene = this.scenes.get('galaxy')!;

    this.handleResize = this.handleResize.bind(this);
    this.loop = this.loop.bind(this);
    this.handleVisibility = this.handleVisibility.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);

    window.addEventListener('resize', this.handleResize, { passive: true });
    document.addEventListener('fullscreenchange', () => {
      this.handleResize();
      setTimeout(this.handleResize, 150);
    });
    document.addEventListener('visibilitychange', this.handleVisibility);
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true });

    this.handleResize();
    this.start();
  }

  public switchAtmosphere(id: AtmosphereId): void {
    const nextScene = this.scenes.get(id);
    if (!nextScene || nextScene === this.activeScene) return;

    this.state.atmosphere = id;
    this.activeScene = nextScene;
    this.activeScene.init(this.ctx, this.width, this.height, this.dpr);
  }

  public setMantra(mantra: MantraMode): void {
    this.state.mantra = mantra;
  }

  public setHighlightAvarana(avarana: number | null): void {
    this.state.highlightAvarana = avarana;
  }

  public setRotationSpeed(speed: number): void {
    this.state.rotationSpeed = speed;
  }

  public setMotionStyle(style: MotionStyle): void {
    this.state.motionStyle = style;
  }

  public setPalette(palette: PaletteId): void {
    this.state.palette = palette;
  }

  public setShowYantra(show: boolean): void {
    this.state.showYantra = show;
  }

  public toggleYantra(): boolean {
    this.state.showYantra = !this.state.showYantra;
    return this.state.showYantra;
  }

  public setDepth3D(depth: number): void {
    this.state.depth3D = depth;
  }

  private handleResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || window.innerWidth;
    this.height = rect.height || window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    this.ctx.resetTransform?.();
    this.ctx.scale(this.dpr, this.dpr);

    this.activeScene.resize(this.width, this.height, this.dpr);
  }

  private handlePointerMove(e: PointerEvent): void {
    if (this.activeScene.onPointerMove) {
      this.activeScene.onPointerMove(e.clientX, e.clientY);
    }
  }

  private handleVisibility(): void {
    if (document.hidden) {
      this.stop();
    } else {
      this.start();
    }
  }

  public start(): void {
    this.isSuspended = false;
    if (!this.animFrameId) {
      this.lastTime = performance.now();
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  }

  public stop(): void {
    this.isSuspended = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private loop(now: number): void {
    if (this.isSuspended) return;

    const delta = now - this.lastTime;
    this.lastTime = now;

    // Render Active Background Scene & Sri Yantra (Text moved to lateral side HUD)
    this.activeScene.render(this.ctx, delta, this.state);

    this.animFrameId = requestAnimationFrame(this.loop);
  }

  /**
   * Export high-resolution wallpaper (e.g. 4K 3840x2160 or 2560x1440)
   */
  public downloadWallpaper(): void {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 3840;
    exportCanvas.height = 2160;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    // Render frame at 4K resolution
    const tempScene = this.scenes.get(this.state.atmosphere)!;
    tempScene.init(exportCtx, 3840, 2160, 1);
    tempScene.render(exportCtx, 16, this.state);

    if (this.state.mantra !== 'off') {
      // Add subtle mantra on 4K render
      exportCtx.save();
      exportCtx.textAlign = 'center';
      exportCtx.textBaseline = 'middle';
      exportCtx.font = '400 96px var(--font-devanagari)';
      exportCtx.fillStyle = 'rgba(255, 240, 210, 0.9)';
      exportCtx.shadowColor = 'rgba(245, 120, 40, 0.8)';
      exportCtx.shadowBlur = 32;
      exportCtx.fillText(this.state.mantra === 'om' ? 'ॐ' : 'श्रीं', 1920, 1950);
      exportCtx.restore();
    }

    const link = document.createElement('a');
    link.download = `sri-yantra-4k-${this.state.atmosphere}-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }

  public destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    window.removeEventListener('pointermove', this.handlePointerMove);
    this.scenes.forEach(s => s.destroy());
    this.scenes.clear();
  }
}
