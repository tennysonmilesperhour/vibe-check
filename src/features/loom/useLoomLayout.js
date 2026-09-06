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

// The seven seats are stable across profiles. Two systems usually express on
// the outer wheel, so their unoccupied vertices remain visible as part of the
// sevenfold construction instead of causing the other placements to jump.
const SYSTEM_SEAT = {
  astrology: 0,
  human_design: 1,
  numerology: 2,
  tarot_archetype: 3,
  gene_keys: 4,
  enneagram: 5,
  chakras: 6,
};

export function buildLoomLayout(graph, size = 400) {
  const cx = size / 2;
  const cy = size / 2;
  const rZodiac = size * 0.462;
  const rGates = size * 0.42;
  const rPlaced = size * 0.35;
  const rInner = size * 0.218;
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
    const spacing = size * 0.075;

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
    const seat = SYSTEM_SEAT[node.system] ?? index;
    const angle = (seat * 360) / 7;
    const [x, y] = polar(cx, cy, rInner, angle);
    return { ...node, x, y, anchorX: x, anchorY: y, angle, ring: 'inner' };
  });

  const positioned = [...positionedWheel, ...positionedInner];
  const byId = Object.fromEntries(positioned.map((node) => [node.id, node]));
  const threads = graph.edges
    .filter((edge) => byId[edge.a] && byId[edge.b])
    .map((edge) => {
      const a = byId[edge.a];
      const b = byId[edge.b];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy);
      const nodeRadius = size * 0.028;
      const trim = Math.min(nodeRadius, Math.max(0, length / 2 - size * 0.005));
      const ux = length ? dx / length : 0;
      const uy = length ? dy / length : 0;
      const x1 = a.x + ux * trim;
      const y1 = a.y + uy * trim;
      const x2 = b.x - ux * trim;
      const y2 = b.y - uy * trim;

      // A correspondence is a literal chord between its two placements. The
      // geometry supplies the structure, so there is no arbitrary curve or hub.
      const d = `M ${x1} ${y1} L ${x2} ${y2}`;

      return {
        ...edge,
        d,
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2,
        color: THREAD_COLORS[edge.kind] || 'var(--gh-cream)',
      };
    });

  return { cx, cy, rZodiac, rGates, rPlaced, rInner, nodes: positioned, threads };
}

export function useLoomLayout(graph, size = 400) {
  return useMemo(() => buildLoomLayout(graph, size), [graph, size]);
}
