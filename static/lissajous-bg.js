/* ==========================================================================
   BENCH LABS — 3D LISSAJOUS KNOT & NEON TUBE ENGINE (Universal Sizing Fix)
   True 3D parametric geometry + multi-layered ribbon strokes + swirling echo
   ========================================================================== */

(() => {
  function initLissajousTube(canvasId = 'mainCanvas') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height, time = 0;
    let loopProgress = 0; // Continuous crawling window offset along the 3D loop

    // 3D Lissajous Knot (p=3, q=4, r=7) Parametric Generator
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

    // Responsive Canvas Sizing based on ACTUAL canvas box dimensions (Not document.body!)
    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(rect.width || canvas.clientWidth || window.innerWidth, 300);
      height = Math.max(rect.height || canvas.clientHeight || (window.innerHeight * 0.45), 240);
      canvas.width = width;
      canvas.height = height;
    }

    window.addEventListener('resize', resize);
    resize();

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

    function getSlidingWindow(points, progress, windowFraction) {
      const subPoints = [];
      const numSamples = 75;
      const startProgress = progress - windowFraction;
      const endProgress = progress;

      for (let i = 0; i <= numSamples; i++) {
        const prog = startProgress + (endProgress - startProgress) * (i / numSamples);
        subPoints.push(getInterpolatedPoint(points, prog));
      }
      return subPoints;
    }

    // Multi-pass translucent strokes create natural glowing halos without shadowBlur overhead (60fps)
    function drawRibbonPath(points, strokeStyle, lineWidth) {
      if (points.length < 2) return;
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
      ctx.stroke();
    }

    function drawTube(currentPoints) {
      if (currentPoints.length < 2) return;

      // 1. Outer Blue Glow Halo
      drawRibbonPath(currentPoints, 'rgba(60, 130, 230, 0.20)', 26);

      // 2. Cyan Main Body
      drawRibbonPath(currentPoints, 'rgba(140, 220, 255, 0.82)', 11);

      // 3. Bright Core Strand
      drawRibbonPath(currentPoints, 'rgba(240, 253, 255, 0.98)', 3.5);

      // 4. Swirling Accent Echo Lines
      const echoPoints1 = currentPoints.map((p, i) => ({
        x: p.x + Math.sin(time * 3 + i * 0.2) * 11,
        y: p.y + Math.cos(time * 3 + i * 0.2) * 7
      }));
      drawRibbonPath(echoPoints1, 'rgba(255, 210, 190, 0.55)', 2.3);

      const echoPoints2 = currentPoints.map((p, i) => ({
        x: p.x - Math.cos(time * 2.5 + i * 0.2) * 12,
        y: p.y - Math.sin(time * 2.5 + i * 0.2) * 8
      }));
      drawRibbonPath(echoPoints2, 'rgba(130, 200, 255, 0.50)', 2.5);
    }

    function animate() {
      time += 0.012;
      loopProgress += 0.0018;
      if (loopProgress >= 1) loopProgress -= 1;

      ctx.clearRect(0, 0, width, height);

      const isMobile = window.innerWidth < 640;
      const centerX = width * 0.5;
      const centerY = height * 0.50; // Centered exactly within the canvas box height
      const floatOffset = Math.sin(time * 1.5) * 8;

      // Responsive knot scaling: fits centered inside any canvas container height/width
      const minDimension = Math.min(width, height);
      const knotScale = isMobile ? (minDimension * 0.85) / 200 : (minDimension * 0.92) / 200;

      const basePoints = [];
      const steps = 160;
      const rotY = time * 0.3;
      const rotX = Math.sin(time * 0.25) * 0.3 + 0.2;
      const fov = 400;

      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        const pt3D = {
          x: Math.sin(p * t + deltaX) * 90,
          y: Math.sin(q * t + deltaY) * 90,
          z: Math.sin(r * t + deltaZ) * 90
        };

        const rotated = rotate3D(pt3D, rotX, rotY, 0);
        const perspective = fov / (fov + rotated.z + 300);

        basePoints.push({
          x: centerX + rotated.x * perspective * knotScale,
          y: centerY + rotated.y * perspective * knotScale + floatOffset,
          z: rotated.z
        });
      }

      const activeSegment = getSlidingWindow(basePoints, loopProgress, 0.46);
      drawTube(activeSegment);

      requestAnimationFrame(animate);
    }

    animate();
  }

  window.addEventListener('DOMContentLoaded', () => {
    initLissajousTube('mainCanvas');
  });
})();
