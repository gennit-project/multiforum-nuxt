import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IncomingMessage } from 'http';
import {
  createEvent,
  defineEventHandler,
  getRequestHeader,
  setResponseHeader,
  getResponseHeader,
} from 'h3';

vi.stubGlobal('defineEventHandler', defineEventHandler);
vi.stubGlobal('getRequestHeader', getRequestHeader);
vi.stubGlobal('setResponseHeader', setResponseHeader);

const { default: handler } = await import('@/server/middleware/1.cache-control');

const createTestRes = () => {
  const headers: Record<string, string> = {};
  return {
    headers,
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    getHeader(name: string) {
      return headers[name];
    },
  };
};

const callHandler = async (
  method: string,
  path: string,
  headers: Record<string, string> = {}
) => {
  const res = createTestRes();
  const req = { method, url: path, headers } as IncomingMessage;
  const event = createEvent(req, res as any);
  event._path = path;
  await handler(event);
  return event;
};

describe('cache-control middleware', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('does not set cache headers for non-GET requests', async () => {
    const event = await callHandler('POST', '/api/test');

    expect(getResponseHeader(event, 'Cache-Control')).toBeUndefined();
  });

  it('does not set cache headers when Authorization is present', async () => {
    const event = await callHandler('GET', '/api/test', { authorization: 'Bearer token' });

    expect(getResponseHeader(event, 'Cache-Control')).toBeUndefined();
  });

  it('sets cache headers for configured routes', async () => {
    const event = await callHandler('GET', '/api/tags', {});

    expect(getResponseHeader(event, 'Cache-Control')).toBe(
      'public, max-age=7200, s-maxage=7200, stale-while-revalidate=43200'
    );
  });

  it('sets cache headers for default api routes', async () => {
    const event = await callHandler('GET', '/api/other', {});

    expect(getResponseHeader(event, 'Cache-Control')).toBe(
      'public, max-age=300, s-maxage=300, stale-while-revalidate=3600'
    );
  });

  it('does not set cache headers for non-api routes', async () => {
    const event = await callHandler('GET', '/non-api');

    expect(getResponseHeader(event, 'Cache-Control')).toBeUndefined();
  });
});
