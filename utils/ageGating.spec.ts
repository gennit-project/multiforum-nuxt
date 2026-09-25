import { describe, expect, it } from 'vitest';
import { getAgeErrorMessage } from './ageGating';

describe('getAgeErrorMessage', () => {
  it.each([
    ['BIRTHDAY_ALREADY_SET', 'already been set'],
    ['BIRTHDAY_REQUIRED', 'Birthday is required'],
    ['INVALID_BIRTHDAY', 'valid birthday'],
    ['MINIMUM_AGE_NOT_MET', 'minimum age requirement'],
  ])('maps the %s backend code', (code, expectedText) => {
    expect(getAgeErrorMessage(`GraphQL error: ${code}`)).toContain(
      expectedText
    );
  });

  it('preserves an unknown server error', () => {
    expect(getAgeErrorMessage('Network unavailable')).toBe(
      'Network unavailable'
    );
  });
});
