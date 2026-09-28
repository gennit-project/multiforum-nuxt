import { computed, ref, watch, type WritableComputedRef } from 'vue';

type UseFavoritedStateParams = {
  /**
   * Favorited state supplied by a parent (e.g. from a list query). `null` or
   * `undefined` means "not supplied" and falls through to the query result.
   */
  provided: () => boolean | null | undefined;
  /**
   * Favorited state derived from the component's own lookup query. `undefined`
   * while the query has not returned (or is disabled).
   */
  queried: () => boolean | undefined;
};

/**
 * Favorited state for the AddTo*Favorites components, derived rather than
 * copied.
 *
 * The old pattern copied the query result into a `ref` from a `watch`. On SSR
 * watchers do not re-run after Apollo's server prefetch resolves, so the server
 * rendered "not favorited" while the client — reading the same result from the
 * SSR payload — rendered "favorited" during hydration (issue #581).
 *
 * Deriving from `provided` / `queried` in a `computed` makes server and client
 * render from the same data. Writing the ref (the optimistic toggle in
 * useFavoriteToggle) stores a local override, which is dropped as soon as the
 * source data changes (parent refetch, or the lookup refetch after a toggle).
 */
export function useFavoritedState(
  params: UseFavoritedStateParams
): WritableComputedRef<boolean> {
  const override = ref<boolean | null>(null);

  watch([params.provided, params.queried], () => {
    override.value = null;
  });

  return computed({
    get: () => override.value ?? params.provided() ?? params.queried() ?? false,
    set: (value: boolean) => {
      override.value = value;
    },
  });
}
