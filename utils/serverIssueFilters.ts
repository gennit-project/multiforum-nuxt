import { DateTime } from 'luxon';
import { createCaseInsensitivePattern } from '@/utils/searchUtils';

/**
 * Pure filter helpers for the server-wide moderation issue list, extracted from
 * the admin issues page so the default-filter and where-clause rules can be
 * unit-tested in isolation.
 */

type RouteQueryValue = string | null | undefined | (string | null)[];

/**
 * The "show only server rule violations" filter defaults to on. It is only off
 * when the query string explicitly opts out with `showOnlyServerRuleViolations=false`.
 */
export function getDefaultServerRuleViolationsFilter(
  showOnlyServerRuleViolations: RouteQueryValue
): boolean {
  return showOnlyServerRuleViolations !== 'false';
}

export type ServerIssuesWhereParams = {
  searchInput: string;
  selectedChannels: string[];
  startDate: string;
  endDate: string;
  showOnlyServerRuleViolations: boolean;
};

export const isDateInputValue = (value: string | null): value is string => {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
};

const buildCreatedAtRange = (
  startDate: string,
  endDate: string
): Record<string, string> => {
  const createdAtRange: Record<string, string> = {};

  if (isDateInputValue(startDate)) {
    const createdAtGte = DateTime.fromISO(startDate, {
      zone: 'utc',
    })
      .startOf('day')
      .toISO();
    if (createdAtGte) {
      createdAtRange.createdAt_GTE = createdAtGte;
    }
  }

  if (isDateInputValue(endDate)) {
    const createdAtLte = DateTime.fromISO(endDate, {
      zone: 'utc',
    })
      .endOf('day')
      .toISO();
    if (createdAtLte) {
      createdAtRange.createdAt_LTE = createdAtLte;
    }
  }

  return createdAtRange;
};

/**
 * Build the `issueWhere` filter for the open server-issue list: always open,
 * optionally restricted to flagged server-rule violations, and optionally
 * matched against a case-insensitive title/body search.
 */
export function buildServerIssuesWhere(
  params: ServerIssuesWhereParams
): { issueWhere: Record<string, unknown> } {
  const {
    searchInput,
    selectedChannels,
    startDate,
    endDate,
    showOnlyServerRuleViolations,
  } =
    params;
  const searchPattern = createCaseInsensitivePattern(searchInput);
  const searchFilter = searchPattern
    ? { OR: [{ title_MATCHES: searchPattern }, { body_MATCHES: searchPattern }] }
    : {};
  const channelFilter =
    selectedChannels.length > 0
      ? { channelUniqueName_IN: selectedChannels }
      : {};

  return {
    issueWhere: {
      isOpen: true,
      ...(showOnlyServerRuleViolations
        ? { flaggedServerRuleViolation: true }
        : {}),
      ...buildCreatedAtRange(startDate, endDate),
      ...channelFilter,
      ...searchFilter,
    },
  };
}
