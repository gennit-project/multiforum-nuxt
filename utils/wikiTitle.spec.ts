import { describe, expect, it } from 'vitest';
import { getPlainWikiTitle } from './wikiTitle';

describe('getPlainWikiTitle', () => {
  it('removes markdown formatting from wiki titles', () => {
    expect(getPlainWikiTitle('**Install** the [CLI](https://example.com)')).toBe(
      'Install the CLI'
    );
  });

  it('uses the fallback for an empty title', () => {
    expect(getPlainWikiTitle('', 'Untitled')).toBe('Untitled');
  });
});
