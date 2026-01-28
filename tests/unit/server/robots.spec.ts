import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler } from 'h3';

vi.stubGlobal('defineEventHandler', defineEventHandler);
const { default: handler } = await import('@/server/robots.txt');

const runHandler = async () => {
  const event = {} as any;
  return handler(event);
};

describe('robots.txt', () => {
  const originalEnv = process.env.VITE_ENVIRONMENT;

  beforeEach(() => {
    process.env.VITE_ENVIRONMENT = originalEnv;
  });

  it('disallows all when not production', async () => {
    process.env.VITE_ENVIRONMENT = 'test';

    const result = await runHandler();

    expect(result).toBe('User-agent: *\nDisallow: /');
  });

  it('allows root and disallows sensitive paths in production', async () => {
    process.env.VITE_ENVIRONMENT = 'production';

    const result = await runHandler();

    expect(result).toBe(`User-agent: *
Allow: /

Disallow: /api/*
Disallow: /admin/*
Disallow: /mod/*
Disallow: /auth/*
Disallow: /_nuxt/*
Disallow: /assets/*
Disallow: /static/*
Disallow: /issues/*`);
  });
});
