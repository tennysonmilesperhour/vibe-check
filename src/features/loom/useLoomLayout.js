// Layout math for the Loom: positions every graph node on the wheel,
// shapes thread paths, and exposes ring geometry. Pure; no React state.
import { useMemo } from 'react';
import { polar, degToWheel } from '@/lib/geometry';

export const THREAD_COLORS = {
  hexagram: 'var(--gh-gold)',
  number: 'var(--gh-rose)',
  astro: 'var(--gh-peach)',
  center: 'var(--gh-amber)',
};

export function buildLoomLayout(graph, size = 400) {
  const cx = size / 2;
  const cy = size / 2;
  const rZodiac = size * 0.462;
  const rGates = size * 0.42;
  const rPlaced = size * 0.35;
  const rInner = size * 0.19;
  const wheelNodes = graph.nodes.filter((node) => node.wheelDeg != null);
  const innerNodes = graph.nodes.filter((node) => node.wheelDeg == null);
  const clusters = new Map();

  for (const node of wheelNodes) {
    const key = Number(node.wheelDeg).toFixed(4);
    const cluster = clusters.get(key) || [];
    cluster.push(node);
    clusters.set(key, cluster);
  }

  // Placements can truthfully share one wheel degree. Keep their common anchor,
  // then fan the emblems along its tangent so no meaning is hidden by overlap.
  const positionedWheel = [];
  for (const cluster of clusters.values()) {
    const angle = degToWheel(cluster[0].wheelDeg);
    const [anchorX, anchorY] = polar(cx, cy, rPlaced, angle);
    const angleRad = ((angle - 90) * Math.PI) / 180;
    const tangentX = -Math.sin(angleRad);
    const tangentY = Math.cos(angleRad);
    const spacing = size * 0.065;

    cluster.forEach((node, index) => {
      const offset = (index - (cluster.length - 1) / 2) * spacing;
      positionedWheel.push({
        ...node,
        x: anchorX + tangentX * offset,
        y: anchorY + tangentY * offset,
        anchorX,
        anchorY,
        angle,
        ring: 'wheel',
      });
    });
  }

  const positionedInner = innerNodes.map((node, index) => {
    const angle = (index * 360) / Math.max(innerNodes.length, 1);
    const [x, y] = polar(cx, cy, rInner, angle);
    return { ...node, x, y, anchorX: x, anchorY: y, angle, ring: 'inner' };
  });

  const positioned = [...positionedWheel, ...positionedInner];
  const byId = Object.fromEntries(positioned.map((node) => [node.id, node]));
  const bendDirection = { hexagram: 1, number: -1, astro: 1, center: -1 };

  const threads = graph.edges
    .filter((edge) => byId[edge.a] && byId[edge.b])
    .map((edge) => {
      const a = byId[edge.a];
      const b = byId[edge.b];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy);
      const sameAnchor = Math.hypot(b.anchorX - a.anchorX, b.anchorY - a.anchorY) < 0.5;
      let d = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;

      // Short links make shared positions read as a cluster. Longer links take
      // a shallow side bend, avoiding the false visual hub at the wheel center.
      if (!sameAnchor && length > size * 0.08) {
        const normalX = -dy / length;
        const normalY = dx / length;
        const bend = Math.min(size * 0.055, length * 0.12) * (bendDirection[edge.kind] || 1);
        const controlX = (a.x + b.x) / 2 + normalX * bend;
        const controlY = (a.y + b.y) / 2 + normalY * bend;
        d = `M ${a.x} ${a.y} Q ${controlX} ${controlY} ${b.x} ${b.y}`;
      }

      return {
        ...edge,
        d,
        color: THREAD_COLORS[edge.kind] || 'var(--gh-cream)',
      };
    });

  return { cx, cy, rZodiac, rGates, rPlaced, rInner, nodes: positioned, threads };
}

export function useLoomLayout(graph, size = 400) {
  return useMemo(() => buildLoomLayout(graph, size), [graph, size]);
}
