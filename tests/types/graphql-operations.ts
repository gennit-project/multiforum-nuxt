// Compiled by pnpm tsc; never run. Unused @ts-expect-error is a failing check.
import { useQuery, useMutation } from '@vue/apollo-composable';
import {
  GetPublicUserProfileDocument,
  GetCommentIssueDocument,
  GetCommentWithRepliesDocument,
  GetPermalinkedCommentDocument,
  type GetPermalinkedCommentQuery,
  type GetPermalinkedCommentQueryVariables,
  SubscribeToCommentDocument,
  UnsubscribeFromCommentDocument,
  type SubscribeToCommentMutation,
  type SubscribeToCommentMutationVariables,
  StickyCommentDocument,
  UpdateUserDocument,
  type GetPublicUserProfileQuery,
  type StickyCommentMutation,
} from '../../__generated__/operations';

// Replies expose only the composed selection, including nullable custom results.
import type { ReplyComment, CommentView } from '../../types/Comment';

export function checkApolloInference() {
  const profile = useQuery(GetPublicUserProfileDocument, { username: 'alice' });
  const issue = useQuery(GetCommentIssueDocument, { commentId: 'c1' });
  const pin = useMutation(StickyCommentDocument);
  const update = useMutation(UpdateUserDocument);
  // @ts-expect-error username is a GraphQL String, not a number
  useQuery(GetPublicUserProfileDocument, { username: 42 });
  // @ts-expect-error missing required username
  profile.refetch({});
  // @ts-expect-error objects are not valid GraphQL IDs
  pin.mutate({ commentId: {} });
  // @ts-expect-error username filters require an operator
  update.mutate({ where: { username: 'alice' } });
  // @ts-expect-error unselected private field must not leak into a public result
  void profile.result.value?.users[0]?.Email;
  // @ts-expect-error the comment issue query does not select text
  void issue.result.value?.comments[0]?.text;
  // @ts-expect-error mutation results retain nullable custom resolver result
  pin.onDone(({ data }) => data?.stickyComment.id);
  return { profile, issue, pin, update };
}

export function checkSelectedFieldsAndNullability(
  profile: GetPublicUserProfileQuery,
  mutation: StickyCommentMutation
) {
  const username: string = profile.users[0]!.username;
  const nullableBio: string | null = profile.users[0]!.bio;
  // @ts-expect-error nullable bio cannot be assigned to string
  const bio: string = profile.users[0]!.bio;
  // @ts-expect-error unselected fields are not full schema entities
  void profile.users[0]!.Email;
  // @ts-expect-error custom mutation response is nullable
  void mutation.stickyComment.id;
  return { username, nullableBio, bio };
}
export function checkReplyInference(reply: ReplyComment) {
  const query = useQuery(GetCommentWithRepliesDocument, {
    commentId: 'parent',
    limit: 5,
  });
  // @ts-expect-error Boolean is not an Int
  query.refetch({ commentId: 'parent', limit: true });
  // @ts-expect-error reply query does not select the full schema entity
  void reply.isRootComment;
  // @ts-expect-error legacy Channel context is not in the reply selection
  void reply.Channel;
  // @ts-expect-error custom reply result may be null
  void query.result.value?.getCommentReplies.ChildComments;
  // @ts-expect-error text is nullable
  const text: string = reply.text;
  // @ts-expect-error shared UI compatibility still requires non-null selected fields
  const incompleteView: CommentView = { id: 'reply' };
  // @ts-expect-error JSON must be narrowed at the rendering boundary
  const emoji: string = reply.emoji;
  const view: CommentView = reply;
  const voteCount: number =
    reply.UpvotedByUsersConnection.aggregate.count.nodes;
  return { view, voteCount, text, incompleteView, emoji };
}

export function checkPermalinkInference(
  root: GetPermalinkedCommentQuery['comments'][number]
) {
  const query = useQuery(GetPermalinkedCommentDocument, { id: 'c1' });
  // @ts-expect-error ID is a scalar, not an array
  query.refetch({ id: ['c1'] });
  // @ts-expect-error ID cannot be missing
  const missing: GetPermalinkedCommentQueryVariables = {};
  // @ts-expect-error invalid ID type
  query.refetch({ id: false });
  // @ts-expect-error full schema fields were not selected
  void root.isRootComment;
  // @ts-expect-error parent is nullable
  void root.ParentComment.id;
  // @ts-expect-error author is nullable
  void root.CommentAuthor.__typename;
  // @ts-expect-error text is nullable
  const text: string = root.text;
  const view: CommentView = root;
  const children: CommentView[] = root.ChildComments;
  return { view, children, text, missing };
}

export function checkCommentSubscriptionInference(
  result: SubscribeToCommentMutation
) {
  const subscribe = useMutation(SubscribeToCommentDocument);
  const unsubscribe = useMutation(UnsubscribeFromCommentDocument);
  subscribe.mutate({ commentId: 'c1' });
  unsubscribe.mutate({ commentId: 'c1' });
  // @ts-expect-error IDs are scalar strings
  subscribe.mutate({ commentId: ['c1'] });
  // @ts-expect-error Boolean is not an ID
  unsubscribe.mutate({ commentId: false });
  // @ts-expect-error commentId is required
  const missing: SubscribeToCommentMutationVariables = {};
  // @ts-expect-error mutation result is nullable
  void result.subscribeToComment.id;
  if (result.subscribeToComment) {
    const usernames: string[] =
      result.subscribeToComment.SubscribedToNotifications.map(
        (user) => user.username
      );
    // @ts-expect-error comment text was not selected
    void result.subscribeToComment.text;
    return { usernames, missing };
  }
}
