

export interface CreateEditDiscussionFormValues {
    title: string;
    body: string;
    selectedTags: Array[string];
    selectedChannels: Array[string];
    author: string;
}

export type SearchDiscussionValues = {
    tags?: Array[string];
    channels?: Array[string];
    searchInput?: string;
  };
  