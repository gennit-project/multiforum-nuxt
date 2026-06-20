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

  // Never cache auth endpoints — they are per-session and authenticate via the
  // session cookie (not an Authorization header), so the generic check below
  // would otherwise cache them and leak/stale one user's token. (SPIKE Phase 2)
  if (path.startsWith('/api/auth/') || path.startsWith('/auth/')) return;

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
