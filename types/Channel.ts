type RuleInput = {
  summary: string;
  detail: string;
};
import type { FilterGroup } from '@/__generated__/graphql';

export type CreateEditChannelFormValues = {
  uniqueName: string;
  displayName: string;
  description: string;
  selectedTags: Array<string>;
  channelIconURL: string;
  channelBannerURL: string;
  rules: Array<RuleInput>;
  wikiEnabled: boolean;
  downloadsEnabled: boolean;
  allowedFileTypes: Array<string>;
  downloadFilterGroups: Array<FilterGroup>;
  eventsEnabled: boolean;
  feedbackEnabled: boolean;
};
