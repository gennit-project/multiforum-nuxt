import { describe, it, expect } from 'vitest';
import {
  getDefaultServerRuleViolationsFilter,
  buildServerIssuesWhere,
  isDateInputValue,
} from './serverIssueFilters';

describe('getDefaultServerRuleViolationsFilter', () => {
  it('defaults to true when the query param is absent', () => {
    expect(getDefaultServerRuleViolationsFilter(undefined)).toBe(true);
  });

  it('is false only when explicitly set to "false"', () => {
    expect(getDefaultServerRuleViolationsFilter('false')).toBe(false);
  });

  it('stays true for the explicit "true" value', () => {
    expect(getDefaultServerRuleViolationsFilter('true')).toBe(true);
  });
});

describe('buildServerIssuesWhere', () => {
  it('always filters to open issues', () => {
    const { issueWhere } = buildServerIssuesWhere({
      searchInput: '',
      selectedChannels: [],
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      showOnlyServerRuleViolations: false,
    });
    expect(issueWhere.isOpen).toBe(true);
  });

  it('adds the server-rule-violation flag when enabled', () => {
    const { issueWhere } = buildServerIssuesWhere({
      searchInput: '',
      selectedChannels: [],
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      showOnlyServerRuleViolations: true,
    });
    expect(issueWhere.flaggedServerRuleViolation).toBe(true);
  });

  it('omits the violation flag when disabled', () => {
    const { issueWhere } = buildServerIssuesWhere({
      searchInput: '',
      selectedChannels: [],
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      showOnlyServerRuleViolations: false,
    });
    expect('flaggedServerRuleViolation' in issueWhere).toBe(false);
  });

  it('adds an inclusive created-at range from the date inputs', () => {
    const { issueWhere } = buildServerIssuesWhere({
      searchInput: '',
      selectedChannels: [],
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      showOnlyServerRuleViolations: false,
    });
    expect({
      createdAt_GTE: issueWhere.createdAt_GTE,
      createdAt_LTE: issueWhere.createdAt_LTE,
    }).toEqual({
      createdAt_GTE: '2026-06-01T00:00:00.000Z',
      createdAt_LTE: '2026-06-30T23:59:59.999Z',
    });
  });

  it('adds a channel filter when channels are selected', () => {
    const { issueWhere } = buildServerIssuesWhere({
      searchInput: '',
      selectedChannels: ['announcements', 'meta'],
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      showOnlyServerRuleViolations: false,
    });
    expect(issueWhere.channelUniqueName_IN).toEqual(['announcements', 'meta']);
  });

  it('adds a title/body OR search filter when search input is present', () => {
    const { issueWhere } = buildServerIssuesWhere({
      searchInput: 'spam',
      selectedChannels: [],
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      showOnlyServerRuleViolations: false,
    });
    expect(issueWhere.OR).toHaveLength(2);
  });

  it('omits the search filter for blank input', () => {
    const { issueWhere } = buildServerIssuesWhere({
      searchInput: '   ',
      selectedChannels: [],
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      showOnlyServerRuleViolations: false,
    });
    expect('OR' in issueWhere).toBe(false);
  });
});

describe('isDateInputValue', () => {
  it('accepts yyyy-mm-dd dates', () => {
    expect(isDateInputValue('2026-06-29')).toBe(true);
  });

  it('rejects non-date values', () => {
    expect(isDateInputValue('06/29/2026')).toBe(false);
  });
});
