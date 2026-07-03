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

export function useLoomLayout(graph, size = 400) {
  return useMemo(() => {
    const cx = size / 2;
    const cy = size / 2;
    const rZodiac = size * 0.462;   // sign ring
    const rGates = size * 0.42;     // 64-tick ring
    const rPlaced = size * 0.35;    // wheel-positioned nodes
    const rInner = size * 0.175;    // degree-less nodes

    const wheelNodes = graph.nodes.filter((n) => n.wheelDeg != null);
    const innerNodes = graph.nodes.filter((n) => n.wheelDeg == null);

    const positioned = [
      ...wheelNodes.map((node) => {
        const angle = degToWheel(node.wheelDeg);
        const [x, y] = polar(cx, cy, rPlaced, angle);
        return { ...node, x, y, angle, ring: 'wheel' };
      }),
      ...innerNodes.map((node, i) => {
        const angle = -90 + (i * 360) / Math.max(innerNodes.length, 1);
        const [x, y] = polar(cx, cy, rInner, angle + 90); // polar() already treats 0 as up
        return { ...node, x, y, angle, ring: 'inner' };
      }),
    ];

    const byId = Object.fromEntries(positioned.map((n) => [n.id, n]));

    const threads = graph.edges
      .filter((e) => byId[e.a] && byId[e.b])
      .map((edge) => {
        const a = byId[edge.a];
        const b = byId[edge.b];
        // curve through a control point pulled toward the center
        const mx = (a.x + b.x) / 2 + (cx - (a.x + b.x) / 2) * 0.55;
        const my = (a.y + b.y) / 2 + (cy - (a.y + b.y) / 2) * 0.55;
        return {
          ...edge,
          d: `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`,
          color: THREAD_COLORS[edge.kind] || 'var(--gh-cream)',
        };
      });

    return { cx, cy, rZodiac, rGates, rPlaced, rInner, nodes: positioned, threads };
  }, [graph, size]);
}
