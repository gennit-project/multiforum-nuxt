// composables/useAuthManager.ts
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { useLazyQuery } from "@vue/apollo-composable";
import { useRouter } from "nuxt/app";
import { GET_EMAIL } from "@/graphQLData/email/queries";
import {
  setUsername,
  setModProfileName,
  isAuthenticatedVar,
  setIsAuthenticated,
  isLoadingAuthVar,
  setIsLoadingAuth,
  setNotificationCount,
  setProfilePicURL,
} from "@/cache";

export function useAuthManager() {
  const router = useRouter();
  const userEmail = ref("");
  const isSessionExpired = ref(false);
  const tokenCheckInterval = ref<number | null>(null);

  // Auth0 setup (client-side only)
  let auth0 = null;
  if (import.meta.env.SSR === false) {
    auth0 = useAuth0();
  }

  // GraphQL query for user data
  const {
    load: loadUserData,
    onResult,
    onError,
    loading: emailQueryLoading,
  } = useLazyQuery(GET_EMAIL, {
    emailAddress: userEmail,
  });

  // Sync loading state
  watch(emailQueryLoading, (isLoading) => {
    setIsLoadingAuth(isLoading);
  });

  onError((error) => {
    console.error("GraphQL query error:", error);
  });

  // Token expiration check
  const checkTokenExpiration = async () => {
    if (!auth0) return;

    try {
      if (auth0.isAuthenticated.value) {
        const claims = auth0.idTokenClaims;

        if (claims) {
          const currentTime = Math.floor(Date.now() / 1000);
          const expiresAt = claims?.exp;

          if (expiresAt <= currentTime + 60) {
            console.log("Token is expired or about to expire, attempting refresh");
            isSessionExpired.value = true;

            try {
              await auth0.getAccessTokenSilently({ cacheMode: "off" });
              console.log("Token refreshed successfully");
              isSessionExpired.value = false;
            } catch (refreshError) {
              console.error("Failed to refresh token:", refreshError);
              isSessionExpired.value = true;
              handleAuthError(refreshError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking token expiration:", error);
      isSessionExpired.value = true;
    }
  };

  // Handle authentication errors
  const handleAuthError = (error: any) => {
    if (
      error.error === "invalid_grant" ||
      (error.error_description && error.error_description.includes("refresh token"))
    ) {
      clearAuthState();
    }
  };

  // Clear authentication state
  const clearAuthState = () => {
    setIsAuthenticated(false);
    setUsername("");
    setModProfileName("");
    setNotificationCount(0);
    setProfilePicURL("");
  };

  // Handle visibility change (tab focus)
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      checkTokenExpiration();
    }
  };

  // Handle GraphQL query results
  onResult((newResult) => {
    const userData = newResult?.data?.emails?.[0]?.User;
    const modProfileData = userData?.ModerationProfile;

    if (userData && !userData.loading) {
      // User found, set all data
      setUsername(userData.username);
      setIsLoadingAuth(false);
      setIsAuthenticated(true);
      setModProfileName(modProfileData?.displayName || "");
      setNotificationCount(userData.NotificationsAggregate?.count || 0);
      
      if (userData.profilePicURL) {
        setProfilePicURL(userData.profilePicURL);
      }
    } else if (newResult?.data?.emails?.[0] === null || newResult?.data?.emails?.length === 0) {
      // User needs to create username
      handleMissingUsername();
    }
  });

  // Handle missing username scenario
  const handleMissingUsername = () => {
    if (
      isAuthenticatedVar.value &&
      !isLoadingAuthVar.value &&
      window.location.pathname !== "/create-username"
    ) {
      const hasCheckedUsername = sessionStorage.getItem("hasCheckedUsername");
      if (!hasCheckedUsername) {
        // Store current path for return after username creation
        if (window.location.pathname !== "/") {
          sessionStorage.setItem("previousPath", window.location.pathname);
        }
        
        sessionStorage.setItem("hasCheckedUsername", "true");
        console.log("Email not found in system, redirecting to create username page");
        router.push("/create-username");
      }
    }
  };

  // Setup watchers and intervals
  const setupAuth = () => {
    if (!auth0) return;

    const { user, isAuthenticated } = auth0;

    // Set initial authentication state
    isAuthenticatedVar.value = isAuthenticated.value === true;

    // Watch for user changes
    watch(
      user,
      (user) => {
        if (user?.email) {
          userEmail.value = user.email;
          loadUserData();
        }
      },
      { immediate: true }
    );

    // Watch for authentication state changes
    watch(
      isAuthenticated,
      (newIsAuthenticated) => {
        setIsAuthenticated(newIsAuthenticated);
        if (newIsAuthenticated && user.value?.email) {
          userEmail.value = user.value.email;
          loadUserData();
        }
      },
      { immediate: true }
    );

    // Watch for Auth0 errors
    watch(
      () => auth0.error.value,
      (error) => {
        if (error && isAuthError(error)) {
          console.error("Auth0 error detected:", error);
          clearAuthState();
          auth0.logout({
            logoutParams: {
              returnTo: window.location.href,
            },
          });
        }
      }
    );

    // Setup token checking
    tokenCheckInterval.value = window.setInterval(checkTokenExpiration, 60000);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    checkTokenExpiration();
  };

  // Check if error is auth-related
  const isAuthError = (error: any) => {
    return (
      error.error === "login_required" ||
      error.error === "unauthorized" ||
      error.error === "invalid_grant" ||
      (error.message && error.message.includes("expired")) ||
      (error.error_description && error.error_description.includes("refresh token"))
    );
  };

  // Cleanup function
  const cleanup = () => {
    if (tokenCheckInterval.value !== null) {
      clearInterval(tokenCheckInterval.value);
    }
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };

  // Mount and unmount handlers
  onMounted(setupAuth);
  onUnmounted(cleanup);

  // Return reactive state and functions
  return {
    isSessionExpired,
    loginWithRedirect: auth0?.loginWithRedirect,
  };
}