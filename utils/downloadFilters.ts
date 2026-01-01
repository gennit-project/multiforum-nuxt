import type { RouteLocationNormalizedLoaded } from 'vue-router';

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
  route: RouteLocationNormalizedLoaded
): LabelFilterInput[] {
  const labelFilters: LabelFilterInput[] = [];

  Object.keys(route.query).forEach((key) => {
    if (key.startsWith('filter_')) {
      const groupKey = key.replace('filter_', '');
      const value = route.query[key];

      let values: string[] = [];

      if (typeof value === 'string' && value.length > 0) {
        values = value.split(',');
      } else if (Array.isArray(value)) {
        values = value.filter((v): v is string => typeof v === 'string');
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
