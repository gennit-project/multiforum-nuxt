import { describe, expect, it } from 'vitest';
import { print } from 'graphql';
import { GET_USER_FAVORITE_COUNTS } from './queries';

describe('GET_USER_FAVORITE_COUNTS', () => {
  it('requests connection totals for every favorite type', () => {
    const query = print(GET_USER_FAVORITE_COUNTS);
    expect(query.match(/totalCount/g)).toHaveLength(5);
  });

  it('separates favorite discussions from downloads by node type', () => {
    const query = print(GET_USER_FAVORITE_COUNTS);
    expect(query).toMatch(
      /FavoriteDownloadsConnection: FavoriteDiscussionsConnection\(\s*where: \{node: \{hasDownload: true\}\}\s*\)/
    );
  });
});
