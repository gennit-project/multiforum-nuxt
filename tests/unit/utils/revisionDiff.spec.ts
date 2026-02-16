import { describe, expect, it } from 'vitest';
import {
  buildDiffLineRows,
  collapseDiffRows,
  expandDiffRows,
} from '@/utils/revisionDiff';

describe('revisionDiff utils', () => {
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
});
