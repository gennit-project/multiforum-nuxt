import { describe, it, expect } from 'vitest';
import { formatWordCount } from './wikiSearchDisplay';

describe('formatWordCount', () => {
  it('returns "0 words" for an empty body', () => {
    expect(formatWordCount('')).toBe('0 words');
  });

  it('returns "0 words" for null', () => {
    expect(formatWordCount(null)).toBe('0 words');
  });

  it('returns "0 words" for whitespace only', () => {
    expect(formatWordCount('   ')).toBe('0 words');
  });

  it('uses the singular noun for a single word', () => {
    expect(formatWordCount('hello')).toBe('1 word');
  });

  it('counts multiple words separated by arbitrary whitespace', () => {
    expect(formatWordCount('one  two\nthree')).toBe('3 words');
  });

  it('uses a compact k-suffix at 1000 words', () => {
    expect(formatWordCount(Array(1000).fill('w').join(' '))).toBe('1k words');
  });

  it('keeps one decimal place for non-round thousands', () => {
    expect(formatWordCount(Array(1200).fill('w').join(' '))).toBe('1.2k words');
  });
});
