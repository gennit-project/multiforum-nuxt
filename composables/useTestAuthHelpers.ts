// composables/useTestAuthHelpers.ts
import { nextTick, onMounted } from "vue";
import { 
  setUsername, 
  setIsAuthenticated, 
  isAuthenticatedVar 
} from "@/cache";
import { config } from "@/config";

export function useTestAuthHelpers() {
  // Only expose in development, test, or Cypress environments
  const shouldExpose = 
    config.environment === "development" || 
    config.environment === "test" || 
    (typeof window !== 'undefined' && (window as any).Cypress);

  if (!shouldExpose) return;

  console.log('🔧 Exposing test auth helpers for environment:', config.environment);

  // Create the auth state setter function
  const setAuthStateDirect = (authState: { username: string; authenticated?: boolean }) => {
    console.log('🔧 Direct auth state update:', authState);
    
    if (authState.authenticated !== false) {
      setIsAuthenticated(true);
      setUsername(authState.username);
      isAuthenticatedVar.value = true;
      console.log('🔧 Auth state set to TRUE for user:', authState.username);
    } else {
      setIsAuthenticated(false);
      setUsername('');
      isAuthenticatedVar.value = false;
      console.log('🔧 Auth state set to FALSE');
    }
    
    // Force UI reactivity update
    nextTick(() => {
      console.log('🔧 After nextTick - isAuthenticated:', isAuthenticatedVar.value, 'username:', authState.username);
    });
  };

  // Expose to window immediately
  const exposeToWindow = () => {
    if (typeof window !== 'undefined') {
      (window as any).__SET_AUTH_STATE_DIRECT__ = setAuthStateDirect;
      console.log('🔧 __SET_AUTH_STATE_DIRECT__ exposed to window');
    }
  };

  // Expose immediately
  exposeToWindow();

  // Re-expose after mount to ensure it's available
  onMounted(() => {
    exposeToWindow();
    console.log('🔧 Test auth helpers re-exposed after mount');
  });

  return {
    setAuthStateDirect,
  };
}