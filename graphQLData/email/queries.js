import { gql } from '@apollo/client/core';

// Self-scoped account lookup for the authenticated caller. Replaces the old
// GET_EMAIL (`emails(where: { address })`) query — enumerating emails is now
// admin-only on the backend. getOwnEmail takes no arguments and resolves the
// caller's email from the verified token server-side, so it cannot leak anyone
// else's account. Returns null when unauthenticated, and an object with
// username: null when authenticated but no account exists yet (onboarding).
export const GET_OWN_EMAIL = gql`
  query getOwnEmail {
    getOwnEmail {
      address
      username
      profilePicURL
      modProfileName
      unreadNotificationCount
    }
  }
`;
