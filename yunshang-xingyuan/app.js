import { countCrossings, exchangeOutcome } from './game.js';
import { collectionLevels, firstUnlitLevelIndex } from './levels.js';
import { themePaintings } from './themes.js';

const app = document.querySelector('#app');
let levelIndex = 0;
let board = structuredClone(collectionLevels[levelIndex]);
let selected = [];
let lastExchange = null;
let message = '依次点亮两个星点，交换它们承载的星轨。';
let view = 'menu';
const completedLevelIds = new Set();

function resetBoard(index = levelIndex) {
  levelIndex = index;
  board = structuredClone(collectionLevels[index]);
  selected = [];
  lastExchange = null;
}

function currentTheme() {
  return themePaintings.find((theme) => theme.id === collectionLevels[levelIndex].themeId);
}

function themeLevels(themeId) {
  return collectionLevels.filter((level) => level.themeId === themeId);
}

function openTheme(themeId) {
  resetBoard(firstUnlitLevelIndex(themeId, completedLevelIds));
  view = 'theme';
}

function selectNode(id) {
  if (countCrossings(board) === 0) return;
  const nextSelected = selected.includes(id) ? selected.filter((nodeId) => nodeId !== id) : [...selected, id].slice(-2);
  if (nextSelected.length < 2) {
    selected = nextSelected;
    lastExchange = null;
    message = `已选「${board.nodes.find((node) => node.id === id).label}」，再选一个星点。`;
    render();
    return;
  }
  const outcome = exchangeOutcome(board, ...nextSelected);
  board = outcome.board;
  selected = [];
  lastExchange = outcome;
  if (outcome.cleared) completedLevelIds.add(collectionLevels[levelIndex].id);
  message = outcome.cleared
    ? `「${collectionLevels[levelIndex].title}」的主题切片已点亮。`
    : outcome.removed
      ? `亮线舒展：解开 ${outcome.removed} 处交叉。`
      : '星轨轻轻换位了；这次没有解开交叉，再试一组。';
  render();
}

function startNextThemeSlice() {
  resetBoard(firstUnlitLevelIndex(currentTheme().id, completedLevelIds));
  message = '新切片已展开，继续把星光送回它们的轨道。';
  view = 'play';
  render();
}

function boardMarkup() {
  const selectedNodes = new Set(selected);
  const glowing = lastExchange?.removed > 0;
  const lines = board.edges.map(([from, to]) => {
    const a = board.nodes.find((node) => node.id === from);
    const b = board.nodes.find((node) => node.id === to);
    return `<line class="${glowing ? 'glow' : ''}" x1="${a.x}%" y1="${a.y}%" x2="${b.x}%" y2="${b.y}%" />`;
  }).join('');
  const nodes = board.nodes.map((node) => `<button class="star ${selectedNodes.has(node.id) ? 'selected' : ''}" aria-label="星点 ${node.id}" data-node="${node.id}" style="--x:${node.x}%;--y:${node.y}%"><i></i><span>${node.label}</span></button>`).join('');
  const sparkles = glowing ? '<div class="sparkles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' : '';
  const level = collectionLevels[levelIndex];
  const constellation = countCrossings(board) === 0 ? `<div class="constellation-mark" aria-live="polite"><div class="catalogue-seal"><span>✦</span><p>${currentTheme().title} · 切片点亮</p><b>星座已点亮</b><small>去看看主题画的新一片光</small></div></div>` : '';
  const anchors = board.nodes.map((node) => `<i class="scene-anchor" style="--x:${node.x}%;--y:${node.y}%"></i>`).join('');
  const scene = `<div class="dream-scene scene-${level.scene}" aria-hidden="true"><i class="scene-orb"></i><i class="scene-portal"></i><i class="scene-terrace terrace-a"></i><i class="scene-terrace terrace-b"></i><i class="scene-ribbon"></i>${anchors}</div>`;
  return `<section class="sky-board layout-${board.nodes.length} ${glowing ? 'exchange-glow' : ''}" aria-label="${level.constellation}星图">${scene}<svg viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>${sparkles}${nodes}${constellation}</section>`;
}

function renderPlay() {
  const level = collectionLevels[levelIndex];
  const theme = currentTheme();
  const cleared = countCrossings(board) === 0;
  const sliceIndex = themeLevels(theme.id).findIndex((item) => item.id === level.id) + 1;
  return `<div class="shell"><header><button class="round" aria-label="查看主题画和点亮进度" data-action="menu">☰</button><div class="title-block"><p>${theme.title} · 第 ${sliceIndex} 片</p><h1>${level.title}</h1></div><button class="catalogue-count" aria-label="查看${theme.title}主题画" data-action="theme">${String(sliceIndex).padStart(2, '0')} <i>/</i> 04</button></header><section class="intro"><span>${level.constellation} · 20–45 秒</span><h2>把交错的星光<br>安放回它原来的位置</h2><p>先后触碰两颗星点，它们承载的星轨便会交换。</p></section>${boardMarkup()}<section class="status"><span>星轨缠结 <b>${countCrossings(board)} 处交叉</b></span><p>${message}</p>${cleared ? '<div class="clear-actions"><button class="secondary" data-action="restart">重看这一关</button><button class="primary" data-action="theme">点亮主题画 <em>→</em></button></div>' : '<button class="quiet-reset" data-action="restart">重置本关</button>'}</section></div>`;
}

function menuMural(theme) {
  const levels = themeLevels(theme.id);
  return `<div class="menu-mural mural-${theme.id}" aria-hidden="true">${levels.map((level, index) => `<i class="menu-slice ${completedLevelIds.has(level.id) ? 'lit' : ''}" style="--slice:${index}"></i>`).join('')}<b>✦</b></div>`;
}

function renderMenu() {
  const totalLit = completedLevelIds.size;
  const cards = themePaintings.map((theme) => {
    const levels = themeLevels(theme.id);
    const lit = levels.filter((level) => completedLevelIds.has(level.id)).length;
    return `<button class="theme-menu-card" data-theme-menu="${theme.id}" aria-label="${theme.menuTitle}：${theme.title}，已点亮 ${lit} / 4">${menuMural(theme)}<span class="theme-card-meta">主题画 · ${lit} / 4</span><b>${theme.title}</b><small>${theme.subtitle}</small><em>${theme.menuTitle} <i>→</i></em></button>`;
  }).join('');
  return `<div class="shell menu-shell"><header><span class="menu-sigil">✦</span><div class="title-block"><p>云上星愿 · 主题画书</p><h1>点亮中的天空</h1></div><span class="catalogue-count">${totalLit} <i>/</i> 12</span></header><section class="menu-intro"><span>当前试玩会话</span><h2>查看主题画<br>与每一片星光</h2><p>每完成一关，主题画会亮起一片；四片相连，景观便完整复苏。</p></section><section class="theme-menu-list">${cards}</section><p class="menu-note">选择一幅主题画，可查看切片进度并继续下一片。</p></div>`;
}

function renderTheme() {
  const theme = currentTheme();
  const levels = themeLevels(theme.id);
  const isComplete = levels.every((level) => completedLevelIds.has(level.id));
  const litCount = levels.filter((level) => completedLevelIds.has(level.id)).length;
  const slices = levels.map((level, index) => {
    const lit = completedLevelIds.has(level.id);
    const current = lit && level.id === collectionLevels[levelIndex].id;
    return `<div class="mural-slice ${lit ? 'lit' : ''} ${current ? 'current' : ''}" style="--slice:${index}"><span>${String(index + 1).padStart(2, '0')}</span><small>${level.title.split(' · ')[0]}</small>${lit ? '<em>已点亮</em>' : ''}</div>`;
  }).join('');
  const nextLabel = isComplete ? '重看第一片' : litCount === 0 ? '开始第一片' : `继续第 ${String(litCount + 1).padStart(2, '0')} 片`;
  return `<div class="shell theme-shell"><header><button class="round" aria-label="查看主题画和点亮进度" data-action="menu">☰</button><div class="title-block"><p>主题画进度 · ${litCount} / 4</p><h1>${theme.title}</h1></div><span class="catalogue-count">四片一画</span></header><section class="theme-intro"><span>${isComplete ? '整幅画已复苏' : '每完成一关，点亮一片'}</span><h2>${isComplete ? theme.completion : theme.subtitle}</h2></section><section class="theme-mural mural-${theme.id} ${isComplete ? 'is-complete' : ''}" aria-label="${theme.title}主题画">${slices}<div class="mural-glow" aria-hidden="true">✦</div></section><p class="theme-note">${isComplete ? '四张星图的光已经连成完整景观。' : '暗下的切片仍在等待对应关卡的星光。'}</p><div class="clear-actions theme-actions"><button class="secondary" data-action="back">回到关卡</button><button class="primary" data-action="next">${nextLabel} <em>→</em></button></div></div>`;
}

function render() {
  app.innerHTML = view === 'menu' ? renderMenu() : view === 'theme' ? renderTheme() : renderPlay();
  app.querySelectorAll('[data-node]').forEach((button) => button.addEventListener('click', () => selectNode(button.dataset.node)));
  app.querySelectorAll('[data-theme-menu]').forEach((button) => button.addEventListener('click', () => { openTheme(button.dataset.themeMenu); render(); }));
  app.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.action === 'theme') { view = 'theme'; render(); }
    if (button.dataset.action === 'menu') { view = 'menu'; render(); }
    if (button.dataset.action === 'back') { view = 'play'; render(); }
    if (button.dataset.action === 'next') startNextThemeSlice();
    if (button.dataset.action === 'restart') { resetBoard(); message = '本关已重置。'; render(); }
  }));
}

render();
