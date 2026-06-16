import { MAX_CHARS_IN_USERNAME } from '@/utils/constants';

/**
 * Pure username/age validation for CreateUsernameForm. `now` is injectable so
 * age math is deterministic in tests.
 */
export const MIN_SIGNUP_AGE = 13;

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(username);
}

export type UsernameValidationParams = {
  username: string;
  isEmpty: boolean;
  isTaken: boolean;
};

export function getUsernameValidationMessage(
  params: UsernameValidationParams
): string {
  const { username, isEmpty, isTaken } = params;
  if (isEmpty) {
    return 'Username cannot be empty.';
  }
  if (isTaken) {
    return 'The username is already taken.';
  }
  if (!isValidUsername(username || '')) {
    return 'Username can only contain letters, numbers, and underscores.';
  }
  if (username && username.length > MAX_CHARS_IN_USERNAME) {
    return `Username must be less than ${MAX_CHARS_IN_USERNAME} characters.`;
  }
  return '';
}

export function calculateAge(birthDate: string, now: Date = new Date()): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export type BirthdayValidationParams = {
  birthday: string;
  now?: Date;
};

export function getBirthdayValidationMessage(
  params: BirthdayValidationParams
): string {
  const { birthday, now = new Date() } = params;
  if (!birthday || birthday.length === 0) {
    return 'Birthday is required.';
  }
  if (calculateAge(birthday, now) < MIN_SIGNUP_AGE) {
    return 'You must be at least 13 years old to create an account.';
  }
  return '';
}
