import type { IVisualScene, VisualState } from '../../../types';
import { SriYantraGeometry } from '../SriYantraGeometry';

export class ZenVoidScene implements IVisualScene {
  public id = 'zen-void' as const;
  public name = 'Zen Void 3D';

  private width: number = 0;
  private height: number = 0;
  private time: number = 0;

  private targetTiltX: number = 0.12;
  private targetTiltY: number = 0.0;
  private currentTiltX: number = 0.12;
  private currentTiltY: number = 0.0;

  private readonly FOV = 550;

  public init(_ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.time = 0;
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  public onPointerMove(x: number, y: number): void {
    const normX = (x / this.width - 0.5) * 2;
    const normY = (y / this.height - 0.5) * 2;
    this.targetTiltX = normY * 0.14;
    this.targetTiltY = normX * 0.18;
  }

  public render(ctx: CanvasRenderingContext2D, delta: number, state: VisualState): void {
    const dt = Math.min(delta, 100) * 0.001;
    this.time += dt * 0.07 * state.rotationSpeed;

    this.currentTiltX += (this.targetTiltX - this.currentTiltX) * 0.035;
    this.currentTiltY += (this.targetTiltY - this.currentTiltY) * 0.035;

    const cx = this.width / 2;
    const isPortrait = this.height > this.width;
    const minDim = Math.min(this.width, this.height);
    // Lower plane anchor when tilted in 3D to ensure ample headroom at top
    const cy = this.height * (isPortrait ? 0.518 : 0.532) + Math.sin(Math.max(0, this.currentTiltX)) * 26;
    // Scaled safely so Bhupura corners never clip in full screen or at extreme 3D tilts
    const yantraRadius = isPortrait ? minDim * 0.35 : minDim * 0.205;

    // 1. OLED True Black Canvas (100% #000000 in Fullscreen)
    if (state.isFullScreen) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      const vignette = ctx.createRadialGradient(cx, cy, minDim * 0.2, cx, cy, minDim * 0.85);
      vignette.addColorStop(0, '#0c0a08');
      vignette.addColorStop(1, '#000000');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 2. Subtle Living Breath
    let breathScale = 1.0;
    if (state.breathing !== 'static') {
      const breathProgress = (Math.sin((this.time * Math.PI * 2) / 16 - Math.PI / 2) + 1) / 2;
      breathScale = 0.985 + 0.025 * breathProgress;
    }

    // 3. Render 3D Sri Yantra
    SriYantraGeometry.render3D(ctx, cx, cy, yantraRadius, {
      time: this.time,
      pitch: this.currentTiltX,
      yaw: this.currentTiltY,
      fov: this.FOV,
      scale: breathScale,
      speed: state.rotationSpeed,
      depth3D: state.depth3D ?? 0.85,
      motionStyle: state.motionStyle ?? 'alternating',
      paletteId: state.palette ?? 'cursor-gold',
      showYantra: state.showYantra ?? true,
      highlightAvarana: state.highlightAvarana,
      glowIntensity: state.glowIntensity * 0.95,
    });
  }

  public destroy(): void {}
}
