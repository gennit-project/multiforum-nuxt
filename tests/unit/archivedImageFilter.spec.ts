import { describe, it, expect } from 'vitest';
import {
  GET_IMAGE_DETAILS,
  GET_ALBUM_DETAILS,
  GET_USER_ALBUMS,
} from '@/graphQLData/image/queries';
import { GET_DISCUSSION } from '@/graphQLData/discussion/queries';

// Archived / permanently-removed images are hidden from normal display purely by
// an `archived_NOT: true, permanentlyRemoved_NOT: true` filter repeated on every
// album/image-bearing query (there is no central/backend filter). If a regression
// drops that filter from one of these queries, archived/removed images would leak
// back into the album, gallery, or discussion view. Guard the key queries.
const queryBody = (doc: { loc?: { source: { body: string } } }) =>
  doc.loc?.source.body ?? '';

describe('archived/removed image hiding filter', () => {
  it.each([
    ['GET_IMAGE_DETAILS', GET_IMAGE_DETAILS],
    ['GET_ALBUM_DETAILS', GET_ALBUM_DETAILS],
    ['GET_USER_ALBUMS', GET_USER_ALBUMS],
    ['GET_DISCUSSION', GET_DISCUSSION],
  ])('%s filters out archived and permanently-removed images', (_name, doc) => {
    const body = queryBody(doc as { loc?: { source: { body: string } } });

    expect([
      body.includes('archived_NOT: true'),
      body.includes('permanentlyRemoved_NOT: true'),
    ]).toEqual([true, true]);
  });
});
