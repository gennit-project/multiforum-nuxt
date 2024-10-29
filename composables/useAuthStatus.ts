import { ref, computed, watch } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { useQuery } from "@vue/apollo-composable";
import { usernameVar, setUsername, setModProfileName } from "@/cache";
import { GET_EMAIL } from "@/graphQLData/email/queries";

export function useAuthStatus() {
  console.log("useAuthStatus");

  // Define authentication and loading refs
  const isAuthenticated = ref(false);
  const isLoadingAuth = ref(true);
  const isLoadingData = ref(true);
  const usernameLoaded = computed(() => !!usernameVar.value);

  const loadUserData = () => {
    // Only call useAuth0 if on client
    if (import.meta.client) {
      // Only call useAuth0 if on client
      const {
        isAuthenticated: auth0Authenticated,
        isLoading: auth0Loading,
        user,
      } = useAuth0();

      // Watch for when Auth0 has finished loading
      watch(
        () => auth0Loading.value,
        async (newVal) => {
          if (!newVal) {
            // Sync isAuthenticated and isLoadingAuth with Auth0's values
            isAuthenticated.value = auth0Authenticated.value;
            isLoadingAuth.value = false;

            console.log({
              email: user.value?.email,
              isAuthenticated: isAuthenticated.value,
              isLoadingAuth: isLoadingAuth.value,
              usernameLoaded: usernameLoaded.value,
              username: usernameVar.value,
            });

            // Load user data if authenticated and not already loaded
            if (
              isAuthenticated.value &&
              user.value?.email &&
              !usernameLoaded.value
            ) {
              const { onResult } = useQuery(GET_EMAIL, {
                emailAddress: user.value.email,
              });

              // Handle the result of the query
              onResult((result: any) => {
                
                const emailData = result.data?.emails[0];
                const userData = emailData?.User;
                console.log("useAuthStatus onResult", userData);

                if (userData) {
                  setUsername(userData.username);
                  setModProfileName(
                    userData.ModerationProfile?.displayName || ""
                  );
                }

                isLoadingData.value = false; // Data loading complete
              });
            } else {
              isLoadingData.value = false; // No need to load data
            }
          }
        },
        { immediate: true }
      );
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
