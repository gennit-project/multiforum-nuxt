import { describe, it, expect } from 'vitest';
import { escapeRegex, createCaseInsensitivePattern } from '@/utils/searchUtils';

describe('escapeRegex', () => {
  it('escapes dots', () => {
    expect(escapeRegex('file.txt')).toBe('file\\.txt');
  });

  it('escapes asterisks', () => {
    expect(escapeRegex('test*')).toBe('test\\*');
  });

  it('escapes plus signs', () => {
    expect(escapeRegex('a+b')).toBe('a\\+b');
  });

  it('escapes question marks', () => {
    expect(escapeRegex('what?')).toBe('what\\?');
  });

  it('escapes caret', () => {
    expect(escapeRegex('^start')).toBe('\\^start');
  });

  it('escapes dollar sign', () => {
    expect(escapeRegex('price$')).toBe('price\\$');
  });

  it('escapes curly braces', () => {
    expect(escapeRegex('{a}')).toBe('\\{a\\}');
  });

  it('escapes parentheses', () => {
    expect(escapeRegex('(group)')).toBe('\\(group\\)');
  });

  it('escapes pipe', () => {
    expect(escapeRegex('a|b')).toBe('a\\|b');
  });

  it('escapes square brackets', () => {
    expect(escapeRegex('[abc]')).toBe('\\[abc\\]');
  });

  it('escapes backslash', () => {
    expect(escapeRegex('path\\to')).toBe('path\\\\to');
  });

  it('escapes multiple special characters', () => {
    expect(escapeRegex('a.*b+c?')).toBe('a\\.\\*b\\+c\\?');
  });

  it('returns empty string for empty input', () => {
    expect(escapeRegex('')).toBe('');
  });

  it('leaves regular text unchanged', () => {
    expect(escapeRegex('hello world')).toBe('hello world');
  });
});

describe('createCaseInsensitivePattern', () => {
  it('creates pattern with case-insensitive flag', () => {
    const result = createCaseInsensitivePattern('test');

    expect(result).toBe('(?i).*test.*');
  });

  it('escapes regex special characters in search term', () => {
    const result = createCaseInsensitivePattern('file.txt');

    expect(result).toBe('(?i).*file\\.txt.*');
  });

  it('trims whitespace from search term', () => {
    const result = createCaseInsensitivePattern('  search  ');

    expect(result).toBe('(?i).*search.*');
  });

  it('returns undefined for empty string', () => {
    expect(createCaseInsensitivePattern('')).toBeUndefined();
  });

  it('returns undefined for whitespace-only string', () => {
    expect(createCaseInsensitivePattern('   ')).toBeUndefined();
  });

  it('handles complex search terms', () => {
    const result = createCaseInsensitivePattern('C++ programming');

    expect(result).toBe('(?i).*C\\+\\+ programming.*');
  });
});
