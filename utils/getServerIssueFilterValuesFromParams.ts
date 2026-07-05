import type { RouteLocationNormalized } from 'vue-router';
import {
  getDefaultServerRuleViolationsFilter,
  isDateInputValue,
} from '@/utils/serverIssueFilters';
import {
  defaultIssueSort,
  getIssueSortFromQuery,
  type IssueSortValue,
} from '@/utils/issueSortOptions';

type GetServerIssueFilterValuesInput = {
  route: Pick<RouteLocationNormalized, 'query'>;
};

export type ServerIssueFilterValues = {
  selectedChannels: string[];
  searchInput: string;
  startDate: string;
  endDate: string;
  showOnlyServerRuleViolations: boolean;
  filterCreatedByMe: boolean;
  filterIAmOP: boolean;
  filterIReported: boolean;
  sort: IssueSortValue;
};

const getQueryString = (value: unknown) => {
  return typeof value === 'string' && value ? value : null;
};

export const getServerIssueFilterValuesFromParams = (
  input: GetServerIssueFilterValuesInput
): ServerIssueFilterValues => {
  const cleanedValues: ServerIssueFilterValues = {
    selectedChannels: [],
    searchInput: '',
    startDate: '',
    endDate: '',
    showOnlyServerRuleViolations: true,
    filterCreatedByMe: false,
    filterIAmOP: false,
    filterIReported: false,
    sort: defaultIssueSort,
  };

  for (const key in input.route?.query || {}) {
    const val = input.route.query[key];

    switch (key) {
      case 'channels':
        if (typeof val === 'string') {
          cleanedValues.selectedChannels = val ? [val] : [];
        }
        if (Array.isArray(val)) {
          cleanedValues.selectedChannels = val.filter(
            (value): value is string => typeof value === 'string' && !!value
          );
        }
        break;
      case 'searchInput':
        if (typeof val === 'string') {
          cleanedValues.searchInput = val;
        }
        break;
      case 'startDate': {
        const startDate = getQueryString(val);
        cleanedValues.startDate = isDateInputValue(startDate) ? startDate : '';
        break;
      }
      case 'endDate': {
        const endDate = getQueryString(val);
        cleanedValues.endDate = isDateInputValue(endDate) ? endDate : '';
        break;
      }
      case 'showOnlyServerRuleViolations':
        cleanedValues.showOnlyServerRuleViolations =
          getDefaultServerRuleViolationsFilter(val);
        break;
      case 'filterCreatedByMe':
        cleanedValues.filterCreatedByMe = val === 'true';
        break;
      case 'filterIAmOP':
        cleanedValues.filterIAmOP = val === 'true';
        break;
      case 'filterIReported':
        cleanedValues.filterIReported = val === 'true';
        break;
      case 'sort':
        cleanedValues.sort = getIssueSortFromQuery(input.route.query);
        break;
    }
  }

  return cleanedValues;
};
