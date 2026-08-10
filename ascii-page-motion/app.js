const canvas = document.getElementById('ascii-field');
const transitionCanvas = document.getElementById('transition-field');
const transitionContext = transitionCanvas.getContext('2d');
const transitionLayer = document.querySelector('.transition-layer');
const reassemble = document.getElementById('reassemble');
const returnLight = document.getElementById('return-light');
const modeSwitch = document.getElementById('mode-switch');
const motionStatus = document.getElementById('motion-status');
const field = canvas.parentElement;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const words = ['PAGE', 'MATERIAL', 'MOTION', 'READING', 'SHAPE', 'FIELD', 'TRACE', 'STILLNESS', 'INDEX'];
const marks = '01+-·<>/[]{}*'.split('');
const noiseGlyphs = '0123456789ABCDEF[]{}()<>/\\|+-=;:.,*';
let pointer = { x: .55, y: .5, hovering: false };
let flowParticles = [];
let transitionNoiseGrid = [];
let transitionStart = 0;
let transitionActive = false;
let transitionToDark = true;
let sceneSwapped = false;
let spiralRenderer = null;

function unitNoise(value) {
  const sample = Math.sin(value * 12.9898) * 43758.5453;
  return sample - Math.floor(sample);
}

function buildSpiral() {
  return buildGlyphBands();
}

function wrapRadians(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function buildGlyphBands() {
  const ringCount = 30;
  const characters = 'THE CONTENT ARCHITECTURE.';
  const baseRadius = .06;
  const radiusSpan = 1.37;
  return Array.from({ length: ringCount }, (_, ring) => {
    const progress = ring / (ringCount - 1);
    const radius = baseRadius + radiusSpan * progress;
    const letterSize = 5.4 + 6.6 * progress;
    const charCount = Math.max(9, Math.floor((Math.PI * 2 * radius * 540) / (.64 * letterSize)));
    const centerChance = unitNoise(ring * 8.23 + 2.1);
    const widthChance = unitNoise(ring * 13.71 + 7.9);
    return {
      ring,
      radius,
      charCount,
      letterSize,
      phase: unitNoise(ring * 29.37 + 4.6) * Math.PI * 2,
      speed: (ring % 2 === 0 ? 1 : -1) * (.004 + (1 - progress) * .021),
      bandCenter: centerChance < .16 ? centerChance * Math.PI * 2 : .24 + (centerChance - .5) * Math.PI * .64,
      bandHalfWidth: Math.min(.98, widthChance < .1 ? .08 + widthChance * .9 : .25 + .34 * progress + widthChance * .28) * Math.PI,
      bandSoftness: (.075 + unitNoise(ring * 47.3 + 9.1) * .11) * Math.PI,
      phrase: characters,
    };
  });
}

function glyphAt(band, index) {
  const pause = 1 + Math.floor(unitNoise((band.ring + 1) * 19.47 + index * .03) * 3);
  const cycle = band.phrase.length + pause;
  const position = index % cycle;
  return position < band.phrase.length ? band.phrase[position] : '.';
}

function createGlyphAtlas() {
  const glyphs = [...new Set('THE CONTENT ARCHITECTURE.'.split(''))];
  const cell = 64;
  const columns = 8;
  const rows = Math.ceil(glyphs.length / columns);
  const sheet = document.createElement('canvas');
  sheet.width = columns * cell;
  sheet.height = rows * cell;
  const paint = sheet.getContext('2d');
  paint.clearRect(0, 0, sheet.width, sheet.height);
  paint.fillStyle = '#ffffff';
  paint.textAlign = 'center';
  paint.textBaseline = 'middle';
  paint.font = '56px "SFMono-Regular", "Cascadia Mono", monospace';
  glyphs.forEach((glyph, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    paint.fillText(glyph, column * cell + cell / 2, row * cell + cell * .54);
  });
  return { sheet, glyphs, columns, rows, lookup: new Map(glyphs.map((glyph, index) => [glyph, index])) };
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || 'WebGL shader compilation failed');
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(message || 'WebGL program link failed');
  }
  return program;
}

const vertexShaderSource = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
layout(location = 1) in float aRadius;
layout(location = 2) in float aAngle;
layout(location = 3) in float aSpeed;
layout(location = 4) in float aSize;
layout(location = 5) in float aGlyph;
layout(location = 6) in float aAlpha;
uniform vec2 uViewport;
uniform vec2 uMouse;
uniform float uTime;
uniform float uScale;
uniform float uHold;
uniform float uRippleStart;
uniform float uHover;
uniform float uColumns;
uniform float uRows;
out vec2 vUv;
out float vAlpha;
void main() {
  float angle = aAngle + uTime * aSpeed;
  vec2 radial = vec2(cos(angle), sin(angle));
  float elapsed = max(0.0, uTime - uRippleStart);
  float rippleRadius = elapsed * 310.0;
  float ripple = elapsed > 0.0 && elapsed < 1.8 ? (1.0 - smoothstep(0.0, 42.0, abs(aRadius * uScale - rippleRadius))) : 0.0;
  float orbit = aRadius * uScale * (1.0 - uHold * 0.22) + ripple * 28.0;
  vec2 center = vec2(uViewport.x * 0.48, uViewport.y * 0.51);
  vec2 point = center + radial * orbit;
  float mouseDistance = distance(point, uMouse);
  float mouseField = uHover * (1.0 - smoothstep(0.0, 120.0, mouseDistance));
  point += radial * mouseField * 14.0;
  vec2 tangent = vec2(-sin(angle), cos(angle));
  vec2 glyphSize = vec2(aSize * uScale * .44, aSize * uScale * .64);
  point += tangent * aCorner.x * glyphSize.x + radial * aCorner.y * glyphSize.y;
  vec2 clip = point / uViewport * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  float column = mod(aGlyph, uColumns);
  float row = floor(aGlyph / uColumns);
  vUv = (vec2(column, row) + aCorner * 0.5 + 0.5) / vec2(uColumns, uRows);
  vAlpha = aAlpha * (1.0 - mouseField * 0.38);
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;
uniform sampler2D uAtlas;
in vec2 vUv;
in float vAlpha;
out vec4 outColor;
void main() {
  float glyph = texture(uAtlas, vUv).a;
  if (glyph < 0.02) discard;
  outColor = vec4(vec3(0.96), glyph * vAlpha);
}`;

class SpiralRenderer {
  constructor(target) {
    this.canvas = target;
    this.gl = target.getContext('webgl2', { alpha: false, antialias: true, depth: false, stencil: false, powerPreference: 'high-performance' });
    this.ready = false;
    this.hold = 0;
    this.holding = false;
    this.rippleStart = -10;
    if (!this.gl) return;
    try {
      this.setup();
      this.ready = true;
    } catch (error) {
      console.warn('ASCII WebGL renderer unavailable', error);
    }
  }

  setup() {
    const gl = this.gl;
    this.atlas = createGlyphAtlas();
    this.program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    this.uniforms = Object.fromEntries(['uViewport', 'uMouse', 'uTime', 'uScale', 'uHold', 'uRippleStart', 'uHover', 'uColumns', 'uRows', 'uAtlas'].map((name) => [name, gl.getUniformLocation(this.program, name)]));
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    const corners = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, corners);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.instanceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    const instances = this.buildInstances();
    this.instanceCount = instances.length / 6;
    gl.bufferData(gl.ARRAY_BUFFER, instances, gl.STATIC_DRAW);
    const stride = 6 * Float32Array.BYTES_PER_ELEMENT;
    for (let attribute = 0; attribute < 6; attribute += 1) {
      gl.enableVertexAttribArray(attribute + 1);
      gl.vertexAttribPointer(attribute + 1, 1, gl.FLOAT, false, stride, attribute * Float32Array.BYTES_PER_ELEMENT);
      gl.vertexAttribDivisor(attribute + 1, 1);
    }
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.atlas.sheet);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.program);
    gl.uniform1f(this.uniforms.uColumns, this.atlas.columns);
    gl.uniform1f(this.uniforms.uRows, this.atlas.rows);
    gl.uniform1i(this.uniforms.uAtlas, 0);
    this.resize();
  }

  buildInstances() {
    const data = [];
    const dotGlyph = this.atlas.lookup.get('.');
    buildSpiral().forEach((band) => {
      for (let index = 0; index < band.charCount; index += 1) {
        const angle = band.phase + index / band.charCount * Math.PI * 2;
        const distance = Math.abs(wrapRadians(angle - band.bandCenter));
        const edge = (band.bandHalfWidth + band.bandSoftness - distance) / band.bandSoftness;
        const density = Math.max(0, Math.min(1, edge));
        const isLetter = density > .12 && (density > .72 || unitNoise(band.ring * 67.1 + index * 5.3) < density);
        const glyph = isLetter ? glyphAt(band, index) : '.';
        data.push(band.radius * 540, angle, band.speed, isLetter ? band.letterSize : 4.2, this.atlas.lookup.get(glyph) ?? dotGlyph, isLetter ? .4 + density * .48 : .2 + density * .14);
      }
    });
    return new Float32Array(data);
  }

  resize() {
    if (!this.ready && !this.program) return;
    const bounds = this.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(bounds.width * ratio));
    this.canvas.height = Math.max(1, Math.floor(bounds.height * ratio));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render(time) {
    if (!this.ready) return;
    const gl = this.gl;
    gl.clearColor(.09, .09, .086, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform2f(this.uniforms.uViewport, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.uniforms.uMouse, pointer.x * this.canvas.width, pointer.y * this.canvas.height);
    gl.uniform1f(this.uniforms.uTime, reducedMotion ? 0 : time * .001);
    gl.uniform1f(this.uniforms.uScale, Math.min(this.canvas.width, this.canvas.height) / 540);
    gl.uniform1f(this.uniforms.uHold, this.hold);
    gl.uniform1f(this.uniforms.uRippleStart, this.rippleStart);
    gl.uniform1f(this.uniforms.uHover, pointer.hovering ? 1 : 0);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.instanceCount);
  }

  setHolding(active) {
    this.holding = active;
    if (!active && this.hold > .08) this.rippleStart = performance.now() * .001;
  }

  animate(time) {
    if (!this.ready) return;
    const target = this.holding ? 1 : 0;
    this.hold += (target - this.hold) * .12;
    this.render(time);
    if (!reducedMotion) requestAnimationFrame((next) => this.animate(next));
  }
}

function createSpiralRenderer() {
  const renderer = new SpiralRenderer(canvas);
  if (!renderer.ready) {
    field.classList.add('webgl-unavailable');
    motionStatus.textContent = '当前浏览器不支持 WebGL 字符场。';
    return null;
  }
  field.classList.add('webgl-ready');
  motionStatus.textContent = 'WebGL 字符场已就绪。';
  return renderer;
}

function buildFlowField(total) {
  return Array.from({ length: total }, (_, index) => ({
    u: unitNoise(index * 17.17),
    v: unitNoise(index * 29.71),
    seed: unitNoise(index * 43.37),
    glyph: index % 5 === 0 ? words[index % words.length] : marks[index % marks.length],
  }));
}

function buildAsciiNoiseGrid(width, height) {
  const cellWidth = 3.3;
  const rowHeight = 6.3;
  const columns = Math.ceil(width / cellWidth) + 2;
  const rows = Math.ceil(height / rowHeight) + 1;
  return Array.from({ length: rows }, (_, row) => Array.from({ length: columns }, (_, column) => {
    const value = unitNoise((row + 1) * 81.17 + (column + 1) * 17.71);
    return noiseGlyphs[Math.floor(value * noiseGlyphs.length)];
  }).join(''));
}

function resize() {
  spiralRenderer?.resize();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const wholeWidth = window.innerWidth;
  const wholeHeight = window.innerHeight;
  transitionCanvas.width = Math.max(1, Math.floor(wholeWidth * ratio));
  transitionCanvas.height = Math.max(1, Math.floor(wholeHeight * ratio));
  transitionContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  flowParticles = buildFlowField(Math.max(1000, Math.min(1900, Math.floor(wholeWidth * wholeHeight / 520))));
  transitionNoiseGrid = buildAsciiNoiseGrid(wholeWidth, wholeHeight);
}

function smoothstep(value) { return value * value * (3 - 2 * value); }

function drawAsciiNoiseGrid(cover, width, height) {
  if (cover < .08 || transitionNoiseGrid.length === 0) return;
  const alpha = Math.min(.72, Math.max(0, (cover - .08) * .78));
  transitionContext.save();
  transitionContext.font = '5px "SFMono-Regular", "Cascadia Mono", monospace';
  transitionContext.textBaseline = 'top';
  transitionNoiseGrid.forEach((line, row) => {
    const shade = .42 + unitNoise((row + 1) * 9.91) * .42;
    transitionContext.fillStyle = `rgba(239,237,229,${alpha * shade})`;
    transitionContext.fillText(line, -(row % 3) * 1.6, row * 6.3);
  });
  transitionContext.restore();
}

function renderTransitionFrame(time) {
  if (!transitionActive) return;
  const elapsed = time - transitionStart;
  const progress = Math.min(elapsed / 1550, 1);
  const cover = Math.sin(Math.PI * Math.min(progress * 1.12, 1));
  const width = window.innerWidth;
  const height = window.innerHeight;
  const originX = transitionToDark ? width * .76 : width * .24;
  const destinationX = transitionToDark ? width * .24 : width * .76;
  transitionContext.clearRect(0, 0, width, height);
  transitionContext.fillStyle = `rgba(24,24,23,${Math.min(.99, cover * 1.18)})`;
  transitionContext.fillRect(0, 0, width, height);
  drawAsciiNoiseGrid(cover, width, height);
  const expansion = smoothstep(Math.min(progress / .52, 1));
  const collapse = smoothstep(Math.max((progress - .5) / .5, 0));
  flowParticles.forEach((particle, index) => {
    const smallX = originX + (particle.u - .5) * width * .36 + Math.sin(particle.seed * 34) * 15;
    const smallY = height * .5 + (particle.v - .5) * height * .74 + Math.cos(particle.seed * 41) * 14;
    const fullX = particle.u * width + Math.sin(particle.seed * 51 + progress * 13) * 22;
    const fullY = particle.v * height + Math.cos(particle.seed * 37 + progress * 11) * 22;
    const finalX = destinationX + (particle.u - .5) * width * .36 + Math.sin(particle.seed * 34) * 15;
    const finalY = height * .5 + (particle.v - .5) * height * .74 + Math.cos(particle.seed * 41) * 14;
    const outwardX = smallX + (fullX - smallX) * expansion;
    const outwardY = smallY + (fullY - smallY) * expansion;
    const x = outwardX + (finalX - outwardX) * collapse;
    const y = outwardY + (finalY - outwardY) * collapse;
    const alpha = .22 + Math.sin(Math.PI * progress) * .72;
    transitionContext.save();
    transitionContext.translate(x, y);
    transitionContext.rotate((particle.seed - .5) * .7 + progress * .28);
    transitionContext.font = `${index % 5 === 0 ? 5.4 : 5}px "SFMono-Regular", "Cascadia Mono", monospace`;
    transitionContext.fillStyle = index % 89 === 0 ? `rgba(239,93,59,${alpha})` : `rgba(239,237,229,${alpha})`;
    transitionContext.fillText(particle.glyph, 0, 0);
    transitionContext.restore();
  });
  if (progress > .48 && !sceneSwapped) {
    document.body.classList.toggle('is-dark');
    sceneSwapped = true;
    motionStatus.textContent = transitionToDark ? '字符云已展开为深色内容页。' : '字符云已收束回明亮页面。';
  }
  if (progress < 1 && !reducedMotion) requestAnimationFrame(renderTransitionFrame);
  if (progress >= 1) {
    transitionActive = false;
    transitionLayer.style.opacity = '0';
    transitionContext.clearRect(0, 0, width, height);
  }
}

function startTransition() {
  if (transitionActive) return;
  transitionToDark = !document.body.classList.contains('is-dark');
  sceneSwapped = false;
  transitionActive = true;
  transitionStart = performance.now();
  transitionLayer.style.opacity = '1';
  motionStatus.textContent = '字符云正在扩散并覆盖页面。';
  if (reducedMotion) {
    document.body.classList.toggle('is-dark');
    transitionActive = false;
    transitionLayer.style.opacity = '0';
    motionStatus.textContent = transitionToDark ? '已切换为深色内容页。' : '已返回明亮页面。';
    return;
  }
  requestAnimationFrame(renderTransitionFrame);
}

function updateDensity() {
  startTransition();
}

reassemble.addEventListener('click', startTransition);
returnLight.addEventListener('click', startTransition);
modeSwitch.addEventListener('click', updateDensity);
field.addEventListener('pointermove', (event) => {
  const bounds = field.getBoundingClientRect();
  pointer = { x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height, hovering: true };
});
field.addEventListener('pointerenter', () => { pointer.hovering = true; });
field.addEventListener('pointerleave', () => {
  pointer.hovering = false;
  spiralRenderer?.setHolding(false);
});
field.addEventListener('pointerdown', () => spiralRenderer?.setHolding(true));
field.addEventListener('pointerup', () => spiralRenderer?.setHolding(false));
window.addEventListener('resize', resize);
spiralRenderer = createSpiralRenderer();
resize();
spiralRenderer?.animate(0);
