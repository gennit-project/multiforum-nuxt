import { describe, it, expect } from 'vitest';
import { escapeRegex, createCaseInsensitivePattern } from './searchUtils';

describe('escapeRegex', () => {
  it('escapes regex metacharacters', () => {
    expect(escapeRegex('a.b*c')).toBe('a\\.b\\*c');
  });

  it('leaves plain text unchanged', () => {
    expect(escapeRegex('plain')).toBe('plain');
  });
});

describe('createCaseInsensitivePattern', () => {
  it('returns undefined for an empty search term', () => {
    expect(createCaseInsensitivePattern('   ')).toBeUndefined();
  });

  it('wraps the escaped term in a case-insensitive contains pattern', () => {
    expect(createCaseInsensitivePattern('a.b')).toBe('(?i).*a\\.b.*');
  });
});
