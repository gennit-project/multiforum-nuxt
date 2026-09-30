import { describe, expect, it } from 'vitest';
import { print } from 'graphql';
import { InMemoryCache } from '@apollo/client/core';
import { inMemoryCacheOptions } from '@/cache';
import { GET_UNIFIED_LIBRARY_FAVORITES } from './queries';

const favoriteData = {
  users: [
    {
      __typename: 'User',
      username: 'alice',
      FavoriteDiscussions: [],
      FavoriteImages: [
        {
          __typename: 'Image',
          id: 'image-1',
          url: 'https://example.com/image.jpg',
          alt: 'Example',
          caption: 'Example image',
          createdAt: '2026-09-30T00:00:00.000Z',
          Uploader: {
            __typename: 'User',
            username: 'bob',
            displayName: 'Bob',
            profilePicURL: null,
          },
          Albums: [
            {
              __typename: 'Album',
              id: 'album-1',
              Discussions: [
                {
                  __typename: 'Discussion',
                  id: 'discussion-1',
                  DiscussionChannels: [],
                },
              ],
            },
          ],
        },
      ],
      FavoriteComments: [
        {
          __typename: 'Comment',
          id: 'comment-1',
          text: 'A favorite comment',
          createdAt: '2026-09-30T00:00:00.000Z',
          CommentAuthor: {
            __typename: 'User',
            username: 'carol',
            displayName: 'Carol',
            profilePicURL: null,
          },
          DiscussionChannel: {
            __typename: 'DiscussionChannel',
            discussionId: 'discussion-2',
            channelUniqueName: 'art',
            Channel: {
              __typename: 'Channel',
              uniqueName: 'art',
              displayName: 'Art',
              channelIconURL: null,
            },
            Discussion: {
              __typename: 'Discussion',
              id: 'discussion-2',
              title: 'Art discussion',
              hasDownload: false,
            },
          },
          Channel: null,
        },
      ],
      FavoriteChannels: [],
    },
  ],
};

describe('GET_UNIFIED_LIBRARY_FAVORITES', () => {
  it('uses the plural image Albums relationship from the schema', () => {
    const query = print(GET_UNIFIED_LIBRARY_FAVORITES);
    const favoriteImagesSelection = query.slice(
      query.indexOf('FavoriteImages'),
      query.indexOf('FavoriteComments')
    );
    expect(favoriteImagesSelection).toMatch(/\bAlbums\(options:/);
  });

  it('writes nested discussions to the configured Apollo cache', () => {
    const cache = new InMemoryCache(inMemoryCacheOptions);
    expect(() =>
      cache.writeQuery({
        query: GET_UNIFIED_LIBRARY_FAVORITES,
        variables: { username: 'alice' },
        data: favoriteData,
      })
    ).not.toThrow();
  });
});
