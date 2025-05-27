<script setup lang="ts">
<<<<<<< HEAD
  import { ref, onMounted, watch, computed, onUnmounted } from "vue";
  import { useAuth0 } from "@auth0/auth0-vue";
  import { useLazyQuery } from "@vue/apollo-composable";
  import TopNav from "@/components/nav/Topnav.vue";
  import SiteSidenav from "@/components/nav/SiteSidenav.vue";
  import SiteFooter from "@/components/layout/SiteFooter.vue";
  import { GET_EMAIL } from "@/graphQLData/email/queries";
  import {
    setUsername,
    setModProfileName,
    isAuthenticatedVar,
    setIsAuthenticated,
    isLoadingAuthVar,
    setIsLoadingAuth,
    sideNavIsOpenVar,
    setSideNavIsOpenVar,
    setNotificationCount,
    setProfilePicURL,
  } from "@/cache";
  import { config } from "@/config";
  import DevOverlay from "@/components/nav/DevOverlay.vue";
  import ErrorBoundary from "@/components/nav/ErrorBoundary.vue";
=======
import { ref, onMounted, watch, computed, onUnmounted } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { useLazyQuery } from "@vue/apollo-composable";
import TopNav from "@/components/nav/TopNav.vue";
import SiteSidenav from "@/components/nav/SiteSidenav.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";
import { GET_EMAIL } from "@/graphQLData/email/queries";
import {
  setUsername,
  setModProfileName,
  usernameVar,
  isAuthenticatedVar,
  setIsAuthenticated,
  isLoadingAuthVar,
  setIsLoadingAuth,
  sideNavIsOpenVar,
  setSideNavIsOpenVar,
  setNotificationCount,
  setProfilePicURL,
} from "@/cache";
import { config } from "@/config";
import DevOverlay from '@/components/nav/DevOverlay.vue'
>>>>>>> parent of 666ae3d (Use automated formatting tools)

const isDevelopment = computed(() => config.environment === 'development');

// UI states
const showUserProfileDropdown = ref(false);
const toggleDropdown = () => {
  setSideNavIsOpenVar(!sideNavIsOpenVar.value);
};
const toggleUserProfileDropdown = () =>
  (showUserProfileDropdown.value = !showUserProfileDropdown.value);
const closeUserProfileDropdown = () => (showUserProfileDropdown.value = false);
const showFooter = !useRoute().name?.includes("map");

const userEmail = ref("");
// Lazy query to fetch user email data from GraphQL
const {
  load: loadUserData,
  onResult,
  onError,
  loading: emailQueryLoading,
} = useLazyQuery(GET_EMAIL, {
  emailAddress: userEmail,
});

// Update loading state whenever the query loading status changes
watch(emailQueryLoading, (isLoading) => {
  setIsLoadingAuth(isLoading);
});

onError((error) => {
  console.error("GraphQL query error:", error);
});

// Move Auth0-specific code into a separate composable or conditional block
let auth0 = null;
if (import.meta.env.SSR === false) {
  auth0 = useAuth0();
}

// Modify the token check logic to be client-only
const tokenCheckInterval = ref<number | null>(null);

// Add new ref for session expired state
const isSessionExpired = ref(false);

// Update checkTokenExpiration to set the expired state
const checkTokenExpiration = async () => {
  if (!auth0) return;
  
  try {
    if (auth0.isAuthenticated.value) {
      const claims = auth0.idTokenClaims;
      
      if (claims) {
        const currentTime = Math.floor(Date.now() / 1000);
        const expiresAt = claims?.exp;
        
        if (expiresAt <= currentTime + 60) {
          console.log('Token is expired or about to expire, attempting refresh');
          isSessionExpired.value = true;
          
          try {
            await auth0.getAccessTokenSilently({ cacheMode: 'off' });
            console.log('Token refreshed successfully');
            isSessionExpired.value = false;
          } catch (refreshError) {
            console.error('Failed to refresh token, logging out locally:', refreshError);
            isSessionExpired.value = true;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking token expiration:', error);
    isSessionExpired.value = true;
  }
};

// Handle when the tab becomes visible again after being hidden
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    checkTokenExpiration();
  }
};

// Setup token checks and event listeners only on client
onMounted(() => {
  if (!auth0) return;
  
  const { user, isAuthenticated } = auth0;
  
  // Only set isAuthenticatedVar to true if we have confirmed authentication
  // Default to false, which allows non-authenticated users to see content
  if (isAuthenticated.value === true) {
    isAuthenticatedVar.value = true;
  } else {
    isAuthenticatedVar.value = false;
  }

<<<<<<< HEAD
  // Modify the token check logic to be client-only
  const tokenCheckInterval = ref<number | null>(null);

  // Add new ref for session expired state
  const isSessionExpired = ref(false);

  // Update checkTokenExpiration to set the expired state
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

              // If it's an invalid_grant error, clear auth state immediately
              if (
                refreshError.error === "invalid_grant" ||
                (refreshError.error_description &&
                  refreshError.error_description.includes("refresh token"))
              ) {
                setIsAuthenticated(false);
                setUsername("");
                setModProfileName("");
                setNotificationCount(0);
                setProfilePicURL("");
              }
            }
          }
        }
=======
  watch(
    user,
    (user) => {
      if (user?.email) {
        userEmail.value = user.email;
        loadUserData();
>>>>>>> parent of 666ae3d (Use automated formatting tools)
      }
    },
    { immediate: true }
  );
  
  // Sync Auth0's authentication state with our local state
  watch(isAuthenticated, (newIsAuthenticated) => {
    setIsAuthenticated(newIsAuthenticated);
    if (newIsAuthenticated && user.value?.email) {
      userEmail.value = user.value.email;
      loadUserData();
    }
<<<<<<< HEAD
  };

  // Handle when the tab becomes visible again after being hidden
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      checkTokenExpiration();
    }
  };

  // Setup token checks and event listeners only on client
  onMounted(() => {
    if (!auth0) return;

    const { user, isAuthenticated } = auth0;

    // Only set isAuthenticatedVar to true if we have confirmed authentication
    // Default to false, which allows non-authenticated users to see content
    if (isAuthenticated.value === true) {
      isAuthenticatedVar.value = true;
    } else {
      isAuthenticatedVar.value = false;
    }

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

    // Sync Auth0's authentication state with our local state
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

    watch(
      () => auth0.error.value,
      (error) => {
        if (
          error &&
          (error.error === "login_required" ||
            error.error === "unauthorized" ||
            error.error === "invalid_grant" ||
            (error.message && error.message.includes("expired")) ||
            (error.error_description && error.error_description.includes("refresh token")))
        ) {
          console.error("Auth0 error detected:", error);
          // Clear any cached authentication state
          setIsAuthenticated(false);
          setUsername("");
          setModProfileName("");
          setNotificationCount(0);
          setProfilePicURL("");

          auth0.logout({
            logoutParams: {
              returnTo: window.location.href,
            },
          });
        }
      }
    );

    // Check token every minute
    tokenCheckInterval.value = window.setInterval(checkTokenExpiration, 60000);

    // Check token when tab becomes visible again
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial token check
    checkTokenExpiration();
  });

  // Clean up on component unmount
  onUnmounted(() => {
    if (tokenCheckInterval.value !== null) {
      clearInterval(tokenCheckInterval.value);
    }
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  });

  // Set `username` in the cache upon GraphQL query result
  onResult((newResult) => {
    const userData = newResult?.data?.emails?.[0]?.User;
    const modProfileData = userData?.ModerationProfile;

    if (userData && !userData.loading) {
      setUsername(userData.username);
      // Save profile picture URL in our reactive state
      if (userData.profilePicURL) {
        setProfilePicURL(userData.profilePicURL);
      }
      setIsLoadingAuth(false);
      setIsAuthenticated(true);
      setModProfileName(modProfileData?.displayName || "");
      setNotificationCount(userData.NotificationsAggregate?.count || 0);
    } else if (newResult?.data?.emails?.[0] === null || newResult?.data?.emails?.length === 0) {
      // Email exists in Auth0 but not in our system yet
      // User needs to create a username
      const router = useRouter();

      // Only redirect if we're authenticated and not already on the create-username page
      if (
        isAuthenticatedVar.value &&
        !isLoadingAuthVar.value &&
        window.location.pathname !== "/create-username"
      ) {
        // Set a flag to prevent redirect loops
        const hasCheckedUsername = sessionStorage.getItem("hasCheckedUsername");
        if (!hasCheckedUsername) {
          // Store the current path so we can return after username creation
          if (window.location.pathname !== "/") {
            sessionStorage.setItem("previousPath", window.location.pathname);
          }

          // Set the flag to prevent repeated redirects
          sessionStorage.setItem("hasCheckedUsername", "true");
          console.log("Email not found in system, redirecting to create username page");
          router.push("/create-username");
        }
=======
  }, { immediate: true });
  
  watch(
    () => auth0.error.value,
    (error) => {
      if (error && (
          error.error === 'login_required' || 
          error.error === 'unauthorized' || 
          (error.message && error.message.includes('expired'))
        )) {
        console.error('Auth0 error detected:', error);
        auth0.logout({
          logoutParams: {
            returnTo: window.location.href,
          },
        });
>>>>>>> parent of 666ae3d (Use automated formatting tools)
      }
    }
  );

  // Check token every minute
  tokenCheckInterval.value = window.setInterval(checkTokenExpiration, 60000);
  
  // Check token when tab becomes visible again
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Initial token check
  checkTokenExpiration();
});

// Clean up on component unmount
onUnmounted(() => {
  if (tokenCheckInterval.value !== null) {
    clearInterval(tokenCheckInterval.value);
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});

// Set `username` in the cache upon GraphQL query result
onResult((newResult) => {
  const userData = newResult?.data?.emails?.[0]?.User;
  const modProfileData = userData?.ModerationProfile;

  if (userData && !userData.loading) {
    setUsername(userData.username);
    // Save profile picture URL in our reactive state
    if (userData.profilePicURL) {
      setProfilePicURL(userData.profilePicURL);
    }
    setIsLoadingAuth(false);
    setIsAuthenticated(true);
    setModProfileName(modProfileData?.displayName || "");
    setNotificationCount(userData.NotificationsAggregate?.count || 0);
  } else if (newResult?.data?.emails?.[0] === null || newResult?.data?.emails?.length === 0) {
    // Email exists in Auth0 but not in our system yet
    // User needs to create a username
    const router = useRouter();
    
    // Only redirect if we're authenticated and not already on the create-username page
    if (isAuthenticatedVar.value && 
        !isLoadingAuthVar.value && 
        window.location.pathname !== '/create-username') {
      
      // Set a flag to prevent redirect loops
      const hasCheckedUsername = sessionStorage.getItem('hasCheckedUsername');
      if (!hasCheckedUsername) {
        // Store the current path so we can return after username creation
        if (window.location.pathname !== '/') {
          sessionStorage.setItem('previousPath', window.location.pathname);
        }
        
        // Set the flag to prevent repeated redirects
        sessionStorage.setItem('hasCheckedUsername', 'true');
        console.log("Email not found in system, redirecting to create username page");
        router.push('/create-username');
      }
    }
  }
});
// For hydration purposes, we need to determine if we're mounted on the client
const isMounted = ref(false);
onMounted(() => {
  isMounted.value = true;
});
</script>

<template>
<<<<<<< HEAD
  <div>
    <ErrorBoundary>
      <DevOverlay v-if="isDevelopment" />
      <main class="flex min-h-screen flex-col">
        <div
          v-if="isSessionExpired"
          class="bg-red-500 p-4 text-center text-white"
        >
          Your session has expired. Please
          <button
            class="font-bold underline hover:text-red-100"
            @click="
              () => {
                if (auth0) auth0.loginWithRedirect();
              }
            "
          >
            click here to log in again
          </button>
        </div>
        <div class="flex flex-grow list-disc flex-col bg-gray-200 text-gray-900 dark:bg-black dark:text-gray-200">
          <TopNav
            :show-user-profile-dropdown="showUserProfileDropdown"
            :side-nav-is-open="sideNavIsOpenVar"
            @close-user-profile-dropdown="closeUserProfileDropdown"
            @toggle-dropdown="toggleDropdown"
            @toggle-user-profile-dropdown="toggleUserProfileDropdown"
          />
          <div class="relative flex flex-grow flex-col">
            <SiteSidenav
              :key="`${sideNavIsOpenVar}`"
              :show-dropdown="sideNavIsOpenVar"
              @close="setSideNavIsOpenVar(false)"
            />
            <div class="flex w-full flex-grow flex-col">
=======
  <v-app>
    <DevOverlay v-if="isDevelopment" />
    <main class="min-h-screen flex flex-col">
      <div v-if="isSessionExpired" class="bg-red-500 text-white p-4 text-center">
        Your session has expired. Please 
        <button 
          @click="() => { if (auth0) auth0.loginWithRedirect(); }" 
          class="underline font-bold hover:text-red-100"
        >
          click here to log in again
        </button>
      </div>
      <div
        class="bg-gray-200 dark:bg-black dark:text-gray-200 list-disc flex-grow flex flex-col"
      >
        <TopNav
          :show-user-profile-dropdown="showUserProfileDropdown"
          :side-nav-is-open="sideNavIsOpenVar"
          @toggle-dropdown="toggleDropdown"
          @close-user-profile-dropdown="closeUserProfileDropdown"
          @toggle-user-profile-dropdown="toggleUserProfileDropdown"
        />
        <div class="flex-col relative flex-grow flex">
          <SiteSidenav
            :key="`${sideNavIsOpenVar}`"
            :show-dropdown="sideNavIsOpenVar"
            @close="setSideNavIsOpenVar(false)"
          />
          <!-- During SSR and initial render, always show content -->
          <client-only>
            <template #fallback>
              <div class="w-full flex-grow flex flex-col">
                <slot />
                <SiteFooter v-if="showFooter" class="mt-auto" />
              </div>
            </template>
            
            <div class="w-full flex-grow flex flex-col">
>>>>>>> parent of 666ae3d (Use automated formatting tools)
              <slot />
              <SiteFooter v-if="showFooter" class="mt-auto" />
            </div>
          </div>
        </div>
<<<<<<< HEAD
      </main>
    </ErrorBoundary>
  </div>
</template>
=======
      </div>
    </main>
  </v-app>
</template>
>>>>>>> parent of 666ae3d (Use automated formatting tools)
