import { defineNuxtPlugin } from 'nuxt/app';
import { setUsername, setIsAuthenticated } from '@/cache';
import { jwtDecode } from 'jwt-decode';

export default defineNuxtPlugin((nuxtApp) => {
  // Only runs on server
  if (import.meta.server) {
    const cookies = nuxtApp.ssrContext?.event.node.req.headers.cookie;
    
    // Default to not authenticated
    setIsAuthenticated(false);
    
    if (cookies) {
      // Look for Auth0 cookie - adjust the name based on your Auth0 config
      const auth0Cookie = cookies.split(';').find(c => c.trim().startsWith('auth0.is.authenticated='));
      const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('auth0.token='));
      
      if (auth0Cookie && tokenCookie) {
        try {
          const token = decodeURIComponent(tokenCookie.split('=')[1]);
          const decoded = jwtDecode(token);
          if (decoded && decoded.sub) {
            // Set initial auth state
            setIsAuthenticated(true);
            if ('username' in decoded) {
              setUsername(decoded.username as string);
            }
          }
        } catch (e) {
          console.error('Failed to decode auth token:', e);
          // Explicitly set to false on error
          setIsAuthenticated(false);
        }
      }
    }
  }
});