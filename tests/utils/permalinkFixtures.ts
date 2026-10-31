import type { GetPermalinkedCommentQuery } from '@/__generated__/operations';
import { makeReply } from './replyFixtures';

export const makePermalinkedComment = (
  overrides: Partial<GetPermalinkedCommentQuery['comments'][number]> = {}
): GetPermalinkedCommentQuery['comments'][number] => ({
  ...makeReply({ id: 'c1', text: 'A comment', ParentComment: null }),
  ChildComments: [],
  ...overrides,
});
