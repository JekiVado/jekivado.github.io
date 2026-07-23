const routeLayouts = [
  {
    points: [[14, 20], [86, 20], [86, 80], [14, 80]],
    edges: [['a', 'c'], ['b', 'd']]
  },
  {
    points: [[14, 38], [34, 16], [66, 16], [86, 38], [72, 76], [28, 76]],
    edges: [['a', 'e'], ['e', 'c'], ['c', 'd'], ['d', 'b'], ['b', 'f']]
  },
  {
    points: [[14, 47], [25, 18], [50, 11], [76, 18], [87, 47], [74, 78], [50, 88], [26, 78]],
    edges: [['a', 'f'], ['f', 'g'], ['g', 'd'], ['d', 'e'], ['e', 'b'], ['b', 'c'], ['c', 'h']]
  }
];

const nodeIds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function createRouteLevels({ requires, region, titles, labels, chapterBonus, flipX = false, flipY = false }) {
  return routeLayouts.map((layout, stage) => ({
    id: `${requires}-${String(stage + 1).padStart(2, '0')}`,
    requires,
    region,
    title: titles[stage],
    chapterBonus: stage === routeLayouts.length - 1 ? chapterBonus : 0,
    nodes: layout.points.map(([x, y], index) => ({
      id: nodeIds[index],
      x: flipX ? 100 - x : x,
      y: flipY ? 100 - y : y,
      label: labels[stage][index]
    })),
    edges: layout.edges.map(([from, to]) => [from, to])
  }));
}

export const levels = [
  {
    id: 'starter-01',
    title: '初醒 · 01',
    nodes: [
      { id: 'a', x: 20, y: 25, label: '晨' }, { id: 'b', x: 80, y: 75, label: '愿' },
      { id: 'c', x: 20, y: 75, label: '云' }, { id: 'd', x: 80, y: 25, label: '星' }
    ],
    edges: [['a', 'b'], ['c', 'd']]
  },
  {
    id: 'starter-02',
    title: '流光 · 02',
    nodes: [
      { id: 'a', x: 15, y: 70, label: '晨' }, { id: 'b', x: 26, y: 22, label: '云' },
      { id: 'c', x: 48, y: 15, label: '微' }, { id: 'd', x: 82, y: 28, label: '光' },
      { id: 'e', x: 74, y: 78, label: '愿' }, { id: 'f', x: 38, y: 83, label: '梦' }
    ],
    edges: [['a', 'e'], ['e', 'c'], ['c', 'd'], ['d', 'b'], ['b', 'f']]
  },
  {
    id: 'starter-03',
    title: '星愿 · 03',
    nodes: [
      { id: 'a', x: 14, y: 70, label: '晨' }, { id: 'b', x: 22, y: 26, label: '云' },
      { id: 'c', x: 42, y: 14, label: '微' }, { id: 'd', x: 70, y: 22, label: '光' },
      { id: 'e', x: 88, y: 48, label: '愿' }, { id: 'f', x: 74, y: 78, label: '澜' },
      { id: 'g', x: 40, y: 84, label: '星' }, { id: 'h', x: 50, y: 52, label: '梦' }
    ],
    edges: [['a', 'f'], ['f', 'c'], ['c', 'g'], ['g', 'e'], ['e', 'b'], ['b', 'd'], ['d', 'h']]
  },
  ...createRouteLevels({
    requires: 'cloud-lamp',
    region: '云灯之径',
    titles: ['灯影 · 04', '云灯 · 05', '微光 · 06'],
    labels: [['灯', '云', '曦', '辉'], ['灯', '云', '路', '光', '柔', '梦'], ['灯', '云', '微', '光', '星', '尘', '路', '梦']],
    chapterBonus: 3
  }),
  ...createRouteLevels({
    requires: 'star-bridge',
    region: '星桥回廊',
    titles: ['桥光 · 07', '渡星 · 08', '回响 · 09'],
    labels: [['桥', '星', '河', '岸'], ['桥', '星', '河', '渡', '回', '响'], ['桥', '星', '河', '夜', '岸', '回', '响', '梦']],
    chapterBonus: 7,
    flipX: true
  }),
  ...createRouteLevels({
    requires: 'sky-observatory',
    region: '月台观星',
    titles: ['望月 · 10', '月台 · 11', '远星 · 12'],
    labels: [['望', '月', '台', '夜'], ['望', '月', '台', '观', '星', '远'], ['望', '月', '台', '夜', '观', '星', '远', '梦']],
    chapterBonus: 0,
    flipY: true
  })
];

export function firstLevelIndexForRepair(repairId) {
  return levels.findIndex((level) => level.requires === repairId);
}

export function nextLevelIndex(index, unlocked = []) {
  const playableIndexes = levels
    .map((level, levelIndex) => ({ level, levelIndex }))
    .filter(({ level }) => !level.requires || unlocked.includes(level.requires))
    .map(({ levelIndex }) => levelIndex);
  const currentPosition = playableIndexes.indexOf(index);

  if (currentPosition === -1) return playableIndexes[0];
  return playableIndexes[(currentPosition + 1) % playableIndexes.length];
}
