import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSSRAuth } from '@/composables/useSSRAuth';

// Mock Nuxt's useCookie
vi.mock('nuxt/app', () => ({
  useCookie: vi.fn(),
}));

describe('useSSRAuth', () => {
  let mockAuthHintCookie: any;
  let mockUsernameHintCookie: any;
  let mockUseCookie: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mock from the mocked module
    const { useCookie } = await vi.importMock('nuxt/app');
    mockUseCookie = useCookie;

    // Mock cookie refs
    mockAuthHintCookie = { value: null };
    mockUsernameHintCookie = { value: null };

    mockUseCookie.mockImplementation((name: string) => {
      if (name === 'auth-hint') return mockAuthHintCookie;
      if (name === 'username-hint') return mockUsernameHintCookie;
      return { value: null };
    });
  });

  describe('hasAuthHint', () => {
    it('should return true when auth-hint cookie is "true"', () => {
      mockAuthHintCookie.value = 'true';

      const { hasAuthHint } = useSSRAuth();

      expect(hasAuthHint.value).toBe(true);
    });

    it('should return false when auth-hint cookie is null', () => {
      mockAuthHintCookie.value = null;

      const { hasAuthHint } = useSSRAuth();

      expect(hasAuthHint.value).toBe(false);
    });

    it('should return false when auth-hint cookie is "false"', () => {
      mockAuthHintCookie.value = 'false';

      const { hasAuthHint } = useSSRAuth();

      expect(hasAuthHint.value).toBe(false);
    });

    it('should return false when auth-hint cookie is empty string', () => {
      mockAuthHintCookie.value = '';

      const { hasAuthHint } = useSSRAuth();

      expect(hasAuthHint.value).toBe(false);
    });
  });

  describe('usernameHint', () => {
    it('should return username when username-hint cookie has value', () => {
      mockUsernameHintCookie.value = 'testuser';

      const { usernameHint } = useSSRAuth();

      expect(usernameHint.value).toBe('testuser');
    });

    it('should return empty string when username-hint cookie is null', () => {
      mockUsernameHintCookie.value = null;

      const { usernameHint } = useSSRAuth();

      expect(usernameHint.value).toBe('');
    });

    it('should return empty string when username-hint cookie is empty', () => {
      mockUsernameHintCookie.value = '';

      const { usernameHint } = useSSRAuth();

      expect(usernameHint.value).toBe('');
    });
  });

  describe('setAuthHint', () => {
    it('should set auth-hint cookie to "true" when passed true', () => {
      const { setAuthHint } = useSSRAuth();

      setAuthHint(true);

      expect(mockAuthHintCookie.value).toBe('true');
    });

    it('should set auth-hint cookie to null when passed false', () => {
      const { setAuthHint } = useSSRAuth();

      setAuthHint(false);

      expect(mockAuthHintCookie.value).toBe(null);
    });
  });

  describe('setUsernameHint', () => {
    it('should set username-hint cookie to provided username', () => {
      const { setUsernameHint } = useSSRAuth();

      setUsernameHint('newuser');

      expect(mockUsernameHintCookie.value).toBe('newuser');
    });

    it('should set username-hint cookie to null when passed null', () => {
      const { setUsernameHint } = useSSRAuth();

      setUsernameHint(null);

      expect(mockUsernameHintCookie.value).toBe(null);
    });

    it('should set username-hint cookie to null when passed empty string', () => {
      const { setUsernameHint } = useSSRAuth();

      setUsernameHint('');

      expect(mockUsernameHintCookie.value).toBe(null);
    });
  });

  describe('clearAuthHints', () => {
    it('should clear both auth-hint and username-hint cookies', () => {
      // Set initial values
      mockAuthHintCookie.value = 'true';
      mockUsernameHintCookie.value = 'testuser';

      const { clearAuthHints } = useSSRAuth();

      clearAuthHints();

      expect(mockAuthHintCookie.value).toBe(null);
      expect(mockUsernameHintCookie.value).toBe(null);
    });
  });

  describe('cookie configuration', () => {
    it('should configure cookies with correct options', () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      useSSRAuth();

      expect(mockUseCookie).toHaveBeenCalledWith('auth-hint', {
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        encode: expect.any(Function),
        decode: expect.any(Function),
      });

      expect(mockUseCookie).toHaveBeenCalledWith('username-hint', {
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        encode: expect.any(Function),
        decode: expect.any(Function),
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should set secure to false in development', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      useSSRAuth();

      expect(mockUseCookie).toHaveBeenCalledWith(
        'auth-hint',
        expect.objectContaining({ secure: false })
      );

      expect(mockUseCookie).toHaveBeenCalledWith(
        'username-hint',
        expect.objectContaining({ secure: false })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('encode/decode functions', () => {
    it('should encode and decode cookie values correctly', () => {
      useSSRAuth();

      interface CookieConfig {
        httpOnly: boolean;
        secure: boolean;
        sameSite: string;
        encode: (value: any) => string;
        decode: (value: any) => string;
      }

      type MockUseCookieCall = [string, CookieConfig];

      const authHintConfig = (
        mockUseCookie.mock.calls.find(
          (call: MockUseCookieCall) => call[0] === 'auth-hint'
        ) as MockUseCookieCall
      )[1];

      // Test encode function
      expect(authHintConfig.encode('test')).toBe('test');
      expect(authHintConfig.encode('')).toBe('');
      expect(authHintConfig.encode(null)).toBe('');
      expect(authHintConfig.encode(undefined)).toBe('');

      // Test decode function
      expect(authHintConfig.decode('test')).toBe('test');
      expect(authHintConfig.decode('')).toBe('');
      expect(authHintConfig.decode(null)).toBe('');
      expect(authHintConfig.decode(undefined)).toBe('');
    });
  });
});
