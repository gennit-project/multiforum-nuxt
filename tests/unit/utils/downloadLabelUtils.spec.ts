import { describe, it, expect } from 'vitest';
import { resolveSelectedLabelOptionIds } from '@/utils/downloadLabelUtils';
import type { FilterGroup } from '@/__generated__/graphql';

const group = (key: string, options: { value: string; id: string | null }[]): FilterGroup =>
  ({ key, options } as unknown as FilterGroup);

describe('resolveSelectedLabelOptionIds', () => {
  const filterGroups = [
    group('size', [
      { value: 'small', id: 'opt-small' },
      { value: 'large', id: 'opt-large' },
    ]),
    group('color', [{ value: 'red', id: 'opt-red' }]),
  ];

  it('maps selected values to their option ids', () => {
    expect(
      resolveSelectedLabelOptionIds({
        downloadLabels: { size: ['small'], color: ['red'] },
        filterGroups,
      })
    ).toEqual(['opt-small', 'opt-red']);
  });

  it('includes multiple selected values within a group', () => {
    expect(
      resolveSelectedLabelOptionIds({
        downloadLabels: { size: ['small', 'large'] },
        filterGroups,
      })
    ).toEqual(['opt-small', 'opt-large']);
  });

  it('skips group keys that do not exist', () => {
    expect(
      resolveSelectedLabelOptionIds({
        downloadLabels: { unknown: ['x'] },
        filterGroups,
      })
    ).toEqual([]);
  });

  it('skips values that do not match any option', () => {
    expect(
      resolveSelectedLabelOptionIds({
        downloadLabels: { size: ['missing'] },
        filterGroups,
      })
    ).toEqual([]);
  });

  it('skips options that have no id', () => {
    expect(
      resolveSelectedLabelOptionIds({
        downloadLabels: { size: ['huge'] },
        filterGroups: [group('size', [{ value: 'huge', id: null }])],
      })
    ).toEqual([]);
  });

  it('returns an empty array for nullish inputs', () => {
    expect(
      resolveSelectedLabelOptionIds({ downloadLabels: null, filterGroups: null })
    ).toEqual([]);
  });
});
