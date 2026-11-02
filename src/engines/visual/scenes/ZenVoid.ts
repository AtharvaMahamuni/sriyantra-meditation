import type { IVisualScene, VisualState } from '../../../types';
import { SriYantraGeometry } from '../SriYantraGeometry';

export class ZenVoidScene implements IVisualScene {
  public id = 'zen-void' as const;
  public name = 'Zen Void 3D';

  private width: number = 0;
  private height: number = 0;
  private time: number = 0;

  private targetTiltX: number = 0.2;
  private targetTiltY: number = 0.0;
  private currentTiltX: number = 0.2;
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
    this.targetTiltX = normY * 0.45;
    this.targetTiltY = normX * 0.55;
  }

  public render(ctx: CanvasRenderingContext2D, delta: number, state: VisualState): void {
    const dt = Math.min(delta, 100) * 0.001;
    this.time += dt * 0.15 * state.rotationSpeed;

    this.currentTiltX += (this.targetTiltX - this.currentTiltX) * 0.06;
    this.currentTiltY += (this.targetTiltY - this.currentTiltY) * 0.06;

    const cx = this.width / 2;
    const cy = this.height / 2;
    const minDim = Math.min(this.width, this.height);
    const yantraRadius = minDim * 0.42;

    // 1. Pure Obsidian Deep Void with Subtle Vignette
    const vignette = ctx.createRadialGradient(cx, cy, minDim * 0.2, cx, cy, minDim * 0.85);
    vignette.addColorStop(0, '#131210');
    vignette.addColorStop(1, '#080806');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Breathing Scale
    let breathScale = 1.0;
    if (state.breathing !== 'static') {
      const breathProgress = (Math.sin((this.time * Math.PI * 2) / 16 - Math.PI / 2) + 1) / 2;
      breathScale = 0.97 + 0.04 * breathProgress;
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
      highlightAvarana: state.highlightAvarana,
      glowIntensity: state.glowIntensity * 0.95,
    });
  }

  public destroy(): void {}
}
