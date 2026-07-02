import { describe, expect, it } from 'vitest';
import {
  AUTO_SAVED_DOWNLOADS_COLLECTION_NAME,
  isAutoSavedDownloadsCollection,
} from './downloadLibraryCollection';

describe('downloadLibraryCollection', () => {
  it('matches the special auto-saved downloads collection', () => {
    expect(
      isAutoSavedDownloadsCollection({
        name: AUTO_SAVED_DOWNLOADS_COLLECTION_NAME,
        collectionType: 'DOWNLOADS',
      })
    ).toBe(true);
  });

  it('rejects collections with a different name', () => {
    expect(
      isAutoSavedDownloadsCollection({
        name: 'My Downloads',
        collectionType: 'DOWNLOADS',
      })
    ).toBe(false);
  });

  it('rejects non-download collections', () => {
    expect(
      isAutoSavedDownloadsCollection({
        name: AUTO_SAVED_DOWNLOADS_COLLECTION_NAME,
        collectionType: 'DISCUSSIONS',
      })
    ).toBe(false);
  });
});
