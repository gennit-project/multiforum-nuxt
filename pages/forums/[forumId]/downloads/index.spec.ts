import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
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

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (opts: {
  channelDownloadsEnabled?: boolean;
  serverDownloadsEnabled?: boolean;
}) => {
  const channel = {
    downloadsEnabled: opts.channelDownloadsEnabled ?? true,
    FilterGroups: [{ key: 'type' }],
  };
  const serverConfig = { enableDownloads: opts.serverDownloadsEnabled ?? true };
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({ channels: [channel] }),
      loading: ref(false),
      error: ref(null),
    })
    .mockReturnValueOnce({
      result: ref({ serverConfigs: [serverConfig] }),
      loading: ref(false),
      error: ref(null),
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
});
