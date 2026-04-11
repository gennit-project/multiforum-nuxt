import { describe, expect, it } from 'vitest';
import {
  buildSequentialRevisionPairs,
  getRevisionAuthorName,
} from '@/utils/revisionHistory';

describe('revisionHistory utils', () => {
  it('uses display name and nested user fallbacks for revision authors', () => {
    expect(
      [
        getRevisionAuthorName({ username: 'alice' }),
        getRevisionAuthorName({ displayName: 'Mod Alice' }),
        getRevisionAuthorName({ User: { username: 'nested-alice' } }),
        getRevisionAuthorName(null),
      ].join(',')
    ).toBe('alice,Mod Alice,nested-alice,[Deleted]');
  });

  it('pairs current content with the most recent past version, then adjacent past versions', () => {
    const pairs = buildSequentialRevisionPairs({
      currentVersion: {
        id: 'current',
        body: 'current',
        createdAt: '2024-01-04T00:00:00.000Z',
        Author: { username: 'current-author' },
      },
      pastVersions: [
        {
          id: 'past-1',
          body: 'past 1',
          createdAt: '2024-01-03T00:00:00.000Z',
          Author: { username: 'past-1-author' },
        },
        {
          id: 'past-2',
          body: 'past 2',
          createdAt: '2024-01-02T00:00:00.000Z',
          Author: { username: 'past-2-author' },
        },
      ],
      currentAuthor: { username: 'editor' },
    });

    expect(
      pairs.map((pair) => ({
        id: pair.id,
        author: pair.author,
        oldId: pair.oldVersionData.id,
        newId: pair.newVersionData.id,
        isCurrent: pair.isCurrent,
      }))
    ).toEqual([
      {
        id: 'most-recent-edit',
        author: 'editor',
        oldId: 'past-1',
        newId: 'current',
        isCurrent: true,
      },
      {
        id: 'past-2',
        author: 'past-2-author',
        oldId: 'past-2',
        newId: 'past-1',
        isCurrent: false,
      },
    ]);
  });

  it('can skip the current pair when the current content matches the most recent past version', () => {
    const pairs = buildSequentialRevisionPairs({
      currentVersion: {
        id: 'current',
        body: 'same',
        createdAt: '2024-01-04T00:00:00.000Z',
        Author: { username: 'current-author' },
      },
      pastVersions: [
        {
          id: 'past-1',
          body: 'same',
          createdAt: '2024-01-03T00:00:00.000Z',
          Author: { username: 'past-1-author' },
        },
        {
          id: 'past-2',
          body: 'older',
          createdAt: '2024-01-02T00:00:00.000Z',
          Author: { username: 'past-2-author' },
        },
      ],
      skipUnchangedCurrent: true,
    });

    expect(pairs.map((pair) => pair.id)).toEqual(['past-2']);
  });
});
