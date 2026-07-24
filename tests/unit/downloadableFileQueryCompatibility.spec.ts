import { print } from 'graphql';
import { describe, expect, it } from 'vitest';
import { REQUEST_DOWNLOADABLE_FILE_REVIEW } from '@/graphQLData/discussion/mutations';
import {
  GET_DISCUSSION,
  GET_DISCUSSION_FEEDBACK,
} from '@/graphQLData/discussion/queries';

describe('DownloadableFile GraphQL operations', () => {
  it('do not select review queue fields from DownloadableFile', () => {
    const operations = [
      GET_DISCUSSION,
      GET_DISCUSSION_FEEDBACK,
      REQUEST_DOWNLOADABLE_FILE_REVIEW,
    ].map(print);

    expect(
      operations.map((operation) => ({
        reviewRequestedAt: operation.includes('reviewRequestedAt'),
        reviewRequestReason: operation.includes('reviewRequestReason'),
      }))
    ).toEqual([
      { reviewRequestedAt: false, reviewRequestReason: false },
      { reviewRequestedAt: false, reviewRequestReason: false },
      { reviewRequestedAt: false, reviewRequestReason: false },
    ]);
  });
});
