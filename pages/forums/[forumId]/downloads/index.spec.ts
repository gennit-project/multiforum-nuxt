import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

const h = vi.hoisted(() => ({
  route: {
    params: { forumId: 'cats' },
    query: {} as Record<string, unknown>,
  },
  router: {
    replace: vi.fn(),
  },
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useRouter: () => h.router,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const DownloadListStub = defineComponent({
  name: 'DownloadList',
  template: '<div class="download-list-stub" />',
});

const DownloadFilterBarStub = defineComponent({
  name: 'DownloadFilterBar',
  template: '<div class="download-filter-bar-stub" />',
});

const DownloadFiltersStub = defineComponent({
  name: 'DownloadFilters',
  template: '<div class="download-filters-stub" />',
});

vi.mock('@/components/channel/DownloadList.vue', () => ({
  default: DownloadListStub,
}));

vi.mock('@/components/download/DownloadFilterBar.vue', () => ({
  default: DownloadFilterBarStub,
}));

vi.mock('@/components/download/DownloadFilters.vue', () => ({
  default: DownloadFiltersStub,
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (opts: {
  channelDownloadsEnabled?: boolean;
  serverDownloadsEnabled?: boolean;
  channelError?: Error | null;
  serverError?: Error | null;
  filterGroups?: Array<{ key: string }>;
}) => {
  const channel = {
    downloadsEnabled: opts.channelDownloadsEnabled ?? true,
    FilterGroups: opts.filterGroups ?? [{ key: 'type' }],
  };
  const serverConfig = { enableDownloads: opts.serverDownloadsEnabled ?? true };
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({ channels: [channel] }),
      loading: ref(false),
      error: ref(opts.channelError ?? null),
    })
    .mockReturnValueOnce({
      result: ref({ serverConfigs: [serverConfig] }),
      loading: ref(false),
      error: ref(opts.serverError ?? null),
    });
  const Page = (await import('./index.vue')).default;
  return shallowMount(Page);
};

describe('downloads index page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.route.query = {};
  });

  it('shows the not-available message when downloads are disabled for the forum', async () => {
    const wrapper = await mountWith({ channelDownloadsEnabled: false });
    expect(wrapper.text()).toContain('Downloads Not Available');
  });

  it('shows the server-disabled explanation when downloads are disabled server-wide', async () => {
    const wrapper = await mountWith({ serverDownloadsEnabled: false });
    expect(wrapper.text()).toContain(
      'Contact the server administrators to enable downloads server-wide.'
    );
  });

  it('hides the not-available message when downloads are enabled', async () => {
    const wrapper = await mountWith({});
    expect(wrapper.text()).not.toContain('Downloads Not Available');
  });

  it('removes stale download filter params after channel filters load', async () => {
    h.route.query = { filter_old: 'x', filter_type: 'pdf' };
    await mountWith({});
    expect(h.router.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.not.objectContaining({ filter_old: expect.anything() }),
      })
    );
  });

  it('does not rewrite the route when every filter query key is still allowed', async () => {
    h.route.query = { filter_type: 'pdf' };
    await mountWith({});
    expect(h.router.replace).not.toHaveBeenCalled();
  });

  it('shows the shared configuration error message when a backing query fails', async () => {
    const wrapper = await mountWith({ serverError: new Error('boom') });
    expect(wrapper.text()).toContain(
      'Unable to load forum or server configuration.'
    );
  });
});
