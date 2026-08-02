import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import CreateEditChannelFields from '@/components/channel/form/CreateEditChannelFields.vue';
import { FilterMode } from '@/__generated__/graphql';

const h = vi.hoisted(() => ({
  mutate: vi.fn(),
  doneCallbacks: [] as Array<() => void>,
  errorCallbacks: [] as Array<(error: Error) => void>,
  autosaves: [] as Array<{ save: (value: boolean) => unknown }>,
}));

vi.mock('@/composables/useSettingAutosave', async () => {
  const { ref } = await import('vue');
  return {
    useSettingAutosave: (options: { save: (value: boolean) => unknown }) => {
      h.autosaves.push(options);
      return {
        status: ref('idle'),
        error: ref(null),
        trigger: vi.fn(),
        setInitial: vi.fn(),
      };
    },
  };
});

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: 'cats' },
    query: {},
    name: 'forums-forumId-edit',
    fullPath: '/forums/cats/edit',
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: () => ({
    mutate: h.mutate,
    loading: ref(false),
    error: ref(null),
    onDone: (callback: () => void) => h.doneCallbacks.push(callback),
    onError: (callback: (error: Error) => void) =>
      h.errorCallbacks.push(callback),
  }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

describe('forum settings edit page', () => {
  const channelData = {
    uniqueName: 'cats',
    displayName: 'Cats',
    description: 'Cat forum',
    channelIconURL: '',
    channelBannerURL: '',
    wikiEnabled: true,
    eventsEnabled: true,
    feedbackEnabled: true,
    imageUploadsEnabled: true,
    markdownImagesEnabled: true,
    emojiEnabled: true,
    downloadsEnabled: true,
    allowedFileTypes: ['zip'],
    Tags: [],
    Admins: [{ username: 'alice' }],
    rules: '[]',
    FilterGroups: [
      {
        id: 'group-1',
        key: 'game_packs',
        displayName: 'Game Packs',
        mode: FilterMode.Include,
        order: 0,
        options: [
          {
            id: 'option-1',
            value: 'vampires',
            displayName: 'Vampires',
            order: 0,
          },
          {
            id: 'option-2',
            value: 'dine_out',
            displayName: 'Dine Out',
            order: 1,
          },
        ],
      },
      {
        id: 'group-2',
        key: 'lot_type',
        displayName: 'Lot Type',
        mode: FilterMode.Include,
        order: 1,
        options: [
          {
            id: 'option-3',
            value: 'residential',
            displayName: 'Residential',
            order: 0,
          },
        ],
      },
    ],
  };

  it('renders the channel edit fields', async () => {
    mockedUseQuery.mockReturnValue({
      result: ref({
        channels: [{ uniqueName: 'cats', Tags: [], Admins: [], rules: '[]' }],
      }),
      loading: ref(false),
      error: ref(null),
      onResult: vi.fn(),
    });
    const Page = (await import('./edit.vue')).default;
    const wrapper = shallowMount(Page, {
      global: { mocks: { $route: { fullPath: '/forums/cats/edit' } } },
    });
    expect(wrapper.findComponent(CreateEditChannelFields).exists()).toBe(true);
  });

  it('persists existing filter group edits and deletes removed groups/options', async () => {
    h.mutate.mockClear();
    mockedUseQuery.mockReturnValue({
      result: ref({
        channels: [channelData],
      }),
      loading: ref(false),
      error: ref(null),
      refetch: vi.fn(),
    });
    const Page = (await import('./edit.vue')).default;
    const wrapper = shallowMount(Page, {
      global: { mocks: { $route: { fullPath: '/forums/cats/edit' } } },
    });

    wrapper
      .findComponent(CreateEditChannelFields)
      .vm.$emit('updateFormValues', {
        downloadFilterGroups: [
          {
            ...channelData.FilterGroups[0],
            displayName: 'Required Game Packs',
            mode: FilterMode.Exclude,
            options: [
              {
                id: 'option-1',
                value: 'vampires',
                displayName: 'Vampires Updated',
                order: 0,
              },
              {
                id: 'local-filter-option-1',
                value: 'werewolves',
                displayName: 'Werewolves',
                order: 1,
              },
            ],
          },
        ],
      });
    wrapper.findComponent(CreateEditChannelFields).vm.$emit('submit');

    const update = h.mutate.mock.calls[0][0].update;
    expect(update.FilterGroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          where: { node: { id: 'group-1' } },
          update: expect.objectContaining({
            node: expect.objectContaining({
              displayName: 'Required Game Packs',
              mode: FilterMode.Exclude,
              options: expect.arrayContaining([
                expect.objectContaining({
                  where: { node: { id: 'option-1' } },
                  update: {
                    node: {
                      value: 'vampires',
                      displayName: 'Vampires Updated',
                      order: 0,
                    },
                  },
                }),
                expect.objectContaining({
                  create: [
                    {
                      node: {
                        id: '',
                        value: 'werewolves',
                        displayName: 'Werewolves',
                        order: 1,
                      },
                    },
                  ],
                }),
                expect.objectContaining({
                  delete: [{ where: { node: { id: 'option-2' } } }],
                }),
              ]),
            }),
          }),
        }),
        {
          delete: [
            {
              where: { node: { id: 'group-2' } },
              delete: { options: [{}] },
            },
          ],
        },
      ])
    );
  });

  it('autosaves each toggle as a scoped channel update', async () => {
    h.mutate.mockClear();
    await Promise.all([
      h.autosaves[0].save(false),
      h.autosaves[1].save(false),
      h.autosaves[2].save(false),
      h.autosaves[3].save(false),
      h.autosaves[4].save(false),
    ]);
    expect(h.mutate.mock.calls.map((call) => call[0].update)).toEqual([
      { eventsEnabled: false },
      { imageUploadsEnabled: false },
      { markdownImagesEnabled: false },
      { feedbackEnabled: false },
      { emojiEnabled: false },
    ]);
  });

  it('falls back to empty rules when the channel stores malformed JSON', async () => {
    mockedUseQuery.mockReturnValue({
      result: ref({ channels: [{ ...channelData, rules: '{invalid' }] }),
      loading: ref(false),
      error: ref(null),
      refetch: vi.fn(),
    });
    const Page = (await import('./edit.vue')).default;
    const wrapper = shallowMount(Page, {
      global: { mocks: { $route: { fullPath: '/forums/cats/edit' } } },
    });
    expect(
      wrapper.findComponent(CreateEditChannelFields).props('formValues').rules
    ).toEqual([]);
  });

  it('creates new filter groups and their options', async () => {
    h.mutate.mockClear();
    mockedUseQuery.mockReturnValue({
      result: ref({ channels: [channelData] }),
      loading: ref(false),
      error: ref(null),
      refetch: vi.fn(),
    });
    const Page = (await import('./edit.vue')).default;
    const wrapper = shallowMount(Page, {
      global: { mocks: { $route: { fullPath: '/forums/cats/edit' } } },
    });
    wrapper
      .findComponent(CreateEditChannelFields)
      .vm.$emit('updateFormValues', {
        downloadFilterGroups: [
          {
            id: 'local-group-1',
            key: 'style',
            displayName: 'Style',
            mode: FilterMode.Include,
            order: 0,
            options: [
              {
                id: 'local-option-1',
                value: 'modern',
                displayName: 'Modern',
                order: 0,
              },
            ],
          },
        ],
      });
    wrapper.findComponent(CreateEditChannelFields).vm.$emit('submit');
    expect(h.mutate.mock.calls[0][0].update.FilterGroups).toEqual(
      expect.arrayContaining([
        {
          create: [
            expect.objectContaining({
              node: expect.objectContaining({
                key: 'style',
                options: {
                  create: [
                    expect.objectContaining({ node: expect.any(Object) }),
                  ],
                },
              }),
            }),
          ],
        },
      ])
    );
  });

  it('shows the saved state and refetches after the update completes', async () => {
    const refetch = vi.fn();
    mockedUseQuery.mockReturnValue({
      result: ref({ channels: [channelData] }),
      loading: ref(false),
      error: ref(null),
      refetch,
    });
    const Page = (await import('./edit.vue')).default;
    const wrapper = shallowMount(Page, {
      global: {
        mocks: { $route: { fullPath: '/forums/cats/edit' } },
        stubs: {
          Notification: {
            name: 'Notification',
            props: ['show'],
            template: '<div />',
          },
        },
      },
    });
    h.doneCallbacks.at(-1)?.();
    await wrapper.vm.$nextTick();
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('handles update mutation errors', async () => {
    mockedUseQuery.mockReturnValue({
      result: ref({ channels: [channelData] }),
      loading: ref(false),
      error: ref(null),
      refetch: vi.fn(),
    });
    const Page = (await import('./edit.vue')).default;
    shallowMount(Page, {
      global: { mocks: { $route: { fullPath: '/forums/cats/edit' } } },
    });
    h.errorCallbacks.at(-1)?.(new Error('update failed'));
    expect(h.errorCallbacks).not.toHaveLength(0);
  });
});
