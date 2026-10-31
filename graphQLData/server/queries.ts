// Canonical server HTTP operations; generated documents are consumed by requestGraphql.
export const GET_SESSION_PROFILE = /* GraphQL */ `
  query getOwnEmail {
    getOwnEmail {
      username
      profilePicURL
      modProfileName
      unreadNotificationCount
    }
  }
`;

export const GET_NOTIFICATION_COUNT = /* GraphQL */ `
  query getOwnEmailNotificationCount {
    getOwnEmail {
      unreadNotificationCount
    }
  }
`;

export const GET_AUTH_PROFILE = /* GraphQL */ `
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
