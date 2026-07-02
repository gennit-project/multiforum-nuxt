import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { FilterGroup } from '@/__generated__/graphql';

export type LabelFilterInput = {
  groupKey: string;
  values: string[];
};

/**
 * Converts URL query parameters to label filters for the backend
 * Transforms params like ?filter_lot_type=residential&filter_style=modern,contemporary
 * into [{ groupKey: "lot_type", values: ["residential"] }, { groupKey: "style", values: ["modern", "contemporary"] }]
 */
export function convertUrlParamsToLabelFilters(
  route: RouteLocationNormalizedLoaded,
  filterGroups?: Pick<FilterGroup, 'key' | 'options'>[]
): LabelFilterInput[] {
  const labelFilters: LabelFilterInput[] = [];
  const allowedFilters = filterGroups
    ? new Map(
        filterGroups.map((group) => [
          group.key,
          new Set((group.options || []).map((option) => option.value)),
        ])
      )
    : null;

  Object.keys(route.query).forEach((key) => {
    if (key.startsWith('filter_')) {
      const groupKey = key.replace('filter_', '');
      const allowedValues = allowedFilters?.get(groupKey);

      if (allowedFilters && !allowedValues) {
        return;
      }

      const value = route.query[key];

      let values: string[] = [];

      if (typeof value === 'string' && value.length > 0) {
        values = value.split(',');
      } else if (Array.isArray(value)) {
        values = value.filter((v): v is string => typeof v === 'string');
      }

      if (allowedValues) {
        values = values.filter((selectedValue) =>
          allowedValues.has(selectedValue)
        );
      }

      if (values.length > 0) {
        labelFilters.push({
          groupKey,
          values,
        });
      }
    }
  });

  return labelFilters;
}

export function getStaleDownloadFilterQueryKeys(
  route: RouteLocationNormalizedLoaded,
  filterGroups: Pick<FilterGroup, 'key'>[]
): string[] {
  const allowedQueryKeys = new Set(
    filterGroups.map((group) => `filter_${group.key}`)
  );

  return Object.keys(route.query).filter(
    (key) => key.startsWith('filter_') && !allowedQueryKeys.has(key)
  );
}
