// server/api/session/profile.get.ts
//
// Alias for the session-backed profile endpoint. The browser client uses this
// path instead of `/api/auth/*` because some embedded browsers block that
// pattern.

type OwnEmailResponse = {
  data?: {
    getOwnEmail?: {
      username?: string | null;
      profilePicURL?: string | null;
      modProfileName?: string | null;
      unreadNotificationCount?: number | null;
    } | null;
  };
};

const GET_OWN_EMAIL = /* GraphQL */ `
  query getOwnEmail {
    getOwnEmail {
      username
      profilePicURL
      modProfileName
      unreadNotificationCount
    }
  }
`;

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store');

  const session = event.context.authSession;
  if (!session?.isAuthenticated) {
    return {
      isAuthenticated: false,
      username: '',
      email: '',
      modProfileName: '',
      notificationCount: 0,
      profilePicURL: '',
    };
  }

  if (session.username) {
    return session;
  }

  try {
    const tokenSet = await useAuth0(event).getAccessToken();
    const accessToken = tokenSet?.accessToken;
    const graphqlUrl =
      useRuntimeConfig(event).public?.apollo?.clients?.default?.httpEndpoint;

    if (!accessToken || !graphqlUrl) {
      return session;
    }

    const res = await $fetch<OwnEmailResponse>(graphqlUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
      body: {
        query: GET_OWN_EMAIL,
      },
    });

    const ownEmail = res?.data?.getOwnEmail;
    if (!ownEmail?.username) {
      return session;
    }

    return {
      ...session,
      username: ownEmail.username,
      modProfileName: ownEmail.modProfileName || '',
      notificationCount: ownEmail.unreadNotificationCount || 0,
      profilePicURL: ownEmail.profilePicURL || '',
    };
  } catch {
    return session;
  }
});
