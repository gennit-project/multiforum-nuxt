import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import CheckBox from '@/components/CheckBox.vue';

const harness = vi.hoisted(() => ({
  queryResult: undefined as undefined | ((result: unknown) => void),
  mutationDone: undefined as undefined | ((result: unknown) => void),
  mutate: vi.fn().mockResolvedValue(undefined),
  toastSuccess: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' } }),
}));

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: harness.toastSuccess }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    loading: ref(false),
    error: ref(null),
    onResult: (callback: (result: unknown) => void) => {
      harness.queryResult = callback;
    },
  }),
  useMutation: () => ({
    mutate: harness.mutate,
    loading: ref(false),
    error: ref(null),
    onDone: (callback: (result: unknown) => void) => {
      harness.mutationDone = callback;
    },
  }),
}));

const configResult = (flairs: unknown[], flairRequired = false) => ({
  data: {
    getChannelDiscussionFlairConfig: { flairRequired, flairs },
  },
});

const mountPage = async (flairs: unknown[] = [], flairRequired = false) => {
  const Page = (await import('./flairs.vue')).default;
  const wrapper = mount(Page, {
    global: {
      stubs: {
        ErrorBanner: {
          props: ['text'],
          template: '<div data-testid="error-banner">{{ text }}</div>',
        },
        LoadingSpinner: { template: '<span />' },
      },
    },
  });
  harness.queryResult?.(configResult(flairs, flairRequired));
  await nextTick();
  return wrapper;
};

const buttonNamed = (wrapper: ReturnType<typeof mount>, name: string) => {
  const button = wrapper.findAll('button').find((item) => item.text() === name);
  if (!button) throw new Error(`Could not find button named ${name}`);
  return button;
};

describe('forum post flair settings', () => {
  it('loads active and archived flairs from the management query', async () => {
    const wrapper = await mountPage([
      {
        id: 'flair-1',
        displayName: 'Question',
        color: '#2563EB',
        order: 0,
        archived: false,
      },
      {
        id: 'flair-2',
        displayName: 'Old category',
        color: null,
        order: 1,
        archived: true,
      },
    ]);

    expect({
      activeRows: wrapper.findAll('[data-testid="active-flair-row"]').length,
      text: wrapper.text(),
    }).toEqual({
      activeRows: 1,
      text: expect.stringContaining('Archived flairs (1)'),
    });
  });

  it('submits the complete authoritative list after archiving a flair', async () => {
    harness.mutate.mockClear();
    const wrapper = await mountPage([
      {
        id: 'flair-1',
        displayName: 'Question',
        color: '#2563EB',
        order: 0,
        archived: false,
      },
      {
        id: 'flair-2',
        displayName: 'Guide',
        color: '#16A34A',
        order: 1,
        archived: false,
      },
    ]);
    await buttonNamed(wrapper, 'Archive').trigger('click');
    await buttonNamed(wrapper, 'Save flair settings').trigger('click');

    expect(harness.mutate).toHaveBeenCalledWith({
      channelUniqueName: 'cats',
      flairRequired: false,
      flairs: [
        {
          id: 'flair-1',
          displayName: 'Question',
          color: '#2563EB',
          order: 1,
          archived: true,
        },
        {
          id: 'flair-2',
          displayName: 'Guide',
          color: '#16A34A',
          order: 0,
          archived: false,
        },
      ],
    });
  });

  it('rejects a required configuration without an active flair', async () => {
    harness.mutate.mockClear();
    const wrapper = await mountPage();
    wrapper.findComponent(CheckBox).vm.$emit('update', true);
    await nextTick();
    await buttonNamed(wrapper, 'Save flair settings').trigger('click');

    expect({
      mutationCalls: harness.mutate.mock.calls.length,
      message: wrapper.get('[data-testid="error-banner"]').text(),
    }).toEqual({
      mutationCalls: 0,
      message: 'Add at least one active flair before requiring flairs.',
    });
  });
});
