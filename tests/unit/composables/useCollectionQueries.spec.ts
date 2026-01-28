import { describe, it, expect } from 'vitest';

vi.mock('@/graphQLData/collection/queries', () => ({
  GET_USER_COLLECTIONS_DISCUSSIONS: Symbol('GET_USER_COLLECTIONS_DISCUSSIONS'),
  GET_USER_COLLECTIONS_COMMENTS: Symbol('GET_USER_COLLECTIONS_COMMENTS'),
  GET_USER_COLLECTIONS_IMAGES: Symbol('GET_USER_COLLECTIONS_IMAGES'),
  GET_USER_COLLECTIONS_CHANNELS: Symbol('GET_USER_COLLECTIONS_CHANNELS'),
  GET_USER_COLLECTIONS_DOWNLOADS: Symbol('GET_USER_COLLECTIONS_DOWNLOADS'),
  CHECK_DISCUSSION_IN_COLLECTIONS: Symbol('CHECK_DISCUSSION_IN_COLLECTIONS'),
  CHECK_COMMENT_IN_COLLECTIONS: Symbol('CHECK_COMMENT_IN_COLLECTIONS'),
  CHECK_DOWNLOAD_IN_COLLECTIONS: Symbol('CHECK_DOWNLOAD_IN_COLLECTIONS'),
  CHECK_IMAGE_IN_COLLECTIONS: Symbol('CHECK_IMAGE_IN_COLLECTIONS'),
  CHECK_CHANNEL_IN_COLLECTIONS: Symbol('CHECK_CHANNEL_IN_COLLECTIONS'),
}));

import { useCollectionQueries } from '@/composables/useCollectionQueries';
import * as queries from '@/graphQLData/collection/queries';

describe('useCollectionQueries', () => {
  it.each([
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
  ])('$name', ({ itemType, expected }) => {
    const { collectionType } = useCollectionQueries(itemType);

    expect(collectionType).toBe(expected);
  });

  it.each([
    {
      name: 'discussion maps to discussion collections query',
      itemType: 'discussion',
      expected: queries.GET_USER_COLLECTIONS_DISCUSSIONS,
    },
    {
      name: 'comment maps to comment collections query',
      itemType: 'comment',
      expected: queries.GET_USER_COLLECTIONS_COMMENTS,
    },
    {
      name: 'image maps to image collections query',
      itemType: 'image',
      expected: queries.GET_USER_COLLECTIONS_IMAGES,
    },
    {
      name: 'channel maps to channel collections query',
      itemType: 'channel',
      expected: queries.GET_USER_COLLECTIONS_CHANNELS,
    },
    {
      name: 'download maps to download collections query',
      itemType: 'download',
      expected: queries.GET_USER_COLLECTIONS_DOWNLOADS,
    },
  ])('$name', ({ itemType, expected }) => {
    const { getCollectionQuery } = useCollectionQueries(itemType);

    expect(getCollectionQuery()).toBe(expected);
  });

  it.each([
    {
      name: 'discussion maps to discussion check query',
      itemType: 'discussion',
      expected: queries.CHECK_DISCUSSION_IN_COLLECTIONS,
    },
    {
      name: 'comment maps to comment check query',
      itemType: 'comment',
      expected: queries.CHECK_COMMENT_IN_COLLECTIONS,
    },
    {
      name: 'download maps to download check query',
      itemType: 'download',
      expected: queries.CHECK_DOWNLOAD_IN_COLLECTIONS,
    },
    {
      name: 'image maps to image check query',
      itemType: 'image',
      expected: queries.CHECK_IMAGE_IN_COLLECTIONS,
    },
    {
      name: 'channel maps to channel check query',
      itemType: 'channel',
      expected: queries.CHECK_CHANNEL_IN_COLLECTIONS,
    },
  ])('$name', ({ itemType, expected }) => {
    const { getCheckItemQuery } = useCollectionQueries(itemType);

    expect(getCheckItemQuery()).toBe(expected);
  });
});
