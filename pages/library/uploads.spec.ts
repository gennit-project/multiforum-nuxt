import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';

vi.mock('nuxt/app', () => ({ useHead: vi.fn() }));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

const RequireAuthStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots['has-auth']?.());
  },
});

const WarningModalStub = defineComponent({
  name: 'WarningModal',
  props: ['open', 'title', 'error'],
  emits: ['close', 'primary-button-click'],
  template: '<div data-testid="warning-modal" :data-open="open" />',
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;
const mockedUseMutation = useMutation as unknown as ReturnType<typeof vi.fn>;
const deleteMutation = vi.fn();
const refetch = vi.fn();

const mountPage = async () => {
  const Page = (await import('./uploads.vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        RequireAuth: RequireAuthStub,
        WarningModal: WarningModalStub,
        ErrorBanner: { props: ['text'], template: '<div>{{ text }}</div>' },
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  deleteMutation.mockResolvedValue({
    data: {
      permanentlyDeleteDownloadableFile: {
        id: 'file-1',
        permanentlyRemoved: true,
      },
    },
  });
  refetch.mockResolvedValue({});
  mockedUseQuery.mockReturnValue({
    result: ref({
      getUploadedDownloadableFiles: [
        {
          discussion: {
            id: 'discussion-1',
            title: 'Printable model',
            channelUniqueNames: ['models'],
          },
          files: [
            {
              id: 'file-1',
              fileName: 'model.stl',
              kind: 'STL',
              size: 1048576,
            },
          ],
        },
      ],
    }),
    loading: ref(false),
    error: ref(null),
    refetch,
  });
  mockedUseMutation.mockReturnValue({
    mutate: deleteMutation,
    loading: ref(false),
    error: ref(null),
  });
});

describe('uploaded files library page', () => {
  it('renders uploaded files grouped under their discussion', async () => {
    const wrapper = await mountPage();

    expect(wrapper.text()).toContain('Printable model');
  });

  it('opens a confirmation before deleting a file', async () => {
    const wrapper = await mountPage();

    await wrapper.get('button').trigger('click');

    expect(wrapper.getComponent(WarningModalStub).props('open')).toBe(true);
  });

  it('passes the selected file id to the permanent delete mutation', async () => {
    const wrapper = await mountPage();

    await wrapper.get('button').trigger('click');
    await wrapper
      .getComponent(WarningModalStub)
      .vm.$emit('primary-button-click');
    await flushPromises();

    expect(deleteMutation).toHaveBeenCalledWith({
      downloadableFileId: 'file-1',
    });
  });

  it('refetches uploaded files after a successful delete', async () => {
    const wrapper = await mountPage();

    await wrapper.get('button').trigger('click');
    await wrapper
      .getComponent(WarningModalStub)
      .vm.$emit('primary-button-click');
    await flushPromises();

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('does not refetch uploaded files when delete fails', async () => {
    deleteMutation.mockRejectedValueOnce(new Error('Not authorized'));
    const wrapper = await mountPage();

    await wrapper.get('button').trigger('click');
    await wrapper
      .getComponent(WarningModalStub)
      .vm.$emit('primary-button-click');
    await flushPromises();

    expect(refetch).not.toHaveBeenCalled();
  });

  it('shows the backend delete error when delete fails', async () => {
    deleteMutation.mockRejectedValueOnce(new Error('Not authorized'));
    const wrapper = await mountPage();

    await wrapper.get('button').trigger('click');
    await wrapper
      .getComponent(WarningModalStub)
      .vm.$emit('primary-button-click');
    await flushPromises();

    expect(wrapper.getComponent(WarningModalStub).props('error')).toBe(
      'Not authorized'
    );
  });
});
