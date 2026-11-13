// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildSchema, coerceInputValue, isInputObjectType } from 'graphql';
import {
  getDefaultServerRuleViolationsFilter,
  buildServerIssueWhere,
  buildServerIssuesWhere,
  isDateInputValue,
} from './serverIssueFilters';

describe('getDefaultServerRuleViolationsFilter', () => {
  it('defaults to all issues so governance requests remain discoverable', () => {
    expect(getDefaultServerRuleViolationsFilter(undefined)).toBe(false);
  });

  it('is false when explicitly set to "false"', () => {
    expect(getDefaultServerRuleViolationsFilter('false')).toBe(false);
  });

  it('stays true for the explicit "true" value', () => {
    expect(getDefaultServerRuleViolationsFilter('true')).toBe(true);
  });
});

describe('server issue filter schema contract', () => {
  const schema = buildSchema(
    readFileSync(
      new URL('../graphql-schema/schema.graphql', import.meta.url),
      'utf8'
    )
  );
  const issueWhereType = schema.getType('IssueWhere');
  if (!isInputObjectType(issueWhereType))
    throw new Error('Pinned schema is missing IssueWhere');

  it.each([
    [true, false],
    [false, false],
    [true, true],
    [false, true],
  ])(
    'accepts open=%s and violations=%s with all optional filters',
    (isOpen, showOnlyServerRuleViolations) => {
      const filter = buildServerIssueWhere({
        isOpen,
        showOnlyServerRuleViolations,
        searchInput: 'spam',
        selectedChannels: ['announcements', 'meta'],
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      });
      expect(coerceInputValue(filter, issueWhereType)).toEqual(filter);
    }
  );

  it.each(['isOpen', 'flaggedServerRuleViolation'])(
    'rejects the former raw boolean shape for %s',
    (key) => {
      expect(() => coerceInputValue({ [key]: true }, issueWhereType)).toThrow(
        /BooleanScalarFilters/
      );
    }
  );
});

describe('buildServerIssuesWhere', () => {
  it('preserves an explicit closed-issue filter', () => {
    expect(
      buildServerIssueWhere({
        searchInput: '',
        selectedChannels: [],
        startDate: '',
        endDate: '',
        showOnlyServerRuleViolations: false,
        isOpen: false,
      })
    ).toEqual({ isOpen: { eq: false } });
  });

  it('always filters to open issues', () => {
    const { issueWhere } = buildServerIssuesWhere({
      searchInput: '',
      selectedChannels: [],
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      showOnlyServerRuleViolations: false,
    });
    expect(issueWhere.isOpen).toEqual({ eq: true });
  });

  it('adds the server-rule-violation flag when enabled', () => {
    const { issueWhere } = buildServerIssuesWhere({
      searchInput: '',
      selectedChannels: [],
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      showOnlyServerRuleViolations: true,
    });
    expect(issueWhere.flaggedServerRuleViolation).toEqual({ eq: true });
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
