import { describe, it, expect } from 'vitest';
import {
  isValidUsername,
  getUsernameValidationMessage,
  calculateAge,
  getBirthdayValidationMessage,
} from './usernameValidation';

describe('isValidUsername', () => {
  it('accepts letters, numbers, and underscores', () => {
    expect(isValidUsername('alice_99')).toBe(true);
  });

  it('rejects names with other characters', () => {
    expect(isValidUsername('alice-99')).toBe(false);
  });
});

describe('getUsernameValidationMessage', () => {
  it('flags an empty username', () => {
    expect(
      getUsernameValidationMessage({ username: '', isEmpty: true, isTaken: false })
    ).toBe('Username cannot be empty.');
  });

  it('flags a taken username', () => {
    expect(
      getUsernameValidationMessage({ username: 'alice', isEmpty: false, isTaken: true })
    ).toBe('The username is already taken.');
  });

  it('flags invalid characters', () => {
    expect(
      getUsernameValidationMessage({ username: 'a-b', isEmpty: false, isTaken: false })
    ).toContain('letters, numbers, and underscores');
  });

  it('returns an empty string for a valid username', () => {
    expect(
      getUsernameValidationMessage({ username: 'alice', isEmpty: false, isTaken: false })
    ).toBe('');
  });
});

describe('calculateAge', () => {
  it('returns 0 for an empty birth date', () => {
    expect(calculateAge('', new Date('2024-06-15'))).toBe(0);
  });

  it('computes age, accounting for a birthday later in the year', () => {
    expect(calculateAge('2010-12-31', new Date('2024-06-15'))).toBe(13);
  });
});

describe('getBirthdayValidationMessage', () => {
  it('requires a birthday', () => {
    expect(getBirthdayValidationMessage({ birthday: '' })).toBe(
      'Birthday is required.'
    );
  });

  it('rejects under-13 signups', () => {
    expect(
      getBirthdayValidationMessage({
        birthday: '2015-01-01',
        now: new Date('2024-06-15'),
      })
    ).toContain('at least 13 years old');
  });

  it('accepts a birthday meeting the minimum age', () => {
    expect(
      getBirthdayValidationMessage({
        birthday: '2000-01-01',
        now: new Date('2024-06-15'),
      })
    ).toBe('');
  });
});
