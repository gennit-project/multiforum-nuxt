import {
  defineEventHandler,
  getRequestHeader,
  setResponseHeader,
  type H3Event,
} from 'h3';
import cacheConfig from '../routes/api/cache-config';

export default defineEventHandler((event: H3Event) => {
  // Only apply caching for GET requests
  if (event.method !== 'GET') return;

  const path = event.path;

  // Skip caching for authenticated requests
  const authHeader = getRequestHeader(event, 'Authorization');
  if (authHeader) return;

  // Check if the path matches any of our configured routes
  const routes = cacheConfig.routes as Record<
    string,
    { maxAge: number; staleWhileRevalidate: number }
  >;

  for (const route in routes) {
    if (!path.startsWith(route)) continue;
    const config = routes[route];
    if (!config) continue;
    const { maxAge, staleWhileRevalidate } = config;

    // Set cache control headers
    setResponseHeader(
      event,
      'Cache-Control',
      `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
    );

    return;
  }

  // Apply default caching for API routes not specifically configured
  if (path.startsWith('/api/')) {
    const { maxAge, staleWhileRevalidate } = cacheConfig.default;

    setResponseHeader(
      event,
      'Cache-Control',
      `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
    );
  }
});
