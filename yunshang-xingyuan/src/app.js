import { countCrossings, moveNode, progressFor } from './game.js';

const initialLevel = {
  nodes: [
    { id: 'a', x: 18, y: 25, label: '晨' },
    { id: 'b', x: 76, y: 77, label: '愿' },
    { id: 'c', x: 24, y: 75, label: '云' },
    { id: 'd', x: 80, y: 20, label: '星' },
    { id: 'e', x: 52, y: 13, label: '光' }
  ],
  edges: [['a', 'b'], ['b', 'e'], ['e', 'c'], ['c', 'd'], ['d', 'a']]
};

const board = document.querySelector('#board');
const hint = document.querySelector('#hint');
const completion = document.querySelector('#completion');
const crossingLabel = document.querySelector('#crossing-label');
const meterDots = document.querySelector('#meter-dots');
const wishCount = document.querySelector('#wish-count');
let level = structuredClone(initialLevel);
let wishes = 0;
let activeNode = null;
let complete = false;

function nodeById(id) {
  return level.nodes.find((node) => node.id === id);
}

function pointFromEvent(event) {
  const bounds = board.getBoundingClientRect();
  return {
    x: Math.max(8, Math.min(92, ((event.clientX - bounds.left) / bounds.width) * 100)),
    y: Math.max(8, Math.min(92, ((event.clientY - bounds.top) / bounds.height) * 100))
  };
}

function render() {
  const crossings = countCrossings(level);
  const isSolved = crossings === 0;
  const nodeElements = level.nodes.map((node) => `
    <g class="star-node ${activeNode === node.id ? 'is-active' : ''}" data-node-id="${node.id}" transform="translate(${node.x} ${node.y})" tabindex="0" role="button" aria-label="移动星点 ${node.label}">
      <circle class="star-node__aura" r="5.6"></circle>
      <circle class="star-node__core" r="2.5"></circle>
      <text class="star-node__label" y="9">${node.label}</text>
    </g>`).join('');
  const trails = level.edges.map(([from, to]) => {
    const start = nodeById(from);
    const end = nodeById(to);
    return `<line class="trail ${isSolved ? 'trail--clear' : ''}" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"></line>`;
  }).join('');

  board.innerHTML = `
    <defs>
      <filter id="star-glow"><feGaussianBlur stdDeviation="1.8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <radialGradient id="board-glow"><stop offset="0" stop-color="#d8f0ff" stop-opacity=".22"/><stop offset="1" stop-color="#d8f0ff" stop-opacity="0"/></radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#board-glow)"></circle>
    <g class="trail-group">${trails}</g>
    <g filter="url(#star-glow)">${nodeElements}</g>`;

  meterDots.innerHTML = Array.from({ length: Math.max(3, crossings) }, (_, index) =>
    `<span class="meter-dot ${index < crossings ? 'is-lit' : ''}"></span>`
  ).join('');
  crossingLabel.textContent = isSolved ? '星轨已归位' : `${crossings} 处交叉`;
  hint.textContent = isSolved ? '听，星光正在轻轻回应你。' : '拖动星点，让缠绕的星轨不再相交';
}

function completeLevel() {
  if (complete) return;
  complete = true;
  wishes += 1;
  wishCount.textContent = wishes;
  completion.hidden = false;
  window.setTimeout(() => completion.classList.add('is-visible'), 20);
}

function checkProgress() {
  const progress = progressFor(level, 1);
  if (progress.cleared) completeLevel();
}

function reset() {
  level = structuredClone(initialLevel);
  activeNode = null;
  complete = false;
  completion.classList.remove('is-visible');
  completion.hidden = true;
  render();
}

board.addEventListener('pointerdown', (event) => {
  const target = event.target.closest('[data-node-id]');
  if (!target || complete) return;
  activeNode = target.dataset.nodeId;
  board.setPointerCapture(event.pointerId);
  render();
});

board.addEventListener('pointermove', (event) => {
  if (!activeNode || complete) return;
  level = moveNode(level, activeNode, pointFromEvent(event));
  render();
});

function releaseNode(event) {
  if (!activeNode) return;
  activeNode = null;
  if (board.hasPointerCapture(event.pointerId)) board.releasePointerCapture(event.pointerId);
  render();
  checkProgress();
}

board.addEventListener('pointerup', releaseNode);
board.addEventListener('pointercancel', releaseNode);
document.querySelector('#reset-button').addEventListener('click', reset);
document.querySelector('#next-button').addEventListener('click', reset);
render();
