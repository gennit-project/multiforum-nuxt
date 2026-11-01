import { describe, it, expect } from 'vitest';

import { useCollectionQueries } from '@/composables/useCollectionQueries';
import {
  GetUserCollectionsDownloadsDocument as GET_USER_COLLECTIONS_DOWNLOADS,
  GetUserCollectionsChannelsDocument as GET_USER_COLLECTIONS_CHANNELS,
  CheckDiscussionInCollectionsDocument as CHECK_DISCUSSION_IN_COLLECTIONS,
  GetUserCollectionsDiscussionsDocument as GET_USER_COLLECTIONS_DISCUSSIONS,
  GetUserCollectionsImagesDocument as GET_USER_COLLECTIONS_IMAGES,
  CheckCommentInCollectionsDocument as CHECK_COMMENT_IN_COLLECTIONS,
  GetUserCollectionsCommentsDocument as GET_USER_COLLECTIONS_COMMENTS,
  CheckImageInCollectionsDocument as CHECK_IMAGE_IN_COLLECTIONS,
  CheckDownloadInCollectionsDocument as CHECK_DOWNLOAD_IN_COLLECTIONS,
  CheckChannelInCollectionsDocument as CHECK_CHANNEL_IN_COLLECTIONS,
} from '@/__generated__/operations';

describe('useCollectionQueries', () => {
  const collectionTypeCases: Array<{
    name: string;
    itemType: Parameters<typeof useCollectionQueries>[0];
    expected: string;
  }> = [
    {
      name: 'discussion maps to DISCUSSIONS collection type',
      itemType: 'discussion',
      expected: 'DISCUSSIONS',
    },
    {
      name: 'comment maps to COMMENTS collection type',
      itemType: 'comment',
      expected: 'COMMENTS',
    },
    {
      name: 'image maps to IMAGES collection type',
      itemType: 'image',
      expected: 'IMAGES',
    },
    {
      name: 'channel maps to CHANNELS collection type',
      itemType: 'channel',
      expected: 'CHANNELS',
    },
    {
      name: 'download maps to DOWNLOADS collection type',
      itemType: 'download',
      expected: 'DOWNLOADS',
    },
  ];

  it.each(collectionTypeCases)('$name', ({ itemType, expected }) => {
    const { collectionType } = useCollectionQueries(itemType);

    expect(collectionType).toBe(expected);
  });

  const collectionQueryCases: Array<{
    name: string;
    itemType: Parameters<typeof useCollectionQueries>[0];
    expected: unknown;
  }> = [
    {
      name: 'discussion maps to discussion collections query',
      itemType: 'discussion',
      expected: GET_USER_COLLECTIONS_DISCUSSIONS,
    },
    {
      name: 'comment maps to comment collections query',
      itemType: 'comment',
      expected: GET_USER_COLLECTIONS_COMMENTS,
    },
    {
      name: 'image maps to image collections query',
      itemType: 'image',
      expected: GET_USER_COLLECTIONS_IMAGES,
    },
    {
      name: 'channel maps to channel collections query',
      itemType: 'channel',
      expected: GET_USER_COLLECTIONS_CHANNELS,
    },
    {
      name: 'download maps to download collections query',
      itemType: 'download',
      expected: GET_USER_COLLECTIONS_DOWNLOADS,
    },
  ];

  it.each(collectionQueryCases)('$name', ({ itemType, expected }) => {
    const { getCollectionQuery } = useCollectionQueries(itemType);

    expect(getCollectionQuery()).toBe(expected);
  });

  const checkQueryCases: Array<{
    name: string;
    itemType: Parameters<typeof useCollectionQueries>[0];
    expected: unknown;
  }> = [
    {
      name: 'discussion maps to discussion check query',
      itemType: 'discussion',
      expected: CHECK_DISCUSSION_IN_COLLECTIONS,
    },
    {
      name: 'comment maps to comment check query',
      itemType: 'comment',
      expected: CHECK_COMMENT_IN_COLLECTIONS,
    },
    {
      name: 'download maps to download check query',
      itemType: 'download',
      expected: CHECK_DOWNLOAD_IN_COLLECTIONS,
    },
    {
      name: 'image maps to image check query',
      itemType: 'image',
      expected: CHECK_IMAGE_IN_COLLECTIONS,
    },
    {
      name: 'channel maps to channel check query',
      itemType: 'channel',
      expected: CHECK_CHANNEL_IN_COLLECTIONS,
    },
  ];

  it.each(checkQueryCases)('$name', ({ itemType, expected }) => {
    const { getCheckItemQuery } = useCollectionQueries(itemType);

    expect(getCheckItemQuery()).toBe(expected);
  });
});
