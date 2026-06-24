import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ChannelAboutPage from '@/components/channel/ChannelAboutPage.vue';

const h = vi.hoisted(() => ({
  // useQuery: [0] channel, [1] server config.
  channelResult: null as unknown,
  channelLoading: null as unknown,
  channelError: null as unknown,
  refetch: vi.fn(),
  serverConfigResult: null as unknown,
  index: { n: 0 },
  username: null as unknown,
  permit: true,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () =>
    h.index.n++ === 0
      ? { result: h.channelResult, loading: h.channelLoading, error: h.channelError, refetch: h.refetch }
      : { result: h.serverConfigResult },
}));
vi.mock('nuxt/app', () => ({ useRoute: () => ({ params: { forumId: 'cats' } }) }));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => h.username,
  useModProfileName: () => ref(''),
}));
vi.mock('@/utils/permissionUtils', () => ({ checkPermission: () => h.permit }));

const channel = (overrides: Record<string, unknown> = {}) => ({
  uniqueName: 'cats',
  displayName: 'Cats',
  Admins: [{ username: 'alice' }],
  locked: false,
  ...overrides,
});

const mountPage = () =>
  mount(ChannelAboutPage, {
    global: {
      stubs: {
        ChannelSidebar: { name: 'ChannelSidebar', props: ['channel'], template: '<div class="sidebar" />' },
        RequireAuth: { props: ['owners'], template: '<div><slot name="has-auth" /></div>' },
        ReportChannelModal: { name: 'ReportChannelModal', props: ['open'], template: '<div class="report-modal" />' },
        ReportChannelImageModal: { name: 'ReportChannelImageModal', props: ['open', 'imageType'], template: '<div class="report-image-modal" />' },
        LockChannelDialog: { name: 'LockChannelDialog', props: ['open'], emits: ['locked'], template: '<div class="lock-dialog" />' },
        UnlockChannelDialog: { name: 'UnlockChannelDialog', props: ['open'], emits: ['unlocked'], template: '<div class="unlock-dialog" />' },
        ClientOnly: { template: '<div><slot /></div>' },
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

const buttonByText = (w: ReturnType<typeof mount>, text: string) =>
  w.findAll('button').find((b) => b.text() === text);

beforeEach(() => {
  vi.clearAllMocks();
  h.index.n = 0;
  h.channelResult = ref({ channels: [channel()] });
  h.channelLoading = ref(false);
  h.channelError = ref(null);
  h.serverConfigResult = ref({ serverConfigs: [{ Admins: [], Moderators: [] }] });
  h.username = ref('alice');
  h.permit = true;
});

describe('ChannelAboutPage rendering', () => {
  it('renders the channel sidebar', () => {
    const wrapper = mountPage();

    expect(wrapper.find('.sidebar').exists()).toBe(true);
  });

  it('hides the sidebar while loading', () => {
    h.channelLoading = ref(true);
    const wrapper = mountPage();

    expect(wrapper.find('.sidebar').exists()).toBe(false);
  });

  it('shows the owner Edit link', () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain('Edit');
  });
});

describe('ChannelAboutPage server moderation', () => {
  it('shows the server moderation section with permission', () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain('Server Moderation');
  });

  it('hides the moderation section without permission', () => {
    h.permit = false;
    const wrapper = mountPage();

    expect(wrapper.text()).not.toContain('Server Moderation');
  });

  it('shows the Report Forum button', () => {
    const wrapper = mountPage();

    expect(buttonByText(wrapper, 'Report Forum')).toBeTruthy();
  });

  it('shows the Report Icon button when the channel has an icon', () => {
    h.channelResult = ref({ channels: [channel({ channelIconURL: 'https://x/i.png' })] });
    const wrapper = mountPage();

    expect(buttonByText(wrapper, 'Report Icon')).toBeTruthy();
  });

  it('shows the Lock Forum button for an unlocked channel', () => {
    const wrapper = mountPage();

    expect(buttonByText(wrapper, 'Lock Forum')).toBeTruthy();
  });

  it('shows the Unlock Forum button for a locked channel', () => {
    h.channelResult = ref({ channels: [channel({ locked: true })] });
    const wrapper = mountPage();

    expect(buttonByText(wrapper, 'Unlock Forum')).toBeTruthy();
  });
});

describe('ChannelAboutPage dialogs', () => {
  it('opens the lock dialog', async () => {
    const wrapper = mountPage();

    await buttonByText(wrapper, 'Lock Forum')!.trigger('click');

    expect(wrapper.getComponent({ name: 'LockChannelDialog' }).props('open')).toBe(
      true
    );
  });

  it('refetches the channel after locking', async () => {
    const wrapper = mountPage();
    await buttonByText(wrapper, 'Lock Forum')!.trigger('click');

    await wrapper.getComponent({ name: 'LockChannelDialog' }).vm.$emit('locked');

    expect(h.refetch).toHaveBeenCalled();
  });

  it('opens the report modal', async () => {
    const wrapper = mountPage();

    await buttonByText(wrapper, 'Report Forum')!.trigger('click');

    expect(wrapper.getComponent({ name: 'ReportChannelModal' }).props('open')).toBe(
      true
    );
  });
});
