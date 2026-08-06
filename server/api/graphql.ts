import { createError, defineEventHandler, proxyRequest } from 'h3';

export default defineEventHandler((event) => {
  const target = useRuntimeConfig(event).backendGraphqlUrl?.trim();

  if (!target) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Backend GraphQL URL is not configured',
    });
  }

  return proxyRequest(event, target);
});
