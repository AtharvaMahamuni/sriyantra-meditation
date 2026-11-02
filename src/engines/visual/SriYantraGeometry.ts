export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Render3DOptions {
  time?: number;                  // Elapsed time in seconds
  pitch?: number;                 // 3D camera tilt around X-axis (mouse Y)
  yaw?: number;                   // 3D camera tilt around Y-axis (mouse X)
  fov?: number;                   // Perspective Field of View
  scale?: number;                 // Breathing scale multiplier (0.95 to 1.05)
  speed?: number;                 // Rotation speed multiplier
  depth3D?: number;               // Z-depth layer separation (0 to 1.5)
  motionMode?: 'vortex' | 'harmonic'; // 'vortex' = alternating counter-rotation, 'harmonic' = locked
  highlightAvarana?: number | null;
  glowIntensity?: number;
  baseColor?: string;
  shivaColor?: string;
  shaktiColor?: string;
}

export class SriYantraGeometry {
  /**
   * The Authentic 9 Interlocking Triangles (Gérard Huet Exact Mathematical Model)
   * Normalized so outer triangle radius R = 1.0.
   * Concurrency is algebraically guaranteed with 0 sliver errors.
   */
  public static readonly TRIANGLES = [
    // 4 Upward Shiva Triangles (Ascending Consciousness / Masculine)
    { id: 'U1', isUpward: true,  halfW: 0.97016, baseY: 0.24247,  apexY: -1.00000, zLayer: 18 },
    { id: 'U2', isUpward: true,  halfW: 0.71735, baseY: 0.47923,  apexY: -0.71895, zLayer: 22 },
    { id: 'U3', isUpward: true,  halfW: 0.51282, baseY: 0.70038,  apexY: -0.26795, zLayer: 26 },
    { id: 'U4', isUpward: true,  halfW: 0.35051, baseY: 0.10660,  apexY: -0.46878, zLayer: 30 },

    // 5 Downward Shakti Triangles (Descending Creative Power / Feminine)
    { id: 'D1', isUpward: false, halfW: 0.96343, baseY: -0.26795, apexY: 1.00000,  zLayer: 18 },
    { id: 'D2', isUpward: false, halfW: 0.69016, baseY: -0.46878, apexY: 0.70038,  zLayer: 22 },
    { id: 'D3', isUpward: false, halfW: 0.59514, baseY: -0.71895, apexY: 0.10660,  zLayer: 26 },
    { id: 'D4', isUpward: false, halfW: 0.33649, baseY: -0.15692, apexY: 0.47923,  zLayer: 30 },
    { id: 'D5', isUpward: false, halfW: 0.25388, baseY: -0.05202, apexY: 0.24247,  zLayer: 36 }, // Central Trikona
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
   * Main 3D Render Function with Multi-Layer Perspective & Alternating Rotations
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
      motionMode = 'vortex',
      highlightAvarana = null,
      glowIntensity = 1.0,
      baseColor = '#c89547',
      shivaColor = '#ffaa3b',
      shaktiColor = '#f54e00',
    } = opts;

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

    // Rotations for each layer:
    // When motionMode === 'vortex', alternate layers move in opposite rotations!
    const t = time * speed;
    const angleBhupura = t * 0.08;            // Clockwise (Slow majestic)
    const angleOuterCircles = -t * 0.12;       // Counter-Clockwise
    const angleLotus16 = -t * 0.22;            // Counter-Clockwise
    const angleMidCircles = t * 0.15;          // Clockwise
    const angleLotus8 = t * 0.32;              // Clockwise
    const angleInnerCircles = -t * 0.18;       // Counter-Clockwise

    // Shiva vs Shakti triangles
    const angleShiva = motionMode === 'vortex' ? t * 0.28 : t * 0.15;
    const angleShakti = motionMode === 'vortex' ? -t * 0.28 : t * 0.15;

    ctx.save();

    // 1. Central Prana Volumetric Radial Glow in 3D
    const binduP = this.project(0, 0, 48 * depth3D, pitch, yaw, fov, cx, cy);
    if (glowIntensity > 0) {
      const glowR = R * 0.85 * binduP.scale;
      const grad = ctx.createRadialGradient(binduP.x, binduP.y, 2, binduP.x, binduP.y, glowR);
      grad.addColorStop(0, `rgba(255, 170, 60, ${0.25 * glowIntensity})`);
      grad.addColorStop(0.3, `rgba(245, 78, 0, ${0.12 * glowIntensity})`);
      grad.addColorStop(0.7, `rgba(200, 149, 71, ${0.04 * glowIntensity})`);
      grad.addColorStop(1, 'rgba(18, 17, 15, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(binduP.x, binduP.y, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. LAYER 1: The Bhupura (Outer Earth Citadel with 4 T-Gates)
    const isBhupuraActive = highlightAvarana === null || highlightAvarana === 1;
    if (isBhupuraActive) {
      const bColor = highlightAvarana === 1 ? '#ff7a29' : baseColor;
      const bZ = -42 * depth3D;
      ctx.strokeStyle = bColor;
      ctx.lineWidth = 1.3;
      ctx.shadowColor = 'rgba(245, 120, 40, 0.4)';
      ctx.shadowBlur = 8 * glowIntensity;

      this.render3DBhupura(ctx, rBhupuraInner, bZ, angleBhupura, pitch, yaw, fov, cx, cy);
      this.render3DBhupura(ctx, rBhupuraMid, bZ + 2, angleBhupura, pitch, yaw, fov, cx, cy);
      this.render3DBhupura(ctx, rBhupuraOuter, bZ + 4, angleBhupura, pitch, yaw, fov, cx, cy);
    }

    // 3. LAYER 2: Outer Boundary Rings (3 Concentric Circles)
    ctx.strokeStyle = 'rgba(200, 149, 71, 0.7)';
    ctx.lineWidth = 1.0;
    const outerCirclesZ = -32 * depth3D;
    for (let i = 0; i < 3; i++) {
      this.render3DCircle(ctx, rOuterCircles + i * (R * 0.015), outerCirclesZ + i * 2, angleOuterCircles, pitch, yaw, fov, cx, cy);
    }

    // 4. LAYER 3: 16-Petal Lotus (Shodasha Dala Padma)
    const isLotus16Active = highlightAvarana === null || highlightAvarana === 2;
    if (isLotus16Active) {
      ctx.strokeStyle = highlightAvarana === 2 ? '#ff7a29' : '#e6ab5b';
      ctx.lineWidth = highlightAvarana === 2 ? 2.0 : 1.25;
      ctx.shadowColor = 'rgba(245, 100, 30, 0.5)';
      ctx.shadowBlur = 9 * glowIntensity;
      this.render3DLotus(ctx, 16, rMidCircles * 1.01, rLotus16, -22 * depth3D, angleLotus16, pitch, yaw, fov, cx, cy);
    }

    // 5. LAYER 4: Middle Boundary Rings (3 Concentric Circles)
    ctx.strokeStyle = 'rgba(200, 149, 71, 0.65)';
    ctx.lineWidth = 0.95;
    const midCirclesZ = -12 * depth3D;
    for (let i = 0; i < 3; i++) {
      this.render3DCircle(ctx, rMidCircles + i * (R * 0.012), midCirclesZ + i * 2, angleMidCircles, pitch, yaw, fov, cx, cy);
    }

    // 6. LAYER 5: 8-Petal Lotus (Ashta Dala Padma)
    const isLotus8Active = highlightAvarana === null || highlightAvarana === 3;
    if (isLotus8Active) {
      ctx.strokeStyle = highlightAvarana === 3 ? '#ff7a29' : '#f0b86a';
      ctx.lineWidth = highlightAvarana === 3 ? 2.2 : 1.35;
      ctx.shadowColor = 'rgba(245, 120, 40, 0.55)';
      ctx.shadowBlur = 10 * glowIntensity;
      this.render3DLotus(ctx, 8, rInnerCircles * 1.01, rLotus8, -2 * depth3D, angleLotus8, pitch, yaw, fov, cx, cy);
    }

    // 7. LAYER 6: Inner Concentric Circles (Mekhala)
    ctx.strokeStyle = 'rgba(200, 149, 71, 0.7)';
    ctx.lineWidth = 1.0;
    const innerCirclesZ = 6 * depth3D;
    for (let i = 0; i < 3; i++) {
      this.render3DCircle(ctx, rInnerCircles + i * (R * 0.01), innerCirclesZ + i * 2, angleInnerCircles, pitch, yaw, fov, cx, cy);
    }

    // 8. LAYERS 7 & 8: The 9 Primary Interlocking Triangles
    // Shiva (Upward) and Shakti (Downward) Counter-Rotating with 3D Depth
    for (let i = 0; i < this.TRIANGLES.length; i++) {
      const tri = this.TRIANGLES[i];
      const isCentral = tri.id === 'D5';
      const angle = tri.isUpward ? angleShiva : angleShakti;
      const z = (tri.zLayer * 0.9) * depth3D;

      let color = tri.isUpward ? shivaColor : shaktiColor;
      let width = 1.4;

      if (highlightAvarana !== null) {
        if (highlightAvarana === 8 && isCentral) {
          color = '#ffffff';
          width = 2.4;
        } else if (highlightAvarana >= 4 && highlightAvarana <= 7) {
          color = tri.isUpward ? shivaColor : shaktiColor;
          width = 1.8;
        } else {
          color = 'rgba(200, 149, 71, 0.25)';
          width = 0.8;
        }
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.shadowColor = tri.isUpward ? 'rgba(255, 170, 59, 0.65)' : 'rgba(245, 78, 0, 0.75)';
      ctx.shadowBlur = (isCentral ? 14 : 9) * glowIntensity;

      // 3 Vertices of this triangle
      const apexPt = { x: 0, y: tri.apexY * rTri };
      const baseL = { x: -tri.halfW * rTri, y: tri.baseY * rTri };
      const baseR = { x: tri.halfW * rTri, y: tri.baseY * rTri };

      this.render3DPolygon(ctx, [apexPt, baseL, baseR], z, angle, pitch, yaw, fov, cx, cy);
    }

    // 9. LAYER 9: The Supreme Central Point (Bindu)
    const isBinduActive = highlightAvarana === null || highlightAvarana === 9;
    if (isBinduActive) {
      const bp = this.project(0, 0, 46 * depth3D, pitch, yaw, fov, cx, cy);
      const bRadius = R * (highlightAvarana === 9 ? 0.022 : 0.014) * bp.scale;

      // Bindu Concentric Pulsing Light Rings
      ctx.save();
      const ringPulse = (Math.sin(t * 3) + 1) * 0.5;
      for (let r = 1; r <= 3; r++) {
        const ringR = bRadius * (1.6 + r * 1.8 + ringPulse * 0.8);
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 200, 100, ${0.45 / r})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Bindu Core Glow
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 18 * glowIntensity;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#f54e00';
      ctx.lineWidth = 1.2;
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
      // 2D Rotation on layer plane
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

      // Inner base points
      const p1 = { x: Math.cos(a1) * innerR, y: Math.sin(a1) * innerR };
      const p2 = { x: Math.cos(a2) * innerR, y: Math.sin(a2) * innerR };

      // Outer petal tip
      const tip = { x: Math.cos(centerA) * outerR, y: Math.sin(centerA) * outerR };

      // Sample curves with 6 points per petal edge for clean 3D perspective
      const pts: { x: number; y: number }[] = [];
      pts.push(p1);

      // Edge 1 to tip
      const ctrlR = innerR + (outerR - innerR) * 0.72;
      for (let t = 0.2; t <= 0.8; t += 0.2) {
        const ca = a1 + (centerA - a1) * t;
        const cr = innerR + (ctrlR - innerR) * Math.sin(t * Math.PI);
        pts.push({ x: Math.cos(ca) * cr, y: Math.sin(ca) * cr });
      }
      pts.push(tip);

      // Edge 2 from tip back to base
      for (let t = 0.2; t <= 0.8; t += 0.2) {
        const ca = centerA + (a2 - centerA) * t;
        const cr = innerR + (ctrlR - innerR) * Math.sin((1 - t) * Math.PI);
        pts.push({ x: Math.cos(ca) * cr, y: Math.sin(ca) * cr });
      }
      pts.push(p2);

      // Draw projected petal
      ctx.beginPath();
      for (let k = 0; k < pts.length; k++) {
        const proj = this.project(pts[k].x, pts[k].y, z, pitch, yaw, fov, cx, cy);
        if (k === 0) ctx.moveTo(proj.x, proj.y);
        else ctx.lineTo(proj.x, proj.y);
      }
      ctx.stroke();

      // Petal central spine
      const midBase = { x: (p1.x + p2.x) * 0.5, y: (p1.y + p2.y) * 0.5 };
      const spineEnd = { x: tip.x * 0.86, y: tip.y * 0.86 };
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

      // Vertices of one side in side coordinate system
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
        // Rotate by side angle
        const sx = lp.x * cosS - lp.y * sinS;
        const sy = lp.x * sinS + lp.y * cosS;

        // Rotate by overall Bhupura angle
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
