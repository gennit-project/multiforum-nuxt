import { describe, it, expect } from 'vitest';
import type { FilterGroup } from '@/__generated__/graphql';
import { resolveSelectedLabelOptionIds } from './downloadLabelUtils';

const filterGroups = [
  {
    key: 'style',
    options: [
      { id: 'opt-modern', value: 'modern' },
      { id: 'opt-classic', value: 'classic' },
    ],
  },
] as unknown as FilterGroup[];

describe('resolveSelectedLabelOptionIds', () => {
  it('resolves selected label values to their option ids', () => {
    expect(
      resolveSelectedLabelOptionIds({
        downloadLabels: { style: ['modern'] },
        filterGroups,
      })
    ).toEqual(['opt-modern']);
  });

  it('skips values from unknown groups', () => {
    expect(
      resolveSelectedLabelOptionIds({
        downloadLabels: { unknown: ['x'] },
        filterGroups,
      })
    ).toEqual([]);
  });

  it('skips unknown values within a known group', () => {
    expect(
      resolveSelectedLabelOptionIds({
        downloadLabels: { style: ['neon'] },
        filterGroups,
      })
    ).toEqual([]);
  });

  it('returns an empty array when there are no labels', () => {
    expect(
      resolveSelectedLabelOptionIds({ downloadLabels: null, filterGroups })
    ).toEqual([]);
  });
});
