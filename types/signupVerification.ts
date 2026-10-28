export type SignupVerification = {
  status: 'verified' | 'unverified' | 'unknown' | 'signed-out';
  canResend: boolean;
};
