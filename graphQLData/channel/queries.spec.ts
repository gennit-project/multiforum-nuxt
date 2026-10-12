import { describe, expect, it } from 'vitest';
import { print } from 'graphql';
import { GET_CHANNEL } from './queries';

describe('GET_CHANNEL', () => {
  it('loads upload selection behavior for download filter groups', () => {
    expect(print(GET_CHANNEL)).toContain('uploadSelection');
  });
});
