/**
 * Resolve the short identifiers carried by detail routes back to the global
 * ids that id-keyed queries and mutations need.
 *
 * Route params keep their folder names (`discussionId`, `eventId`,
 * `commentId`, `imageId`, `albumId`, `collectionId`) but carry the short
 * scheme's value: `{number}-{slug}` for discussions/events/collections, a bare
 * number for images/albums, and the comment `shortId` for comments.
 *
 * - `useRouteDiscussionNumber` / `useRouteEventNumber` parse the leading
 *   number synchronously (no request). The discussion detail loader passes it
 *   straight to `getDiscussionDetail` / `getCommentSection`.
 * - `useResolved*Id` run the matching lookup query, for pages whose data is
 *   keyed by the global id. The returned id is '' until the lookup resolves
 *   (and stays '' when nothing matches), so callers gate on `loading`.
 */
import { computed, type ComputedRef } from 'vue';
import { useRoute } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import {
  GetAlbumIdByNumberDocument,
  GetCollectionIdByNumberDocument,
  GetCommentIdByShortIdDocument,
  GetDiscussionIdByNumberDocument,
  GetEventIdByNumberDocument,
  GetImageIdByNumberDocument,
} from '@/__generated__/operations';
import { parseSlugSegmentNumber } from '@/utils/slugify';

type ResolvedId = {
  /** The global id, or '' while loading / when nothing matches. */
  id: ComputedRef<string>;
  loading: ComputedRef<boolean>;
  /** True once the lookup finished without finding a match. */
  notFound: ComputedRef<boolean>;
};

const paramString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

export function useRouteDiscussionNumber(): ComputedRef<number | null> {
  const route = useRoute();
  return computed(() => parseSlugSegmentNumber(paramString(route.params.discussionId)));
}

export function useRouteEventNumber(): ComputedRef<number | null> {
  const route = useRoute();
  return computed(() => parseSlugSegmentNumber(paramString(route.params.eventId)));
}

/** The comment shortId carried by a permalink route ('' on non-permalink routes). */
export function useRouteCommentShortId(): ComputedRef<string> {
  const route = useRoute();
  return computed(() => paramString(route.params.commentId));
}

export function useResolvedDiscussionId(): ResolvedId & {
  discussionNumber: ComputedRef<number | null>;
} {
  const route = useRoute();
  const discussionNumber = useRouteDiscussionNumber();
  const forumId = computed(() => paramString(route.params.forumId));
  const { result, loading } = useQuery(
    GetDiscussionIdByNumberDocument,
    () => ({
      channelUniqueName: forumId.value,
      discussionNumber: discussionNumber.value ?? 0,
    }),
    () => ({
      enabled: discussionNumber.value != null && !!forumId.value,
    })
  );
  const id = computed(
    () => result.value?.discussionChannels?.[0]?.discussionId ?? ''
  );
  return {
    id,
    discussionNumber,
    loading: computed(() => loading.value),
    notFound: computed(() => !loading.value && !!result.value && !id.value),
  };
}

type ResolvedEventIdOptions = {
  /** Set false to skip the lookup, e.g. when the global id is already known. */
  enabled?: ComputedRef<boolean>;
};

export function useResolvedEventId(
  options: ResolvedEventIdOptions = {}
): ResolvedId & {
  eventNumber: ComputedRef<number | null>;
} {
  const route = useRoute();
  const eventNumber = useRouteEventNumber();
  // The forum-less search routes (/events/list/search/[eventId],
  // /map/search/[eventId]) carry the forum as a `forum` query param.
  const forumId = computed(
    () => paramString(route.params.forumId) || paramString(route.query.forum)
  );
  const { result, loading } = useQuery(
    GetEventIdByNumberDocument,
    () => ({
      channelUniqueName: forumId.value,
      eventNumber: eventNumber.value ?? 0,
    }),
    () => ({
      enabled:
        (options.enabled?.value ?? true) &&
        eventNumber.value != null &&
        !!forumId.value,
    })
  );
  const id = computed(() => result.value?.getEventIdByNumber ?? '');
  return {
    id,
    eventNumber,
    loading: computed(() => loading.value),
    notFound: computed(() => !loading.value && !!result.value && !id.value),
  };
}

export function useResolvedCommentId(): ResolvedId {
  const shortId = useRouteCommentShortId();
  const { result, loading } = useQuery(
    GetCommentIdByShortIdDocument,
    () => ({ shortId: shortId.value }),
    () => ({ enabled: !!shortId.value })
  );
  const id = computed(() => result.value?.getCommentIdByShortId ?? '');
  return {
    id,
    loading: computed(() => loading.value),
    notFound: computed(() => !loading.value && !!result.value && !id.value),
  };
}

export function useResolvedImageId(): ResolvedId {
  const route = useRoute();
  const username = computed(() => paramString(route.params.username));
  const imageNumber = computed(() =>
    parseSlugSegmentNumber(paramString(route.params.imageId))
  );
  const { result, loading } = useQuery(
    GetImageIdByNumberDocument,
    () => ({
      username: username.value,
      imageNumber: imageNumber.value ?? 0,
    }),
    () => ({ enabled: imageNumber.value != null && !!username.value })
  );
  const id = computed(() => result.value?.getImageIdByNumber ?? '');
  return {
    id,
    loading: computed(() => loading.value),
    notFound: computed(() => !loading.value && !!result.value && !id.value),
  };
}

export function useResolvedAlbumId(): ResolvedId {
  const route = useRoute();
  const username = computed(() => paramString(route.params.username));
  const albumNumber = computed(() =>
    parseSlugSegmentNumber(paramString(route.params.albumId))
  );
  const { result, loading } = useQuery(
    GetAlbumIdByNumberDocument,
    () => ({
      username: username.value,
      albumNumber: albumNumber.value ?? 0,
    }),
    () => ({ enabled: albumNumber.value != null && !!username.value })
  );
  const id = computed(() => result.value?.getAlbumIdByNumber ?? '');
  return {
    id,
    loading: computed(() => loading.value),
    notFound: computed(() => !loading.value && !!result.value && !id.value),
  };
}

export function useResolvedCollectionId(): ResolvedId {
  const route = useRoute();
  const username = computed(() => paramString(route.params.username));
  const collectionNumber = computed(() =>
    parseSlugSegmentNumber(paramString(route.params.collectionId))
  );
  const { result, loading } = useQuery(
    GetCollectionIdByNumberDocument,
    () => ({
      username: username.value,
      collectionNumber: collectionNumber.value ?? 0,
    }),
    () => ({
      enabled: collectionNumber.value != null && !!username.value,
    })
  );
  const id = computed(() => result.value?.getCollectionIdByNumber ?? '');
  return {
    id,
    loading: computed(() => loading.value),
    notFound: computed(() => !loading.value && !!result.value && !id.value),
  };
}
