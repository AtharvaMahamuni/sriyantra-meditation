import type { IVisualScene, VisualState } from '../../../types';
import { SriYantraGeometry } from '../SriYantraGeometry';

interface OrbitalElectron {
  trackRadiusRatio: number;
  angle: number;
  speed: number;
  size: number;
  trail: { x: number; y: number; alpha: number }[];
  color: string;
}

export class QuantumAtomsScene implements IVisualScene {
  public id = 'quantum-atoms' as const;
  public name = 'Quantum Atoms';

  private width: number = 0;
  private height: number = 0;
  private electrons: OrbitalElectron[] = [];
  private time: number = 0;
  private rotationAngle: number = 0;

  public init(_ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.time = 0;
    this.rotationAngle = 0;
    this.spawnElectrons();
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.spawnElectrons();
  }

  public render(ctx: CanvasRenderingContext2D, delta: number, state: VisualState): void {
    const dt = Math.min(delta, 100) * 0.001;
    this.time += dt * 0.1;
    this.rotationAngle += dt * 0.02 * state.rotationSpeed;

    const cx = this.width / 2;
    const cy = this.height / 2;
    const minDim = Math.min(this.width, this.height);
    const yantraRadius = minDim * 0.40;

    // 1. Dark Quantum Vacuum
    ctx.fillStyle = '#0f0e0c';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Faint Quantum Orbital Rings in Background
    ctx.save();
    ctx.translate(cx, cy);
    const ringRadii = [0.46, 0.62, 0.82, 0.98];
    for (let i = 0; i < ringRadii.length; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, yantraRadius * ringRadii[i], 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(200, 149, 71, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    // 3. Render Orbital Electrons & Trails
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < this.electrons.length; i++) {
      const el = this.electrons[i];
      el.angle += el.speed * dt * state.rotationSpeed;
      const r = yantraRadius * el.trackRadiusRatio;
      const ex = Math.cos(el.angle) * r;
      const ey = Math.sin(el.angle) * r;

      // Update trail
      el.trail.unshift({ x: ex, y: ey, alpha: 1.0 });
      if (el.trail.length > 14) el.trail.pop();

      // Draw Trail
      ctx.beginPath();
      for (let t = 0; t < el.trail.length; t++) {
        const pt = el.trail[t];
        const tAlpha = (1 - t / el.trail.length) * 0.45;
        ctx.strokeStyle = `rgba(245, 120, 40, ${tAlpha})`;
        ctx.lineWidth = Math.max(0.6, el.size * (1 - t / el.trail.length));
        if (t === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Draw particle head
      ctx.beginPath();
      ctx.arc(ex, ey, el.size, 0, Math.PI * 2);
      ctx.fillStyle = el.color;
      ctx.shadowColor = el.color;
      ctx.shadowBlur = 8;
      ctx.fill();
    }
    ctx.restore();

    // 4. Breathing Rhythm
    let breathScale = 1.0;
    if (state.breathing !== 'static') {
      const breathPeriod = 16.0;
      const breathProgress = (Math.sin((this.time * Math.PI * 2) / breathPeriod - Math.PI / 2) + 1) / 2;
      breathScale = 0.965 + 0.05 * breathProgress;
    }

    // 5. Render Geometry
    SriYantraGeometry.render(ctx, cx, cy, yantraRadius, {
      rotation: this.rotationAngle,
      petalCounterRotation: state.counterRotatePetals ? -this.rotationAngle * 0.6 : 0,
      scale: breathScale,
      highlightAvarana: state.highlightAvarana,
      glowIntensity: state.glowIntensity,
      baseColor: '#c89547',
      shivaColor: '#e88c38',
      shaktiColor: '#d46820',
    });
  }

  private spawnElectrons(): void {
    this.electrons = [];
    const tracks = [0.25, 0.46, 0.62, 0.82, 0.98, 1.05];
    for (let i = 0; i < 24; i++) {
      const track = tracks[i % tracks.length];
      const direction = i % 2 === 0 ? 1 : -1;
      this.electrons.push({
        trackRadiusRatio: track,
        angle: Math.random() * Math.PI * 2,
        speed: (0.35 + Math.random() * 0.4) * direction,
        size: Math.random() * 1.5 + 1.2,
        trail: [],
        color: i % 3 === 0 ? '#ff8c3b' : i % 3 === 1 ? '#dfa88f' : '#ffffff',
      });
    }
  }

  public destroy(): void {
    this.electrons = [];
  }
}
