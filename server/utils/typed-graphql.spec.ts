import { beforeEach, describe, expect, it, vi } from 'vitest';
import { print } from 'graphql';
import { GetOwnEmailNotificationCountDocument } from '@/__generated__/operations';
import { requestGraphql } from './typed-graphql';

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('$fetch', fetchMock);
});

describe('typed server GraphQL transport', () => {
  it('sends the generated operation and selected variables with caller authorization', async () => {
    fetchMock.mockResolvedValue({ data: { getOwnEmail: null } });
    await requestGraphql(
      'https://backend.test/graphql',
      GetOwnEmailNotificationCountDocument,
      {},
      { headers: { authorization: 'Bearer test' } }
    );
    expect(fetchMock).toHaveBeenCalledWith('https://backend.test/graphql', {
      method: 'POST',
      headers: { authorization: 'Bearer test' },
      body: {
        query: print(GetOwnEmailNotificationCountDocument),
        variables: {},
      },
    });
  });
  it('preserves GraphQL null data and errors for caller fallback handling', async () => {
    const response = { data: null, errors: [{ message: 'Unavailable' }] };
    fetchMock.mockResolvedValue(response);
    expect(
      await requestGraphql(
        'https://backend.test/graphql',
        GetOwnEmailNotificationCountDocument,
        {}
      )
    ).toEqual(response);
  });
  it('propagates transport failure to existing session fallback handling', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    await expect(
      requestGraphql(
        'https://backend.test/graphql',
        GetOwnEmailNotificationCountDocument,
        {}
      )
    ).rejects.toThrow('offline');
  });
});
