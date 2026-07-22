import { countCrossings, progressFor, swapNodeTrails } from './game.js';

const initialLevel = {
  nodes: [
    { id: 'a', x: 14, y: 70, label: '晨' },
    { id: 'b', x: 22, y: 26, label: '云' },
    { id: 'c', x: 42, y: 14, label: '微' },
    { id: 'd', x: 70, y: 22, label: '光' },
    { id: 'e', x: 88, y: 48, label: '愿' },
    { id: 'f', x: 74, y: 78, label: '澜' },
    { id: 'g', x: 40, y: 84, label: '星' },
    { id: 'h', x: 50, y: 52, label: '梦' }
  ],
  edges: [['a', 'f'], ['f', 'c'], ['c', 'g'], ['g', 'e'], ['e', 'b'], ['b', 'd'], ['d', 'h']]
};

const board = document.querySelector('#board');
const hint = document.querySelector('#hint');
const completion = document.querySelector('#completion');
const crossingLabel = document.querySelector('#crossing-label');
const meterDots = document.querySelector('#meter-dots');
const wishCount = document.querySelector('#wish-count');
let level = structuredClone(initialLevel);
let wishes = 0;
let selectedNode = null;
let complete = false;
let hintMessage = '依次点击两个星点，交换它们的星轨';

function nodeById(id) {
  return level.nodes.find((node) => node.id === id);
}

function render() {
  const crossings = countCrossings(level);
  const isSolved = crossings === 0;
  const nodeElements = level.nodes.map((node) => `
    <g class="star-node ${selectedNode === node.id ? 'is-selected' : ''}" data-node-id="${node.id}" transform="translate(${node.x} ${node.y})" tabindex="0" role="button" aria-label="选择星点 ${node.label}">
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
  hint.textContent = isSolved ? '听，星光正在轻轻回应你。' : hintMessage;
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
  selectedNode = null;
  complete = false;
  hintMessage = '依次点击两个星点，交换它们的星轨';
  completion.classList.remove('is-visible');
  completion.hidden = true;
  render();
}

function selectNode(nodeId) {
  if (complete) return;
  if (!selectedNode) {
    selectedNode = nodeId;
    hintMessage = `已选「${nodeById(nodeId).label}」；再点击另一颗星来交换星轨`;
    render();
    return;
  }

  if (selectedNode === nodeId) {
    selectedNode = null;
    hintMessage = '已取消选择；依次点击两个星点，交换它们的星轨';
    render();
    return;
  }

  level = swapNodeTrails(level, selectedNode, nodeId);
  selectedNode = null;
  hintMessage = '星轨已交换；继续寻找不再相交的轨道';
  render();
  checkProgress();
}

board.addEventListener('click', (event) => {
  const target = event.target.closest('[data-node-id]');
  if (target) selectNode(target.dataset.nodeId);
});

board.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const target = event.target.closest('[data-node-id]');
  if (!target) return;
  event.preventDefault();
  selectNode(target.dataset.nodeId);
});
document.querySelector('#reset-button').addEventListener('click', reset);
document.querySelector('#next-button').addEventListener('click', reset);
render();
