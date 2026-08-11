/* =========================================================================
   WEBGPU WGSL HOMOGENOUS FILM GRAIN SHADER (NON-GRADIENT, 0.40 INTENSITY)
   SLOWED DOWN GENTLE CINEMATIC GRAIN (No high-frequency flicker / headache)
   ========================================================================= */

(function () {
  const canvas = document.getElementById('hero-grain-canvas');
  if (!canvas) return;
  const heroSection = document.getElementById('hero');
  const GRAIN_INTENSITY = 0.35; // Calm, clean intensity

  // DPI-aware Canvas Resize
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = (heroSection || canvas.parentElement).getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    return { width, height };
  }

  window.addEventListener('resize', resizeCanvas);

  // =====================================================================
  // 1. WEBGPU WGSL HOMOGENOUS SHADER
  // =====================================================================
  const wgslShaderCode = `
  struct VertexOutput {
    @builtin(position) position : vec4<f32>,
    @location(0) uv : vec2<f32>,
  };

  @vertex
  fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {
    var pos = array<vec2<f32>, 6>(
      vec2<f32>(-1.0, -1.0),
      vec2<f32>( 1.0, -1.0),
      vec2<f32>(-1.0,  1.0),
      vec2<f32>(-1.0,  1.0),
      vec2<f32>( 1.0, -1.0),
      vec2<f32>( 1.0,  1.0)
    );
    var output : VertexOutput;
    output.position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
    output.uv = pos[VertexIndex] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5, 0.5);
    return output;
  }

  struct Uniforms {
    time : f32,
    width : f32,
    height : f32,
    intensity : f32,
  };

  @group(0) @binding(0) var<uniform> u : Uniforms;

  fn hash12(p: vec2<f32>) -> f32 {
    var p3 = fract(p.xyx * 0.1031);
    var d = dot(p3, p3.yzx + vec3<f32>(33.33, 33.33, 33.33));
    p3 = p3 + vec3<f32>(d, d, d);
    return fract((p3.x + p3.y) * p3.z);
  }

  fn ign(p: vec2<f32>) -> f32 {
    var magic = vec3<f32>(0.06711056, 0.00583715, 52.9829189);
    return fract(magic.z * fract(dot(p, magic.xy)));
  }

  @fragment
  fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    var pixel_coord = uv * vec2<f32>(u.width, u.height);
    // SLOWED DOWN: Extremely gentle drift (was 41.37 / 113.1)
    var time_seed = u.time * 0.15;
    var seed = pixel_coord + vec2<f32>(time_seed * 4.1, time_seed * 2.9);
    var g1 = hash12(seed);
    var g2 = ign(seed + vec2<f32>(19.3, 47.7));
    var raw_grain = mix(g1, g2, 0.5);
    var film_grain = pow(raw_grain, 1.25);
    var brightness = film_grain * u.intensity;
    var color = vec3<f32>(brightness, brightness, brightness);
    var alpha = clamp(brightness * 1.5, 0.0, 0.85);
    return vec4<f32>(color, alpha);
  }
  `;

  async function initWebGPU() {
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported in this browser.');
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('No appropriate GPUAdapter found.');
    }
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
      device: device,
      format: format,
      alphaMode: 'premultiplied',
    });

    const uniformBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
          buffer: { type: 'uniform' },
        },
      ],
    });

    const bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: uniformBuffer },
        },
      ],
    });

    const shaderModule = device.createShaderModule({
      code: wgslShaderCode,
    });

    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    const pipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format: format,
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });

    let startTime = performance.now();

    function render(now) {
      resizeCanvas();
      const timeInSeconds = (now - startTime) * 0.001;

      const uniformData = new Float32Array([
        timeInSeconds,        // 0: time
        canvas.width,         // 1: width
        canvas.height,        // 2: height
        GRAIN_INTENSITY,      // 3: intensity
      ]);

      device.queue.writeBuffer(uniformBuffer, 0, uniformData);

      const commandEncoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();
      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: textureView,
            clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      });

      renderPass.setPipeline(pipeline);
      renderPass.setBindGroup(0, bindGroup);
      renderPass.draw(6, 1, 0, 0);
      renderPass.end();

      device.queue.submit([commandEncoder.finish()]);
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }

  function initWebGL2() {
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true });
    if (!gl) return;

    const vsSource = `#version 300 es
      precision highp float;
      out vec2 v_uv;
      void main() {
        vec2 pos[6] = vec2[](
          vec2(-1.0, -1.0),
          vec2( 1.0, -1.0),
          vec2(-1.0,  1.0),
          vec2(-1.0,  1.0),
          vec2( 1.0, -1.0),
          vec2( 1.0,  1.0)
        );
        gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
        v_uv = pos[gl_VertexID] * vec2(0.5, -0.5) + vec2(0.5, 0.5);
      }
    `;

    const fsSource = `#version 300 es
      precision highp float;
      in vec2 v_uv;
      out vec4 outColor;
      uniform float u_time;
      uniform float u_width;
      uniform float u_height;
      uniform float u_intensity;

      float hash12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      float ign(vec2 p) {
        vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
        return fract(magic.z * fract(dot(p, magic.xy)));
      }

      void main() {
        vec2 pixel_coord = v_uv * vec2(u_width, u_height);
        // SLOWED DOWN: Extremely gentle drift (was 41.37 / 113.1)
        float time_seed = u_time * 0.15;
        vec2 seed = pixel_coord + vec2(time_seed * 4.1, time_seed * 2.9);
        float g1 = hash12(seed);
        float g2 = ign(seed + vec2(19.3, 47.7));
        float raw_grain = mix(g1, g2, 0.5);
        float film_grain = pow(raw_grain, 1.25);
        float brightness = film_grain * u_intensity;
        vec3 color = vec3(brightness);
        float alpha = clamp(brightness * 1.5, 0.0, 0.85);
        outColor = vec4(color, alpha);
      }
    `;

    function compileShader(src, type) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uWidth = gl.getUniformLocation(program, 'u_width');
    const uHeight = gl.getUniformLocation(program, 'u_height');
    const uIntensity = gl.getUniformLocation(program, 'u_intensity');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let startTime = performance.now();

    function renderWebGL(now) {
      resizeCanvas();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const timeInSeconds = (now - startTime) * 0.001;
      gl.uniform1f(uTime, timeInSeconds);
      gl.uniform1f(uWidth, canvas.width);
      gl.uniform1f(uHeight, canvas.height);
      gl.uniform1f(uIntensity, GRAIN_INTENSITY);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(renderWebGL);
    }

    requestAnimationFrame(renderWebGL);
  }

  window.addEventListener('DOMContentLoaded', () => {
    initWebGPU().catch(() => {
      initWebGL2();
    });
  });
})();
