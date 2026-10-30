import { isLocalDevAuth } from '@/server/utils/local-auth';
import type { SignupVerification } from '@/types/signupVerification';

export default defineEventHandler(
  async (event): Promise<SignupVerification> => {
    setResponseHeader(event, 'Cache-Control', 'no-store');
    if (!event.context.authSession?.isAuthenticated) {
      return { status: 'signed-out', canResend: false };
    }
    const config = useRuntimeConfig(event);
    if (isLocalDevAuth(config)) return { status: 'verified', canResend: false };
    try {
      // Read the signed session's claim, never infer verification from an email
      // address or a missing app username. Rechecking performs a fresh login.
      const session = await useAuth0(event).getSession();
      const user = session?.user;
      if (!user) return { status: 'signed-out', canResend: false };
      if (typeof user.email !== 'string' || !user.email.trim())
        return { status: 'unknown', canResend: false };
      const status =
        user.email_verified === true
          ? 'verified'
          : user.email_verified === false
            ? 'unverified'
            : 'unknown';
      return {
        status,
        canResend:
          status === 'unverified' &&
          typeof user.sub === 'string' &&
          user.sub.startsWith('auth0|') &&
          Boolean(
            config.signupEmailVerification.clientId &&
            config.signupEmailVerification.clientSecret
          ),
      };
    } catch {
      return { status: 'unknown', canResend: false };
    }
  }
);
