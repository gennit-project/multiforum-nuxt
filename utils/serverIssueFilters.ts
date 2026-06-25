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
  showOnlyServerRuleViolations: boolean;
};

/**
 * Build the `issueWhere` filter for the open server-issue list: always open,
 * optionally restricted to flagged server-rule violations, and optionally
 * matched against a case-insensitive title/body search.
 */
export function buildServerIssuesWhere(
  params: ServerIssuesWhereParams
): { issueWhere: Record<string, unknown> } {
  const { searchInput, showOnlyServerRuleViolations } = params;
  const searchPattern = createCaseInsensitivePattern(searchInput);
  const searchFilter = searchPattern
    ? { OR: [{ title_MATCHES: searchPattern }, { body_MATCHES: searchPattern }] }
    : {};

  return {
    issueWhere: {
      isOpen: true,
      ...(showOnlyServerRuleViolations
        ? { flaggedServerRuleViolation: true }
        : {}),
      ...searchFilter,
    },
  };
}
