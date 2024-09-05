// Placeholder Auth0 Hooks
export const useAuth0 = () => {
  return {
    isAuthenticated: true, // Placeholder value
    user: { name: "Mock User", email: process.env.VITE_AUTH0_USERNAME }, // Placeholder value
    loginWithRedirect: () => console.log("Mock login"),
    logout: () => console.log("Mock logout"),
    isLoading: false, // Placeholder value
  };
};

export default useAuth0;
