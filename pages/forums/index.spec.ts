import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import ChannelList from '@/components/channel/ChannelList.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));

const SlotStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (opts: {
  channels: unknown[];
  total?: number;
  downloads?: unknown[];
}) => {
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({
        getSortedChannels: {
          channels: opts.channels,
          aggregateChannelCount: opts.total ?? opts.channels.length,
        },
      }),
      loading: ref(false),
      error: ref(null),
      fetchMore: vi.fn(),
    })
    .mockReturnValueOnce({
      result: ref({ getSortedChannels: { channels: opts.downloads ?? [] } }),
      fetchMore: vi.fn(),
    });
  const Page = (await import('./index.vue')).default;
  return shallowMount(Page, {
    global: { stubs: { NuxtLayout: SlotStub, ClientOnly: SlotStub, RequireAuth: true } },
  });
};

describe('forums index page', () => {
  it('renders the channel list with the result count', async () => {
    const wrapper = await mountWith({
      channels: [{ uniqueName: 'cats', DiscussionChannelsAggregate: { count: 0 } }],
      total: 1,
    });
    expect(wrapper.findComponent(ChannelList).props('resultCount')).toBe(1);
  });

  it('merges download counts onto the channels', async () => {
    const wrapper = await mountWith({
      channels: [{ uniqueName: 'cats', DiscussionChannelsAggregate: { count: 0 } }],
      downloads: [{ uniqueName: 'cats', DiscussionChannelsAggregate: { count: 2 } }],
    });
    const channels = wrapper.findComponent(ChannelList).props('channels') as Array<{
      downloadCount: number;
    }>;
    expect(channels[0].downloadCount).toBe(2);
  });
});
