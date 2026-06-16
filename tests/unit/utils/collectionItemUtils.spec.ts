import { describe, it, expect } from 'vitest';
import {
  getCollectionTypeLabel,
  getCollectionItems,
  buildCollectionDiscussionLink,
  resolveCollectionItemAuthor,
} from '@/utils/collectionItemUtils';
import type { Discussion, Comment } from '@/__generated__/graphql';

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

  it('falls back to Items for unknown types', () => {
    expect(getCollectionTypeLabel(undefined)).toBe('Items');
  });
});

describe('getCollectionItems', () => {
  it('returns the array matching the collection type', () => {
    expect(
      getCollectionItems({ collectionType: 'COMMENTS', Comments: [{}, {}] })
    ).toHaveLength(2);
  });

  it('returns an empty array when the typed array is missing', () => {
    expect(getCollectionItems({ collectionType: 'IMAGES' })).toEqual([]);
  });

  it('returns an empty array for a null collection', () => {
    expect(getCollectionItems(null)).toEqual([]);
  });

  it('returns an empty array for an unknown type', () => {
    expect(getCollectionItems({ collectionType: 'WIDGETS' })).toEqual([]);
  });
});

describe('buildCollectionDiscussionLink', () => {
  const discussion = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 'd1',
      DiscussionChannels: [{ channelUniqueName: 'cats' }],
      ...overrides,
    }) as unknown as Discussion;

  it('links to the discussions path by default', () => {
    expect(
      buildCollectionDiscussionLink({ discussion: discussion(), isDownloadsCollection: false })
    ).toBe('/forums/cats/discussions/d1');
  });

  it('links to the downloads path for a downloads collection', () => {
    expect(
      buildCollectionDiscussionLink({ discussion: discussion(), isDownloadsCollection: true })
    ).toBe('/forums/cats/downloads/d1');
  });

  it('links to the downloads path when the discussion has a download', () => {
    expect(
      buildCollectionDiscussionLink({
        discussion: discussion({ hasDownload: true }),
        isDownloadsCollection: false,
      })
    ).toBe('/forums/cats/downloads/d1');
  });

  it('returns "/" when there is no channel', () => {
    expect(
      buildCollectionDiscussionLink({
        discussion: discussion({ DiscussionChannels: [] }),
        isDownloadsCollection: false,
      })
    ).toBe('/');
  });
});

describe('resolveCollectionItemAuthor', () => {
  it('returns null when there is no author', () => {
    expect(
      resolveCollectionItemAuthor({ item: { Author: null } as unknown as Discussion, adminUsernames: [] })
    ).toBeNull();
  });

  it('resolves a user Author with karma', () => {
    const item = {
      Author: { username: 'alice', displayName: 'Alice', commentKarma: 5, discussionKarma: 7 },
    } as unknown as Discussion;
    const result = resolveCollectionItemAuthor({ item, adminUsernames: [] });
    expect(result).toMatchObject({ username: 'alice', commentKarma: 5, discussionKarma: 7, isAdmin: false });
  });

  it('reads the CommentAuthor for comments', () => {
    const item = { CommentAuthor: { username: 'bob', displayName: 'Bob' } } as unknown as Comment;
    expect(resolveCollectionItemAuthor({ item, adminUsernames: [] })?.username).toBe('bob');
  });

  it('marks server admins', () => {
    const item = { Author: { username: 'alice', displayName: 'Alice' } } as unknown as Discussion;
    expect(
      resolveCollectionItemAuthor({ item, adminUsernames: ['alice'] })?.isAdmin
    ).toBe(true);
  });

  it('collapses a mod profile (no username) to display name only', () => {
    const item = { Author: { displayName: 'ModName' } } as unknown as Discussion;
    const result = resolveCollectionItemAuthor({ item, adminUsernames: [] });
    expect(result).toMatchObject({ username: '', displayName: 'ModName' });
  });
});
