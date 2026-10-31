// Compiled by pnpm tsc; never run. Unused @ts-expect-error is a failing check.
import { useQuery, useMutation } from '@vue/apollo-composable';
import {
  GetPublicUserProfileDocument,
  GetCommentIssueDocument,
  StickyCommentDocument,
  UpdateUserDocument,
  type GetPublicUserProfileQuery,
  type StickyCommentMutation,
} from '../../__generated__/operations';

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
  void profile.result.value?.users[0]?.email;
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
  void profile.users[0]!.email;
  // @ts-expect-error custom mutation response is nullable
  void mutation.stickyComment.id;
  return { username, nullableBio, bio };
}
