import { gql } from '@apollo/client/core';

export const UPDATED_ANSWERS_FRAGMENT = gql`
  fragment UpdatedAnswers on DiscussionChannel {
    id
    answered
    Answers {
      id
      shortId
      text
      CommentAuthor {
        ... on User {
          username
        }
        ... on ModerationProfile {
          displayName
        }
      }
    }
  }
`;
