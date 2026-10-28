// server/api/session/profile.get.ts
//
// Same-origin session-backed profile fallback for embedded browsers where
// localStorage-backed token flows are unreliable or unavailable.
import type { OwnEmail } from '@/__generated__/graphql';
import { getServerGraphqlUrl } from '@/server/utils/local-auth';

type OwnEmailResponse = {
  errors?: readonly unknown[];
  data?: {
    getOwnEmail?: Pick<
      OwnEmail,
      | 'username'
      | 'profilePicURL'
      | 'modProfileName'
      | 'unreadNotificationCount'
    > | null;
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
    const tokenSet = event.context.accessToken
      ? null
      : await useAuth0(event).getAccessToken();
    const accessToken = event.context.accessToken || tokenSet?.accessToken;
    const graphqlUrl = getServerGraphqlUrl(useRuntimeConfig(event));

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

    // An empty username is only conclusive after a successful, complete lookup.
    if (res.errors?.length || !res.data || !('getOwnEmail' in res.data)) {
      return session;
    }
    const ownEmail = res.data.getOwnEmail;
    // The backend returns null when the API token has no verified email.
    if (!ownEmail) return session;
    if (!ownEmail.username) {
      return { ...session, needsOnboarding: true };
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
