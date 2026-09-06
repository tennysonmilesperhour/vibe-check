import { describe, expect, it } from 'vitest';
import { buildLoomLayout } from '../useLoomLayout.js';

describe('buildLoomLayout', () => {
  it('separates nodes that share a wheel position and keeps their link visible', () => {
    const layout = buildLoomLayout({
      nodes: [
        { id: 'hd', system: 'human_design', label: 'Gate 14', wheelDeg: 222 },
        { id: 'gk', system: 'gene_keys', label: "Life's Work 14", wheelDeg: 222 },
      ],
      edges: [{ a: 'hd', b: 'gk', kind: 'hexagram', why: 'Same hexagram', strength: 2 }],
    });

    expect(layout.nodes[0].anchorX).toBe(layout.nodes[1].anchorX);
    expect(Math.hypot(
      layout.nodes[0].x - layout.nodes[1].x,
      layout.nodes[0].y - layout.nodes[1].y,
    )).toBeGreaterThan(22);
    expect(layout.threads[0].d).toContain(' L ');
  });

  it('uses a shallow local curve instead of pulling connections through the center', () => {
    const layout = buildLoomLayout({
      nodes: [
        { id: 'outer', system: 'astrology', label: 'Sun', wheelDeg: 15 },
        { id: 'inner', system: 'numerology', label: 'Life Path 5', wheelDeg: null },
      ],
      edges: [{ a: 'outer', b: 'inner', kind: 'number', why: 'Exact match', strength: 2 }],
    });

    expect(layout.threads[0].d).toContain(' Q ');
    expect(layout.threads[0].d).not.toContain(` Q ${layout.cx} ${layout.cy} `);
    expect(layout.threads[0].d).not.toContain('NaN');
  });
});
