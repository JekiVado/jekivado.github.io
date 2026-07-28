const layouts = [
  { points: [[50, 17], [83, 50], [50, 83], [17, 50]], edges: [['a', 'c'], ['b', 'd']] },
  { points: [[14, 42], [31, 17], [68, 17], [86, 42], [71, 78], [29, 78]], edges: [['a', 'e'], ['e', 'c'], ['c', 'd'], ['d', 'b'], ['b', 'f']] },
  { points: [[14, 48], [25, 18], [50, 11], [76, 18], [87, 48], [74, 80], [50, 89], [26, 80]], edges: [['a', 'f'], ['f', 'g'], ['g', 'd'], ['d', 'e'], ['e', 'b'], ['b', 'c'], ['c', 'h']] }
];

const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const scenes = ['dawn-arch', 'cloud-stairs', 'moon-well', 'sun-gate', 'mist-bridge', 'paper-tower', 'quiet-court', 'hanging-garden', 'halo-terrace', 'far-observatory', 'river-steps', 'open-sky'];
const constellations = ['晨星座', '微光座', '愿望座', '灯影座', '云门座', '桥光座', '月庭座', '星花座', '回环座', '云塔座', '星河座', '天穹座'];

function level(id, title, layoutIndex, labels, transform = {}) {
  const layout = layouts[layoutIndex];
  const index = Number(id.slice(-2)) - 1;
  return {
    id,
    title,
    themeId: index < 4 ? 'moon-court' : index < 8 ? 'cloud-bridge' : 'sky-observatory',
    scene: scenes[index],
    constellation: constellations[index],
    nodes: layout.points.map(([x, y], index) => ({
      id: ids[index],
      x: transform.flipX ? 100 - x : x,
      y: transform.flipY ? 100 - y : y,
      label: labels[index]
    })),
    edges: layout.edges.map(([from, to]) => [from, to])
  };
}

export const collectionLevels = [
  level('moon-court-01', '初醒 · 01', 0, ['晨', '星', '云', '愿']),
  level('moon-court-02', '流光 · 02', 1, ['晨', '云', '微', '光', '愿', '梦']),
  level('moon-court-03', '星愿 · 03', 2, ['晨', '云', '微', '光', '愿', '澜', '星', '梦']),
  level('moon-court-04', '灯影 · 04', 0, ['灯', '云', '曦', '辉']),
  level('moon-court-05', '云门 · 05', 1, ['门', '云', '路', '光', '柔', '梦']),
  level('moon-court-06', '桥光 · 06', 2, ['桥', '星', '河', '岸', '月', '风', '桥', '梦']),
  level('moon-court-07', '月庭 · 07', 0, ['月', '台', '庭', '光'], { flipX: true }),
  level('moon-court-08', '星花 · 08', 1, ['花', '星', '露', '晨', '云', '愿'], { flipX: true }),
  level('moon-court-09', '回环 · 09', 2, ['环', '月', '台', '光', '星', '云', '桥', '愿'], { flipX: true }),
  level('moon-court-10', '云塔 · 10', 0, ['塔', '云', '望', '月'], { flipY: true }),
  level('moon-court-11', '星河 · 11', 1, ['河', '星', '雾', '光', '桥', '梦'], { flipY: true }),
  level('moon-court-12', '苏醒 · 12', 2, ['月', '塔', '云', '门', '星', '桥', '河', '庭'], { flipY: true })
];

export function nextCollectionLevelIndex(index) {
  return (index + 1) % collectionLevels.length;
}

export function firstUnlitLevelIndex(themeId, completedLevelIds = new Set()) {
  const firstThemeLevel = collectionLevels.findIndex((level) => level.themeId === themeId);
  const nextUnlit = collectionLevels.findIndex(
    (level) => level.themeId === themeId && !completedLevelIds.has(level.id)
  );
  return nextUnlit === -1 ? firstThemeLevel : nextUnlit;
}
