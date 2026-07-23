import { countCrossings, progressFor, repairs, rewardFor, unlockRepair, swapNodeTrails } from './game.js?v=20260723-5';
import { firstLevelIndexForRepair, levels, nextLevelIndexInRegion } from './levels.js?v=20260723-5';

const skyCard = document.querySelector('.sky-card');
const board = document.querySelector('#board');
const hint = document.querySelector('#hint');
const completion = document.querySelector('#completion');
const crossingLabel = document.querySelector('#crossing-label');
const meterDots = document.querySelector('#meter-dots');
const wishCount = document.querySelector('#wish-count');
const levelTitle = document.querySelector('.level-label strong');
const levelRegion = document.querySelector('.level-label span');
const skyDecor = document.querySelectorAll('#sky-decor i');
const completionReward = document.querySelector('#completion-reward');
const nextButton = document.querySelector('#next-button');
const starMapButton = document.querySelector('#star-map-button');
const openStarMapButton = document.querySelector('#open-star-map-button');
const closeStarMapButton = document.querySelector('#close-star-map-button');
const starMap = document.querySelector('#star-map');
const mapWishCount = document.querySelector('#map-wish-count');
const mapMessage = document.querySelector('#map-message');
const regionList = document.querySelector('#region-list');

let levelIndex = 0;
let level = structuredClone(levels[levelIndex]);
let repairState = { wishes: 0, unlocked: [] };
let completedLevelIds = [];
let selectedNode = null;
let complete = false;
let hintMessage = '依次点击两个星点，交换它们的星轨';
let mapMessageText = '先完成云端星图，收集 3 点星愿来点亮第一处天空装饰。';
let mapHideTimer;

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
  skyDecor.forEach((decor) => decor.classList.toggle('is-repaired', repairState.unlocked.includes(decor.dataset.repair)));
  hint.textContent = isSolved ? '听，星光正在轻轻回应你。' : hintMessage;
}

function regionCard({ repair, isStarter = false }) {
  const unlocked = isStarter || repairState.unlocked.includes(repair.id);
  const affordable = !isStarter && repairState.wishes >= repair.cost;
  const status = isStarter
    ? '起始星图 · 随时可进入'
    : unlocked
      ? '天空已修复 · 可进入'
      : affordable
        ? `可消耗 ${repair.cost} 点星愿点亮`
        : `还差 ${repair.cost - repairState.wishes} 点星愿`;
  const action = isStarter || unlocked ? '进入星域' : affordable ? `点亮 · ${repair.cost} 点` : '暂未可用';
  const actionType = isStarter || unlocked ? 'enter' : affordable ? 'unlock' : 'locked';
  const disabled = actionType === 'locked' ? 'disabled' : '';
  const regionName = isStarter ? '云端星图' : repair.unlocks;
  const description = isStarter ? '从最初的三张星图开始，让星轨回到它们的位置。' : `修复「${repair.name}」，开启 ${repair.unlocks} 的三张星图。`;
  const symbol = isStarter ? '✦' : repair.symbol;

  return `<article class="region-card ${unlocked ? 'is-unlocked' : ''} ${affordable ? 'is-affordable' : ''}">
    <div class="region-card__symbol">${symbol}</div>
    <div class="region-card__copy">
      <p>${status}</p>
      <h3>${regionName}</h3>
      <small>${description}</small>
    </div>
    <button data-map-action="${actionType}" data-repair-id="${isStarter ? '' : repair.id}" ${disabled}>${action}</button>
  </article>`;
}

function renderStarMap() {
  mapWishCount.textContent = repairState.wishes;
  mapMessage.textContent = mapMessageText;
  regionList.innerHTML = [
    regionCard({ isStarter: true, repair: { id: 'starter' } }),
    ...repairs.map((repair) => regionCard({ repair }))
  ].join('');
}

function openStarMap() {
  window.clearTimeout(mapHideTimer);
  renderStarMap();
  starMap.hidden = false;
  window.setTimeout(() => starMap.classList.add('is-visible'), 20);
}

function closeStarMap() {
  starMap.classList.remove('is-visible');
  mapHideTimer = window.setTimeout(() => { starMap.hidden = true; }, 250);
}

function completeLevel() {
  if (complete) return;
  complete = true;
  const reward = rewardFor(level, completedLevelIds);
  if (reward.total) {
    completedLevelIds = [...completedLevelIds, level.id];
    repairState = { ...repairState, wishes: repairState.wishes + reward.total };
  }
  completionReward.textContent = reward.total
    ? `你收下了 ${reward.base} 点星愿${reward.chapterBonus ? `，并获得 ${reward.chapterBonus} 点章节奖励。` : '。'}`
    : '这张星图已完成首通，星愿已经收下。';
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
  levelIndex = nextLevelIndexInRegion(levelIndex);
  reset();
}

function enterRegion(repairId) {
  levelIndex = repairId ? firstLevelIndexForRepair(repairId) : 0;
  reset();
  if (repairId) {
    const repair = repairs.find((candidate) => candidate.id === repairId);
    hintMessage = `「${repair.unlocks}」已点亮；这里有新的星轨在等你。`;
    render();
  }
  closeStarMap();
}

function unlockSkyRepair(repairId) {
  const nextState = unlockRepair(repairState, repairId);
  if (nextState === repairState) return;
  repairState = nextState;
  const repair = repairs.find((candidate) => candidate.id === repairId);
  mapMessageText = `「${repair.name}」已点亮。你现在可以主动进入「${repair.unlocks}」。`;
  render();
  renderStarMap();
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
starMapButton.addEventListener('click', openStarMap);
openStarMapButton.addEventListener('click', openStarMap);
closeStarMapButton.addEventListener('click', closeStarMap);
regionList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-map-action]');
  if (!button || button.disabled) return;
  if (button.dataset.mapAction === 'unlock') unlockSkyRepair(button.dataset.repairId);
  if (button.dataset.mapAction === 'enter') enterRegion(button.dataset.repairId || null);
});

render();
