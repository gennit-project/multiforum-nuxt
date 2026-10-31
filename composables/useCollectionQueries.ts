import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type {
  GetUserCollectionsDiscussionsQuery,
  GetUserCollectionsCommentsQuery,
  GetUserCollectionsImagesQuery,
  GetUserCollectionsChannelsQuery,
  GetUserCollectionsDownloadsQuery,
  GetUserCollectionsDiscussionsQueryVariables,
} from '@/__generated__/operations';
import { CollectionType } from '@/__generated__/graphql';
import {
  GetUserCollectionsDiscussionsDocument as GET_USER_COLLECTIONS_DISCUSSIONS,
  GetUserCollectionsCommentsDocument as GET_USER_COLLECTIONS_COMMENTS,
  GetUserCollectionsImagesDocument as GET_USER_COLLECTIONS_IMAGES,
  GetUserCollectionsChannelsDocument as GET_USER_COLLECTIONS_CHANNELS,
  GetUserCollectionsDownloadsDocument as GET_USER_COLLECTIONS_DOWNLOADS,
  CheckDiscussionInCollectionsDocument as CHECK_DISCUSSION_IN_COLLECTIONS,
  CheckCommentInCollectionsDocument as CHECK_COMMENT_IN_COLLECTIONS,
  CheckDownloadInCollectionsDocument as CHECK_DOWNLOAD_IN_COLLECTIONS,
  CheckImageInCollectionsDocument as CHECK_IMAGE_IN_COLLECTIONS,
  CheckChannelInCollectionsDocument as CHECK_CHANNEL_IN_COLLECTIONS,
} from '@/__generated__/operations';
type CollectionsResult =
  | GetUserCollectionsDiscussionsQuery
  | GetUserCollectionsCommentsQuery
  | GetUserCollectionsImagesQuery
  | GetUserCollectionsChannelsQuery
  | GetUserCollectionsDownloadsQuery;

type ItemType = 'discussion' | 'comment' | 'image' | 'channel' | 'download';

/**
 * Composable that provides collection query selection helpers
 * Maps item types to appropriate GraphQL queries
 */
export function useCollectionQueries(itemType: ItemType) {
  // Map frontend item types to GraphQL enum values
  const collectionTypeMap: Record<ItemType, CollectionType> = {
    discussion: CollectionType.Discussions,
    comment: CollectionType.Comments,
    image: CollectionType.Images,
    channel: CollectionType.Channels,
    download: CollectionType.Downloads,
  };

  const collectionType = collectionTypeMap[itemType];

  /**
   * Get the appropriate query for fetching user collections based on item type
   */
  const getCollectionQuery = (): TypedDocumentNode<
    CollectionsResult,
    GetUserCollectionsDiscussionsQueryVariables
  > => {
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
