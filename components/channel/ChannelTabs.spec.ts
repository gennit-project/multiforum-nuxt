import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, reactive, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import type { Channel } from '@/__generated__/graphql';

import ChannelTabs from '@/components/channel/ChannelTabs.vue';

const h = vi.hoisted(() => ({
  username: null as unknown,
  modName: null as unknown,
  isAuth: null as unknown,
  serverConfig: null as unknown,
  mdAndUp: null as unknown,
  route: null as unknown,
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => h.username,
  useModProfileName: () => h.modName,
  useIsAuthenticated: () => h.isAuth,
}));
vi.mock('vuetify', () => ({ useDisplay: () => ({ mdAndUp: h.mdAndUp }) }));
vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.serverConfig }),
}));
vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useRouter: () => ({ push: vi.fn() }),
}));

const makeChannel = (overrides: Partial<Channel> = {}) =>
  ({
    downloadsEnabled: false,
    eventsEnabled: false,
    wikiEnabled: false,
    Admins: [],
    Moderators: [],
    ...overrides,
  }) as unknown as Channel;

const mountTabs = (props: Record<string, unknown> = {}) =>
  mount(ChannelTabs, {
    props: { channel: makeChannel(), ...props },
    global: {
      stubs: {
        ClientOnly: { template: '<div><slot /></div>' },
        Popper: { template: '<div><slot /><slot name="content" /></div>' },
        TabButton: {
          name: 'TabButton',
          props: ['label', 'isActive', 'count', 'to', 'showCount', 'vertical'],
          template: '<div><slot /></div>',
        },
      },
    },
  });

const labels = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAllComponents({ name: 'TabButton' }).map((c) => c.props('label'));

const tabByLabel = (wrapper: ReturnType<typeof mount>, label: string) =>
  wrapper
    .findAllComponents({ name: 'TabButton' })
    .find((c) => c.props('label') === label);

beforeEach(() => {
  h.username = ref('');
  h.modName = ref('');
  h.isAuth = ref(false);
  h.serverConfig = ref({
    serverConfigs: [{ enableDownloads: true, enableEvents: true }],
  });
  h.mdAndUp = ref(true);
  h.route = reactive({
    params: { forumId: 'cats' },
    path: '/forums/cats/discussions',
  });
});

describe('ChannelTabs base tabs', () => {
  it('always shows Discussions, Contributors and About', () => {
    const wrapper = mountTabs();

    expect(labels(wrapper)).toEqual(['Discussions', 'Contributors', 'About']);
  });

  it('adds Downloads when the channel and server both enable downloads', () => {
    const wrapper = mountTabs({
      channel: makeChannel({ downloadsEnabled: true }),
    });

    expect(labels(wrapper)).toContain('Downloads');
  });

  it('hides Downloads when the server disables downloads', () => {
    (h.serverConfig as { value: unknown }).value = {
      serverConfigs: [{ enableDownloads: false, enableEvents: true }],
    };
    const wrapper = mountTabs({
      channel: makeChannel({ downloadsEnabled: true }),
    });

    expect(labels(wrapper)).not.toContain('Downloads');
  });

  it('adds the Calendar tab when events are enabled', () => {
    const wrapper = mountTabs({ channel: makeChannel({ eventsEnabled: true }) });

    expect(labels(wrapper)).toContain('Calendar');
  });

  it('adds the Wiki tab when the wiki is enabled', () => {
    const wrapper = mountTabs({ channel: makeChannel({ wikiEnabled: true }) });

    expect(labels(wrapper)).toContain('Wiki');
  });
});

describe('ChannelTabs auth-dependent tabs', () => {
  it('shows Settings and Issues for an admin', () => {
    (h.isAuth as { value: boolean }).value = true;
    (h.username as { value: string }).value = 'alice';
    const wrapper = mountTabs({
      channel: makeChannel({ Admins: [{ username: 'alice' }] as never }),
    });

    expect(labels(wrapper)).toEqual(expect.arrayContaining(['Settings', 'Issues']));
  });

  it('shows Issues but not Settings for a moderator', () => {
    (h.isAuth as { value: boolean }).value = true;
    (h.modName as { value: string }).value = 'modAlice';
    const wrapper = mountTabs({
      channel: makeChannel({
        Moderators: [{ displayName: 'modAlice' }] as never,
      }),
    });

    expect(labels(wrapper)).toContain('Issues');
  });

  it('does not show moderation tabs for a regular authenticated user', () => {
    (h.isAuth as { value: boolean }).value = true;
    (h.username as { value: string }).value = 'bob';
    const wrapper = mountTabs();

    expect(labels(wrapper)).not.toContain('Issues');
  });

  it('does not show moderation tabs when unauthenticated', () => {
    const wrapper = mountTabs({
      channel: makeChannel({ Admins: [{ username: 'alice' }] as never }),
    });

    expect(labels(wrapper)).not.toContain('Settings');
  });
});

describe('ChannelTabs routing and active state', () => {
  it('builds tab routes scoped to the current forum', () => {
    const wrapper = mountTabs();

    expect(tabByLabel(wrapper, 'Discussions')?.props('to')).toBe(
      '/forums/cats/discussions'
    );
  });

  it('marks the tab matching the current path as active', () => {
    (h.route as { path: string }).path = '/forums/cats/about';
    const wrapper = mountTabs();

    expect(tabByLabel(wrapper, 'About')?.props('isActive')).toBe(true);
  });

  it('does not mark the wiki tab active on the wiki-settings page', () => {
    (h.route as { path: string }).path = '/forums/cats/edit/wiki-settings';
    const wrapper = mountTabs({ channel: makeChannel({ wikiEnabled: true }) });

    expect(tabByLabel(wrapper, 'Wiki')?.props('isActive')).toBe(false);
  });

  it('rebuilds routes when the forumId route param changes', async () => {
    const wrapper = mountTabs();

    (h.route as { params: unknown }).params = { forumId: 'dogs' };
    await nextTick();

    expect(tabByLabel(wrapper, 'Discussions')?.props('to')).toBe(
      '/forums/dogs/discussions'
    );
  });
});

describe('ChannelTabs mobile layout', () => {
  it('renders the active tab label in the mobile dropdown', () => {
    (h.mdAndUp as { value: boolean }).value = false;
    const wrapper = mountTabs();

    expect(wrapper.text()).toContain('Discussions');
  });
});
