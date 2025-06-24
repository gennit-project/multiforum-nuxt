// Global types - add TypeScript support for our custom window properties
interface Window {
  // Auth token refresh function exposed by RequireAuth component
  refreshAuthToken?: () => Promise<boolean>;
  // Test-only auth state refresh function
  __REFRESH_AUTH_STATE__?: () => Promise<void>;
  // Direct auth state setter for testing
  __SET_AUTH_STATE_DIRECT__?: (userData?: any) => void;
  // Debug function to monitor auth state
  __DEBUG_AUTH_STATE__?: () => any;
}