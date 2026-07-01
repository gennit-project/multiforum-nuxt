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
