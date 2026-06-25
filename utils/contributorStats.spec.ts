import { describe, it, expect } from 'vitest';
import type { UserContributionData } from '@/__generated__/graphql';
import { getMaxDayCount, buildContributorStats } from './contributorStats';

const makeContributor = (
  username: string,
  days: { count: number; discussions?: number; comments?: number }[]
): UserContributionData =>
  ({
    username,
    dayData: days.map((d) => ({
      count: d.count,
      activities: [
        {
          Discussions: Array.from({ length: d.discussions ?? 0 }, (_, i) => ({
            id: `d${i}`,
          })),
          Comments: Array.from({ length: d.comments ?? 0 }, (_, i) => ({
            id: `c${i}`,
          })),
        },
      ],
    })),
  }) as unknown as UserContributionData;

describe('getMaxDayCount', () => {
  it('returns 0 for no contributors', () => {
    expect(getMaxDayCount([])).toBe(0);
  });

  it('returns the highest single-day count across all contributors', () => {
    const contributors = [
      makeContributor('alice', [{ count: 2 }, { count: 5 }]),
      makeContributor('bob', [{ count: 9 }, { count: 1 }]),
    ];
    expect(getMaxDayCount(contributors)).toBe(9);
  });
});

describe('buildContributorStats', () => {
  it('sums discussions and comments across a contributor\'s days', () => {
    const stats = buildContributorStats([
      makeContributor('alice', [
        { count: 3, discussions: 2, comments: 1 },
        { count: 1, discussions: 0, comments: 4 },
      ]),
    ]);
    expect(stats[0]).toEqual({
      username: 'alice',
      discussionCount: 2,
      commentCount: 5,
    });
  });

  it('returns a stat entry per contributor', () => {
    const stats = buildContributorStats([
      makeContributor('alice', [{ count: 1 }]),
      makeContributor('bob', [{ count: 1 }]),
    ]);
    expect(stats.map((s) => s.username)).toEqual(['alice', 'bob']);
  });
});
