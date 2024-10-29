import { ref, computed } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import { useQuery } from "@vue/apollo-composable";
import { usernameVar, setUsername, setModProfileName } from '@/cache';
import { GET_EMAIL } from '@/graphQLData/email/queries';

export function useAuthStatus() {
  const { isAuthenticated, isLoading: isLoadingAuth, user } = useAuth0();
  const isLoadingData = ref(true);  // Tracks user data loading
  const usernameLoaded = computed(() => !!usernameVar.value);

  const loadUserData = async () => {
    // Only load if user is authenticated, email is present, and username is not already loaded
    if (isAuthenticated.value && user.value?.email && !usernameLoaded.value) {
      const { onResult } = useQuery(GET_EMAIL, {
        emailAddress: user.value.email,
      });
      
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
  };

  return {
    isAuthenticated,
    isLoadingAuth,
    isLoadingData,
    loadUserData,
    usernameLoaded,
  };
}
