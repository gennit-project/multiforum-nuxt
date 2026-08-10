import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '@/server/api/graphql';

const h = vi.hoisted(() => ({
  backendGraphqlUrl: 'http://backend:4000/graphql',
  getRequestHeaders: vi.fn(),
  readRawBody: vi.fn(),
  setResponseHeader: vi.fn(),
  setResponseStatus: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('h3', () => ({
  createError: (input: { statusCode: number; statusMessage: string }) =>
    Object.assign(new Error(input.statusMessage), input),
  defineEventHandler: (currentHandler: unknown) => currentHandler,
  getRequestHeaders: h.getRequestHeaders,
  readRawBody: h.readRawBody,
  setResponseHeader: h.setResponseHeader,
  setResponseStatus: h.setResponseStatus,
}));

vi.stubGlobal('useRuntimeConfig', () => ({
  backendGraphqlUrl: h.backendGraphqlUrl,
}));
vi.stubGlobal('fetch', h.fetch);

const event = { method: 'POST' };

beforeEach(() => {
  vi.clearAllMocks();
  h.backendGraphqlUrl = 'http://backend:4000/graphql';
  h.getRequestHeaders.mockReturnValue({
    'content-type': 'application/json',
    authorization: 'Bearer test-token',
    host: 'frontend.test',
    connection: 'keep-alive',
    'content-length': '25',
  });
  h.readRawBody.mockResolvedValue('{"query":"{ __typename }"}');
});

describe('runtime GraphQL proxy', () => {
  it('forwards the request to the runtime-configured backend', async () => {
    h.fetch.mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const result = await (handler as (input: unknown) => Promise<unknown>)(event);

    expect(h.fetch).toHaveBeenCalledWith(
      'http://backend:4000/graphql',
      expect.objectContaining({
        method: 'POST',
        body: '{"query":"{ __typename }"}',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer test-token',
        },
      })
    );
    expect(result).toEqual({ data: { ok: true } });
  });

  it('trims the configured backend URL', async () => {
    h.backendGraphqlUrl = '  http://backend:4000/graphql  ';
    h.fetch.mockResolvedValue(
      new Response(JSON.stringify({ data: {} }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    await (handler as (input: unknown) => Promise<unknown>)(event);

    expect(h.fetch).toHaveBeenCalledWith(
      'http://backend:4000/graphql',
      expect.any(Object)
    );
  });

  it('returns a service-unavailable error when no backend is configured', async () => {
    h.backendGraphqlUrl = ' ';
    await expect(
      (handler as (input: unknown) => Promise<unknown>)(event)
    ).rejects.toThrowError('Backend GraphQL URL is not configured');
  });

  it('returns a GraphQL error payload when the backend responds with 503', async () => {
    h.fetch.mockResolvedValue(
      new Response('backend unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'content-type': 'text/html' },
      })
    );

    const result = await (handler as (input: unknown) => Promise<unknown>)(event);

    expect(h.setResponseStatus).toHaveBeenCalledWith(event, 200);
    expect(h.setResponseHeader).toHaveBeenCalledWith(
      event,
      'content-type',
      'application/json; charset=utf-8'
    );
    expect(result).toEqual({
      data: null,
      errors: [
        {
          message:
            'The backend service is temporarily unavailable. Please try again later.',
          extensions: {
            code: 'SERVICE_UNAVAILABLE',
            upstreamStatusCode: 503,
          },
        },
      ],
    });
  });

  it('returns a GraphQL error payload when the backend cannot be reached', async () => {
    h.fetch.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const result = await (handler as (input: unknown) => Promise<unknown>)(event);

    expect(h.setResponseStatus).toHaveBeenCalledWith(event, 200);
    expect(result).toEqual({
      data: null,
      errors: [
        {
          message:
            'The backend service is temporarily unavailable. Please try again later.',
          extensions: {
            code: 'SERVICE_UNAVAILABLE',
            upstreamStatusCode: undefined,
          },
        },
      ],
    });
  });
});
