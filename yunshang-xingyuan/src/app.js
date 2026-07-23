import { countCrossings, progressFor, repairs, rewardFor, unlockRepair, swapNodeTrails } from './game.js?v=20260723-4';
import { firstLevelIndexForRepair, levels, nextLevelIndex } from './levels.js?v=20260723-4';

const skyCard = document.querySelector('.sky-card');
const board = document.querySelector('#board');
const hint = document.querySelector('#hint');
const completion = document.querySelector('#completion');
const crossingLabel = document.querySelector('#crossing-label');
const meterDots = document.querySelector('#meter-dots');
const wishCount = document.querySelector('#wish-count');
const levelTitle = document.querySelector('.level-label strong');
const levelRegion = document.querySelector('.level-label span');
const repairStatus = document.querySelector('#repair-status');
const skyDecor = document.querySelectorAll('#sky-decor i');
const repairOptions = document.querySelector('#repair-options');
const completionReward = document.querySelector('#completion-reward');
const nextButton = document.querySelector('#next-button');
let levelIndex = 0;
let level = structuredClone(levels[levelIndex]);
let repairState = { wishes: 0, unlocked: [] };
let completedLevelIds = [];
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
  levelTitle.textContent = levels[levelIndex].title;
  levelRegion.textContent = levels[levelIndex].region ?? '云端星图';
  skyCard.dataset.region = levels[levelIndex].requires ?? 'origin';
  wishCount.textContent = repairState.wishes;
  const unlockedCount = repairState.unlocked.length;
  repairStatus.textContent = unlockedCount
    ? `已修复 ${unlockedCount} 处天空装饰；星愿余额只在你主动修复时扣除。`
    : '完成星图获得星愿，再选择想先点亮的天空装饰。';
  skyDecor.forEach((decor) => decor.classList.toggle('is-repaired', repairState.unlocked.includes(decor.dataset.repair)));
  repairOptions.innerHTML = repairs.map((repair) => {
    const unlocked = repairState.unlocked.includes(repair.id);
    const affordable = repairState.wishes >= repair.cost;
    const action = unlocked ? '已修复' : affordable ? `消耗 ${repair.cost} 点` : `还差 ${repair.cost - repairState.wishes} 点`;
    return `<button class="repair-option ${unlocked ? 'is-unlocked' : ''}" data-repair-id="${repair.id}" ${unlocked || !affordable ? 'disabled' : ''}>
      <span class="repair-option__symbol">${repair.symbol}</span>
      <span class="repair-option__copy"><strong>${repair.name}</strong><small>${repair.cost} 星愿 · 开启${repair.unlocks}</small></span>
      <span class="repair-option__action">${action}</span>
    </button>`;
  }).join('');
  hint.textContent = isSolved ? '听，星光正在轻轻回应你。' : hintMessage;
}

function completeLevel() {
  if (complete) return;
  complete = true;
  const reward = rewardFor(level, completedLevelIds);
  if (reward.total) {
    completedLevelIds = [...completedLevelIds, level.id];
    repairState = { ...repairState, wishes: repairState.wishes + reward.total };
  }
  const availableRepair = repairs.find((repair) => !repairState.unlocked.includes(repair.id) && repairState.wishes >= repair.cost);
  completionReward.textContent = reward.total
    ? `你收下了 ${reward.base} 点星愿${reward.chapterBonus ? `，并获得 ${reward.chapterBonus} 点章节奖励。` : '。'}`
    : '这张星图已完成首通，星愿已收下。';
  nextButton.textContent = availableRepair
    ? `消耗 ${availableRepair.cost} 点，修复${availableRepair.name}并前往${availableRepair.unlocks}`
    : '前往下一片星空';
  render();
  completion.hidden = false;
  window.setTimeout(() => completion.classList.add('is-visible'), 20);
}

function checkProgress() {
  const progress = progressFor(level, 1);
  if (progress.cleared) completeLevel();
}

function reset() {
  level = structuredClone(levels[levelIndex]);
  selectedNode = null;
  complete = false;
  hintMessage = '依次点击两个星点，交换它们的星轨';
  completion.classList.remove('is-visible');
  completion.hidden = true;
  render();
}

function advanceLevel() {
  const availableRepair = repairs.find((repair) => !repairState.unlocked.includes(repair.id) && repairState.wishes >= repair.cost);
  if (availableRepair) {
    unlockRoute(availableRepair.id);
    return;
  }
  levelIndex = nextLevelIndex(levelIndex, repairState.unlocked);
  reset();
}

function unlockRoute(repairId) {
  const nextState = unlockRepair(repairState, repairId);
  if (nextState === repairState) return;
  repairState = nextState;
  const repair = repairs.find((candidate) => candidate.id === nextState.unlockedRepair);
  levelIndex = firstLevelIndexForRepair(nextState.unlockedRepair);
  reset();
  hintMessage = `「${repair.unlocks}」已开启；这片天空有新的星轨在等你。`;
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
nextButton.addEventListener('click', advanceLevel);
repairOptions.addEventListener('click', (event) => {
  const option = event.target.closest('[data-repair-id]');
  if (!option) return;
  unlockRoute(option.dataset.repairId);
});
render();
