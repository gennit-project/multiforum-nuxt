import { describe, it, expect } from 'vitest';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { FilterMode, type FilterGroup } from '@/__generated__/graphql';
import {
  convertUrlParamsToLabelFilters,
  getStaleDownloadFilterQueryKeys,
} from './downloadFilters';

const routeWithQuery = (query: Record<string, unknown>) =>
  ({ query } as unknown as RouteLocationNormalizedLoaded);

const filterGroup = (
  key: string,
  optionValues: string[] = ['a']
): Pick<FilterGroup, 'key' | 'options'> =>
  ({
    key,
    mode: FilterMode.Include,
    options: optionValues.map((value) => ({
      value,
      displayName: value,
    })),
  }) as unknown as Pick<FilterGroup, 'key' | 'options'>;

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

  it('ignores stale filter params when current filter groups are provided', () => {
    expect(
      convertUrlParamsToLabelFilters(
        routeWithQuery({ filter_old: 'x', filter_type: 'pdf' }),
        [filterGroup('type', ['pdf'])]
      )
    ).toEqual([{ groupKey: 'type', values: ['pdf'] }]);
  });

  it('drops option values that no longer exist in the current group', () => {
    expect(
      convertUrlParamsToLabelFilters(
        routeWithQuery({ filter_type: 'pdf,stale' }),
        [filterGroup('type', ['pdf'])]
      )[0].values
    ).toEqual(['pdf']);
  });
});

describe('getStaleDownloadFilterQueryKeys', () => {
  it('returns filter query keys that do not match current filter groups', () => {
    expect(
      getStaleDownloadFilterQueryKeys(
        routeWithQuery({ filter_old: 'x', filter_type: 'pdf', page: '2' }),
        [filterGroup('type')]
      )
    ).toEqual(['filter_old']);
  });
});
