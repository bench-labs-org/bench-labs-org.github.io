/* ==========================================================================
   3D LISSAJOUS KNOT & NEON TUBE ENGINE (Optimized for Bench Labs Hero)
   True 3D parametric geometry + multi-layered ribbon strokes + swirling echo
   ========================================================================== */

(() => {
  const canvas = document.getElementById('mainCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height, time = 0;
  let dpr = 1;
  let loopProgress = 0; // Continuous crawling window offset along the 3D loop

  // 3D Lissajous Knot (p=3, q=4, r=7) Parametric Generator
  // Generates 240 smooth points along a closed 3D orbit
  const p = 3, q = 4, r = 7;
  const deltaX = 0, deltaY = 0.785, deltaZ = 0;

  function rotate3D(pt, rx, ry, rz) {
    let { x, y, z } = pt;
    // X axis
    let y1 = y * Math.cos(rx) - z * Math.sin(rx);
    let z1 = y * Math.sin(rx) + z * Math.cos(rx);
    // Y axis
    let x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
    let z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
    // Z axis
    let x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz);
    let y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz);
    return { x: x3, y: y3, z: z2 };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize);
  resize();

  // Helper to interpolate a point at fractional progress [0, 1] on a closed loop
  function getInterpolatedPoint(points, prog) {
    if (points.length === 0) return { x: 0, y: 0, z: 0 };
    prog = ((prog % 1) + 1) % 1;
    const N = points.length - 1;
    const idx = prog * N;
    const i = Math.floor(idx);
    const f = idx - i;
    const p1 = points[i];
    const p2 = points[i + 1] || points[0];
    return {
      x: p1.x + (p2.x - p1.x) * f,
      y: p1.y + (p2.y - p1.y) * f,
      z: p1.z + (p2.z - p1.z) * f
    };
  }

  // Helper to extract a sliding window segment along a closed 3D loop
  function getSlidingWindow(points, progress, windowFraction) {
    const subPoints = [];
    const numSamples = 130;
    const startProgress = progress - windowFraction;
    const endProgress = progress;

    for (let i = 0; i <= numSamples; i++) {
      const prog = startProgress + (endProgress - startProgress) * (i / numSamples);
      const pt = getInterpolatedPoint(points, prog);
      subPoints.push(pt);
    }
    return subPoints;
  }

  function drawRibbonPath(points, strokeStyle, lineWidth, blur = 0) {
    if (points.length < 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) * 0.5;
      const yc = (points[i].y + points[i + 1].y) * 0.5;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    if (points.length > 2) {
      ctx.quadraticCurveTo(
        points[points.length - 2].x,
        points[points.length - 2].y,
        points[points.length - 1].x,
        points[points.length - 1].y
      );
    }

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (blur > 0) {
      ctx.shadowBlur = blur;
      ctx.shadowColor = strokeStyle;
    }

    ctx.stroke();
    ctx.restore();
  }

  function drawTube(currentPoints) {
    if (currentPoints.length < 2) return;

    // 1. Outer Blue Glow (lowered opacity: 0.18)
    drawRibbonPath(currentPoints, 'rgba(60, 130, 230, 0.18)', 28, 30);

    // 2. Cyan Main Body
    drawRibbonPath(currentPoints, 'rgba(140, 220, 255, 0.75)', 12, 15);

    // 3. Bright Core Strand
    drawRibbonPath(currentPoints, 'rgba(240, 253, 255, 0.95)', 4, 8);

    // 4. Swirling Accent Echo Lines
    const echoPoints1 = currentPoints.map((p, i) => ({
      x: p.x + Math.sin(time * 3 + i * 0.15) * 12,
      y: p.y + Math.cos(time * 3 + i * 0.15) * 8
    }));
    drawRibbonPath(echoPoints1, 'rgba(255, 210, 190, 0.5)', 2.5, 5);

    const echoPoints2 = currentPoints.map((p, i) => ({
      x: p.x - Math.cos(time * 2.5 + i * 0.15) * 14,
      y: p.y - Math.sin(time * 2.5 + i * 0.15) * 10
    }));
    drawRibbonPath(echoPoints2, 'rgba(130, 200, 255, 0.4)', 3, 10);
  }

  function animate() {
    time += 0.012;
    loopProgress += 0.0018;
    if (loopProgress >= 1) loopProgress -= 1;

    ctx.clearRect(0, 0, width, height);

    const centerX = width * 0.5;
    const centerY = height * 0.52;
    const floatOffset = Math.sin(time * 1.5) * 10;

    // Scale dynamically based on viewport dimensions
    const maxDimension = Math.max(width, height);
    const knotScale = (maxDimension * 1.35) / 200;

    // Generate base 3D Lissajous points
    const basePoints = [];
    const steps = 240;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const pt3D = {
        x: Math.sin(p * t + deltaX) * 90,
        y: Math.sin(q * t + deltaY) * 90,
        z: Math.sin(r * t + deltaZ) * 90
      };

      // Gentle 3D rotation in space
      const rotY = time * 0.3;
      const rotX = Math.sin(time * 0.25) * 0.35 + 0.2;
      const rotated = rotate3D(pt3D, rotX, rotY, 0);

      // Perspective projection
      const fov = 400;
      const perspective = fov / (fov + rotated.z + 300);

      basePoints.push({
        x: centerX + rotated.x * perspective * knotScale,
        y: centerY + rotated.y * perspective * knotScale + floatOffset,
        z: rotated.z
      });
    }

    // Fraction of the knot drawn at any given time (0.45 = 45% visible crawling window)
    const activeSegment = getSlidingWindow(basePoints, loopProgress, 0.46);

    drawTube(activeSegment);

    requestAnimationFrame(animate);
  }

  animate();
})();
