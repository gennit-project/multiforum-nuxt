import { describe, it, expect } from 'vitest';
import {
  defaultIssueSort,
  getIssueSortFromQuery,
  getIssueSortLabel,
  issueSortValues,
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

  it('includes most reports as a valid query sort', () => {
    expect(
      getIssueSortFromQuery({ sort: issueSortValues.MOST_REPORTS })
    ).toBe(issueSortValues.MOST_REPORTS);
  });
});
