import { describe, it, expect } from 'vitest';
import {
  defaultIssueSort,
  getIssueGraphqlSort,
  getIssueSortFromQuery,
  getIssueSortLabel,
  issueSortValues,
  sortIssuesBySelection,
} from '@/utils/issueSortOptions';

describe('issueSortOptions', () => {
  it('defaults to newest when query sort is missing or invalid', () => {
    expect(getIssueSortFromQuery({})).toBe(defaultIssueSort);
    expect(getIssueSortFromQuery({ sort: 'invalid' })).toBe(defaultIssueSort);
  });

  it('parses a valid sort from the query', () => {
    expect(getIssueSortFromQuery({ sort: issueSortValues.OLDEST })).toBe(
      issueSortValues.OLDEST
    );
  });

  it('returns labels for the configured sorts', () => {
    expect(getIssueSortLabel(issueSortValues.NEWEST)).toBe('Newest');
    expect(getIssueSortLabel(issueSortValues.OLDEST)).toBe('Oldest');
    expect(getIssueSortLabel(issueSortValues.MOST_REPORTS)).toBe(
      'Most reports'
    );
  });

  it('maps server-supported sorts to graphql sort inputs', () => {
    expect(getIssueGraphqlSort(issueSortValues.NEWEST)).toEqual([
      { createdAt: 'DESC' },
    ]);
    expect(getIssueGraphqlSort(issueSortValues.OLDEST)).toEqual([
      { createdAt: 'ASC' },
    ]);
    expect(getIssueGraphqlSort(issueSortValues.MOST_REPORTS)).toEqual([
      { createdAt: 'DESC' },
    ]);
  });

  it('sorts most reports by report count descending with newest tie-breaker', () => {
    const sorted = sortIssuesBySelection(
      [
        {
          id: '1',
          createdAt: '2026-05-01T00:00:00.000Z',
          ActivityFeedAggregate: { count: 2 },
        },
        {
          id: '2',
          createdAt: '2026-06-01T00:00:00.000Z',
          ActivityFeedAggregate: { count: 4 },
        },
        {
          id: '3',
          createdAt: '2026-07-01T00:00:00.000Z',
          ActivityFeedAggregate: { count: 2 },
        },
      ] as never,
      issueSortValues.MOST_REPORTS
    );

    expect(sorted.map((issue) => issue.id)).toEqual(['2', '3', '1']);
  });
});
