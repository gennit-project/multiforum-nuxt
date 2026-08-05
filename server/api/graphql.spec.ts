import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '@/server/api/graphql';

const h = vi.hoisted(() => ({
  proxyRequest: vi.fn(),
  backendGraphqlUrl: 'http://backend:4000/graphql',
}));

vi.mock('h3', () => ({
  createError: (input: { statusCode: number; statusMessage: string }) =>
    Object.assign(new Error(input.statusMessage), input),
  defineEventHandler: (handler: unknown) => handler,
  proxyRequest: h.proxyRequest,
}));

vi.stubGlobal('useRuntimeConfig', () => ({
  backendGraphqlUrl: h.backendGraphqlUrl,
}));

const event = { method: 'POST' };

beforeEach(() => {
  vi.clearAllMocks();
  h.backendGraphqlUrl = 'http://backend:4000/graphql';
});

describe('runtime GraphQL proxy', () => {
  it('forwards the request to the runtime-configured backend', async () => {
    h.proxyRequest.mockResolvedValue({ data: {} });
    await (handler as (event: unknown) => Promise<unknown>)(event);
    expect(h.proxyRequest).toHaveBeenCalledWith(
      event,
      'http://backend:4000/graphql'
    );
  });

  it('trims the configured backend URL', async () => {
    h.backendGraphqlUrl = '  http://backend:4000/graphql  ';
    await (handler as (event: unknown) => Promise<unknown>)(event);
    expect(h.proxyRequest).toHaveBeenCalledWith(
      event,
      'http://backend:4000/graphql'
    );
  });

  it('returns a service-unavailable error when no backend is configured', () => {
    h.backendGraphqlUrl = ' ';
    expect(() =>
      (handler as (event: unknown) => Promise<unknown>)(event)
    ).toThrowError('Backend GraphQL URL is not configured');
  });
});
