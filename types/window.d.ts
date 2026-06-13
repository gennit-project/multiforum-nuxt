// Global types - add TypeScript support for our custom window properties

// Auth user data for test utilities
interface AuthUserData {
  username?: string;
  authenticated?: boolean;
  hasToken?: boolean;
}

// Network Information API types
interface NetworkInformation {
  effectiveType?: '2g' | 'slow-2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface Window {
  // Auth token refresh function exposed by RequireAuth component
  refreshAuthToken?: () => Promise<boolean>;
  // Test-only auth state refresh function
  __REFRESH_AUTH_STATE__?: () => Promise<void>;
  // Direct auth state setter for testing
  __SET_AUTH_STATE_DIRECT__?: (userData?: AuthUserData) => void;
  // Debug function to monitor auth state
  __DEBUG_AUTH_STATE__?: () => AuthUserData | null;
  // Cypress test framework
  Cypress?: unknown;
}

interface Navigator {
  // Network Information API (experimental, vendor-prefixed)
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}
