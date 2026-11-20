/**
 * List items show at most this many tags in full. Beyond it, the list
 * collapses to TAG_PREVIEW_COUNT tags plus a "... and x others" label.
 */
export const TAG_DISPLAY_LIMIT = 4;
export const TAG_PREVIEW_COUNT = 3;

export type TagOverflow<T> = {
  visible: T[];
  hiddenCount: number;
};

/**
 * Split a list item's tags into the ones to render and a count of the rest.
 * Four or fewer tags are all shown; five or more show the first three.
 */
export function splitTagsForList<T>(tags: readonly T[]): TagOverflow<T> {
  if (tags.length <= TAG_DISPLAY_LIMIT) {
    return { visible: [...tags], hiddenCount: 0 };
  }
  return {
    visible: tags.slice(0, TAG_PREVIEW_COUNT),
    hiddenCount: tags.length - TAG_PREVIEW_COUNT,
  };
}
