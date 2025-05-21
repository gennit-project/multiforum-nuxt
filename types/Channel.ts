type RuleInput = {
  summary: string;
  detail: string;
};
export type CreateEditChannelFormValues = {
  uniqueName: string;
  displayName: string;
  description: string;
  selectedTags: Array<string>;
  channelIconURL: string;
  channelBannerURL: string;
  rules: Array<RuleInput>;
  wikiEnabled: boolean;
};
