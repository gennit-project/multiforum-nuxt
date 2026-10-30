import { onMounted, ref } from 'vue';
import type { SignupVerification } from '@/types/signupVerification';

export const useSignupVerification = () => {
  const status = ref<SignupVerification['status'] | 'checking'>('checking');
  const canResend = ref(false);
  const sending = ref(false);
  const message = ref('');

  const check = async () => {
    status.value = 'checking';
    message.value = '';
    try {
      const response = await fetch('/api/session/verification', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('lookup failed');
      const profile = (await response.json()) as SignupVerification;
      if (
        !['verified', 'unverified', 'unknown', 'signed-out'].includes(
          profile.status
        )
      )
        throw new Error('invalid status');
      if (profile.status === 'verified') {
        // Apollo reads its bearer token from local storage. Don't enable Save
        // with the previous login's token while the global sync is still pending.
        const tokenResponse = await fetch('/api/session/token', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!tokenResponse.ok) throw new Error('token unavailable');
        const token = (await tokenResponse.json()) as {
          accessToken?: string | null;
        };
        if (!token.accessToken) throw new Error('session expired');
        localStorage.setItem('token', token.accessToken);
      }
      status.value = profile.status;
      canResend.value = profile.canResend === true;
    } catch {
      status.value = 'unknown';
      canResend.value = false;
    }
  };
  const resend = async () => {
    if (sending.value) return;
    sending.value = true;
    message.value = '';
    try {
      const response = await fetch('/api/session/verification', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        message.value =
          response.status === 429
            ? 'Please wait a minute before requesting another email.'
            : 'We could not send the email. Try again in a minute, or sign in again.';
        return;
      }
      message.value =
        'Verification email sent. Check your inbox and spam folder, then return here.';
    } catch {
      message.value =
        'We could not send the email. Try again in a minute, or sign in again.';
    } finally {
      sending.value = false;
    }
  };
  onMounted(check);
  return { status, canResend, sending, message, check, resend };
};
