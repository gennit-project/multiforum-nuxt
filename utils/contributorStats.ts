import type {
  Activity,
  DayData,
  UserContributionData,
} from '@/__generated__/graphql';

/**
 * Pure aggregation helpers for the forum contributors page. Extracted so the
 * per-contributor counting and chart-scaling logic can be unit-tested without
 * mounting the page or its chart component.
 */

/** Highest single-day contribution count across all contributors (chart Y max). */
export function getMaxDayCount(
  contributors: UserContributionData[]
): number {
  let max = 0;
  for (const contributor of contributors) {
    for (const day of contributor.dayData as DayData[]) {
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
  contributors: UserContributionData[]
): ContributorStat[] {
  return contributors.map((contributor) => {
    let discussionCount = 0;
    let commentCount = 0;

    (contributor.dayData as DayData[]).forEach((day) => {
      day.activities.forEach((activity: Activity) => {
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
