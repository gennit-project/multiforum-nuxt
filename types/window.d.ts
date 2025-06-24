// Global types - add TypeScript support for our custom window properties
interface Window {
  // Auth token refresh function exposed by RequireAuth component
  refreshAuthToken?: () => Promise<boolean>;
  // Test-only auth state refresh function
  __REFRESH_AUTH_STATE__?: () => Promise<void>;
}