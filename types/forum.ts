export type ForumItem = {
  uniqueName: string;
  channelIconURL?: string | null;
  variantUrls?: Record<string, string> | null;
  icon32Url?: string | null;
  icon48Url?: string | null;
  icon64Url?: string | null;
  icon96Url?: string | null;
  displayName?: string | null;
  timestamp: number;
};
