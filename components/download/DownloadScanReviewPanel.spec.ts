import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';
import DownloadScanReviewPanel from './DownloadScanReviewPanel.vue';

const mockClear = vi.hoisted(() => vi.fn());
const mockRetry = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockViewer = vi.hoisted(() => ({
  authenticated: true,
  username: 'admin-user',
  admins: ['admin-user'],
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn((document) => {
    const doneHandlers: Array<() => void> = [];
    const target =
      document.definitions?.[0]?.name?.value === 'retryDownloadableFileScan'
        ? mockRetry
        : mockClear;
    return {
      // Mirror Apollo: the mutation resolves, then onDone handlers run.
      mutate: vi.fn((variables) => {
        target(variables);
        doneHandlers.forEach((handler) => handler());
        return Promise.resolve();
      }),
      loading: ref(false),
      error: ref(null),
      onDone: (handler: () => void) => {
        doneHandlers.push(handler);
      },
    };
  }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useIsAuthenticated: () => ref(mockViewer.authenticated),
  useUsername: () => ref(mockViewer.username),
}));

vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({
    serverAdminUsernames: ref(mockViewer.admins),
  }),
}));

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: mockToastSuccess }),
}));

const mountPanel = () =>
  mount(DownloadScanReviewPanel, { props: { downloadableFileId: 'file-1' } });

beforeEach(() => {
  vi.clearAllMocks();
  mockViewer.authenticated = true;
  mockViewer.username = 'admin-user';
  mockViewer.admins = ['admin-user'];
});

describe('DownloadScanReviewPanel', () => {
  it('is hidden from viewers who are not server admins', () => {
    mockViewer.username = 'someone-else';

    expect(
      mountPanel().find('[data-testid="download-scan-admin-review"]').exists()
    ).toBe(false);
  });

  it('is hidden from signed-out viewers', () => {
    mockViewer.authenticated = false;

    expect(
      mountPanel().find('[data-testid="download-scan-admin-review"]').exists()
    ).toBe(false);
  });

  it('keeps quarantine release disabled until an audit reason is entered', () => {
    expect(
      mountPanel().get('[data-testid="release-quarantine"]').attributes('disabled')
    ).toBe('');
  });

  it('labels the reason input for assistive technology', () => {
    const wrapper = mountPanel();
    const inputId = wrapper.get('input').attributes('id');

    expect(wrapper.get(`label[for="${inputId}"]`).text()).toBe(
      'Required release reason'
    );
  });

  it('releases the file with a trimmed reason', async () => {
    const wrapper = mountPanel();
    await wrapper.get('input').setValue('  Reviewed archive contents ');
    await wrapper.get('[data-testid="release-quarantine"]').trigger('click');
    await flushPromises();

    expect(mockClear).toHaveBeenCalledWith({
      downloadableFileId: 'file-1',
      reason: 'Reviewed archive contents',
    });
  });

  it('confirms the release with a toast and clears the reason', async () => {
    const wrapper = mountPanel();
    await wrapper.get('input').setValue('Reviewed archive contents');
    await wrapper.get('[data-testid="release-quarantine"]').trigger('click');
    await flushPromises();

    expect({
      toast: mockToastSuccess.mock.calls[0]?.[0],
      reason: (wrapper.get('input').element as HTMLInputElement).value,
    }).toEqual({
      toast: 'Quarantine released. The file is available to download.',
      reason: '',
    });
  });

  it('does not release without a reason', async () => {
    const wrapper = mountPanel();
    await wrapper.get('input').setValue('   ');
    await wrapper.get('[data-testid="release-quarantine"]').trigger('click');

    expect(mockClear).not.toHaveBeenCalled();
  });

  it('retries the scan for the file', async () => {
    const wrapper = mountPanel();
    await wrapper.get('[data-testid="retry-scan"]').trigger('click');
    await flushPromises();

    expect(mockRetry).toHaveBeenCalledWith({ downloadableFileId: 'file-1' });
  });

  it('tells the admin the retry was started', async () => {
    const wrapper = mountPanel();
    await wrapper.get('[data-testid="retry-scan"]').trigger('click');
    await flushPromises();

    expect(mockToastSuccess).toHaveBeenCalledWith(
      'Scan restarted. Check back for the result.'
    );
  });
});
