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
      attributionOverride?: string | null;
      supportPatreonUrl?: string | null;
      supportBuyMeACoffeeUrl?: string | null;
      supportKoFiUrl?: string | null;
      supportPayPalMeUrl?: string | null;
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

// Extended types for runtime fields returned by GraphQL queries
// but not included in the generated schema types
export interface DiscussionChannelWithFavorited {
  isFavorited?: boolean;
}

export interface DiscussionWithFavorited {
  isFavorited?: boolean;
}

// Type for downloadable files in forms (simplified from full DownloadableFile)
export interface DownloadFormFile {
  id?: string;
  fileName: string;
  url: string;
  kind: string;
  size: number;
  license: string;
  priceModel: string;
  priceCents: number;
  priceCurrency: string;
}

// Stub type for creating temporary Discussion objects in forms
export interface DiscussionStubForDownload {
  id: string;
  DownloadableFiles: DownloadFormFile[];
}
