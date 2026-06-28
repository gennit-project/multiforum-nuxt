import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { useAutoUnsubscribe } from './useAutoUnsubscribe';

// Mock vue-router
const mockRoute = ref({
  query: {} as Record<string, string>,
});

const mockReplace = vi.fn();

vi.mock('nuxt/app', () => ({
  useRoute: () => mockRoute.value,
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// Mock the auth state for authentication
vi.mock('@/composables/useAuthState', () => ({
  useIsAuthenticated: () => ({ value: true }),
}));

// Mock the Pinia toast store — the one <ToastNotification> actually renders.
const mockShowToast = vi.fn();

vi.mock('@/stores/toastStore', () => ({
  useToastStore: () => ({
    showToast: mockShowToast,
    dismissToast: vi.fn(),
    clearAllToasts: vi.fn(),
  }),
}));

describe('useAutoUnsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.value = { query: {} };
  });

  it('does nothing when action param is not present', async () => {
    const unsubscribeFn = vi.fn();
    const entityId = ref<string | null>('test-id');
    const isSubscribed = ref(true);

    useAutoUnsubscribe({
      entityId,
      unsubscribeFn,
      entityType: 'discussion',
      isSubscribed,
    });

    await nextTick();

    expect(unsubscribeFn).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('calls unsubscribeFn when action=unsubscribe and user is subscribed', async () => {
    mockRoute.value = { query: { action: 'unsubscribe' } };

    const unsubscribeFn = vi.fn().mockResolvedValue(undefined);
    const entityId = ref<string | null>('test-id');
    const isSubscribed = ref(true);

    useAutoUnsubscribe({
      entityId,
      unsubscribeFn,
      entityType: 'discussion',
      isSubscribed,
    });

    await nextTick();
    await nextTick(); // Allow async operations to complete

    expect(unsubscribeFn).toHaveBeenCalledWith('test-id');
    expect(mockShowToast).toHaveBeenCalledWith(
      'You have been unsubscribed from this discussion.',
      'success'
    );
  });

  it('shows info message when user is not subscribed', async () => {
    mockRoute.value = { query: { action: 'unsubscribe' } };

    const unsubscribeFn = vi.fn();
    const entityId = ref<string | null>('test-id');
    const isSubscribed = ref(false);

    useAutoUnsubscribe({
      entityId,
      unsubscribeFn,
      entityType: 'event',
      isSubscribed,
    });

    await nextTick();
    await nextTick();

    expect(unsubscribeFn).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith(
      'You are not subscribed to this event.',
      'info'
    );
  });

  it('removes action param from URL after processing', async () => {
    mockRoute.value = { query: { action: 'unsubscribe', other: 'value' } };

    const unsubscribeFn = vi.fn().mockResolvedValue(undefined);
    const entityId = ref<string | null>('test-id');
    const isSubscribed = ref(true);

    useAutoUnsubscribe({
      entityId,
      unsubscribeFn,
      entityType: 'discussion',
      isSubscribed,
    });

    await nextTick();
    await nextTick();

    expect(mockReplace).toHaveBeenCalledWith({ query: { other: 'value' } });
  });

  it('does not process if entityId is null', async () => {
    mockRoute.value = { query: { action: 'unsubscribe' } };

    const unsubscribeFn = vi.fn();
    const entityId = ref<string | null>(null);
    const isSubscribed = ref(true);

    useAutoUnsubscribe({
      entityId,
      unsubscribeFn,
      entityType: 'discussion',
      isSubscribed,
    });

    await nextTick();

    expect(unsubscribeFn).not.toHaveBeenCalled();
  });

  it('only processes once per page load', async () => {
    mockRoute.value = { query: { action: 'unsubscribe' } };

    const unsubscribeFn = vi.fn().mockResolvedValue(undefined);
    const entityId = ref<string | null>('test-id');
    const isSubscribed = ref(true);

    const { hasHandledUnsubscribe } = useAutoUnsubscribe({
      entityId,
      unsubscribeFn,
      entityType: 'discussion',
      isSubscribed,
    });

    await nextTick();
    await nextTick();

    expect(hasHandledUnsubscribe.value).toBe(true);
    expect(unsubscribeFn).toHaveBeenCalledTimes(1);
  });

  it('uses correct entity type in toast message', async () => {
    mockRoute.value = { query: { action: 'unsubscribe' } };

    const unsubscribeFn = vi.fn().mockResolvedValue(undefined);
    const entityId = ref<string | null>('test-id');
    const isSubscribed = ref(true);

    useAutoUnsubscribe({
      entityId,
      unsubscribeFn,
      entityType: 'issue',
      isSubscribed,
    });

    await nextTick();
    await nextTick();

    expect(mockShowToast).toHaveBeenCalledWith(
      'You have been unsubscribed from this issue.',
      'success'
    );
  });
});
