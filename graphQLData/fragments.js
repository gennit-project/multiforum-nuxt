import { gql } from '@apollo/client/core';

/**
 * Canonical reusable GraphQL fragments shared across query/mutation files.
 *
 * AUTHOR_FIELDS is the standard selection for a user rendered as the author of
 * content (discussions, comments, events, images). Spread it with
 * `...AuthorFields` in a selection set and interpolate `${AUTHOR_FIELDS}` into
 * the surrounding gql template so Apollo can resolve the fragment definition.
 */
export const AUTHOR_FIELDS = gql`
  fragment AuthorFields on User {
    username
    displayName
    profilePicURL
    createdAt
    discussionKarma
    commentKarma
  }
`;
