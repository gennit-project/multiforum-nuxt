import { describe, it, expect } from 'vitest';
import {
  getDefaultServerRuleViolationsFilter,
  buildServerIssuesWhere,
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
      showOnlyServerRuleViolations: false,
    });
    expect(issueWhere.isOpen).toBe(true);
  });

  it('adds the server-rule-violation flag when enabled', () => {
    const { issueWhere } = buildServerIssuesWhere({
      searchInput: '',
      selectedChannels: [],
      showOnlyServerRuleViolations: true,
    });
    expect(issueWhere.flaggedServerRuleViolation).toBe(true);
  });

  it('omits the violation flag when disabled', () => {
    const { issueWhere } = buildServerIssuesWhere({
      searchInput: '',
      selectedChannels: [],
      showOnlyServerRuleViolations: false,
    });
    expect('flaggedServerRuleViolation' in issueWhere).toBe(false);
  });

  it('adds a channel filter when channels are selected', () => {
    const { issueWhere } = buildServerIssuesWhere({
      searchInput: '',
      selectedChannels: ['announcements', 'meta'],
      showOnlyServerRuleViolations: false,
    });
    expect(issueWhere.channelUniqueName_IN).toEqual(['announcements', 'meta']);
  });

  it('adds a title/body OR search filter when search input is present', () => {
    const { issueWhere } = buildServerIssuesWhere({
      searchInput: 'spam',
      selectedChannels: [],
      showOnlyServerRuleViolations: false,
    });
    expect(issueWhere.OR).toHaveLength(2);
  });

  it('omits the search filter for blank input', () => {
    const { issueWhere } = buildServerIssuesWhere({
      searchInput: '   ',
      selectedChannels: [],
      showOnlyServerRuleViolations: false,
    });
    expect('OR' in issueWhere).toBe(false);
  });
});
