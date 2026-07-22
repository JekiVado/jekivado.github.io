function orientation(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function liesOnSegment(a, b, point) {
  return (
    Math.min(a.x, b.x) <= point.x && point.x <= Math.max(a.x, b.x) &&
    Math.min(a.y, b.y) <= point.y && point.y <= Math.max(a.y, b.y)
  );
}

function segmentsIntersect(a, b, c, d) {
  const first = orientation(a, b, c);
  const second = orientation(a, b, d);
  const third = orientation(c, d, a);
  const fourth = orientation(c, d, b);

  if (first === 0 && liesOnSegment(a, b, c)) return true;
  if (second === 0 && liesOnSegment(a, b, d)) return true;
  if (third === 0 && liesOnSegment(c, d, a)) return true;
  if (fourth === 0 && liesOnSegment(c, d, b)) return true;

  return (first > 0) !== (second > 0) && (third > 0) !== (fourth > 0);
}

function nodeMap(level) {
  return new Map(level.nodes.map((node) => [node.id, node]));
}

export function connectionCounts(level) {
  const counts = new Map(level.nodes.map((node) => [node.id, 0]));
  for (const [from, to] of level.edges) {
    counts.set(from, counts.get(from) + 1);
    counts.set(to, counts.get(to) + 1);
  }
  return counts;
}

export function countCrossings(level) {
  const nodes = nodeMap(level);
  let crossings = 0;

  for (let index = 0; index < level.edges.length; index += 1) {
    const [firstStart, firstEnd] = level.edges[index];
    for (let candidate = index + 1; candidate < level.edges.length; candidate += 1) {
      const [secondStart, secondEnd] = level.edges[candidate];
      const sharesNode = [firstStart, firstEnd].some((id) => id === secondStart || id === secondEnd);
      if (sharesNode) continue;

      if (segmentsIntersect(nodes.get(firstStart), nodes.get(firstEnd), nodes.get(secondStart), nodes.get(secondEnd))) {
        crossings += 1;
      }
    }
  }

  return crossings;
}

export function swapNodeTrails(level, firstNodeId, secondNodeId) {
  if (firstNodeId === secondNodeId) return structuredClone(level);

  const swapEndpoint = (nodeId) => {
    if (nodeId === firstNodeId) return secondNodeId;
    if (nodeId === secondNodeId) return firstNodeId;
    return nodeId;
  };

  return {
    ...level,
    nodes: level.nodes.map((node) => ({ ...node })),
    edges: level.edges.map(([from, to]) => [swapEndpoint(from), swapEndpoint(to)])
  };
}

export function progressFor(level, stars) {
  const crossings = countCrossings(level);
  return {
    crossings,
    cleared: crossings === 0,
    stars: crossings === 0 ? stars : 0
  };
}

export function repairFor(wishes, cost = 3) {
  return { repaired: Math.floor(wishes / cost), remainder: wishes % cost, cost };
}
