export const levels = [
  {
    title: '初醒 · 01',
    nodes: [
      { id: 'a', x: 20, y: 25, label: '晨' }, { id: 'b', x: 80, y: 75, label: '愿' },
      { id: 'c', x: 20, y: 75, label: '云' }, { id: 'd', x: 80, y: 25, label: '星' }
    ],
    edges: [['a', 'b'], ['c', 'd']]
  },
  {
    title: '流光 · 02',
    nodes: [
      { id: 'a', x: 15, y: 70, label: '晨' }, { id: 'b', x: 26, y: 22, label: '云' },
      { id: 'c', x: 48, y: 15, label: '微' }, { id: 'd', x: 82, y: 28, label: '光' },
      { id: 'e', x: 74, y: 78, label: '愿' }, { id: 'f', x: 38, y: 83, label: '梦' }
    ],
    edges: [['a', 'e'], ['e', 'c'], ['c', 'd'], ['d', 'b'], ['b', 'f']]
  },
  {
    title: '星愿 · 03',
    nodes: [
      { id: 'a', x: 14, y: 70, label: '晨' }, { id: 'b', x: 22, y: 26, label: '云' },
      { id: 'c', x: 42, y: 14, label: '微' }, { id: 'd', x: 70, y: 22, label: '光' },
      { id: 'e', x: 88, y: 48, label: '愿' }, { id: 'f', x: 74, y: 78, label: '澜' },
      { id: 'g', x: 40, y: 84, label: '星' }, { id: 'h', x: 50, y: 52, label: '梦' }
    ],
    edges: [['a', 'f'], ['f', 'c'], ['c', 'g'], ['g', 'e'], ['e', 'b'], ['b', 'd'], ['d', 'h']]
  }
];

export function nextLevelIndex(index) {
  return (index + 1) % levels.length;
}
