import { GetOwnEmailSource3c35564c1eDocument as GET_OWN_EMAIL } from '@/__generated__/operations';
import { requestGraphql } from '@/server/utils/typed-graphql';
// server/api/auth/profile.get.ts
//
// Returns the current session-backed auth profile for the browser. This is a
// same-origin fallback for embedded browsers where localStorage-backed token
// sync is unreliable or unavailable.
import { getServerGraphqlUrl } from '@/server/utils/local-auth';

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
    const graphqlUrl = getServerGraphqlUrl(useRuntimeConfig(event));

    if (!accessToken || !graphqlUrl) {
      return session;
    }

    const res = await requestGraphql(
      graphqlUrl,
      GET_OWN_EMAIL,
      {},
      {
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
      }
    );

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
