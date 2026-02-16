import * as DiffMatchPatch from 'diff-match-patch';

export type SideKind = 'context' | 'removed' | 'added' | 'empty';

export interface DiffLineRow {
  type: 'line';
  key: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
  leftText: string;
  rightText: string;
  leftKind: SideKind;
  rightKind: SideKind;
  isContext: boolean;
}

export interface CollapsedDiffRow {
  type: 'collapsed';
  key: string;
  hiddenCount: number;
  hiddenRows: DiffLineRow[];
}

export type DiffRow = DiffLineRow | CollapsedDiffRow;

type BuildDiffLineRowsParams = {
  oldContent: string;
  newContent: string;
};

type CollapseDiffRowsParams = {
  rows: DiffLineRow[];
  contextLines?: number;
};

type ExpandDiffRowsParams = {
  rows: DiffRow[];
  expandedChunks: Record<string, boolean>;
};

export const buildDiffLineRows = ({
  oldContent,
  newContent,
}: BuildDiffLineRowsParams): DiffLineRow[] => {
  const dmp = new DiffMatchPatch.diff_match_patch();
  const lineData = dmp.diff_linesToChars_(oldContent, newContent);
  const diffs = dmp.diff_main(lineData.chars1, lineData.chars2, false);
  dmp.diff_charsToLines_(diffs, lineData.lineArray);
  dmp.diff_cleanupSemantic(diffs);

  const blocks = diffs.map(([operation, text]) => {
    const lines = text.split('\n');
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }
    return { operation, lines };
  });

  const rows: DiffLineRow[] = [];
  let oldLineNumber = 1;
  let newLineNumber = 1;
  let rowIndex = 0;

  const pushRow = (row: Omit<DiffLineRow, 'type' | 'key'>) => {
    rows.push({
      type: 'line',
      key: `line-${rowIndex}`,
      ...row,
    });
    rowIndex += 1;
  };

  let blockIndex = 0;
  while (blockIndex < blocks.length) {
    const block = blocks[blockIndex];
    if (!block) {
      blockIndex += 1;
      continue;
    }

    const nextBlock = blocks[blockIndex + 1];
    if (block.operation === -1 && nextBlock && nextBlock.operation === 1) {
      const removedLines = block.lines;
      const addedLines = nextBlock.lines;
      const maxLineCount = Math.max(removedLines.length, addedLines.length);

      for (let lineIndex = 0; lineIndex < maxLineCount; lineIndex += 1) {
        const hasRemovedLine = lineIndex < removedLines.length;
        const hasAddedLine = lineIndex < addedLines.length;

        pushRow({
          oldLineNumber: hasRemovedLine ? oldLineNumber++ : null,
          newLineNumber: hasAddedLine ? newLineNumber++ : null,
          leftText: hasRemovedLine ? (removedLines[lineIndex] ?? '') : '',
          rightText: hasAddedLine ? (addedLines[lineIndex] ?? '') : '',
          leftKind: hasRemovedLine ? 'removed' : 'empty',
          rightKind: hasAddedLine ? 'added' : 'empty',
          isContext: false,
        });
      }

      blockIndex += 2;
      continue;
    }

    if (block.operation === 0) {
      block.lines.forEach((line) => {
        pushRow({
          oldLineNumber: oldLineNumber++,
          newLineNumber: newLineNumber++,
          leftText: line,
          rightText: line,
          leftKind: 'context',
          rightKind: 'context',
          isContext: true,
        });
      });
      blockIndex += 1;
      continue;
    }

    if (block.operation === -1) {
      block.lines.forEach((line) => {
        pushRow({
          oldLineNumber: oldLineNumber++,
          newLineNumber: null,
          leftText: line,
          rightText: '',
          leftKind: 'removed',
          rightKind: 'empty',
          isContext: false,
        });
      });
      blockIndex += 1;
      continue;
    }

    block.lines.forEach((line) => {
      pushRow({
        oldLineNumber: null,
        newLineNumber: newLineNumber++,
        leftText: '',
        rightText: line,
        leftKind: 'empty',
        rightKind: 'added',
        isContext: false,
      });
    });
    blockIndex += 1;
  }

  return rows;
};

export const collapseDiffRows = ({
  rows,
  contextLines = 3,
}: CollapseDiffRowsParams): DiffRow[] => {
  const changedIndexes = rows.reduce<number[]>((indexes, row, index) => {
    if (!row.isContext) {
      indexes.push(index);
    }
    return indexes;
  }, []);

  if (!changedIndexes.length) {
    return rows;
  }

  const visibleIndexes = new Set<number>();
  changedIndexes.forEach((changedIndex) => {
    const start = Math.max(0, changedIndex - contextLines);
    const end = Math.min(rows.length - 1, changedIndex + contextLines);

    for (let i = start; i <= end; i += 1) {
      visibleIndexes.add(i);
    }
  });

  const output: DiffRow[] = [];
  let cursor = 0;
  while (cursor < rows.length) {
    if (visibleIndexes.has(cursor)) {
      output.push(rows[cursor] as DiffLineRow);
      cursor += 1;
      continue;
    }

    const hiddenRows: DiffLineRow[] = [];
    const chunkStart = cursor;
    while (cursor < rows.length && !visibleIndexes.has(cursor)) {
      hiddenRows.push(rows[cursor] as DiffLineRow);
      cursor += 1;
    }

    output.push({
      type: 'collapsed',
      key: `collapsed-${chunkStart}-${cursor - 1}`,
      hiddenCount: hiddenRows.length,
      hiddenRows,
    });
  }

  return output;
};

export const expandDiffRows = ({
  rows,
  expandedChunks,
}: ExpandDiffRowsParams): DiffRow[] => {
  const output: DiffRow[] = [];

  rows.forEach((row) => {
    if (row.type === 'collapsed' && expandedChunks[row.key]) {
      output.push(...row.hiddenRows);
      return;
    }

    output.push(row);
  });

  return output;
};
