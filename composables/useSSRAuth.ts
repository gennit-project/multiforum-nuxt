import { computed } from 'vue';
import { useCookie } from 'nuxt/app';

export const useSSRAuth = () => {
  // Use a simple cookie to hint at auth status for SSR
  // This is not a security measure, just a hint to reduce UI flash
  const authHint = useCookie('auth-hint', {
    httpOnly: false, // Needs to be accessible by client JS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    encode: (value) => value || '',
    decode: (value) => value || '',
  });

  // Additional cookie for username hint (non-sensitive)
  const usernameHint = useCookie('username-hint', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    encode: (value) => value || '',
    decode: (value) => value || '',
  });

  return {
    hasAuthHint: computed(() => authHint.value === 'true'),
    usernameHint: computed(() => usernameHint.value || ''),
    setAuthHint: (value: boolean) => {
      authHint.value = value ? 'true' : null;
    },
    setUsernameHint: (username: string | null) => {
      usernameHint.value = username || null;
    },
    clearAuthHints: () => {
      authHint.value = null;
      usernameHint.value = null;
    },
  };
};
