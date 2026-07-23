import { bestExchangePair, countCrossings, repairs, rewardFor, unlockRepair, swapNodeTrails } from './game.js?v=20260723-11';
import { expeditionChapterById, firstLevelIndexForRepair, levels, nextLevelIndexInRegion } from './levels.js?v=20260723-11';
import {
  abandonExpedition,
  acceptSpirit,
  chooseAspect,
  chooseRoute,
  completeFinalePhase,
  completeNode,
  createExpeditionRun,
  guideLayerFor,
  recordExchange,
  useSpirit
} from './expedition.js?v=20260723-11';

const skyCard = document.querySelector('.sky-card');
const board = document.querySelector('#board');
const hint = document.querySelector('#hint');
const expeditionStatus = document.querySelector('#expedition-status');
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
const homeScreen = document.querySelector('#home-screen');
const journeyPanel = document.querySelector('#journey-panel');
const journeyContent = document.querySelector('#journey-content');
const leaveDialog = document.querySelector('#leave-dialog');
const spiritButton = document.querySelector('#spirit-button');
const effectCallout = document.querySelector('#effect-callout');

let screen = 'home';
let mode = 'quick';
let levelIndex = 0;
let level = structuredClone(levels[levelIndex]);
let levelTemplate = levels[levelIndex];
let repairState = { wishes: 0, unlocked: [] };
let completedLevelIds = [];
let completedExpeditionIds = [];
let expeditionRun = null;
let selectedNode = null;
let complete = false;
let resultMode = 'quick';
let hintMessage = '依次点击两个星点，交换它们的星轨';
let mapMessageText = '星愿只会在这里消耗。修复天空后，再主动选择进入新的星域。';
let mapHideTimer;
let effectCalloutState = null;
let effectCalloutTimer;
const debugEvents = [];

window.cloudWishDebug = debugEvents;

function track(type, detail = {}) {
  const event = { type, detail, at: Date.now() };
  debugEvents.push(event);
  console.info('[云上星愿]', event);
}

function nodeById(id) {
  return level.nodes.find((node) => node.id === id);
}

function currentChapter() {
  return expeditionChapterById(expeditionRun?.chapterId ?? 'cloud-harp-01');
}

function hideOverlay(element) {
  element.classList.remove('is-visible');
  element.hidden = true;
}

function clearEffectCallout() {
  window.clearTimeout(effectCalloutTimer);
  effectCalloutState = null;
}

function showEffectCallout(kind, title, detail) {
  window.clearTimeout(effectCalloutTimer);
  effectCalloutState = { kind, title, detail };
  effectCalloutTimer = window.setTimeout(() => {
    effectCalloutState = null;
    render();
  }, 3000);
}

function showOverlay(element) {
  element.hidden = false;
  window.setTimeout(() => element.classList.add('is-visible'), 20);
}

function render() {
  const crossings = countCrossings(level);
  const isSolved = crossings === 0;
  const isExpedition = mode === 'expedition' && expeditionRun;
  const guideLayer = guideLayerFor(expeditionRun);
  const guidePair = guideLayer ? bestExchangePair(level) : null;
  const guidedNodeIds = new Set(guidePair?.nodeIds ?? []);
  const guideNodes = guidePair ? guidePair.nodeIds.map(nodeById) : [];
  const guideLink = guideNodes.length === 2
    ? `<line class="guide-link guide-link--${guideLayer}" x1="${guideNodes[0].x}" y1="${guideNodes[0].y}" x2="${guideNodes[1].x}" y2="${guideNodes[1].y}"></line>`
    : '';
  const nodeElements = level.nodes.map((node) => `
    <g class="star-node ${selectedNode === node.id ? 'is-selected' : ''} ${guidedNodeIds.has(node.id) ? `is-guided is-guided--${guideLayer}` : ''}" data-node-id="${node.id}" transform="translate(${node.x} ${node.y})" tabindex="0" role="button" aria-label="选择星点 ${node.label}">
      <circle class="star-node__aura" r="5.6"></circle>
      <circle class="star-node__core" r="2.5"></circle>
      <text class="star-node__label" y="9">${node.label}</text>
    </g>`).join('');
  const trails = level.edges.map(([from, to], index) => {
    const start = nodeById(from);
    const end = nodeById(to);
    const hiddenByMist = level.mistHiddenEdges?.includes(index) && ![from, to].includes(selectedNode);
    return `<line class="trail ${isSolved ? 'trail--clear' : ''} ${hiddenByMist ? 'trail--mist-hidden' : ''}" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"></line>`;
  }).join('');
  const mist = level.mist ? '<ellipse class="mist-veil" cx="66" cy="34" rx="31" ry="19"></ellipse><ellipse class="mist-veil mist-veil--low" cx="33" cy="73" rx="26" ry="15"></ellipse>' : '';

  board.innerHTML = `
    <defs>
      <filter id="star-glow"><feGaussianBlur stdDeviation="1.8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <radialGradient id="board-glow"><stop offset="0" stop-color="#d8f0ff" stop-opacity=".22"/><stop offset="1" stop-color="#d8f0ff" stop-opacity="0"/></radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#board-glow)"></circle>
    <g class="trail-group">${trails}</g>
    ${mist}
    ${guideLink}
    <g filter="url(#star-glow)">${nodeElements}</g>`;

  effectCallout.hidden = !effectCalloutState;
  effectCallout.className = `effect-callout ${effectCalloutState ? `effect-callout--${effectCalloutState.kind}` : ''}`;
  effectCallout.innerHTML = effectCalloutState
    ? `<span class="effect-callout__mark">${{ mist: '☁', resonance: '⌁', meteor: '✦', spirit: '☾' }[effectCalloutState.kind]}</span><span><b>${effectCalloutState.title}</b><small>${effectCalloutState.detail}</small></span>`
    : '';

  meterDots.innerHTML = Array.from({ length: Math.max(3, crossings) }, (_, index) =>
    `<span class="meter-dot ${index < crossings ? 'is-lit' : ''}"></span>`
  ).join('');
  crossingLabel.textContent = isSolved ? '星轨已归位' : `${crossings} 处交叉`;
  levelTitle.textContent = level.title;
  levelRegion.textContent = isExpedition ? `远征 · ${currentChapter().title}` : level.region ?? '云端星图';
  skyCard.dataset.region = isExpedition ? 'expedition' : level.requires ?? 'origin';
  skyCard.dataset.mode = mode;
  wishCount.textContent = repairState.wishes;
  skyDecor.forEach((decor) => decor.classList.toggle('is-repaired', repairState.unlocked.includes(decor.dataset.repair)));
  const guidePrefix = { resonance: '回响指引', meteor: '流星指引', spirit: '云鲸指引' }[guideLayer];
  const guideText = guidePair
    ? `${guidePrefix}：交换「${nodeById(guidePair.nodeIds[0]).label}」与「${nodeById(guidePair.nodeIds[1]).label}」。`
    : null;
  hint.textContent = guideText ?? (isSolved ? '听，星光正在轻轻回应你。' : hintMessage);

  if (isExpedition) {
    const aspectName = { resonance: '回响', meteor: '流星', spirit: '云鲸' }[expeditionRun.chosenAspect];
    const constellation = expeditionRun.constellationId ? ' · 天琴座已成' : '';
    const aspectProgress = expeditionRun.chosenAspect === 'resonance'
      ? ` · 连解 ${expeditionRun.aspectCharge}/2`
      : expeditionRun.chosenAspect === 'meteor'
        ? expeditionRun.aspectHintActive ? ' · 已获交换提示' : ' · 寻找一步多消'
        : expeditionRun.spirit ? ` · 云鲸指引 ${expeditionRun.spirit.usesRemaining}` : expeditionRun.aspectCharge ? ' · 云鲸已充能' : ' · 云鲸充能中';
    expeditionStatus.hidden = false;
    expeditionStatus.textContent = `本次远征 · ${aspectName}星象 · 天琴座进度 ${expeditionRun.traces.length}/3${constellation}${aspectProgress}`;
  } else {
    expeditionStatus.hidden = true;
  }

  const remainingUses = expeditionRun?.spirit?.usesRemaining ?? 0;
  spiritButton.hidden = !(isExpedition && ['finale-outer', 'finale-fog'].includes(expeditionRun.phase) && remainingUses > 0 && !complete);
  spiritButton.textContent = `☁ 云鲸指引 · ${remainingUses}`;
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
  const action = isStarter || unlocked ? '进入轻解星图' : affordable ? `点亮 · ${repair.cost} 点` : '暂未可用';
  const actionType = isStarter || unlocked ? 'enter' : affordable ? 'unlock' : 'locked';
  const disabled = actionType === 'locked' ? 'disabled' : '';
  const regionName = isStarter ? '云端星图' : repair.unlocks;
  const description = isStarter ? '随时进入一张独立星图，轻轻解开交叉。' : `修复「${repair.name}」，开启 ${repair.unlocks} 的三张轻解星图。`;
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
  showOverlay(starMap);
}

function closeStarMap() {
  starMap.classList.remove('is-visible');
  mapHideTimer = window.setTimeout(() => { starMap.hidden = true; }, 250);
}

function resetPuzzle() {
  selectedNode = null;
  complete = false;
  hideOverlay(completion);
  render();
}

function startQuick(index = levelIndex) {
  clearEffectCallout();
  mode = 'quick';
  screen = 'puzzle';
  levelIndex = index;
  levelTemplate = levels[levelIndex];
  level = structuredClone(levelTemplate);
  expeditionRun = null;
  hintMessage = '依次点击两个星点，交换它们的星轨';
  homeScreen.hidden = true;
  hideOverlay(journeyPanel);
  hideOverlay(leaveDialog);
  closeStarMap();
  track('mode_entered', { mode: 'quick', levelId: level.id });
  resetPuzzle();
}

function showHome() {
  clearEffectCallout();
  screen = 'home';
  mode = 'quick';
  selectedNode = null;
  complete = false;
  hideOverlay(completion);
  hideOverlay(journeyPanel);
  hideOverlay(leaveDialog);
  closeStarMap();
  homeScreen.hidden = false;
  render();
}

function startExpedition() {
  expeditionRun = createExpeditionRun('cloud-harp-01');
  mode = 'expedition';
  screen = 'expedition-map';
  homeScreen.hidden = true;
  closeStarMap();
  track('mode_entered', { mode: 'expedition', chapterId: expeditionRun.chapterId });
  renderJourneyPanel();
}

function startExpeditionPuzzle(key) {
  const puzzle = currentChapter().puzzles[key];
  levelTemplate = puzzle;
  level = structuredClone(levelTemplate);
  screen = 'puzzle';
  selectedNode = null;
  complete = false;
  hideOverlay(journeyPanel);
  hintMessage = level.mist
    ? '云雾遮住了部分星轨；点选一颗星，就能看清它承载的线。'
    : '依次点击两个星点，交换它们的星轨。';
  if (expeditionRun?.phase === 'finale-outer') hintMessage = '先让外围乱线安静下来，星座正在等待回应。';
  if (expeditionRun?.phase === 'finale-fog') hintMessage = '云雾侵蚀了星轨；云鲸会标亮一对可以直接交换的星点。';
  if (level.mist) {
    const isFinaleFog = expeditionRun?.phase === 'finale-fog';
    showEffectCallout(
      'mist',
      isFinaleFog ? '云雾侵蚀' : '迷雾观测',
      isFinaleFog ? '两段星轨被云雾遮住；点选星点即可看清它承载的线。' : '两段星轨被云雾遮住；点选星点即可照亮它承载的线。'
    );
  }
  render();
}

function renderJourneyPanel() {
  if (!expeditionRun) return;
  const phase = expeditionRun.phase;
  let content = '';

  if (phase === 'choose-aspect') {
    content = `
      <p class="eyebrow">01 / 初始星象</p>
      <h2>这一趟，想怎样整理星光？</h2>
      <p>只选择一种偏好；它会在终局帮助你看见不同的机会。</p>
      <div class="journey-options">
        <button data-journey-action="aspect" data-value="resonance"><b>回响星象</b><small>连续正确交换后，星轨更容易共鸣。</small></button>
        <button data-journey-action="aspect" data-value="meteor"><b>流星星象</b><small>一次多消后，直接标亮一对交换点。</small></button>
        <button data-journey-action="aspect" data-value="spirit"><b>云鲸星象</b><small>更快获得一次温柔的双点指引。</small></button>
      </div>`;
  } else if (phase === 'choose-route') {
    content = `
      <p class="eyebrow">02 / 路线选择</p>
      <h2>云海在两边轻轻分开。</h2>
      <p>晴空一眼可读；迷雾需要点选星点观察。两条路都沿用“两点交换”的规则。</p>
      <div class="journey-options journey-options--two">
        <button data-journey-action="route" data-value="clear"><b>晴空星路</b><small>线路完全可见，直接解开下一张星图。</small></button>
        <button data-journey-action="route" data-value="mist"><b>迷雾星云</b><small>部分线路被云雾遮住；点选星点后查看它的连线。</small></button>
      </div>`;
  } else if (phase === 'spirit-event') {
    content = `
      <p class="eyebrow">05 / 星灵相遇</p>
      <h2>云鲸从星云后游来。</h2>
      <p>它不会替你交换星点，但愿意在终局标亮一对可以直接交换的星点。</p>
      <div class="journey-options journey-options--one">
        <button data-journey-action="spirit"><b>唤醒云鲸</b><small>获得一次“云鲸指引”，然后进入污染天琴座。</small></button>
      </div>`;
  }

  journeyContent.innerHTML = `${content}<button class="journey-back" data-journey-action="leave">返回主页</button>`;
  showOverlay(journeyPanel);
}

function finishExpedition() {
  const chapterId = expeditionRun.chapterId;
  const reward = completedExpeditionIds.includes(chapterId) ? 0 : 3;
  if (reward) {
    completedExpeditionIds = [...completedExpeditionIds, chapterId];
    repairState = { ...repairState, wishes: repairState.wishes + reward };
  }
  mapMessageText = reward
    ? '云海天琴座已经归位。再修复一片天空，新的星象、路线或星灵会加入下一次远征。'
    : '这次远征已经留下星座图鉴记录；去星域地图看看下一片天空。';
  track('expedition_completed', { chapterId, reward, aspect: expeditionRun.chosenAspect, route: expeditionRun.chosenRoute });
  expeditionRun = null;
  resultMode = 'expedition';
  completionReward.textContent = reward ? `完整星座飞入图鉴，你收下了 ${reward} 点章节星愿。` : '完整星座已在图鉴中闪烁。';
  nextButton.textContent = '返回主页';
  openStarMapButton.textContent = '点亮星域';
  render();
  showOverlay(completion);
}

function advanceExpeditionAfterPuzzle() {
  const phase = expeditionRun.phase;

  if (['starter-puzzle', 'route-puzzle', 'merge-puzzle'].includes(phase)) {
    expeditionRun = completeNode(expeditionRun);
    track('trace_granted', { phase, traces: expeditionRun.traces });
    if (expeditionRun.constellationId) track('constellation_formed', { constellationId: expeditionRun.constellationId });
    render();
    if (expeditionRun.phase === 'choose-route') return renderJourneyPanel();
    if (expeditionRun.phase === 'merge-puzzle') return startExpeditionPuzzle('merge');
    return renderJourneyPanel();
  }

  if (['finale-outer', 'finale-fog'].includes(phase)) {
    expeditionRun = completeFinalePhase(expeditionRun);
    track('finale_phase_cleared', { phase });
    if (expeditionRun.phase === 'finale-fog') return startExpeditionPuzzle('finaleFog');
    return finishExpedition();
  }
}

function completeQuickLevel() {
  const reward = rewardFor(level, completedLevelIds);
  if (reward.total) {
    completedLevelIds = [...completedLevelIds, level.id];
    repairState = { ...repairState, wishes: repairState.wishes + reward.total };
  }
  resultMode = 'quick';
  nextButton.textContent = '下一关';
  openStarMapButton.textContent = '点亮星域';
  completionReward.textContent = reward.total
    ? `你收下了 ${reward.base} 点星愿${reward.chapterBonus ? `，并获得 ${reward.chapterBonus} 点章节奖励。` : '。'}`
    : '这张星图已完成首通，星愿已经收下。';
  render();
  showOverlay(completion);
}

function completeLevel() {
  if (complete) return;
  complete = true;
  render();
  if (mode === 'quick') return completeQuickLevel();
  window.setTimeout(() => {
    complete = false;
    advanceExpeditionAfterPuzzle();
  }, 420);
}

function selectNode(nodeId) {
  if (screen !== 'puzzle' || complete) return;
  if (!selectedNode) {
    selectedNode = nodeId;
    hintMessage = level.mist
      ? `已选「${nodeById(nodeId).label}」；它承载的雾中星轨已经显露，再选择交换对象。`
      : `已选「${nodeById(nodeId).label}」；再点击另一颗星来交换星轨`;
    return render();
  }

  if (selectedNode === nodeId) {
    selectedNode = null;
    hintMessage = '已取消选择；依次点击两个星点，交换它们的星轨';
    return render();
  }

  const before = countCrossings(level);
  level = swapNodeTrails(level, selectedNode, nodeId);
  selectedNode = null;
  const after = countCrossings(level);
  const removedCrossings = before - after;
  const previousAspectHint = expeditionRun?.aspectHintActive;
  if (mode === 'expedition') expeditionRun = recordExchange(expeditionRun, removedCrossings);

  if (removedCrossings > 0 && expeditionRun?.chosenAspect === 'resonance' && !previousAspectHint && expeditionRun.aspectHintActive) {
    hintMessage = '连续净解引发回响，蓝色光带已经连向下一对交换点。';
    showEffectCallout('resonance', '星轨共鸣', '连续两次净解达成；回响光带指向下一对交换点。');
  } else if (removedCrossings >= 2 && expeditionRun?.chosenAspect === 'meteor' && !previousAspectHint && expeditionRun.aspectHintActive) {
    hintMessage = '一步多消唤醒流星，金色尾迹已经指向下一对交换点。';
    showEffectCallout('meteor', '流星坠落', `一次净除 ${removedCrossings} 处交叉；金色尾迹指向下一对交换点。`);
  } else if (removedCrossings > 0 && expeditionRun?.chosenAspect === 'spirit' && expeditionRun.aspectCharge) {
    hintMessage = '云鲸听见了正确的回应；终局将多保留一次温柔指引。';
  } else {
    hintMessage = removedCrossings > 0 ? '星轨回应了你的判断；继续寻找不再相交的轨道。' : '星轨已交换；温柔地再试一次也没关系。';
  }
  render();
  if (after === 0) completeLevel();
}

function advanceQuickLevel() {
  levelIndex = nextLevelIndexInRegion(levelIndex);
  startQuick(levelIndex);
}

function enterRegion(repairId) {
  const index = repairId ? firstLevelIndexForRepair(repairId) : 0;
  startQuick(index);
  if (repairId) {
    const repair = repairs.find((candidate) => candidate.id === repairId);
    hintMessage = `「${repair.unlocks}」已点亮；这里有新的星轨在等你。`;
    render();
  }
}

function unlockSkyRepair(repairId) {
  const nextState = unlockRepair(repairState, repairId);
  if (nextState === repairState) return;
  repairState = nextState;
  const repair = repairs.find((candidate) => candidate.id === repairId);
  mapMessageText = `「${repair.name}」已点亮。下一次远征会逐渐拥有更多星象、路线或星灵。`;
  render();
  renderStarMap();
  track('repair_preview_seen', { repairId });
}

function requestHome() {
  if (expeditionRun) {
    showOverlay(leaveDialog);
    return;
  }
  showHome();
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

document.querySelector('#reset-button').addEventListener('click', () => {
  level = structuredClone(levelTemplate);
  selectedNode = null;
  complete = false;
  hintMessage = '重新整理这张星图；星点的位置始终不会移动。';
  hideOverlay(completion);
  render();
});
document.querySelector('#home-button').addEventListener('click', requestHome);
spiritButton.addEventListener('click', () => {
  expeditionRun = useSpirit(expeditionRun);
  hintMessage = '云鲸标亮了一对可以直接交换的星点。';
  showEffectCallout('spirit', '云鲸引航', '云鲸留下蓝白光带，标亮一对可以直接交换的星点。');
  track('spirit_used', { phase: expeditionRun.phase });
  render();
});
nextButton.addEventListener('click', () => {
  if (resultMode === 'expedition') return showHome();
  advanceQuickLevel();
});
starMapButton.addEventListener('click', openStarMap);
openStarMapButton.addEventListener('click', openStarMap);
closeStarMapButton.addEventListener('click', closeStarMap);
homeScreen.addEventListener('click', (event) => {
  const button = event.target.closest('[data-home-action]');
  if (!button) return;
  if (button.dataset.homeAction === 'quick') startQuick(levelIndex);
  if (button.dataset.homeAction === 'expedition') startExpedition();
  if (button.dataset.homeAction === 'atlas') openStarMap();
});
journeyPanel.addEventListener('click', (event) => {
  const button = event.target.closest('[data-journey-action]');
  if (!button) return;
  const { journeyAction, value } = button.dataset;
  if (journeyAction === 'aspect') {
    expeditionRun = chooseAspect(expeditionRun, value);
    track('aspect_chosen', { aspect: value });
    startExpeditionPuzzle('starter');
  }
  if (journeyAction === 'route') {
    expeditionRun = chooseRoute(expeditionRun, value);
    track('route_chosen', { route: value });
    startExpeditionPuzzle(value);
  }
  if (journeyAction === 'spirit') {
    expeditionRun = acceptSpirit(expeditionRun);
    track('spirit_joined', { spirit: expeditionRun.spirit.id });
    startExpeditionPuzzle('finaleOuter');
  }
  if (journeyAction === 'leave') requestHome();
});
document.querySelector('#stay-expedition-button').addEventListener('click', () => hideOverlay(leaveDialog));
document.querySelector('#leave-expedition-button').addEventListener('click', () => {
  expeditionRun = abandonExpedition(expeditionRun);
  track('expedition_abandoned');
  showHome();
});
regionList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-map-action]');
  if (!button || button.disabled) return;
  if (button.dataset.mapAction === 'unlock') unlockSkyRepair(button.dataset.repairId);
  if (button.dataset.mapAction === 'enter') enterRegion(button.dataset.repairId || null);
});

showHome();
