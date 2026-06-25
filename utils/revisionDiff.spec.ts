import { describe, it, expect } from 'vitest';
import {
  buildDiffLineRows,
  collapseDiffRows,
  expandDiffRows,
  type DiffLineRow,
} from './revisionDiff';

const contextRow = (n: number): DiffLineRow => ({
  type: 'line',
  key: `line-${n}`,
  oldLineNumber: n,
  newLineNumber: n,
  leftText: `line ${n}`,
  rightText: `line ${n}`,
  leftKind: 'context',
  rightKind: 'context',
  isContext: true,
});

const changedRow = (n: number): DiffLineRow => ({
  ...contextRow(n),
  rightText: 'changed',
  rightKind: 'added',
  isContext: false,
});

describe('buildDiffLineRows', () => {
  it('marks every row as context for identical content', () => {
    const rows = buildDiffLineRows({
      oldContent: 'hello\nworld',
      newContent: 'hello\nworld',
    });
    expect(rows.every((r) => r.isContext)).toBe(true);
  });

  it('emits an added row when a line is appended', () => {
    const rows = buildDiffLineRows({
      oldContent: 'hello',
      newContent: 'hello\nworld',
    });
    expect(rows.some((r) => r.rightKind === 'added')).toBe(true);
  });

  it('numbers the first line starting at 1', () => {
    const rows = buildDiffLineRows({
      oldContent: 'a\nb',
      newContent: 'a\nb',
    });
    expect(rows[0].oldLineNumber).toBe(1);
  });
});

describe('collapseDiffRows', () => {
  it('returns the rows unchanged when nothing changed', () => {
    const rows = [contextRow(1), contextRow(2)];
    expect(collapseDiffRows({ rows })).toBe(rows);
  });

  it('collapses context far from any change', () => {
    const rows = [
      contextRow(1),
      contextRow(2),
      contextRow(3),
      contextRow(4),
      contextRow(5),
      changedRow(6),
    ];
    const result = collapseDiffRows({ rows, contextLines: 1 });
    expect(result.some((r) => r.type === 'collapsed')).toBe(true);
  });
});

describe('expandDiffRows', () => {
  const collapsed = {
    type: 'collapsed' as const,
    key: 'collapsed-0-1',
    hiddenCount: 2,
    hiddenRows: [contextRow(1), contextRow(2)],
  };

  it('replaces a collapsed row with its hidden rows when expanded', () => {
    expect(
      expandDiffRows({
        rows: [collapsed],
        expandedChunks: { 'collapsed-0-1': true },
      })
    ).toHaveLength(2);
  });

  it('keeps the collapsed row when not expanded', () => {
    expect(
      expandDiffRows({ rows: [collapsed], expandedChunks: {} })[0].type
    ).toBe('collapsed');
  });
});
