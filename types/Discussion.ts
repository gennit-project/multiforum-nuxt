

export interface Image {
  fileName: string;
  caption: string;
  attribution: string;
}

export interface Album {
    images: Array<Image>;
}
export interface CreateEditDiscussionFormValues {
    title: string;
    body: string;
    selectedTags: Array<string>;
    selectedChannels: Array<string>;
    author: string;
    album: Album;
}

export type SearchDiscussionValues = {
    tags?: Array<string>
    channels?: Array<string>
    searchInput?: string;
    showArchived?: boolean;
  };
  