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
  channelEventsEnabled?: boolean;
  serverEventsEnabled?: boolean;
}) => {
  const channel = { eventsEnabled: opts.channelEventsEnabled ?? true };
  const serverConfig = { enableEvents: opts.serverEventsEnabled ?? true };
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

describe('events index page', () => {
  it('shows the not-available message when events are disabled server-wide', async () => {
    const wrapper = await mountWith({ serverEventsEnabled: false });
    expect(wrapper.text()).toContain('Calendar Not Available');
  });

  it('hides the not-available message when events are enabled', async () => {
    const wrapper = await mountWith({});
    expect(wrapper.text()).not.toContain('Calendar Not Available');
  });
});
