import { describe, expect, it } from 'vitest';
import { ApolloClient, InMemoryCache } from '@apollo/client/core';
import { MockLink } from '@apollo/client/testing/core';
import { Kind, print, type DocumentNode } from 'graphql';
import {
  GetPublicUserProfileDocument,
  GetBasicUserInfoDocument,
  UpdateUserDocument,
  GetCommentIssueDocument,
  GetCommentWithRepliesDocument,
  GetPermalinkedCommentDocument,
  SubscribeToCommentDocument,
  UnsubscribeFromCommentDocument,
  StickyCommentDocument,
  UnstickyCommentDocument,
} from '@/__generated__/operations';
import { GET_PUBLIC_USER_PROFILE, GET_USER } from '@/graphQLData/user/queries';
import { UPDATE_USER } from '@/graphQLData/user/mutations';
import { GET_COMMENT_REPLIES, GET_COMMENT_AND_REPLIES } from '@/graphQLData/comment/queries';
import { GET_COMMENT_ISSUE } from '@/graphQLData/mod/queries';
import {
  SUBSCRIBE_TO_COMMENT,
  UNSUBSCRIBE_FROM_COMMENT,
  STICKY_COMMENT,
  UNSTICKY_COMMENT,
} from '@/graphQLData/comment/mutations';

// Fragment order is immaterial; selection sets, variables and directives are not.
const definitions = (document: DocumentNode) =>
  document.definitions.map(print).sort();

describe('generated operation runtime contracts', () => {
  it.each([
    ['public profile', GetPublicUserProfileDocument, GET_PUBLIC_USER_PROFILE],
    ['account', GetBasicUserInfoDocument, GET_USER],
    ['update profile', UpdateUserDocument, UPDATE_USER],
    ['comment issue', GetCommentIssueDocument, GET_COMMENT_ISSUE],
    ['comment replies', GetCommentWithRepliesDocument, GET_COMMENT_REPLIES],
    ['permalinked comment', GetPermalinkedCommentDocument, GET_COMMENT_AND_REPLIES],
    ['watch comment', SubscribeToCommentDocument, SUBSCRIBE_TO_COMMENT],
    ['unwatch comment', UnsubscribeFromCommentDocument, UNSUBSCRIBE_FROM_COMMENT],
    ['pin comment', StickyCommentDocument, STICKY_COMMENT],
    ['unpin comment', UnstickyCommentDocument, UNSTICKY_COMMENT],
  ])(
    'preserves the %s operation and composed fragments',
    (_name, generated, source) => {
      expect(definitions(generated)).toEqual(definitions(source));
    }
  );

  it('ships each composed fragment once', () => {
    const names = GetPublicUserProfileDocument.definitions
      .filter((definition) => definition.kind === Kind.FRAGMENT_DEFINITION)
      .map((definition) => definition.name.value);
    expect(names).toEqual(['AuthorFields']);
  });

  it.each([
    ['an archived comment without an issue', []],
    [
      'an archived comment with an issue',
      [{ __typename: 'Issue', id: 'i1', issueNumber: 8 }],
    ],
  ])(
    'executes the typed read for %s through Apollo',
    async (_name, relatedIssues) => {
      const client = new ApolloClient({
        cache: new InMemoryCache(),
        link: new MockLink([
          {
            request: {
              query: GetCommentIssueDocument,
              variables: { commentId: 'c1' },
            },
            result: {
              data: {
                comments: [
                  {
                    __typename: 'Comment',
                    id: 'c1',
                    RelatedIssues: relatedIssues,
                  },
                ],
              },
            },
          },
        ]),
      });
      try {
        const result = await client.query({
          query: GetCommentIssueDocument,
          variables: { commentId: 'c1' },
        });
        expect(
          result.data.comments[0]?.RelatedIssues.map(
            (issue) => issue.issueNumber
          )
        ).toEqual(relatedIssues.map((issue) => issue.issueNumber));
      } finally {
        client.stop();
      }
    }
  );

  it('executes and normalizes a typed comment mutation with nullable fields', async () => {
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new MockLink([
        {
          request: {
            query: StickyCommentDocument,
            variables: { commentId: 'c1' },
          },
          result: {
            data: {
              stickyComment: {
                __typename: 'Comment',
                id: 'c1',
                isSticky: true,
                stickyAt: null,
                stickyByUsername: null,
              },
            },
          },
        },
      ]),
    });
    await client.mutate({
      mutation: StickyCommentDocument,
      variables: { commentId: 'c1' },
    });
    expect(client.cache.extract()['Comment:c1']).toEqual({
      __typename: 'Comment',
      id: 'c1',
      isSticky: true,
      stickyAt: null,
      stickyByUsername: null,
    });
    client.stop();
  });

  it('preserves a nullable custom resolver response through Apollo', async () => {
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new MockLink([
        {
          request: {
            query: StickyCommentDocument,
            variables: { commentId: 'missing' },
          },
          result: { data: { stickyComment: null } },
        },
      ]),
    });
    const result = await client.mutate({
      mutation: StickyCommentDocument,
      variables: { commentId: 'missing' },
    });
    expect(result.data?.stickyComment).toBeNull();
    client.stop();
  });
});
