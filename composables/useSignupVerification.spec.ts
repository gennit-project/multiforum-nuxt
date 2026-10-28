import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { useSignupVerification } from './useSignupVerification';
const mockFetch = vi.fn();
let state: ReturnType<typeof useSignupVerification>;
const start = async () => {
  mount(
    defineComponent({
      setup() {
        state = useSignupVerification();
        return () => null;
      },
    })
  );
  await flushPromises();
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockImplementation(async (url: string) => ({
    ok: true,
    json: async () =>
      url === '/api/session/token'
        ? { accessToken: 'fresh-token' }
        : { status: 'unverified', canResend: true },
  }));
});
describe('signup verification requests', () => {
  it('checks the current session on mount', async () => {
    await start();
    expect({
      status: state.status.value,
      canResend: state.canResend.value,
    }).toEqual({ status: 'unverified', canResend: true });
  });
  it.each(['verified', 'signed-out', 'unknown'])(
    'handles %s',
    async (status) => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status, canResend: false }),
      });
      await start();
      expect(state.status.value).toBe(status);
    }
  );
  it.each([
    { ok: false },
    { ok: true, json: async () => ({ status: 'unexpected' }) },
  ])(
    'keeps lookup failures distinct from unverified email: %s',
    async (response) => {
      mockFetch.mockResolvedValue(response);
      await start();
      expect(state.status.value).toBe('unknown');
    }
  );
  it('handles a network error', async () => {
    mockFetch.mockRejectedValue(new Error('offline'));
    await start();
    expect(state.status.value).toBe('unknown');
  });
  it('allows retry after an unavailable lookup', async () => {
    mockFetch.mockRejectedValueOnce(new Error('offline'));
    await start();
    await state.check();
    expect(state.status.value).toBe('unverified');
  });
  it('announces a successful resend', async () => {
    await start();
    await state.resend();
    expect(state.message.value).toContain('Verification email sent');
  });
  it.each([
    [429, 'Please wait a minute'],
    [503, 'We could not send'],
  ])('handles resend response %s', async (status, message) => {
    await start();
    mockFetch.mockResolvedValue({ ok: false, status });
    await state.resend();
    expect(state.message.value).toContain(message);
  });
  it('handles a network error while resending', async () => {
    await start();
    mockFetch.mockRejectedValue(new Error('offline'));
    await state.resend();
    expect({
      sending: state.sending.value,
      message: state.message.value,
    }).toEqual({
      sending: false,
      message:
        'We could not send the email. Try again in a minute, or sign in again.',
    });
  });
  it('prevents duplicate sends while a request is in flight', async () => {
    await start();
    let resolve!: (value: unknown) => void;
    mockFetch.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    const first = state.resend();
    await state.resend();
    resolve({ ok: true });
    await first;
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

it('replaces the stale Apollo token before allowing signup', async () => {
  localStorage.setItem('token', 'previous-login-token');
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ status: 'verified', canResend: false }),
  });
  await start();
  expect({
    status: state.status.value,
    token: localStorage.getItem('token'),
  }).toEqual({ status: 'verified', token: 'fresh-token' });
});

it.each([
  { ok: false },
  { ok: true, json: async () => ({ accessToken: null }) },
])(
  'keeps signup blocked when the current API token is unavailable: %s',
  async (response) => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'verified', canResend: false }),
      })
      .mockResolvedValueOnce(response);
    await start();
    expect(state.status.value).toBe('unknown');
  }
);
