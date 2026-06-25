import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' } }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (opts: {
  channelDownloadsEnabled?: boolean;
  serverDownloadsEnabled?: boolean;
}) => {
  const channel = { downloadsEnabled: opts.channelDownloadsEnabled ?? true };
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
  it('shows the not-available message when downloads are disabled for the forum', async () => {
    const wrapper = await mountWith({ channelDownloadsEnabled: false });
    expect(wrapper.text()).toContain('Downloads Not Available');
  });

  it('hides the not-available message when downloads are enabled', async () => {
    const wrapper = await mountWith({});
    expect(wrapper.text()).not.toContain('Downloads Not Available');
  });
});
