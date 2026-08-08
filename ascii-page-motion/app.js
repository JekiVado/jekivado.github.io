const canvas = document.getElementById('ascii-field');
const context = canvas.getContext('2d');
const transitionCanvas = document.getElementById('transition-field');
const transitionContext = transitionCanvas.getContext('2d');
const transitionLayer = document.querySelector('.transition-layer');
const reassemble = document.getElementById('reassemble');
const returnLight = document.getElementById('return-light');
const modeSwitch = document.getElementById('mode-switch');
const sceneName = document.getElementById('scene-name');
const orbitState = document.getElementById('orbit-state');
const frameCount = document.getElementById('frame-count');
const motionStatus = document.getElementById('motion-status');
const field = canvas.parentElement;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const words = ['PAGE', 'MATERIAL', 'MOTION', 'READING', 'SHAPE', 'FIELD', 'TRACE', 'STILLNESS', 'INDEX'];
const marks = '01+-·<>/[]{}*'.split('');
const noiseGlyphs = '0123456789ABCDEF[]{}()<>/\\|+-=;:.,*';
const fieldFrameInterval = 42;
let frames = 0;
let lastFieldFrame = -Infinity;
let pointer = { x: .55, y: .5 };
let glyphBands = [];
let flowParticles = [];
let transitionNoiseGrid = [];
let transitionStart = 0;
let transitionActive = false;
let transitionToDark = true;
let sceneSwapped = false;

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
  return position < band.phrase.length ? band.phrase[position] : '·';
}

function unitNoise(value) {
  const sample = Math.sin(value * 12.9898) * 43758.5453;
  return sample - Math.floor(sample);
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
  const bounds = field.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(bounds.width * ratio));
  canvas.height = Math.max(1, Math.floor(bounds.height * ratio));
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const wholeWidth = window.innerWidth;
  const wholeHeight = window.innerHeight;
  transitionCanvas.width = Math.max(1, Math.floor(wholeWidth * ratio));
  transitionCanvas.height = Math.max(1, Math.floor(wholeHeight * ratio));
  transitionContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  glyphBands = buildSpiral();
  flowParticles = buildFlowField(Math.max(1000, Math.min(1900, Math.floor(wholeWidth * wholeHeight / 520))));
  transitionNoiseGrid = buildAsciiNoiseGrid(wholeWidth, wholeHeight);
}

function renderFrame(time) {
  if (!reducedMotion && time - lastFieldFrame < fieldFrameInterval) {
    requestAnimationFrame(renderFrame);
    return;
  }
  lastFieldFrame = time;
  const bounds = field.getBoundingClientRect();
  const width = bounds.width;
  const height = bounds.height;
  const size = Math.min(width, height);
  const t = reducedMotion ? 0 : time * .001;
  const centerX = width * .48;
  const centerY = height * .51;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#171716';
  context.fillRect(0, 0, width, height);
  const halo = context.createRadialGradient(centerX, centerY, 2, centerX, centerY, size * .76);
  halo.addColorStop(0, 'rgba(255,255,255,.022)');
  halo.addColorStop(.65, 'rgba(255,255,255,.009)');
  halo.addColorStop(1, 'rgba(23,23,22,0)');
  context.fillStyle = halo;
  context.fillRect(0, 0, width, height);
  drawGlyphBands(t, size, centerX, centerY);
  frames += 1;
  if (frames % 12 === 0) frameCount.textContent = `${String(frames).padStart(3, '0')} FRAMES`;
  if (!reducedMotion) requestAnimationFrame(renderFrame);
}

function drawGlyphBands(t, size, centerX, centerY) {
  const designScale = size / 540;
  const dotSize = 5 * designScale;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  glyphBands.forEach((band) => {
    const radius = band.radius * 540 * designScale;
    const drift = reducedMotion ? 0 : t * band.speed;
    for (let index = 0; index < band.charCount; index += 1) {
      const angle = band.phase + index / band.charCount * Math.PI * 2 + drift;
      const distance = Math.abs(wrapRadians(angle - band.bandCenter));
      const edge = (band.bandHalfWidth + band.bandSoftness - distance) / band.bandSoftness;
      const density = Math.max(0, Math.min(1, edge));
      const isLetter = density > .12 && (density > .72 || unitNoise(band.ring * 67.1 + index * 5.3) < density);
      const fontSize = isLetter ? band.letterSize * designScale : dotSize;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      if (x < -fontSize || x > canvas.clientWidth + fontSize || y < -fontSize || y > canvas.clientHeight + fontSize) continue;
      context.save();
      context.translate(x, y);
      context.rotate(angle + Math.PI / 2);
      context.font = `${fontSize}px "SFMono-Regular", "Cascadia Mono", monospace`;
      context.fillStyle = isLetter
        ? `rgba(244,241,232,${.36 + density * .48})`
        : `rgba(244,241,232,${.2 + density * .13})`;
      context.fillText(isLetter ? glyphAt(band, index) : '·', 0, 0);
      context.restore();
    }
  });
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
  pointer = { x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height };
});
window.addEventListener('resize', resize);
resize();
renderFrame(0);
