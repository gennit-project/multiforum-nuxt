import type { FilterGroup, FilterOption } from '@/__generated__/graphql';

/**
 * Pure helper extracted from the download edit page
 * (pages/forums/[forumId]/downloads/edit/[discussionId].vue). Resolves the set
 * of selected filter-option IDs from a map of selected label values, keyed by
 * filter group.
 */

type SelectedDownloadLabels = Record<string, string[]>;

/**
 * Given the user's selected label values per group key and the channel's filter
 * groups, return the corresponding filter-option IDs. Unknown groups, unknown
 * values, and options without IDs are skipped.
 */
export function resolveSelectedLabelOptionIds(params: {
  downloadLabels: SelectedDownloadLabels | null | undefined;
  filterGroups: FilterGroup[] | null | undefined;
}): string[] {
  const downloadLabels = params.downloadLabels || {};
  const filterGroups = params.filterGroups || [];
  const selectedIds: string[] = [];

  Object.entries(downloadLabels).forEach(([groupKey, selectedValues]) => {
    const group = filterGroups.find((fg) => fg.key === groupKey);
    if (!group?.options) return;

    (selectedValues || []).forEach((value) => {
      const option = group.options?.find(
        (opt: FilterOption) => opt.value === value
      );
      if (option?.id) {
        selectedIds.push(option.id);
      }
    });
  });

  return selectedIds;
}
