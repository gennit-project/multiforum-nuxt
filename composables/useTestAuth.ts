import { useAuth0 } from '@auth0/auth0-vue';
import { useLazyQuery } from '@vue/apollo-composable';
import { GET_EMAIL } from '@/graphQLData/email/queries';
import {
  setUsername,
  setModProfileName,
  setIsAuthenticated,
  setIsLoadingAuth,
  setNotificationCount,
  setProfilePicURL,
} from '@/cache';

/**
 * Test-only composable for refreshing authentication state
 * This helps Cypress tests sync programmatic authentication with UI state
 */
export const useTestAuth = () => {
  // Expose debug functions when composable is used
  if (typeof window !== 'undefined') {
    // Check if we're in a test environment
    const isTestEnv =
      process.env.NODE_ENV === 'test' ||
      process.env.NODE_ENV === 'development' ||
      window.Cypress;

    if (isTestEnv) {
      // Debug function to monitor reactive state
      window.__DEBUG_AUTH_STATE__ = () => ({
        hasToken: !!localStorage.getItem('token'),
      });

      // Direct auth state setter for testing
      window.__SET_AUTH_STATE_DIRECT__ = (
        userData: {
          username?: string;
          profilePicURL?: string;
          modProfileName?: string;
        } = {}
      ) => {
        window.__DEBUG_AUTH_STATE__?.();

        // Force set all auth-related reactive variables
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        setUsername(userData.username || 'cluse');
        setNotificationCount(0);

        if (userData.profilePicURL) setProfilePicURL(userData.profilePicURL);
        if (userData.modProfileName) setModProfileName(userData.modProfileName);

        window.__DEBUG_AUTH_STATE__?.();
      };

      // Also expose the refresh function (defined below)
      window.__REFRESH_AUTH_STATE__ = async () => {
        await refreshAuthState();
      };
    }
  }

  const refreshAuthState = async () => {
    // Log environment for debugging

    try {
      // Get the token from localStorage (set by Cypress)
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      // Check if we have Auth0 available (client-side only)
      let auth0;
      try {
        auth0 = useAuth0();
      } catch (error) {
        // Auth0 not available, proceed with manual state sync
      }

      // If Auth0 is available, try to sync its state
      if (auth0) {
        try {
          // Force Auth0 to check its authentication state
          await auth0.checkSession();

          // If Auth0 recognizes the user, let the normal flow handle it
          if (auth0.isAuthenticated.value && auth0.user.value?.email) {
            // Set loading state
            setIsLoadingAuth(true);
            setIsAuthenticated(true);

            // Load user data using the same GraphQL query as the layout
            const { load: loadUserData, onResult } = useLazyQuery(GET_EMAIL, {
              emailAddress: auth0.user.value.email,
            });

            onResult((result) => {
              const userData = result?.data?.emails?.[0]?.User;
              const modProfileData = userData?.ModerationProfile;

              if (userData && !userData.loading) {
                setUsername(userData.username);
                if (userData.profilePicURL) {
                  setProfilePicURL(userData.profilePicURL);
                }
                setIsLoadingAuth(false);
                setIsAuthenticated(true);
                setModProfileName(modProfileData?.displayName || '');
                setNotificationCount(
                  userData.NotificationsAggregate?.count || 0
                );
              }
            });

            loadUserData();
            return;
          }
        } catch (error) {
          // Auth0 checkSession failed, falling back to manual sync
        }
      }

      // Manual fallback: decode token and set basic auth state
      try {
        // Parse the JWT token to get user info
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1] || ''));
          const userEmail = payload.email;

          if (userEmail) {
            // Set basic auth state immediately
            setIsAuthenticated(true);
            setIsLoadingAuth(true);

            // Load user data using GraphQL
            const { load: loadUserData, onResult } = useLazyQuery(GET_EMAIL, {
              emailAddress: userEmail,
            });

            onResult((result) => {
              const userData = result?.data?.emails?.[0]?.User;
              const modProfileData = userData?.ModerationProfile;

              if (userData && !userData.loading) {
                setUsername(userData.username);
                if (userData.profilePicURL) {
                  setProfilePicURL(userData.profilePicURL);
                }
                setIsLoadingAuth(false);
                setModProfileName(modProfileData?.displayName || '');
                setNotificationCount(
                  userData.NotificationsAggregate?.count || 0
                );
              }
            });

            loadUserData();
            return; // Exit early since we're handling it manually
          }
        }
      } catch (parseError) {
        console.error(
          'Failed to parse token for manual auth sync:',
          parseError
        );
      }

      // Final fallback: just set basic auth state
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error refreshing auth state:', error);
    }
  };

  return {
    refreshAuthState,
  };
};
