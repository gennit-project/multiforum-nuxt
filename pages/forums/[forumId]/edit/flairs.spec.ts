import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import CheckBox from '@/components/CheckBox.vue';

const harness = vi.hoisted(() => ({
  queryResult: undefined as undefined | ((result: unknown) => void),
  mutationDone: undefined as undefined | ((result: unknown) => void),
  mutate: vi.fn().mockResolvedValue(undefined),
  toastSuccess: vi.fn(),
  queryVariables: undefined as undefined | Record<string, unknown>,
  queryEnabled: undefined as undefined | boolean,
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' } }),
}));

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: harness.toastSuccess }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: (
    _operation: unknown,
    variables: () => Record<string, unknown>,
    options: { enabled: { value: boolean } }
  ) => {
    harness.queryVariables = variables();
    harness.queryEnabled = options.enabled.value;
    return {
      loading: ref(false),
      error: ref(null),
      onResult: (callback: (result: unknown) => void) => {
        harness.queryResult = callback;
      },
    };
  },
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
  it('queries the current forum including archived flairs', async () => {
    await mountPage();
    expect([harness.queryVariables, harness.queryEnabled]).toEqual([
      { channelUniqueName: 'cats', includeArchived: true },
      true,
    ]);
  });

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

  it.each([
    ['', 'Each active flair needs a name.'],
    ['x'.repeat(41), 'Flair names must be 40 characters or fewer.'],
  ])('rejects the invalid flair name %j', async (name, message) => {
    const wrapper = await mountPage([
      {
        id: 'flair-1',
        displayName: name,
        color: '#2563EB',
        order: 0,
        archived: false,
      },
    ]);
    await buttonNamed(wrapper, 'Save flair settings').trigger('click');
    expect(wrapper.get('[data-testid="error-banner"]').text()).toBe(message);
  });

  it('rejects malformed flair colors', async () => {
    const wrapper = await mountPage([
      {
        id: 'flair-1',
        displayName: 'Question',
        color: 'blue',
        order: 0,
        archived: false,
      },
    ]);
    await buttonNamed(wrapper, 'Save flair settings').trigger('click');
    expect(wrapper.get('[data-testid="error-banner"]').text()).toBe(
      'Flair colors must use six-digit hex values such as #F97316.'
    );
  });

  it('rejects duplicate active flair names case-insensitively', async () => {
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
        displayName: ' question ',
        color: '#16A34A',
        order: 1,
        archived: false,
      },
    ]);
    await buttonNamed(wrapper, 'Save flair settings').trigger('click');
    expect(wrapper.get('[data-testid="error-banner"]').text()).toBe(
      'Active flair names must be unique.'
    );
  });

  it('adds and removes an unsaved flair', async () => {
    const wrapper = await mountPage();
    await buttonNamed(wrapper, 'Add flair').trigger('click');
    await buttonNamed(wrapper, 'Archive').trigger('click');
    expect(wrapper.findAll('[data-testid="active-flair-row"]')).toHaveLength(0);
  });

  it('moves active flairs and restores archived flairs', async () => {
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
      {
        id: 'flair-3',
        displayName: 'Old',
        color: null,
        order: 2,
        archived: true,
      },
    ]);
    await wrapper
      .get('button[aria-label="Move Question down"]')
      .trigger('click');
    await buttonNamed(wrapper, 'Restore').trigger('click');
    expect(
      wrapper
        .findAll('[data-testid="active-flair-row"] input[type="text"]')
        .filter((input) =>
          input.attributes('aria-label')?.startsWith('Flair name')
        )
        .map((input) => input.element.value)
    ).toEqual(['Guide', 'Question', 'Old']);
  });

  it('applies the saved response and announces success', async () => {
    const wrapper = await mountPage();
    harness.mutationDone?.(
      configResult([
        {
          id: 'flair-1',
          displayName: 'Saved',
          color: '#2563EB',
          order: 0,
          archived: false,
        },
      ])
    );
    await nextTick();
    expect([
      wrapper.get('input[aria-label="Flair name 1"]').element.value,
      harness.toastSuccess.mock.calls,
    ]).toEqual(['Saved', [['Post flair settings saved']]]);
  });

  it('handles a rejected save through the Apollo mutation error state', async () => {
    harness.mutate.mockRejectedValueOnce(new Error('network'));
    const wrapper = await mountPage([
      {
        id: 'flair-1',
        displayName: 'Question',
        color: '',
        order: 0,
        archived: false,
      },
    ]);
    await buttonNamed(wrapper, 'Save flair settings').trigger('click');
    expect(harness.mutate).toHaveBeenCalledOnce();
  });
});
