import {
  createError,
  defineEventHandler,
  getRequestHeaders,
  readRawBody,
  setResponseHeader,
  setResponseStatus,
} from 'h3';

const SERVICE_UNAVAILABLE_MESSAGE =
  'The backend service is temporarily unavailable. Please try again later.';

const buildUnavailableGraphqlResponse = (
  event: Parameters<typeof defineEventHandler>[0] extends (event: infer T) => unknown
    ? T
    : never,
  upstreamStatusCode?: number
) => {
  setResponseStatus(event, 200);
  setResponseHeader(event, 'content-type', 'application/json; charset=utf-8');
  return {
    data: null,
    errors: [
      {
        message: SERVICE_UNAVAILABLE_MESSAGE,
        extensions: {
          code: 'SERVICE_UNAVAILABLE',
          upstreamStatusCode,
        },
      },
    ],
  };
};

export default defineEventHandler(async (event) => {
  const target = useRuntimeConfig(event).backendGraphqlUrl?.trim();

  if (!target) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Backend GraphQL URL is not configured',
    });
  }

  const method = event.method || 'GET';
  const headers = {
    ...getRequestHeaders(event),
  };
  delete headers.host;
  delete headers.connection;
  delete headers['content-length'];

  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : await readRawBody(event, false);

  let response: Response;
  try {
    response = await fetch(target, {
      method,
      headers,
      body,
    });
  } catch {
    return buildUnavailableGraphqlResponse(event);
  }

  if (response.status >= 500) {
    return buildUnavailableGraphqlResponse(event, response.status);
  }

  setResponseStatus(event, response.status, response.statusText);

  const contentType = response.headers.get('content-type');
  if (contentType) {
    setResponseHeader(event, 'content-type', contentType);
  }

  if (contentType?.includes('application/json')) {
    return await response.json();
  }

  return await response.text();
});
