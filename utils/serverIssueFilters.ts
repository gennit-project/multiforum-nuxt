import { DateTime } from 'luxon';
import type { IssueWhere } from '@/__generated__/graphql';
import { createCaseInsensitivePattern } from '@/utils/searchUtils';

/**
 * Pure filter helpers for the server-wide moderation issue list, extracted from
 * the admin issues page so the default-filter and where-clause rules can be
 * unit-tested in isolation.
 */

type RouteQueryValue = string | null | undefined | (string | null)[];

/**
 * Show all issues by default, including governance requests that are not rule
 * violations. The violation-only view is an explicit filter.
 */
export function getDefaultServerRuleViolationsFilter(
  showOnlyServerRuleViolations: RouteQueryValue
): boolean {
  return showOnlyServerRuleViolations === 'true';
}

export type ServerIssuesWhereParams = {
  searchInput: string;
  selectedChannels: string[];
  startDate: string;
  endDate: string;
  showOnlyServerRuleViolations: boolean;
  isOpen?: boolean;
};

export const isDateInputValue = (value: string | null): value is string => {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
};

const buildCreatedAtRange = (
  startDate: string,
  endDate: string
): Pick<IssueWhere, 'createdAt_GTE' | 'createdAt_LTE'> => {
  const createdAtRange: Pick<IssueWhere, 'createdAt_GTE' | 'createdAt_LTE'> =
    {};

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
 * Build the `issueWhere` filter for a server-issue list (open by default),
 * optionally restricted to flagged server-rule violations, and optionally
 * matched against a case-insensitive title/body search.
 */
export function buildServerIssueWhere(
  params: ServerIssuesWhereParams
): IssueWhere {
  const {
    searchInput,
    selectedChannels,
    startDate,
    endDate,
    showOnlyServerRuleViolations,
    isOpen = true,
  } = params;
  const searchPattern = createCaseInsensitivePattern(searchInput);
  const searchFilter = searchPattern
    ? {
        OR: [{ title_MATCHES: searchPattern }, { body_MATCHES: searchPattern }],
      }
    : {};
  const channelFilter =
    selectedChannels.length > 0
      ? { channelUniqueName_IN: selectedChannels }
      : {};

  return {
    isOpen: { eq: isOpen },
    ...(showOnlyServerRuleViolations
      ? { flaggedServerRuleViolation: { eq: true } }
      : {}),
    ...buildCreatedAtRange(startDate, endDate),
    ...channelFilter,
    ...searchFilter,
  };
}

export function buildServerIssuesWhere(params: ServerIssuesWhereParams): {
  issueWhere: IssueWhere;
} {
  return {
    issueWhere: buildServerIssueWhere(params),
  };
}
