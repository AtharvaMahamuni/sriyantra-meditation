import type { MotionStyle, PaletteId } from '../../types';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface PaletteColors {
  shiva: string;
  shakti: string;
  trikona: string;
  lotus8: string;
  lotus16: string;
  circles: string;
  bhupura: string;
  binduCore: string;
  binduGlow: string;
  lineGlow: string;
}

export const PALETTES: Record<PaletteId, PaletteColors> = {
  'cursor-gold': {
    shiva: '#ffb74d',      // Solar Radiant Gold
    shakti: '#f54e00',     // Cursor Brand Orange / Vermilion
    trikona: '#fff3d6',    // Incandescent Champagne Gold
    lotus8: '#dfa88f',     // Warm Peach / Rose Coral
    lotus16: '#e5b85e',    // Luminous Temple Gold
    circles: '#c89547',    // Antique Polished Amber
    bhupura: '#b38138',    // Deep Sacred Bronze
    binduCore: '#ffffff',  // Pure Star White
    binduGlow: 'rgba(245, 78, 0, 0.65)',
    lineGlow: 'rgba(245, 120, 40, 0.45)',
  },
  'amethyst-rose': {
    shiva: '#c48bfe',      // Radiant Cosmic Amethyst
    shakti: '#f06292',     // Sacred Rose Lotus
    trikona: '#f8edeb',    // Luminous Pearl White
    lotus8: '#d1a3f6',     // Soft Lilac
    lotus16: '#f48fb1',    // Rose Gold Shimmer
    circles: '#ab47bc',    // Violet Boundary
    bhupura: '#8e24aa',    // Deep Royal Purple
    binduCore: '#ffffff',  // Star White
    binduGlow: 'rgba(225, 112, 180, 0.7)',
    lineGlow: 'rgba(186, 104, 200, 0.45)',
  },
  'emerald-copper': {
    shiva: '#4dd0e1',      // Celestial Cyan Jade
    shakti: '#e67e22',     // Radiant Copper Fire
    trikona: '#e0f7fa',    // Luminous Crystal Mint
    lotus8: '#80cbc4',     // Soft Sage
    lotus16: '#f39c12',    // Polished Copper Ochre
    circles: '#00897b',    // Deep Malachite
    bhupura: '#c0392b',    // Antique Red Copper
    binduCore: '#ffffff',  // Diamond White
    binduGlow: 'rgba(0, 188, 212, 0.65)',
    lineGlow: 'rgba(230, 126, 34, 0.45)',
  },
  'pure-platinum': {
    shiva: '#ffffff',      // Pure Incandescent White
    shakti: '#e2e8f0',     // Cool Moonlight Silver
    trikona: '#ffffff',    // Brilliant Diamond
    lotus8: '#cbd5e1',     // Pearl
    lotus16: '#94a3b8',    // Slate Silver
    circles: '#64748b',    // Steel
    bhupura: '#475569',    // Deep Obsidian Chrome
    binduCore: '#ffffff',  // White
    binduGlow: 'rgba(255, 255, 255, 0.75)',
    lineGlow: 'rgba(200, 220, 255, 0.4)',
  },
};

export interface Render3DOptions {
  time?: number;
  pitch?: number;
  yaw?: number;
  fov?: number;
  scale?: number;
  speed?: number;
  depth3D?: number;
  motionStyle?: MotionStyle;
  paletteId?: PaletteId;
  highlightAvarana?: number | null;
  glowIntensity?: number;
  showYantra?: boolean;
}

export class SriYantraGeometry {
  /**
   * The Classical Authentic 9 Triangles (Gérard Huet Exact Mathematical Model)
   * All 9 triangles remain geometrically locked as a pristine constellation.
   */
  public static readonly TRIANGLES = [
    // 4 Upward Shiva Triangles (Ascending Consciousness / Masculine)
    { id: 'U1', isUpward: true,  halfW: 0.97016, baseY: 0.24247,  apexY: -1.00000, zLayer: 14 },
    { id: 'U2', isUpward: true,  halfW: 0.71735, baseY: 0.47923,  apexY: -0.71895, zLayer: 18 },
    { id: 'U3', isUpward: true,  halfW: 0.51282, baseY: 0.70038,  apexY: -0.26795, zLayer: 22 },
    { id: 'U4', isUpward: true,  halfW: 0.35051, baseY: 0.10660,  apexY: -0.46878, zLayer: 26 },

    // 5 Downward Shakti Triangles (Descending Creative Power / Feminine)
    { id: 'D1', isUpward: false, halfW: 0.96343, baseY: -0.26795, apexY: 1.00000,  zLayer: 14 },
    { id: 'D2', isUpward: false, halfW: 0.69016, baseY: -0.46878, apexY: 0.70038,  zLayer: 18 },
    { id: 'D3', isUpward: false, halfW: 0.59514, baseY: -0.71895, apexY: 0.10660,  zLayer: 22 },
    { id: 'D4', isUpward: false, halfW: 0.33649, baseY: -0.15692, apexY: 0.47923,  zLayer: 26 },
    { id: 'D5', isUpward: false, halfW: 0.25388, baseY: -0.05202, apexY: 0.24247,  zLayer: 32 }, // Central Trikona
  ];

  /**
   * 3D Perspective Projection Function
   */
  public static project(
    x: number,
    y: number,
    z: number,
    pitch: number,
    yaw: number,
    fov: number,
    cx: number,
    cy: number
  ): { x: number; y: number; z: number; scale: number } {
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);

    // 1. Yaw rotation (around Y axis)
    const rx1 = x * cosY + z * sinY;
    const rz1 = -x * sinY + z * cosY;

    // 2. Pitch rotation (around X axis)
    const ry2 = y * cosP - rz1 * sinP;
    const rz2 = y * sinP + rz1 * cosP;

    // 3. Perspective division
    const depth = rz2 + fov;
    const scale = depth > 10 ? fov / depth : fov / 10;

    return {
      x: cx + rx1 * scale,
      y: cy + ry2 * scale,
      z: rz2,
      scale,
    };
  }

  /**
   * Main 3D Render Function
   */
  public static render3D(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    baseRadius: number,
    opts: Render3DOptions = {}
  ): void {
    const {
      time = 0,
      pitch = 0,
      yaw = 0,
      fov = 550,
      scale = 1.0,
      speed = 1.0,
      depth3D = 1.0,
      motionStyle = 'alternating',
      paletteId = 'cursor-gold',
      highlightAvarana = null,
      glowIntensity = 1.0,
      showYantra = true,
    } = opts;

    if (!showYantra) {
      return;
    }

    const colors = PALETTES[paletteId] || PALETTES['cursor-gold'];
    const R = baseRadius * scale;
    const rTri = R * 0.44;
    const rInnerCircles = R * 0.47;
    const rLotus8 = R * 0.60;
    const rMidCircles = R * 0.64;
    const rLotus16 = R * 0.80;
    const rOuterCircles = R * 0.84;
    const rBhupuraInner = R * 0.93;
    const rBhupuraMid = R * 0.97;
    const rBhupuraOuter = R * 1.01;

    // Harmonious Rotations:
    // IMPORTANT: In ALL modes, the 9 core triangles rotate TOGETHER at angleCore
    // so the 43 triangles remain crystalline, razor-sharp, and NEVER tangled!
    const effectiveSpeed = motionStyle === 'still' ? 0 : speed;
    const t = time * effectiveSpeed;

    let angleBhupura = 0;
    let angleOuterCircles = 0;
    let angleLotus16 = 0;
    let angleMidCircles = 0;
    let angleLotus8 = 0;
    let angleInnerCircles = 0;
    let angleCore = 0; // The 9 triangles constellation

    if (motionStyle === 'alternating') {
      // Concentric circles & lotus counter-rotate in alternating harmony!
      angleBhupura = t * 0.06;          // Clockwise (Slow majestic)
      angleOuterCircles = -t * 0.10;     // Counter-Clockwise
      angleLotus16 = -t * 0.16;          // Counter-Clockwise
      angleMidCircles = t * 0.12;        // Clockwise
      angleLotus8 = t * 0.22;            // Clockwise
      angleInnerCircles = -t * 0.14;     // Counter-Clockwise
      angleCore = t * 0.10;              // Core 43-triangle constellation rotates gently
    } else if (motionStyle === 'unified') {
      // All layers rotate together
      angleBhupura = t * 0.12;
      angleOuterCircles = t * 0.12;
      angleLotus16 = t * 0.12;
      angleMidCircles = t * 0.12;
      angleLotus8 = t * 0.12;
      angleInnerCircles = t * 0.12;
      angleCore = t * 0.12;
    }

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // 1. Central Prana Volumetric Radial Glow in 3D
    const binduP = this.project(0, 0, 42 * depth3D, pitch, yaw, fov, cx, cy);
    if (glowIntensity > 0) {
      const glowR = R * 0.78 * binduP.scale;
      const grad = ctx.createRadialGradient(binduP.x, binduP.y, 2, binduP.x, binduP.y, glowR);
      grad.addColorStop(0, colors.binduGlow);
      grad.addColorStop(0.35, colors.lineGlow);
      grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.05)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(binduP.x, binduP.y, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. LAYER 1: The Bhupura (Outer Earth Citadel with 4 T-Gates)
    const isBhupuraActive = highlightAvarana === null || highlightAvarana === 1;
    if (isBhupuraActive) {
      const bColor = highlightAvarana === 1 ? '#ffffff' : colors.bhupura;
      const bZ = -38 * depth3D;
      ctx.strokeStyle = bColor;
      ctx.lineWidth = 1.25;
      ctx.shadowColor = colors.lineGlow;
      ctx.shadowBlur = 6 * glowIntensity;

      this.render3DBhupura(ctx, rBhupuraInner, bZ, angleBhupura, pitch, yaw, fov, cx, cy);
      this.render3DBhupura(ctx, rBhupuraMid, bZ + 2, angleBhupura, pitch, yaw, fov, cx, cy);
      this.render3DBhupura(ctx, rBhupuraOuter, bZ + 4, angleBhupura, pitch, yaw, fov, cx, cy);
    }

    // 3. LAYER 2: Outer Boundary Rings (3 Concentric Circles)
    ctx.strokeStyle = colors.circles;
    ctx.lineWidth = 1.0;
    const outerCirclesZ = -28 * depth3D;
    for (let i = 0; i < 3; i++) {
      this.render3DCircle(ctx, rOuterCircles + i * (R * 0.015), outerCirclesZ + i * 2, angleOuterCircles, pitch, yaw, fov, cx, cy);
    }

    // 4. LAYER 3: 16-Petal Lotus (Shodasha Dala Padma)
    const isLotus16Active = highlightAvarana === null || highlightAvarana === 2;
    if (isLotus16Active) {
      ctx.strokeStyle = highlightAvarana === 2 ? '#ffffff' : colors.lotus16;
      ctx.lineWidth = highlightAvarana === 2 ? 2.0 : 1.2;
      ctx.shadowColor = colors.lineGlow;
      ctx.shadowBlur = 8 * glowIntensity;
      this.render3DLotus(ctx, 16, rMidCircles * 1.01, rLotus16, -18 * depth3D, angleLotus16, pitch, yaw, fov, cx, cy);
    }

    // 5. LAYER 4: Middle Boundary Rings (3 Concentric Circles)
    ctx.strokeStyle = colors.circles;
    ctx.lineWidth = 0.95;
    const midCirclesZ = -8 * depth3D;
    for (let i = 0; i < 3; i++) {
      this.render3DCircle(ctx, rMidCircles + i * (R * 0.012), midCirclesZ + i * 2, angleMidCircles, pitch, yaw, fov, cx, cy);
    }

    // 6. LAYER 5: 8-Petal Lotus (Ashta Dala Padma)
    const isLotus8Active = highlightAvarana === null || highlightAvarana === 3;
    if (isLotus8Active) {
      ctx.strokeStyle = highlightAvarana === 3 ? '#ffffff' : colors.lotus8;
      ctx.lineWidth = highlightAvarana === 3 ? 2.2 : 1.35;
      ctx.shadowColor = colors.lineGlow;
      ctx.shadowBlur = 9 * glowIntensity;
      this.render3DLotus(ctx, 8, rInnerCircles * 1.01, rLotus8, 2 * depth3D, angleLotus8, pitch, yaw, fov, cx, cy);
    }

    // 7. LAYER 6: Inner Concentric Circles (Mekhala)
    ctx.strokeStyle = colors.circles;
    ctx.lineWidth = 1.0;
    const innerCirclesZ = 10 * depth3D;
    for (let i = 0; i < 3; i++) {
      this.render3DCircle(ctx, rInnerCircles + i * (R * 0.01), innerCirclesZ + i * 2, angleInnerCircles, pitch, yaw, fov, cx, cy);
    }

    // 8. LAYERS 7 & 8: The 9 Primary Interlocking Triangles
    // ALL 9 TRIANGLES ROTATE SYNCHRONOUSLY at angleCore so the 43 triangles are 100% PRISTINE!
    for (let i = 0; i < this.TRIANGLES.length; i++) {
      const tri = this.TRIANGLES[i];
      const isCentral = tri.id === 'D5';
      const z = (tri.zLayer * 0.8) * depth3D;

      let strokeColor: string;
      if (isCentral) {
        strokeColor = colors.trikona;
      } else if (tri.isUpward) {
        strokeColor = colors.shiva;
      } else {
        strokeColor = colors.shakti;
      }

      let width = isCentral ? 1.7 : 1.35;

      if (highlightAvarana !== null) {
        if (highlightAvarana === 8 && isCentral) {
          strokeColor = '#ffffff';
          width = 2.4;
        } else if (highlightAvarana >= 4 && highlightAvarana <= 7) {
          width = 1.6;
        } else {
          strokeColor = 'rgba(200, 149, 71, 0.2)';
          width = 0.8;
        }
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.shadowColor = isCentral ? colors.binduGlow : colors.lineGlow;
      ctx.shadowBlur = (isCentral ? 12 : 7) * glowIntensity;

      // 3 Vertices of this triangle
      const apexPt = { x: 0, y: tri.apexY * rTri };
      const baseL = { x: -tri.halfW * rTri, y: tri.baseY * rTri };
      const baseR = { x: tri.halfW * rTri, y: tri.baseY * rTri };

      this.render3DPolygon(ctx, [apexPt, baseL, baseR], z, angleCore, pitch, yaw, fov, cx, cy);
    }

    // 9. LAYER 9: The Supreme Central Point (Bindu)
    const isBinduActive = highlightAvarana === null || highlightAvarana === 9;
    if (isBinduActive) {
      const bp = this.project(0, 0, 40 * depth3D, pitch, yaw, fov, cx, cy);
      const bRadius = R * (highlightAvarana === 9 ? 0.022 : 0.013) * bp.scale;

      ctx.save();
      // Pulsing outer ripple rings
      const ringPulse = (Math.sin(time * 3) + 1) * 0.5;
      for (let r = 1; r <= 3; r++) {
        const ringR = bRadius * (1.6 + r * 1.6 + ringPulse * 0.7);
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 240, 200, ${0.4 / r})`;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }

      // Bindu Core Glow
      ctx.shadowColor = colors.binduGlow;
      ctx.shadowBlur = 18 * glowIntensity;
      ctx.fillStyle = colors.binduCore;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = colors.shakti;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Helper: Project and stroke a 3D polygon
   */
  private static render3DPolygon(
    ctx: CanvasRenderingContext2D,
    pts: { x: number; y: number }[],
    z: number,
    angle: number,
    pitch: number,
    yaw: number,
    fov: number,
    cx: number,
    cy: number
  ): void {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const rx = p.x * cosA - p.y * sinA;
      const ry = p.x * sinA + p.y * cosA;

      const proj = this.project(rx, ry, z, pitch, yaw, fov, cx, cy);
      if (i === 0) ctx.moveTo(proj.x, proj.y);
      else ctx.lineTo(proj.x, proj.y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  /**
   * Helper: Project and stroke a 3D circle with smooth perspective ellipse
   */
  private static render3DCircle(
    ctx: CanvasRenderingContext2D,
    radius: number,
    z: number,
    angle: number,
    pitch: number,
    yaw: number,
    fov: number,
    cx: number,
    cy: number
  ): void {
    const SAMPLES = 48;
    const step = (Math.PI * 2) / SAMPLES;

    ctx.beginPath();
    for (let i = 0; i <= SAMPLES; i++) {
      const a = i * step + angle;
      const px = Math.cos(a) * radius;
      const py = Math.sin(a) * radius;
      const proj = this.project(px, py, z, pitch, yaw, fov, cx, cy);
      if (i === 0) ctx.moveTo(proj.x, proj.y);
      else ctx.lineTo(proj.x, proj.y);
    }
    ctx.stroke();
  }

  /**
   * Helper: Project and render Lotus Petals in 3D
   */
  private static render3DLotus(
    ctx: CanvasRenderingContext2D,
    count: number,
    innerR: number,
    outerR: number,
    z: number,
    angle: number,
    pitch: number,
    yaw: number,
    fov: number,
    cx: number,
    cy: number
  ): void {
    const step = (Math.PI * 2) / count;
    const half = step / 2;

    for (let i = 0; i < count; i++) {
      const centerA = i * step + angle;
      const a1 = centerA - half;
      const a2 = centerA + half;

      const p1 = { x: Math.cos(a1) * innerR, y: Math.sin(a1) * innerR };
      const p2 = { x: Math.cos(a2) * innerR, y: Math.sin(a2) * innerR };
      const tip = { x: Math.cos(centerA) * outerR, y: Math.sin(centerA) * outerR };

      const pts: { x: number; y: number }[] = [];
      pts.push(p1);

      const ctrlR = innerR + (outerR - innerR) * 0.72;
      for (let t = 0.25; t <= 0.75; t += 0.25) {
        const ca = a1 + (centerA - a1) * t;
        const cr = innerR + (ctrlR - innerR) * Math.sin(t * Math.PI);
        pts.push({ x: Math.cos(ca) * cr, y: Math.sin(ca) * cr });
      }
      pts.push(tip);

      for (let t = 0.25; t <= 0.75; t += 0.25) {
        const ca = centerA + (a2 - centerA) * t;
        const cr = innerR + (ctrlR - innerR) * Math.sin((1 - t) * Math.PI);
        pts.push({ x: Math.cos(ca) * cr, y: Math.sin(ca) * cr });
      }
      pts.push(p2);

      ctx.beginPath();
      for (let k = 0; k < pts.length; k++) {
        const proj = this.project(pts[k].x, pts[k].y, z, pitch, yaw, fov, cx, cy);
        if (k === 0) ctx.moveTo(proj.x, proj.y);
        else ctx.lineTo(proj.x, proj.y);
      }
      ctx.stroke();

      // Petal subtle spine
      const midBase = { x: (p1.x + p2.x) * 0.5, y: (p1.y + p2.y) * 0.5 };
      const spineEnd = { x: tip.x * 0.88, y: tip.y * 0.88 };
      const pr1 = this.project(midBase.x, midBase.y, z, pitch, yaw, fov, cx, cy);
      const pr2 = this.project(spineEnd.x, spineEnd.y, z + 2, pitch, yaw, fov, cx, cy);
      ctx.beginPath();
      ctx.moveTo(pr1.x, pr1.y);
      ctx.lineTo(pr2.x, pr2.y);
      ctx.stroke();
    }
  }

  /**
   * Helper: Project and render the Bhupura (Square Earth Citadel with 4 T-Gates) in 3D
   */
  private static render3DBhupura(
    ctx: CanvasRenderingContext2D,
    radius: number,
    z: number,
    angle: number,
    pitch: number,
    yaw: number,
    fov: number,
    cx: number,
    cy: number
  ): void {
    const s = radius;
    const gateW = s * 0.32;
    const gateD = s * 0.085;
    const gateL = gateW * 0.42;

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    for (let side = 0; side < 4; side++) {
      const sideAngle = (side * Math.PI) / 2;
      const cosS = Math.cos(sideAngle);
      const sinS = Math.sin(sideAngle);

      const localPts = [
        { x: -s, y: -s },
        { x: -gateW * 0.5, y: -s },
        { x: -gateW * 0.5 - gateL, y: -s - gateD },
        { x: gateW * 0.5 + gateL, y: -s - gateD },
        { x: gateW * 0.5, y: -s },
        { x: s, y: -s },
      ];

      ctx.beginPath();
      for (let i = 0; i < localPts.length; i++) {
        const lp = localPts[i];
        const sx = lp.x * cosS - lp.y * sinS;
        const sy = lp.x * sinS + lp.y * cosS;

        const bx = sx * cosA - sy * sinA;
        const by = sx * sinA + sy * cosA;

        const proj = this.project(bx, by, z, pitch, yaw, fov, cx, cy);
        if (i === 0) ctx.moveTo(proj.x, proj.y);
        else ctx.lineTo(proj.x, proj.y);
      }
      ctx.stroke();
    }
  }
}
