import { describe, it, expect } from 'vitest';
import type { Discussion, Comment } from '@/__generated__/graphql';
import {
  getCollectionTypeLabel,
  getCollectionItems,
  getCollectionItemStableId,
  orderCollectionItems,
  buildCollectionDiscussionLink,
  resolveCollectionItemAuthor,
} from './collectionItemUtils';

describe('getCollectionTypeLabel', () => {
  it.each([
    ['DISCUSSIONS', 'Discussions'],
    ['COMMENTS', 'Comments'],
    ['IMAGES', 'Images'],
    ['CHANNELS', 'Forums'],
    ['DOWNLOADS', 'Downloads'],
  ])('labels %s as %s', (type, label) => {
    expect(getCollectionTypeLabel(type)).toBe(label);
  });

  it('falls back to "Items" for an unknown type', () => {
    expect(getCollectionTypeLabel('WIDGETS')).toBe('Items');
  });
});

describe('getCollectionItems', () => {
  it('returns the array matching the collection type', () => {
    expect(
      getCollectionItems({
        collectionType: 'COMMENTS',
        itemOrder: ['c1'],
        Comments: [{ id: 'c1' }],
        Discussions: [{ id: 'd1' }],
      })
    ).toEqual([{ id: 'c1' }]);
  });

  it('returns an empty array for a null collection', () => {
    expect(getCollectionItems(null)).toEqual([]);
  });

  it('returns an empty array for an unknown type', () => {
    expect(getCollectionItems({ collectionType: 'WIDGETS' })).toEqual([]);
  });

  it('sorts collection items by itemOrder and appends missing items', () => {
    expect(
      getCollectionItems({
        collectionType: 'DOWNLOADS',
        itemOrder: ['d2', 'stale-id'],
        Downloads: [{ id: 'd1' }, { id: 'd2' }, { id: 'd3' }],
      }).map((item) => item.id)
    ).toEqual(['d2', 'd1', 'd3']);
  });
});

describe('collection item ordering helpers', () => {
  it('uses uniqueName as the stable ID for channel items', () => {
    expect(getCollectionItemStableId({ uniqueName: 'sims4_builds' })).toBe(
      'sims4_builds'
    );
  });

  it('returns the original array when no order is stored', () => {
    const items = [{ id: 'a' }, { id: 'b' }];
    expect(orderCollectionItems(items, [])).toBe(items);
  });

  it('drops stale stored IDs and preserves unordered items', () => {
    expect(
      orderCollectionItems(
        [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        ['c', 'missing', 'a']
      ).map((item) => item.id)
    ).toEqual(['c', 'a', 'b']);
  });
});

describe('buildCollectionDiscussionLink', () => {
  const discussion = {
    id: 'd1',
    DiscussionChannels: [{ channelUniqueName: 'cats' }],
  } as unknown as Discussion;

  it('links to the discussions path for a normal discussion', () => {
    expect(
      buildCollectionDiscussionLink({ discussion, isDownloadsCollection: false })
    ).toBe('/forums/cats/discussions/d1');
  });

  it('links to the downloads path for a downloads collection', () => {
    expect(
      buildCollectionDiscussionLink({ discussion, isDownloadsCollection: true })
    ).toBe('/forums/cats/downloads/d1');
  });

  it('links to the downloads path when the discussion hasDownload', () => {
    expect(
      buildCollectionDiscussionLink({
        discussion: {
          id: 'd1',
          hasDownload: true,
          DiscussionChannels: [{ channelUniqueName: 'cats' }],
        } as unknown as Discussion,
        isDownloadsCollection: false,
      })
    ).toBe('/forums/cats/downloads/d1');
  });

  it('falls back to root when there is no channel', () => {
    expect(
      buildCollectionDiscussionLink({
        discussion: { id: 'd1', DiscussionChannels: [] } as unknown as Discussion,
        isDownloadsCollection: false,
      })
    ).toBe('/');
  });
});

describe('resolveCollectionItemAuthor', () => {
  it('returns null when the item has no author', () => {
    expect(
      resolveCollectionItemAuthor({
        item: { Author: null } as unknown as Discussion,
        adminUsernames: [],
      })
    ).toBeNull();
  });

  it('reads the Author for a discussion', () => {
    const info = resolveCollectionItemAuthor({
      item: { Author: { username: 'alice' } } as unknown as Discussion,
      adminUsernames: [],
    });
    expect(info?.username).toBe('alice');
  });

  it('reads the CommentAuthor for a comment', () => {
    const info = resolveCollectionItemAuthor({
      item: {
        CommentAuthor: { username: 'bob', displayName: 'Bob' },
      } as unknown as Comment,
      adminUsernames: [],
    });
    expect(info?.username).toBe('bob');
  });

  it('flags server admins', () => {
    const info = resolveCollectionItemAuthor({
      item: { Author: { username: 'alice' } } as unknown as Discussion,
      adminUsernames: ['alice'],
    });
    expect(info?.isAdmin).toBe(true);
  });

  it('collapses a moderation-profile author to display-name only', () => {
    const info = resolveCollectionItemAuthor({
      item: {
        CommentAuthor: { displayName: 'ModBob' },
      } as unknown as Comment,
      adminUsernames: [],
    });
    expect([info?.username, info?.displayName]).toEqual(['', 'ModBob']);
  });
});
