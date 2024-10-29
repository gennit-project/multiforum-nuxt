import { ref, computed } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import { useQuery } from "@vue/apollo-composable";
import { usernameVar, setUsername, setModProfileName } from '@/cache';
import { GET_EMAIL } from '@/graphQLData/email/queries';

export function useAuthStatus() {
  // Define authentication and loading refs
  const isAuthenticated = ref(false);
  const isLoadingAuth = ref(true);
  const isLoadingData = ref(true);
  const usernameLoaded = computed(() => !!usernameVar.value);

  const loadUserData = async () => {
    if (import.meta.client) {
      // Only call useAuth0 if on client
      const { isAuthenticated: auth0Authenticated, isLoading: auth0Loading, user } = useAuth0();

      // Sync isAuthenticated and isLoadingAuth with Auth0's values
      isAuthenticated.value = auth0Authenticated.value;
      isLoadingAuth.value = auth0Loading.value;

      if (isAuthenticated.value && user.value?.email && !usernameLoaded.value) {
        const { onResult } = useQuery(GET_EMAIL, {
          emailAddress: user.value.email,
        });
        
        // Handle the result of the query
        onResult((result: any) => {
          if (!import.meta.client) return;

          const emailData = result.data?.emails[0];
          const userData = emailData?.User;
          
          if (userData) {
            setUsername(userData.username);
            setModProfileName(userData.ModerationProfile?.displayName || "");
          }

          isLoadingData.value = false;  // Data loading complete
        });
      } else {
        // No need to load if user data is already set or user is unauthenticated
        isLoadingData.value = false;
      }
    } else {
      // On the server side, assume not authenticated
      isAuthenticated.value = false;
      isLoadingAuth.value = false;
      isLoadingData.value = false;
    }
  };

  return {
    isAuthenticated,
    isLoadingAuth,
    isLoadingData,
    loadUserData,
    usernameLoaded,
  };
}
