// server/api/session/token.get.ts
//
// Alias for the session access token endpoint. Some embedded browsers are more
// aggressive about blocking `/api/auth/*` paths, so the browser fallback uses
// this neutral path instead.
import type { H3Event } from 'h3';
import {
  getServerGraphqlUrl,
  isLocalDevAuth,
  LOCAL_AUTH_COOKIE,
} from '@/server/utils/local-auth';

const GET_NOTIFICATION_COUNT = /* GraphQL */ `
  query getOwnEmailNotificationCount {
    getOwnEmail {
      unreadNotificationCount
    }
  }
`;

type NotificationCountResponse = {
  data?: {
    getOwnEmail?: {
      unreadNotificationCount?: number | null;
    } | null;
  };
};

const getNotificationCount = async (event: H3Event, accessToken: string) => {
  const runtimeConfig = useRuntimeConfig(event);

  // Local development and mocked browser tests already resolve the full
  // profile in middleware, so there is no reason to repeat the query here.
  if (
    isLocalDevAuth(runtimeConfig) ||
    process.env.VITE_E2E_MOCK_MODE === 'true'
  ) {
    return event.context.authSession?.notificationCount ?? 0;
  }

  const graphqlUrl = getServerGraphqlUrl(runtimeConfig);
  if (!graphqlUrl) return event.context.authSession?.notificationCount ?? 0;

  try {
    const response = await $fetch<NotificationCountResponse>(graphqlUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
      body: { query: GET_NOTIFICATION_COUNT },
    });
    return response?.data?.getOwnEmail?.unreadNotificationCount ?? 0;
  } catch {
    // Token synchronization still succeeds if the non-critical count lookup
    // fails. A later full-page load can retry it.
    return event.context.authSession?.notificationCount ?? 0;
  }
};

const buildSessionResponse = async (
  event: H3Event,
  accessToken: string | null
) => ({
  accessToken,
  notificationCount: accessToken
    ? await getNotificationCount(event, accessToken)
    : 0,
});

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store');

  // The auth-session middleware has already resolved the request's token. In
  // mocked E2E runs this is sourced from the guarded mock-auth cookie; in real
  // sessions it avoids doing the same provider lookup twice.
  if (event.context?.accessToken) {
    return buildSessionResponse(event, event.context.accessToken);
  }

  if (isLocalDevAuth(useRuntimeConfig(event))) {
    return buildSessionResponse(
      event,
      getCookie(event, LOCAL_AUTH_COOKIE) ?? null
    );
  }

  try {
    const tokenSet = await useAuth0(event).getAccessToken();
    return buildSessionResponse(event, tokenSet?.accessToken ?? null);
  } catch {
    return { accessToken: null, notificationCount: 0 };
  }
});
