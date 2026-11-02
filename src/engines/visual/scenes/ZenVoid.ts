import type { IVisualScene, VisualState } from '../../../types';
import { SriYantraGeometry } from '../SriYantraGeometry';

export class ZenVoidScene implements IVisualScene {
  public id = 'zen-void' as const;
  public name = 'Zen Void';

  private width: number = 0;
  private height: number = 0;
  private time: number = 0;
  private rotationAngle: number = 0;

  public init(_ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.time = 0;
    this.rotationAngle = 0;
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  public render(ctx: CanvasRenderingContext2D, delta: number, state: VisualState): void {
    const dt = Math.min(delta, 100) * 0.001;
    this.time += dt * 0.1;
    this.rotationAngle += dt * 0.015 * state.rotationSpeed;

    const cx = this.width / 2;
    const cy = this.height / 2;
    const minDim = Math.min(this.width, this.height);
    const yantraRadius = minDim * 0.40;

    // 1. Pure Obsidian Deep Void with Subtle Vignette
    const vignette = ctx.createRadialGradient(cx, cy, minDim * 0.2, cx, cy, minDim * 0.8);
    vignette.addColorStop(0, '#151412');
    vignette.addColorStop(1, '#0a0a08');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Breathing Scale
    let breathScale = 1.0;
    if (state.breathing !== 'static') {
      const breathPeriod = 16.0;
      const breathProgress = (Math.sin((this.time * Math.PI * 2) / breathPeriod - Math.PI / 2) + 1) / 2;
      breathScale = 0.97 + 0.04 * breathProgress;
    }

    // 3. Render High-Contrast Crisp Geometry
    SriYantraGeometry.render(ctx, cx, cy, yantraRadius, {
      rotation: this.rotationAngle,
      petalCounterRotation: state.counterRotatePetals ? -this.rotationAngle * 0.5 : 0,
      scale: breathScale,
      highlightAvarana: state.highlightAvarana,
      glowIntensity: state.glowIntensity * 0.85,
      baseColor: '#d4a259',
      shivaColor: '#f59038',
      shaktiColor: '#e06b20',
      lineWidth: 1.4,
    });
  }

  public destroy(): void {}
}
