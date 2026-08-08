const canvas = document.getElementById('ascii-field');
const context = canvas.getContext('2d');
const reassemble = document.getElementById('reassemble');
const modeSwitch = document.getElementById('mode-switch');
const sceneName = document.getElementById('scene-name');
const orbitState = document.getElementById('orbit-state');
const frameCount = document.getElementById('frame-count');
const motionStatus = document.getElementById('motion-status');
const field = canvas.parentElement;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const glyphs = 'THE INTERFACE IS NOT STILL 0123456789 +-*/<>[]{}·'.split('');
const modes = [
  { name: 'ORBIT', label: 'THE WORDS BEND', button: '切换：网格模式' },
  { name: 'GRID', label: 'THE WORDS GATHER', button: '切换：轨道模式' },
];
let mode = 0;
let pulse = 0;
let frames = 0;
let pointer = { x: 0.55, y: 0.5 };
let particles = [];

function buildSpiral(total) {
  return Array.from({ length: total }, (_, index) => {
    const ratio = index / total;
    return {
      angle: ratio * Math.PI * 18 + (index % 9) * 0.09,
      radius: 0.06 + Math.sqrt(ratio) * 0.51,
      glyph: glyphs[index % glyphs.length],
      depth: 0.3 + (index % 7) / 10,
      drift: ((index * 19) % 37) / 37,
    };
  });
}

function resize() {
  const bounds = field.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(bounds.width * ratio));
  canvas.height = Math.max(1, Math.floor(bounds.height * ratio));
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  particles = buildSpiral(Math.max(280, Math.min(570, Math.floor(bounds.width * bounds.height / 1550))));
}

function renderFrame(time) {
  const bounds = field.getBoundingClientRect();
  const width = bounds.width;
  const height = bounds.height;
  const size = Math.min(width, height);
  const t = reducedMotion ? 0 : time * 0.00015;
  const current = modes[mode];
  const centerX = width * (0.52 + (pointer.x - 0.5) * 0.07);
  const centerY = height * (0.52 + (pointer.y - 0.5) * 0.07);

  context.clearRect(0, 0, width, height);
  context.fillStyle = '#10100f';
  context.fillRect(0, 0, width, height);
  const glow = context.createRadialGradient(centerX, centerY, 4, centerX, centerY, size * 0.7);
  glow.addColorStop(0, 'rgba(238, 85, 50, .11)');
  glow.addColorStop(.3, 'rgba(238, 85, 50, .025)');
  glow.addColorStop(1, 'rgba(16, 16, 15, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  particles.forEach((particle, index) => {
    const wave = Math.sin(t * 5 + particle.angle * 2 + particle.drift * 11) * (reducedMotion ? 0 : 0.012);
    const phase = particle.angle + t * (0.55 + particle.depth * .9) + pulse * (1 - particle.radius) * 1.7;
    const radius = size * (particle.radius + wave + pulse * (0.04 + particle.depth * .025));
    let x;
    let y;
    let rotation;
    if (mode === 0) {
      x = centerX + Math.cos(phase) * radius * 1.18;
      y = centerY + Math.sin(phase) * radius * .79;
      rotation = phase + Math.PI / 2;
    } else {
      const columns = 28;
      const row = Math.floor(index / columns);
      const column = index % columns;
      const unit = Math.max(13, size / 32);
      x = width * .5 + (column - columns / 2) * unit * 1.08 + Math.sin(t * 4 + row) * 5 * particle.depth;
      y = height * .5 + (row - particles.length / columns / 2) * unit * .92 + Math.cos(t * 3 + column) * 5 * particle.depth;
      rotation = Math.sin(t * 4 + index) * .16;
    }
    const alpha = .24 + particle.depth * .61;
    const fontSize = Math.max(7, Math.round(8 + particle.depth * 3 + (pulse > .25 ? 1 : 0)));
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.font = `${fontSize}px "SFMono-Regular", "Cascadia Mono", monospace`;
    context.fillStyle = index % 19 === 0 ? `rgba(238, 85, 50, ${alpha})` : `rgba(244, 240, 228, ${alpha})`;
    context.fillText(particle.glyph, 0, 0);
    context.restore();
  });

  context.beginPath();
  context.arc(centerX, centerY, 2 + Math.sin(t * 8) * .6, 0, Math.PI * 2);
  context.fillStyle = '#ee5532';
  context.fill();
  frames += 1;
  if (frames % 8 === 0) frameCount.textContent = `${String(frames).padStart(3, '0')} FRAMES`;
  if (pulse > 0.003) pulse *= 0.946;
  if (!reducedMotion) requestAnimationFrame(renderFrame);
}

function updateMode() {
  const current = modes[mode];
  sceneName.textContent = current.name;
  orbitState.textContent = current.label;
  modeSwitch.textContent = current.button;
  modeSwitch.setAttribute('aria-pressed', String(mode === 1));
  motionStatus.textContent = `字符场已切换为${current.name === 'ORBIT' ? '轨道' : '网格'}模式。`;
}

reassemble.addEventListener('click', () => {
  pulse = 1;
  motionStatus.textContent = '字符场正在重新组合。';
  if (reducedMotion) renderFrame(0);
});

modeSwitch.addEventListener('click', () => {
  mode = mode === 0 ? 1 : 0;
  updateMode();
  if (reducedMotion) renderFrame(0);
});

field.addEventListener('pointermove', (event) => {
  const bounds = field.getBoundingClientRect();
  pointer = { x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height };
});

window.addEventListener('resize', () => { resize(); renderFrame(0); });
resize();
updateMode();
renderFrame(0);
