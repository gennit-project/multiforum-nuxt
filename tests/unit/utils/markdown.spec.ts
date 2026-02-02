import { describe, it, expect } from 'vitest';
import { generateHeadingId } from '@/utils/markdown';

describe('generateHeadingId', () => {
  it('converts text to lowercase', () => {
    expect(generateHeadingId('HELLO')).toBe('hello');
  });

  it('replaces spaces with hyphens', () => {
    expect(generateHeadingId('hello world')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(generateHeadingId('hello, world!')).toBe('hello-world');
  });

  it('handles multiple spaces', () => {
    expect(generateHeadingId('hello   world')).toBe('hello-world');
  });

  it('removes leading hyphens', () => {
    expect(generateHeadingId('  hello')).toBe('hello');
  });

  it('removes trailing hyphens', () => {
    expect(generateHeadingId('hello  ')).toBe('hello');
  });

  it('replaces multiple hyphens with single hyphen', () => {
    expect(generateHeadingId('hello---world')).toBe('hello-world');
  });

  it('preserves underscores', () => {
    expect(generateHeadingId('hello_world')).toBe('hello_world');
  });

  it('preserves numbers', () => {
    expect(generateHeadingId('version 2')).toBe('version-2');
  });

  it('handles parentheses', () => {
    expect(generateHeadingId('hello (world)')).toBe('hello-world');
  });

  it('returns empty string for all special characters', () => {
    expect(generateHeadingId('!!!')).toBe('');
  });

  it('handles complex mixed input', () => {
    expect(generateHeadingId('Hello, World! (v2.0)')).toBe('hello-world-v20');
  });
});
