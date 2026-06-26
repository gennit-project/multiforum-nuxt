import { describe, it, expect } from 'vitest';
import { generateHeadingId } from './markdown';

describe('generateHeadingId', () => {
  it('lowercases and hyphenates the text', () => {
    expect(generateHeadingId('My Heading')).toBe('my-heading');
  });

  it('removes special characters', () => {
    expect(generateHeadingId('Hello, World!')).toBe('hello-world');
  });

  it('collapses multiple spaces into a single hyphen', () => {
    expect(generateHeadingId('a    b')).toBe('a-b');
  });

  it('trims leading and trailing hyphens', () => {
    expect(generateHeadingId('!!!hi!!!')).toBe('hi');
  });
});
