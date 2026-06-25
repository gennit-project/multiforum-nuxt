import { describe, it, expect } from 'vitest';
import {
  getRevisionAuthorName,
  getVersionAuthorName,
  getRevisionContent,
  buildSequentialRevisionPairs,
} from './revisionHistory';

describe('getRevisionAuthorName', () => {
  it('returns a non-empty string author as-is', () => {
    expect(getRevisionAuthorName('alice')).toBe('alice');
  });

  it('returns [Deleted] for an empty string', () => {
    expect(getRevisionAuthorName('')).toBe('[Deleted]');
  });

  it('returns [Deleted] for a null author', () => {
    expect(getRevisionAuthorName(null)).toBe('[Deleted]');
  });

  it('prefers username', () => {
    expect(
      getRevisionAuthorName({ username: 'alice', displayName: 'Alice' })
    ).toBe('alice');
  });

  it('falls back to displayName', () => {
    expect(getRevisionAuthorName({ displayName: 'Alice' })).toBe('Alice');
  });

  it('falls back to the nested User username', () => {
    expect(getRevisionAuthorName({ User: { username: 'bob' } })).toBe('bob');
  });

  it('returns [Deleted] when nothing identifies the author', () => {
    expect(getRevisionAuthorName({})).toBe('[Deleted]');
  });
});

describe('getVersionAuthorName', () => {
  it('reads the author from a version', () => {
    expect(
      getVersionAuthorName({
        id: 'v1',
        createdAt: 't',
        Author: { username: 'alice' },
      })
    ).toBe('alice');
  });
});

describe('getRevisionContent', () => {
  it('prefers the body', () => {
    expect(
      getRevisionContent({ id: 'v', createdAt: 't', body: 'B', title: 'T' })
    ).toBe('B');
  });

  it('falls back to the title then empty string', () => {
    expect(getRevisionContent({ id: 'v', createdAt: 't', title: 'T' })).toBe(
      'T'
    );
  });
});

describe('buildSequentialRevisionPairs', () => {
  const current = {
    id: 'current',
    body: 'v3',
    createdAt: '2024-03-01',
    Author: { username: 'carol' },
  };

  it('returns an empty list when there are no past versions', () => {
    expect(
      buildSequentialRevisionPairs({ pastVersions: [], currentVersion: current })
    ).toEqual([]);
  });

  it('pairs the current version against the most recent past version', () => {
    const pairs = buildSequentialRevisionPairs({
      pastVersions: [{ id: 'p1', body: 'v2', createdAt: '2024-02-01' }],
      currentVersion: current,
    });
    expect(pairs[0]).toMatchObject({ id: 'most-recent-edit', isCurrent: true });
  });

  it('uses currentAuthor for the most-recent pair when provided', () => {
    const pairs = buildSequentialRevisionPairs({
      pastVersions: [{ id: 'p1', body: 'v2', createdAt: '2024-02-01' }],
      currentVersion: current,
      currentAuthor: { username: 'dave' },
    });
    expect(pairs[0].author).toBe('dave');
  });

  it('skips the most-recent pair when unchanged and skipUnchangedCurrent is set', () => {
    const pairs = buildSequentialRevisionPairs({
      pastVersions: [{ id: 'p1', body: 'v3', createdAt: '2024-02-01' }],
      currentVersion: current,
      skipUnchangedCurrent: true,
    });
    expect(pairs).toEqual([]);
  });

  it('builds one sequential pair per older version step', () => {
    const pairs = buildSequentialRevisionPairs({
      pastVersions: [
        { id: 'p1', body: 'v2', createdAt: '2024-02-01' },
        { id: 'p2', body: 'v1', createdAt: '2024-01-01' },
      ],
      currentVersion: current,
    });
    // most-recent-edit + one historical pair (p2 vs p1)
    expect(pairs.map((p) => p.id)).toEqual(['most-recent-edit', 'p2']);
  });

  it('resolves historical pair authors via getHistoricalPairAuthor', () => {
    const pairs = buildSequentialRevisionPairs({
      pastVersions: [
        { id: 'p1', body: 'v2', createdAt: '2024-02-01' },
        {
          id: 'p2',
          body: 'v1',
          createdAt: '2024-01-01',
          Author: { username: 'eve' },
        },
      ],
      currentVersion: current,
      getHistoricalPairAuthor: ({ oldVersion }) => oldVersion.Author,
    });
    expect(pairs[1].author).toBe('eve');
  });
});
