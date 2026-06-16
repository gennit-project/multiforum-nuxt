/**
 * Pure helpers for the "select all" and search-filter behavior in
 * SearchableForumList. The component emits `toggleSelection` events, so these
 * functions only compute results from the current selection — no Vue/DOM
 * state — which keeps them unit-testable.
 */

export type SelectionParams = {
  channelNames: string[];
  selectedChannels: string[];
};

/**
 * True when there is at least one channel and every channel is selected.
 */
export function areAllChannelsSelected(params: SelectionParams): boolean {
  const { channelNames, selectedChannels } = params;
  return (
    channelNames.length > 0 &&
    channelNames.every((name) => selectedChannels.includes(name))
  );
}

/**
 * Compute which channels should be toggled when "select all" is pressed:
 * - if every channel is already selected, return the selected ones (to
 *   deselect them);
 * - otherwise return the not-yet-selected ones (to select them).
 */
export function getChannelsToToggle(params: SelectionParams): string[] {
  const { channelNames, selectedChannels } = params;
  const allSelected = channelNames.every((name) =>
    selectedChannels.includes(name)
  );
  if (allSelected) {
    return channelNames.filter((name) => selectedChannels.includes(name));
  }
  return channelNames.filter((name) => !selectedChannels.includes(name));
}

export type FilterChannelsParams<T> = {
  channels: T[];
  searchTerm: string;
};

/**
 * Filter channels by a case-insensitive match on uniqueName or displayName.
 * Returns the input unchanged when the search term is empty.
 */
export function filterChannelsBySearch<
  T extends { uniqueName: string; displayName: string },
>(params: FilterChannelsParams<T>): T[] {
  const { channels, searchTerm } = params;
  if (!searchTerm) {
    return channels;
  }
  const lower = searchTerm.toLowerCase();
  return channels.filter(
    (channel) =>
      channel.uniqueName.toLowerCase().includes(lower) ||
      channel.displayName.toLowerCase().includes(lower)
  );
}
