import { MAX_CHARS_IN_USERNAME } from '@/utils/constants';

/**
 * Pure username/age validation for CreateUsernameForm. `now` is injectable so
 * age math is deterministic in tests.
 */
export const DEFAULT_MIN_SIGNUP_AGE = 13;

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

export function calculateAge(
  birthDate: string,
  now: Date = new Date()
): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const birth = new Date(Date.UTC(year, month - 1, day));
  if (
    birth.getUTCFullYear() !== year ||
    birth.getUTCMonth() !== month - 1 ||
    birth.getUTCDate() !== day
  ) {
    return null;
  }

  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())
  ) {
    age--;
  }
  return age;
}

export type BirthdayValidationParams = {
  birthday: string;
  minimumAge?: number | null;
  required?: boolean;
  now?: Date;
};

export function getBirthdayValidationMessage(
  params: BirthdayValidationParams
): string {
  const {
    birthday,
    minimumAge = DEFAULT_MIN_SIGNUP_AGE,
    required = true,
    now = new Date(),
  } = params;
  if (!birthday || birthday.length === 0) {
    return required ? 'Birthday is required.' : '';
  }

  const age = calculateAge(birthday, now);
  if (age === null || age < 0) {
    return 'Enter a valid birthday.';
  }
  if (minimumAge !== null && age < minimumAge) {
    return `You must be at least ${minimumAge} years old to create an account.`;
  }
  return '';
}
