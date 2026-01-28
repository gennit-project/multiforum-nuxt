import { describe, it, expect } from 'vitest';
import { convertUrlParamsToLabelFilters } from '@/utils/downloadFilters';

describe('downloadFilters', () => {
  it.each([
    {
      name: 'parses comma-separated filter values',
      query: { filter_style: 'modern,contemporary' },
      expected: [
        {
          groupKey: 'style',
          values: ['modern', 'contemporary'],
        },
      ],
    },
    {
      name: 'ignores non-filter params',
      query: { q: 'search', filter_lot_type: 'residential' },
      expected: [
        {
          groupKey: 'lot_type',
          values: ['residential'],
        },
      ],
    },
    {
      name: 'skips empty string values',
      query: { filter_style: '' },
      expected: [],
    },
    {
      name: 'filters array values to strings only',
      query: { filter_style: ['modern', 2, 'contemporary', null] },
      expected: [
        {
          groupKey: 'style',
          values: ['modern', 'contemporary'],
        },
      ],
    },
    {
      name: 'skips arrays with no string values',
      query: { filter_style: [1, null, false] },
      expected: [],
    },
  ])('$name', ({ query, expected }) => {
    const route = { query } as any;

    const result = convertUrlParamsToLabelFilters(route);

    expect(result).toEqual(expected);
  });
});
