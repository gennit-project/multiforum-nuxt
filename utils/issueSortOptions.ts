import type { Issue } from '@/__generated__/graphql';
import type { LocationQuery } from 'vue-router';

export const issueSortValues = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  MOST_REPORTS: 'mostReports',
} as const;

export type IssueSortValue =
  (typeof issueSortValues)[keyof typeof issueSortValues];

export const defaultIssueSort = issueSortValues.NEWEST;

export const issueSortOptions = [
  {
    label: 'Newest',
    value: issueSortValues.NEWEST,
  },
  {
    label: 'Oldest',
    value: issueSortValues.OLDEST,
  },
  {
    label: 'Most reports',
    value: issueSortValues.MOST_REPORTS,
  },
];

const validIssueSorts = new Set<IssueSortValue>(Object.values(issueSortValues));

export const getIssueSortFromQuery = (query: LocationQuery): IssueSortValue => {
  if (
    typeof query.sort === 'string' &&
    validIssueSorts.has(query.sort as IssueSortValue)
  ) {
    return query.sort as IssueSortValue;
  }
  return defaultIssueSort;
};

export const getIssueSortLabel = (value: IssueSortValue): string => {
  const match = issueSortOptions.find((option) => option.value === value);
  return match?.label || 'Newest';
};

export const getIssueGraphqlSort = (value: IssueSortValue) => {
  if (value === issueSortValues.OLDEST) {
    return [{ createdAt: 'ASC' }];
  }

  return [{ createdAt: 'DESC' }];
};

const getReportCount = (issue: Pick<Issue, 'ActivityFeedAggregate'>) => {
  return issue.ActivityFeedAggregate?.count || 0;
};

const getCreatedAtTimestamp = (issue: Pick<Issue, 'createdAt'>) => {
  if (!issue.createdAt) {
    return 0;
  }
  const timestamp = new Date(issue.createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const sortIssuesBySelection = (
  issues: Issue[],
  selectedSort: IssueSortValue
) => {
  if (selectedSort !== issueSortValues.MOST_REPORTS) {
    return issues;
  }

  return [...issues].sort((left, right) => {
    const reportCountDelta = getReportCount(right) - getReportCount(left);
    if (reportCountDelta !== 0) {
      return reportCountDelta;
    }

    return getCreatedAtTimestamp(right) - getCreatedAtTimestamp(left);
  });
};
