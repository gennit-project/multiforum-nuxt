import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import IssueRelatedChannel from '@/components/mod/IssueRelatedChannel.vue';

const h = vi.hoisted(() => ({
  // useQuery: [0] channel, [1] server config.
  channelResult: null as unknown,
  channelLoading: null as unknown,
  refetch: vi.fn(),
  serverConfigResult: null as unknown,
  index: { n: 0 },
  username: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () =>
    h.index.n++ === 0
      ? { result: h.channelResult, loading: h.channelLoading, refetch: h.refetch }
      : { result: h.serverConfigResult },
}));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => h.username,
  useModProfileName: () => ref(''),
}));

const channel = (overrides: Record<string, unknown> = {}) => ({
  locked: false,
  displayName: 'Cats',
  ...overrides,
});

const dialogStub = (name: string) => ({
  name,
  props: ['open', 'channelUniqueName', 'channelDisplayName'],
  emits: ['close', 'locked', 'unlocked'],
  template: '<div />',
});

const mountChannel = (props: Record<string, unknown> = {}) =>
  mount(IssueRelatedChannel, {
    props: { relatedChannelUniqueName: 'cats', ...props },
    global: {
      stubs: {
        LockChannelDialog: dialogStub('LockChannelDialog'),
        UnlockChannelDialog: dialogStub('UnlockChannelDialog'),
        LockClosedIcon: true,
        LockOpenIcon: true,
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
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
  h.serverConfigResult = ref({ serverConfigs: [{ Admins: [{ username: 'alice' }] }] });
  h.username = ref('alice');
});

describe('IssueRelatedChannel rendering', () => {
  it('renders nothing without a channel name', () => {
    const wrapper = mountChannel({ relatedChannelUniqueName: '' });

    expect(wrapper.text()).toBe('');
  });

  it('shows the related channel name', () => {
    const wrapper = mountChannel();

    expect(wrapper.text()).toContain('cats');
  });

  it('shows a loading state', () => {
    h.channelLoading = ref(true);
    const wrapper = mountChannel();

    expect(wrapper.text()).toContain('Loading');
  });

  it('shows an Active badge for an unlocked channel', () => {
    const wrapper = mountChannel();

    expect(wrapper.text()).toContain('Active');
  });

  it('shows a Locked badge and lock details for a locked channel', () => {
    h.channelResult = ref({
      channels: [channel({ locked: true, LockedBy: { displayName: 'mod1' }, lockReason: 'spam' })],
    });
    const wrapper = mountChannel();

    expect(wrapper.text()).toContain('Locked by: mod1');
  });
});

describe('IssueRelatedChannel permissions', () => {
  it('shows the Lock button to a server admin', () => {
    const wrapper = mountChannel();

    expect(buttonByText(wrapper, 'Lock Channel')).toBeTruthy();
  });

  it('hides the Lock button from non-admins', () => {
    h.username = ref('bob');
    h.serverConfigResult = ref({
      serverConfigs: [{ Admins: [{ username: 'alice' }], Moderators: [] }],
    });
    const wrapper = mountChannel();

    expect(buttonByText(wrapper, 'Lock Channel')).toBeUndefined();
  });

  it('shows the Unlock button for a locked channel', () => {
    h.channelResult = ref({ channels: [channel({ locked: true })] });
    const wrapper = mountChannel();

    expect(buttonByText(wrapper, 'Unlock Channel')).toBeTruthy();
  });
});

describe('IssueRelatedChannel dialogs', () => {
  it('opens the lock dialog', async () => {
    const wrapper = mountChannel();

    await buttonByText(wrapper, 'Lock Channel')!.trigger('click');

    expect(wrapper.getComponent({ name: 'LockChannelDialog' }).props('open')).toBe(
      true
    );
  });

  it('refetches the channel after locking', async () => {
    const wrapper = mountChannel();
    await buttonByText(wrapper, 'Lock Channel')!.trigger('click');

    await wrapper.getComponent({ name: 'LockChannelDialog' }).vm.$emit('locked');

    expect(h.refetch).toHaveBeenCalled();
  });

  it('refetches the channel after unlocking', async () => {
    h.channelResult = ref({ channels: [channel({ locked: true })] });
    const wrapper = mountChannel();
    await buttonByText(wrapper, 'Unlock Channel')!.trigger('click');

    await wrapper.getComponent({ name: 'UnlockChannelDialog' }).vm.$emit('unlocked');

    expect(h.refetch).toHaveBeenCalled();
  });
});
