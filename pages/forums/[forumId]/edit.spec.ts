import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import CreateEditChannelFields from '@/components/channel/form/CreateEditChannelFields.vue';
import { FilterMode } from '@/__generated__/graphql';

const h = vi.hoisted(() => ({
  mutate: vi.fn(),
}));

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
    onDone: vi.fn(),
    onError: vi.fn(),
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

    wrapper.findComponent(CreateEditChannelFields).vm.$emit('updateFormValues', {
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
});
