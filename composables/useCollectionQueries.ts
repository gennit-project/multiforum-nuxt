import type { CollectionType } from '@/__generated__/graphql';
import {
  GET_USER_COLLECTIONS_DISCUSSIONS,
  GET_USER_COLLECTIONS_COMMENTS,
  GET_USER_COLLECTIONS_IMAGES,
  GET_USER_COLLECTIONS_CHANNELS,
  GET_USER_COLLECTIONS_DOWNLOADS,
  CHECK_DISCUSSION_IN_COLLECTIONS,
  CHECK_COMMENT_IN_COLLECTIONS,
  CHECK_DOWNLOAD_IN_COLLECTIONS,
  CHECK_IMAGE_IN_COLLECTIONS,
  CHECK_CHANNEL_IN_COLLECTIONS,
} from '@/graphQLData/collection/queries';

type ItemType = 'discussion' | 'comment' | 'image' | 'channel' | 'download';

/**
 * Composable that provides collection query selection helpers
 * Maps item types to appropriate GraphQL queries
 */
export function useCollectionQueries(itemType: ItemType) {
  // Map frontend item types to GraphQL enum values
  const collectionTypeMap: Record<ItemType, CollectionType> = {
    discussion: 'DISCUSSIONS' as CollectionType,
    comment: 'COMMENTS' as CollectionType,
    image: 'IMAGES' as CollectionType,
    channel: 'CHANNELS' as CollectionType,
    download: 'DOWNLOADS' as CollectionType,
  };

  const collectionType = collectionTypeMap[itemType];

  /**
   * Get the appropriate query for fetching user collections based on item type
   */
  const getCollectionQuery = () => {
    const queryMap = {
      discussion: GET_USER_COLLECTIONS_DISCUSSIONS,
      comment: GET_USER_COLLECTIONS_COMMENTS,
      image: GET_USER_COLLECTIONS_IMAGES,
      channel: GET_USER_COLLECTIONS_CHANNELS,
      download: GET_USER_COLLECTIONS_DOWNLOADS,
    };

    return queryMap[itemType];
  };

  /**
   * Get the appropriate query for checking which collections contain an item
   */
  const getCheckItemQuery = () => {
    const queryMap = {
      discussion: CHECK_DISCUSSION_IN_COLLECTIONS,
      comment: CHECK_COMMENT_IN_COLLECTIONS,
      download: CHECK_DOWNLOAD_IN_COLLECTIONS,
      image: CHECK_IMAGE_IN_COLLECTIONS,
      channel: CHECK_CHANNEL_IN_COLLECTIONS,
    };

    return queryMap[itemType];
  };

  return {
    collectionType,
    getCollectionQuery,
    getCheckItemQuery,
  };
}
