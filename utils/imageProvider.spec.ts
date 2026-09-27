import { describe, expect, it } from 'vitest';
import { resolveImageProvider } from './imageProvider';

describe('resolveImageProvider', () => {
  it.each([
    ['the Vercel Nitro preset', { nitroPreset: 'vercel' }, 'vercel'],
    ['the Vercel build environment', { vercel: '1' }, 'vercel'],
    ['a Node server build', { nitroPreset: 'node-server' }, 'ipx'],
    ['local development', {}, 'ipx'],
  ] as const)('uses %s to select %s', (_case, input, expected) => {
    expect(resolveImageProvider(input)).toBe(expected);
  });
});
