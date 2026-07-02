type DownloadsCollectionLike = {
  name?: string | null;
  collectionType?: string | null;
};

export const AUTO_SAVED_DOWNLOADS_COLLECTION_NAME = 'Downloaded Items';
export const AUTO_SAVED_DOWNLOADS_COLLECTION_DESCRIPTION =
  'Items appear here automatically when you download them.';

export const isAutoSavedDownloadsCollection = (
  collection: DownloadsCollectionLike | null | undefined
) =>
  collection?.collectionType === 'DOWNLOADS' &&
  collection?.name === AUTO_SAVED_DOWNLOADS_COLLECTION_NAME;
