// Cache configuration for API routes
// This defines which routes should be cached and how long

export default {
  // Default cache settings
  default: {
    // Cache for 5 minutes by default
    maxAge: 60 * 5,
    staleWhileRevalidate: 60 * 60, // Allow serving stale content for up to an hour while revalidating
  },

  // Cache settings for specific routes
  routes: {
    // Public data that rarely changes (cache for longer periods)
    "/api/tags": {
      maxAge: 60 * 60 * 2, // 2 hours
      staleWhileRevalidate: 60 * 60 * 12, // 12 hours
    },
    "/api/channels": {
      maxAge: 60 * 60 * 1, // 1 hour
      staleWhileRevalidate: 60 * 60 * 6, // 6 hours
    },

    // Content that changes more frequently
    "/api/events": {
      maxAge: 60 * 5, // 5 minutes
      staleWhileRevalidate: 60 * 30, // 30 minutes
    },
    "/api/discussions": {
      maxAge: 60 * 5, // 5 minutes
      staleWhileRevalidate: 60 * 30, // 30 minutes
    },

    // User-specific data should have shorter cache times
    "/api/user": {
      maxAge: 30, // 30 seconds
      staleWhileRevalidate: 60 * 2, // 2 minutes
    },
  },
};
