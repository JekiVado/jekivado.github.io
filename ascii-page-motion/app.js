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
let densityBoost = false;
let frames = 0;
let lastFieldFrame = -Infinity;
let pointer = { x: .55, y: .5 };
let spiralWords = [];
let flowParticles = [];
let transitionNoiseGrid = [];
let transitionStart = 0;
let transitionActive = false;
let transitionToDark = true;
let sceneSwapped = false;

function buildSpiral() {
  return buildConcentricRings();
}

function buildConcentricRings() {
  const ringCount = 38;
  const ringGap = 8;
  const ringTrack = 'THE CONTENT ARCHITECTURE · ';
  return Array.from({ length: ringCount }, (_, ring) => {
    return {
      ring,
      radius: 18 + ring * ringGap,
      track: ringTrack,
      phase: ring * .17,
      isText: ring % 3 === 0 || ring > 31,
    };
  });
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
  spiralWords = buildSpiral();
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
  const t = reducedMotion ? 0 : time * .0001;
  const centerX = width * (.62 + (pointer.x - .5) * .015);
  const centerY = height * (.51 + (pointer.y - .5) * .015);
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#171716';
  context.fillRect(0, 0, width, height);
  const halo = context.createRadialGradient(centerX, centerY, 2, centerX, centerY, size * .76);
  halo.addColorStop(0, 'rgba(255,255,255,.022)');
  halo.addColorStop(.65, 'rgba(255,255,255,.009)');
  halo.addColorStop(1, 'rgba(23,23,22,0)');
  context.fillStyle = halo;
  context.fillRect(0, 0, width, height);
  drawConcentricTextRings(t, size, centerX, centerY);
  frames += 1;
  if (frames % 12 === 0) frameCount.textContent = `${String(frames).padStart(3, '0')} FRAMES`;
  if (!reducedMotion) requestAnimationFrame(renderFrame);
}

function drawConcentricTextRings(t, size, centerX, centerY) {
  const visibleRadius = size * .62;
  spiralWords.forEach((ring) => {
    if (ring.radius > visibleRadius) return;
    const depth = ring.ring / (spiralWords.length - 1);
    const fontSize = 4.6 + depth * 2.25 + (densityBoost ? .35 : 0);
    const drift = reducedMotion ? 0 : t * (.055 + ring.ring * .0018);
    context.save();
    if (ring.isText) {
      const segmentAdvance = Math.max(18, fontSize * ring.track.length * .56);
      const segmentCount = Math.ceil((Math.PI * 2 * ring.radius) / segmentAdvance);
      context.font = `${fontSize}px "SFMono-Regular", "Cascadia Mono", monospace`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      for (let segment = 0; segment < segmentCount; segment += 1) {
        const angle = (segment / segmentCount) * Math.PI * 2 + ring.phase + drift;
        context.save();
        context.translate(centerX + Math.cos(angle) * ring.radius, centerY + Math.sin(angle) * ring.radius);
        context.rotate(angle + Math.PI / 2);
        context.fillStyle = `rgba(244,241,232,${.34 + depth * .4})`;
        context.fillText(ring.track, 0, 0);
        context.restore();
      }
    }
    if (ring.ring < spiralWords.length - 1) {
      context.beginPath();
      context.setLineDash([.6, 3.9]);
      context.arc(centerX, centerY, ring.radius + 3.9, 0, Math.PI * 2);
      context.strokeStyle = `rgba(244,241,232,${.09 + depth * .13})`;
      context.lineWidth = .55;
      context.stroke();
      context.setLineDash([]);
    }
    context.restore();
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
  densityBoost = !densityBoost;
  modeSwitch.textContent = densityBoost ? '密度：高' : '密度：标准';
  modeSwitch.setAttribute('aria-pressed', String(densityBoost));
  sceneName.textContent = densityBoost ? 'DENSE SPIRAL' : 'SPIRAL';
  orbitState.textContent = densityBoost ? 'THE ORBIT GROWS DENSE' : 'WORDS HOLD THEIR ORBIT';
  motionStatus.textContent = densityBoost ? '字符螺旋已提高密度。' : '字符螺旋已恢复标准密度。';
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
