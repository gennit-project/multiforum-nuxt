import { describe, it, expect } from 'vitest';
import {
  isValidUsername,
  getUsernameValidationMessage,
  calculateAge,
  getBirthdayValidationMessage,
} from '@/utils/usernameValidation';

const NOW = new Date('2024-06-15T00:00:00Z');

describe('isValidUsername', () => {
  it('accepts letters, numbers and underscores', () => {
    expect(isValidUsername('cool_user_99')).toBe(true);
  });

  it('rejects spaces and punctuation', () => {
    expect(isValidUsername('cool user!')).toBe(false);
  });
});

describe('getUsernameValidationMessage', () => {
  it('reports an empty username first', () => {
    expect(
      getUsernameValidationMessage({ username: '', isEmpty: true, isTaken: false })
    ).toBe('Username cannot be empty.');
  });

  it('reports a taken username', () => {
    expect(
      getUsernameValidationMessage({
        username: 'taken',
        isEmpty: false,
        isTaken: true,
      })
    ).toBe('The username is already taken.');
  });

  it('reports invalid characters', () => {
    expect(
      getUsernameValidationMessage({
        username: 'bad name',
        isEmpty: false,
        isTaken: false,
      })
    ).toContain('letters, numbers, and underscores');
  });

  it('reports an over-long username', () => {
    expect(
      getUsernameValidationMessage({
        username: 'a'.repeat(60),
        isEmpty: false,
        isTaken: false,
      })
    ).toContain('must be less than');
  });

  it('returns no message for a valid username', () => {
    expect(
      getUsernameValidationMessage({
        username: 'valid_name',
        isEmpty: false,
        isTaken: false,
      })
    ).toBe('');
  });
});

describe('calculateAge', () => {
  it('returns 0 for an empty birth date', () => {
    expect(calculateAge('', NOW)).toBe(0);
  });

  it('computes age before the birthday this year', () => {
    expect(calculateAge('2000-12-01', NOW)).toBe(23);
  });

  it('computes age after the birthday this year', () => {
    expect(calculateAge('2000-01-01', NOW)).toBe(24);
  });
});

describe('getBirthdayValidationMessage', () => {
  it('requires a birthday', () => {
    expect(getBirthdayValidationMessage({ birthday: '', now: NOW })).toBe(
      'Birthday is required.'
    );
  });

  it('rejects under-13 users', () => {
    expect(
      getBirthdayValidationMessage({ birthday: '2015-01-01', now: NOW })
    ).toContain('at least 13 years old');
  });

  it('accepts users 13 and older', () => {
    expect(
      getBirthdayValidationMessage({ birthday: '2000-01-01', now: NOW })
    ).toBe('');
  });
});
