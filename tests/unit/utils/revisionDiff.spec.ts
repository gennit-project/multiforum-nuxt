import { describe, expect, it } from 'vitest';
import {
  buildDiffLineRows,
  collapseDiffRows,
  expandDiffRows,
} from '@/utils/revisionDiff';

describe('buildDiffLineRows', () => {
  it('pairs a replaced line into one left/right diff row', () => {
    const rows = buildDiffLineRows({
      oldContent: 'line 1\nold line\nline 3\n',
      newContent: 'line 1\nnew line\nline 3\n',
    });

    expect(rows[1]).toEqual({
      type: 'line',
      key: 'line-1',
      oldLineNumber: 2,
      newLineNumber: 2,
      leftText: 'old line',
      rightText: 'new line',
      leftKind: 'removed',
      rightKind: 'added',
      isContext: false,
    });
  });

  it('handles empty old content (pure addition)', () => {
    const rows = buildDiffLineRows({
      oldContent: '',
      newContent: 'new line 1\nnew line 2\n',
    });

    expect(rows.every((row) => row.rightKind === 'added')).toBe(true);
    expect(rows.every((row) => row.leftKind === 'empty')).toBe(true);
    expect(rows.length).toBe(2);
  });

  it('handles empty new content (pure deletion)', () => {
    const rows = buildDiffLineRows({
      oldContent: 'old line 1\nold line 2\n',
      newContent: '',
    });

    expect(rows.every((row) => row.leftKind === 'removed')).toBe(true);
    expect(rows.every((row) => row.rightKind === 'empty')).toBe(true);
    expect(rows.length).toBe(2);
  });

  it('handles both empty content', () => {
    const rows = buildDiffLineRows({
      oldContent: '',
      newContent: '',
    });

    expect(rows).toEqual([]);
  });

  it('handles identical content', () => {
    const rows = buildDiffLineRows({
      oldContent: 'same line\n',
      newContent: 'same line\n',
    });

    expect(rows.length).toBe(1);
    expect(rows[0]!.isContext).toBe(true);
    expect(rows[0]!.leftKind).toBe('context');
    expect(rows[0]!.rightKind).toBe('context');
  });

  it('handles lines added in the middle', () => {
    const rows = buildDiffLineRows({
      oldContent: 'line 1\nline 2\n',
      newContent: 'line 1\nnew middle line\nline 2\n',
    });

    const addedRow = rows.find(
      (row) => row.rightText === 'new middle line'
    );
    expect(addedRow).toBeDefined();
    expect(addedRow!.rightKind).toBe('added');
    expect(addedRow!.leftKind).toBe('empty');
  });

  it('handles lines removed from the middle', () => {
    const rows = buildDiffLineRows({
      oldContent: 'line 1\nmiddle line\nline 2\n',
      newContent: 'line 1\nline 2\n',
    });

    const removedRow = rows.find((row) => row.leftText === 'middle line');
    expect(removedRow).toBeDefined();
    expect(removedRow!.leftKind).toBe('removed');
    expect(removedRow!.rightKind).toBe('empty');
  });

  it('tracks line numbers correctly through changes', () => {
    const rows = buildDiffLineRows({
      oldContent: 'line 1\nold line\nline 3\n',
      newContent: 'line 1\nnew line\nline 3\n',
    });

    expect(rows[0]!.oldLineNumber).toBe(1);
    expect(rows[0]!.newLineNumber).toBe(1);
    expect(rows[2]!.oldLineNumber).toBe(3);
    expect(rows[2]!.newLineNumber).toBe(3);
  });
});

describe('collapseDiffRows', () => {
  it('collapses unchanged leading and trailing lines outside context', () => {
    const oldContent = [
      'line 1',
      'line 2',
      'line 3',
      'line 4',
      'line 5',
      'line 6',
      'line 7',
      'line 8 old',
      'line 9',
      'line 10',
      'line 11',
      'line 12',
      'line 13',
      'line 14',
      'line 15',
    ].join('\n');
    const newContent = oldContent.replace('line 8 old', 'line 8 new');

    const collapsedRows = collapseDiffRows({
      rows: buildDiffLineRows({ oldContent, newContent }),
      contextLines: 3,
    });

    expect(
      collapsedRows
        .filter((row) => row.type === 'collapsed')
        .map((row) => row.hiddenCount)
    ).toEqual([4, 4]);
  });

  it('does not add collapse rows when there are no changes', () => {
    const collapsedRows = collapseDiffRows({
      rows: buildDiffLineRows({
        oldContent: 'same 1\nsame 2\n',
        newContent: 'same 1\nsame 2\n',
      }),
      contextLines: 3,
    });

    expect(collapsedRows.map((row) => row.type)).toEqual(['line', 'line']);
  });

  it('uses default context lines of 3', () => {
    const oldContent = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`)
      .join('\n')
      .replace('line 10', 'line 10 old');
    const newContent = oldContent.replace('line 10 old', 'line 10 new');

    const collapsedRows = collapseDiffRows({
      rows: buildDiffLineRows({ oldContent, newContent }),
    });

    // Should show 3 lines of context before and after the change
    const collapsedChunks = collapsedRows.filter(
      (row) => row.type === 'collapsed'
    );
    expect(collapsedChunks.length).toBeGreaterThan(0);
  });

  it('does not collapse when all lines are within context', () => {
    const oldContent = 'line 1\nold line\nline 3\n';
    const newContent = 'line 1\nnew line\nline 3\n';

    const collapsedRows = collapseDiffRows({
      rows: buildDiffLineRows({ oldContent, newContent }),
      contextLines: 3,
    });

    expect(collapsedRows.every((row) => row.type === 'line')).toBe(true);
  });
});

describe('expandDiffRows', () => {
  it('expands only selected collapsed chunks', () => {
    const oldContent = [
      'line 1',
      'line 2',
      'line 3',
      'line 4',
      'line 5',
      'line 6',
      'line 7',
      'line 8 old',
      'line 9',
      'line 10',
      'line 11',
      'line 12',
      'line 13',
      'line 14',
      'line 15',
    ].join('\n');
    const newContent = oldContent.replace('line 8 old', 'line 8 new');

    const collapsedRows = collapseDiffRows({
      rows: buildDiffLineRows({ oldContent, newContent }),
      contextLines: 3,
    });

    const expandedRows = expandDiffRows({
      rows: collapsedRows,
      expandedChunks: {
        'collapsed-0-3': true,
      },
    });

    expect({
      lineCount: expandedRows.filter((row) => row.type === 'line').length,
      collapsedCount: expandedRows.filter((row) => row.type === 'collapsed')
        .length,
      lastRowType: expandedRows[expandedRows.length - 1]?.type,
    }).toEqual({
      lineCount: 11,
      collapsedCount: 1,
      lastRowType: 'collapsed',
    });
  });

  it('keeps collapsed rows when not in expandedChunks', () => {
    const oldContent = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`)
      .join('\n')
      .replace('line 10', 'line 10 old');
    const newContent = oldContent.replace('line 10 old', 'line 10 new');

    const collapsedRows = collapseDiffRows({
      rows: buildDiffLineRows({ oldContent, newContent }),
      contextLines: 3,
    });

    const expandedRows = expandDiffRows({
      rows: collapsedRows,
      expandedChunks: {},
    });

    expect(expandedRows).toEqual(collapsedRows);
  });

  it('expands all chunks when all keys are in expandedChunks', () => {
    const oldContent = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`)
      .join('\n')
      .replace('line 10', 'line 10 old');
    const newContent = oldContent.replace('line 10 old', 'line 10 new');

    const collapsedRows = collapseDiffRows({
      rows: buildDiffLineRows({ oldContent, newContent }),
      contextLines: 3,
    });

    const expandedChunks: Record<string, boolean> = {};
    collapsedRows.forEach((row) => {
      if (row.type === 'collapsed') {
        expandedChunks[row.key] = true;
      }
    });

    const expandedRows = expandDiffRows({
      rows: collapsedRows,
      expandedChunks,
    });

    expect(expandedRows.every((row) => row.type === 'line')).toBe(true);
  });
});
