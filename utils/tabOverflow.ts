export type ComputeVisibleTabCountParams = {
  /** Natural width of each tab, in order. */
  tabWidths: number[];
  /** Width of the "More" trigger button. */
  moreWidth: number;
  /** Width available to the tab row. */
  containerWidth: number;
};

/**
 * How many leading tabs fit in the container. If every tab fits, no "More"
 * button is needed. Otherwise room is reserved for the "More" button and as
 * many tabs as fit beside it stay visible.
 */
export function computeVisibleTabCount({
  tabWidths,
  moreWidth,
  containerWidth,
}: ComputeVisibleTabCountParams): number {
  const total = tabWidths.reduce((sum, width) => sum + width, 0);
  if (total <= containerWidth) {
    return tabWidths.length;
  }

  let used = moreWidth;
  let count = 0;
  for (const width of tabWidths) {
    if (used + width > containerWidth) {
      break;
    }
    used += width;
    count += 1;
  }
  return count;
}
