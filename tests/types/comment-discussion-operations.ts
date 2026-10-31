import { useMutation, useQuery } from '@vue/apollo-composable';
import {
  UpdateCommentDocument,
  AddFeedbackCommentToCommentDocument,
  GetCrosspostPreviewDocument,
} from '@/__generated__/operations';
import type {
  DiscussionUpdateInput,
  DiscussionCreateInput,
} from '@/__generated__/graphql';
export function checkCommentDiscussionContracts() {
  const update = useMutation(UpdateCommentDocument);
  // @ts-expect-error generated comment updates require scalar set operations
  update.mutate({ where: { id: { eq: 'comment' } }, update: { text: 'text' } });
  const feedback = useMutation(AddFeedbackCommentToCommentDocument);
  // @ts-expect-error route arrays are not comment IDs
  feedback.mutate({ commentId: ['comment'] });
  const preview = useQuery(GetCrosspostPreviewDocument, { id: 'discussion' });
  // @ts-expect-error crosspost summaries do not select bookmark counts
  void preview.result.value?.discussions[0]?.bookmarkCount;
  // @ts-expect-error nullable author must be guarded
  void preview.result.value?.discussions[0]?.Author.username;
  // Pinned schema exceptions remain explicit until backend #413 repairs these inputs.
  const album: DiscussionUpdateInput = {
    // @ts-expect-error legacy Album relationship is absent from the pinned update input
    Album: { create: { node: { imageOrder: [] } } },
  };
  const author: DiscussionCreateInput = {
    // @ts-expect-error legacy Author connect is absent from the pinned create input
    Author: { connect: { where: { node: { username: 'alice' } } } },
  };
  void album;
  void author;
}
