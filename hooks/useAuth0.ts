// Placeholder Auth0 Hooks
import config from "@/config";
export const useAuth0 = () => {
  return {
    isAuthenticated: true, // Placeholder value
    user: { 
      name: "Catherine", 
      email: config.auth0username,
      username: 'gennitdev',
      ModerationProfile: {
        displayName: "miniatureDeafeningMysteriousTeacher"
      }
    }, // Placeholder value
    loginWithRedirect: () => console.log("Mock login"),
    login: () => console.log("Mock login"),
    logout: () => console.log("Mock logout"),
    isLoading: false, // Placeholder value
    error: null, // Placeholder value
  };
};

export default useAuth0;
