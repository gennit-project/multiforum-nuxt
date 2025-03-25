<script setup lang="ts">
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
} from "@/cache";
import CreateUsernamePage from "@/components/auth/CreateUsernamePage.vue";
import { config } from "@/config";
import DevOverlay from '@/components/nav/DevOverlay.vue'

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
} = useLazyQuery(GET_EMAIL, {
  emailAddress: userEmail,
});

onError((error) => {
  console.error("GraphQL query error:", error);
});

// ===== Token Expiration Handler =====
const auth0 = useAuth0();
const tokenCheckInterval = ref<number | null>(null);

// Check token expiration status
const checkTokenExpiration = async () => {
  try {
    if (auth0.isAuthenticated.value) {
      // Check if we can get claims from the token
      const claims = auth0.idTokenClaims
      
      if (claims) {
        const currentTime = Math.floor(Date.now() / 1000);
        const expiresAt = claims.exp;
        
        // If token is expired or about to expire in the next minute
        if (expiresAt <= currentTime + 60) {
          console.log('Token is expired or about to expire, attempting refresh');
          
          try {
            // Try to silently refresh the token
            await auth0.getAccessTokenSilently({ cacheMode: 'off' });
            console.log('Token refreshed successfully');
          } catch (refreshError) {
            console.error('Failed to refresh token, logging out locally:', refreshError);
            
            // If refresh fails, logout the user without redirect
            auth0.logout({
              logoutParams: {
                returnTo: window.location.href, // Stay on current page
              },
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking token expiration:', error);
    
    // If we can't check the token at all, it's likely an issue with auth
    // Log the user out to be safe
    if (auth0.isAuthenticated.value) {
      console.log('Authentication error detected, logging out locally');
      auth0.logout({
        logoutParams: {
          returnTo: window.location.href, // Stay on current page
        },
      });
    }
  }
};

// Handle when the tab becomes visible again after being hidden
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    checkTokenExpiration();
  }
};

// Setup token checks and event listeners
onMounted(() => {
  const { user, isAuthenticated } = useAuth0();
  isAuthenticatedVar.value = isAuthenticated.value;
  isLoadingAuthVar.value = false;

  // Watch for authentication state
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
  
  // Watch for authentication errors
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
            returnTo: window.location.href, // Stay on current page
          },
        });
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
    setIsLoadingAuth(false);
    setIsAuthenticated(true);
    setModProfileName(modProfileData?.displayName || "");
    setNotificationCount(userData.NotificationsAggregate?.count || 0);
  }
});

const emailDoesNotHaveUsernameAttached = computed(() => {
  return (
    !usernameVar.value && isAuthenticatedVar.value && !isLoadingAuthVar.value
  );
});

const showMainContent = computed(() => {
  return !isAuthenticatedVar || (isAuthenticatedVar && usernameVar);
});
</script>

<template>
  <v-app>
    <DevOverlay v-if="isDevelopment" />
    <main class="min-h-screen flex flex-col">
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
          <div v-if="showMainContent" class="w-full flex-grow flex flex-col">
            <slot />
            <SiteFooter v-if="showFooter" class="mt-auto" />
          </div>
          <div v-else>
            <client-only>
              <CreateUsernamePage
                v-if="emailDoesNotHaveUsernameAttached"
                @email-and-user-created="!usernameVar"
              />
            </client-only>
          </div>
        </div>
      </div>
    </main>
  </v-app>
</template>