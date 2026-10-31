import type { ChannelContributor } from '@/types/contribution';

/**
 * Pure aggregation helpers for the forum contributors page. Extracted so the
 * per-contributor counting and chart-scaling logic can be unit-tested without
 * mounting the page or its chart component.
 */

/** Highest single-day contribution count across all contributors (chart Y max). */
export function getMaxDayCount(
  contributors: ChannelContributor[]
): number {
  let max = 0;
  for (const contributor of contributors) {
    for (const day of contributor.dayData) {
      if (day.count > max) {
        max = day.count;
      }
    }
  }
  return max;
}

export type ContributorStat = {
  username: string;
  discussionCount: number;
  commentCount: number;
};

/** Total discussions and comments each contributor authored over the period. */
export function buildContributorStats(
  contributors: ChannelContributor[]
): ContributorStat[] {
  return contributors.map((contributor) => {
    let discussionCount = 0;
    let commentCount = 0;

    (contributor.dayData).forEach((day) => {
      day.activities.forEach((activity) => {
        discussionCount += (activity.Discussions || []).length;
        commentCount += (activity.Comments || []).length;
      });
    });

    return {
      username: contributor.username,
      discussionCount,
      commentCount,
    };
  });
}
