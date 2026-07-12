import { describe, expect, it } from 'vitest';

import { SortDirection } from '@/__generated__/graphql';

import {
  chronologicalOrder,
  reverseChronologicalOrder,
} from './filterStrings';

describe('filterStrings', () => {
  it('exports chronological order by ascending start time', () => {
    expect(chronologicalOrder).toEqual({
      startTime: SortDirection.Asc,
    });
  });

  it('exports reverse chronological order by descending start time', () => {
    expect(reverseChronologicalOrder).toEqual({
      startTime: SortDirection.Desc,
    });
  });
});
