import { describe, it, expect } from 'vitest';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { convertUrlParamsToLabelFilters } from './downloadFilters';

const routeWithQuery = (query: Record<string, unknown>) =>
  ({ query } as unknown as RouteLocationNormalizedLoaded);

describe('convertUrlParamsToLabelFilters', () => {
  it('converts a filter_ param into a label filter', () => {
    expect(
      convertUrlParamsToLabelFilters(
        routeWithQuery({ filter_lot_type: 'residential' })
      )
    ).toEqual([{ groupKey: 'lot_type', values: ['residential'] }]);
  });

  it('splits a comma-separated value into multiple values', () => {
    expect(
      convertUrlParamsToLabelFilters(
        routeWithQuery({ filter_style: 'modern,contemporary' })
      )[0].values
    ).toEqual(['modern', 'contemporary']);
  });

  it('ignores non-filter query params', () => {
    expect(
      convertUrlParamsToLabelFilters(routeWithQuery({ page: '2' }))
    ).toEqual([]);
  });

  it('keeps only string values from array params', () => {
    expect(
      convertUrlParamsToLabelFilters(
        routeWithQuery({ filter_tag: ['a', null, 'b'] })
      )[0].values
    ).toEqual(['a', 'b']);
  });
});
