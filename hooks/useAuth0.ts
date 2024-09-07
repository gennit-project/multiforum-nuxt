// Placeholder Auth0 Hooks
export const useAuth0 = () => {
  return {
    isAuthenticated: true, // Placeholder value
    user: { 
      name: "Alice", 
      email: process.env.VITE_AUTH0_USERNAME,
      username: 'alice'
    }, // Placeholder value
    loginWithRedirect: () => console.log("Mock login"),
    login: () => console.log("Mock login"),
    logout: () => console.log("Mock logout"),
    isLoading: false, // Placeholder value
  };
};

export default useAuth0;
