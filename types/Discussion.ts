export interface CreateEditDiscussionFormValues {
  title: string;
  body: string;
  selectedTags: Array<string>;
  selectedChannels: Array<string>;
  author: string;
  album: {
    images: {
      id?: string;
      url: string;
      alt: string;
      caption: string;
      copyright: string;
    }[];
    imageOrder: string[];
  };
  downloadableFiles?: {
    id?: string;
    fileName: string;
    url: string;
    kind: string;
    size: number;
    license: string;
    priceModel: string;
    priceCents: number;
    priceCurrency: string;
  }[];
  downloadLabels?: Record<string, string[]>; // filterGroupKey -> selected option values
  crosspostId?: string | null;
}

export type SearchDiscussionValues = {
  tags?: Array<string>;
  channels?: Array<string>;
  searchInput?: string;
  showArchived?: boolean;
  showUnanswered?: boolean;
};
