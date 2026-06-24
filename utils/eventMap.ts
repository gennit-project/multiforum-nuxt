/**
 * Pure helpers extracted from components/event/map/MapView.vue so the filter
 * and infowindow logic can be unit-tested without the router or Google Maps.
 */

/** Toggle an item in an array: remove it if present, otherwise append it. */
export function toggleArrayItem(items: string[], item: string): string[] {
  return items.includes(item)
    ? items.filter((existing) => existing !== item)
    : [...items, item];
}

/** Drop falsy values from a params object, returning string-valued entries. */
export function cleanQueryParams(
  params: Record<string, unknown>
): Record<string, string> {
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      cleaned[key] = value as string;
    }
  }
  return cleaned;
}

/**
 * Infowindow HTML for a highlighted event — title only, or title plus the
 * location name. (The markup mirrors the original component output verbatim.)
 */
export function buildInfowindowContent(
  title?: string | null,
  locationName?: string | null
): string {
  if (locationName) {
    return `<div data-testid="infowindow" style="text-align:center"><b>${title}</b></div></div><div style="text-align:center">at ${locationName}</div>`;
  }
  return `<b>${title}</b>`;
}
