

export interface Image {
  url: string;
  caption: string;
  copyright: string;
  alt: string;
  hasSensitiveContent: boolean;
  isCoverImage: boolean;
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
  