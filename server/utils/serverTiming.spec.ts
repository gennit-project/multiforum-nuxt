import { describe, expect, it } from 'vitest';
import { buildProxyServerTiming } from './serverTiming';

describe('buildProxyServerTiming', () => {
  it.each([
    [
      'appends the proxy hop to the backend timing',
      'total;dur=40',
      'total;dur=40, proxy;dur=52.3;desc="Vercel -> backend"',
    ],
    [
      'reports only the proxy hop when the backend sent none',
      null,
      'proxy;dur=52.3;desc="Vercel -> backend"',
    ],
  ])('%s', (_label, upstream, expected) => {
    expect(buildProxyServerTiming({ upstream, proxyMs: 52.34 })).toBe(expected);
  });
});
