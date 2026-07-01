import { describe, it, expect } from 'vitest';
import { getServerIssueFilterValuesFromParams } from '@/utils/getServerIssueFilterValuesFromParams';
import type { RouteLocationNormalized } from 'vue-router';
import { issueSortValues } from '@/utils/issueSortOptions';

function createMockRoute(
  query: Record<string, unknown> = {}
): Pick<RouteLocationNormalized, 'query'> {
  return { query };
}

describe('getServerIssueFilterValuesFromParams', () => {
  it('returns default values when route has no query parameters', () => {
    expect(
      getServerIssueFilterValuesFromParams({
        route: createMockRoute(),
      })
    ).toEqual({
      selectedChannels: [],
      searchInput: '',
      startDate: '',
      endDate: '',
      showOnlyServerRuleViolations: true,
      sort: issueSortValues.NEWEST,
    });
  });

  it('parses selected channels from a string', () => {
    expect(
      getServerIssueFilterValuesFromParams({
        route: createMockRoute({ channels: 'announcements' }),
      }).selectedChannels
    ).toEqual(['announcements']);
  });

  it('parses selected channels from an array', () => {
    expect(
      getServerIssueFilterValuesFromParams({
        route: createMockRoute({
          channels: ['announcements', 'support', 3],
        }),
      }).selectedChannels
    ).toEqual(['announcements', 'support']);
  });

  it('parses search input and valid date bounds', () => {
    expect(
      getServerIssueFilterValuesFromParams({
        route: createMockRoute({
          searchInput: 'spam',
          startDate: '2026-05-01',
          endDate: '2026-07-01',
        }),
      })
    ).toMatchObject({
      searchInput: 'spam',
      startDate: '2026-05-01',
      endDate: '2026-07-01',
    });
  });

  it('drops invalid date values', () => {
    expect(
      getServerIssueFilterValuesFromParams({
        route: createMockRoute({
          startDate: '2026-5-1',
          endDate: 'not-a-date',
        }),
      })
    ).toMatchObject({
      startDate: '',
      endDate: '',
    });
  });

  it('defaults server-rule violations filter to true unless explicitly false', () => {
    expect(
      getServerIssueFilterValuesFromParams({
        route: createMockRoute({
          showOnlyServerRuleViolations: 'false',
        }),
      }).showOnlyServerRuleViolations
    ).toBe(false);

    expect(
      getServerIssueFilterValuesFromParams({
        route: createMockRoute({
          showOnlyServerRuleViolations: 'true',
        }),
      }).showOnlyServerRuleViolations
    ).toBe(true);
  });

  it('parses the sort value from query params', () => {
    expect(
      getServerIssueFilterValuesFromParams({
        route: createMockRoute({
          sort: issueSortValues.OLDEST,
        }),
      }).sort
    ).toBe(issueSortValues.OLDEST);
  });
});
