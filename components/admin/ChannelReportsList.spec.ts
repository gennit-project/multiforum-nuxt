import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ChannelReportsList from '@/components/admin/ChannelReportsList.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  loading: null as unknown,
  error: null as unknown,
  refetch: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: h.result,
    loading: h.loading,
    error: h.error,
    refetch: h.refetch,
  }),
}));

const report = (overrides: Record<string, unknown> = {}) => ({
  id: 'r1',
  issueNumber: 1,
  relatedChannelUniqueName: 'cats',
  isOpen: true,
  locked: false,
  title: 'Spam everywhere',
  Author: { __typename: 'User', username: 'alice' },
  createdAt: '2024-01-01T00:00:00Z',
  ActivityFeedAggregate: { count: 2 },
  ...overrides,
});

const dialogStub = (name: string) => ({
  name,
  props: ['channelUniqueName', 'open'],
  emits: ['close', 'locked', 'unlocked'],
  template: '<div />',
});

const mountList = () =>
  mount(ChannelReportsList, {
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        LockChannelDialog: dialogStub('LockChannelDialog'),
        UnlockChannelDialog: dialogStub('UnlockChannelDialog'),
      },
    },
  });

const buttonByText = (w: ReturnType<typeof mount>, text: string) =>
  w.findAll('button').find((b) => b.text() === text);

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref({ issues: [report()] });
  h.loading = ref(false);
  h.error = ref(null);
});

describe('ChannelReportsList states', () => {
  it('shows a loading message', () => {
    h.loading = ref(true);
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Loading');
  });

  it('shows an error message', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountList();

    expect(wrapper.text()).toContain('boom');
  });

  it('shows an empty message when there are no reports', () => {
    h.result = ref({ issues: [] });
    const wrapper = mountList();

    expect(wrapper.text()).toContain('No channel reports found');
  });

  it('shows the report count', () => {
    h.result = ref({ issues: [report(), report({ id: 'r2', issueNumber: 2 })] });
    const wrapper = mountList();

    expect(wrapper.text()).toContain('2 report(s)');
  });
});

describe('ChannelReportsList report card', () => {
  it('shows the report title and channel', () => {
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Spam everywhere');
  });

  it('shows an Open badge for open reports', () => {
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Open');
  });

  it('shows a Closed badge for closed reports', () => {
    h.result = ref({ issues: [report({ isOpen: false })] });
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Closed');
  });

  it('shows a Locked badge for locked channels', () => {
    h.result = ref({ issues: [report({ locked: true })] });
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Locked');
  });

  it('shows a moderation-profile reporter with an @ handle', () => {
    h.result = ref({
      issues: [
        report({ Author: { __typename: 'ModerationProfile', displayName: 'mod1' } }),
      ],
    });
    const wrapper = mountList();

    expect(wrapper.text()).toContain('@mod1');
  });
});

describe('ChannelReportsList lock/unlock', () => {
  it('opens the lock dialog from the Lock button', async () => {
    const wrapper = mountList();

    await buttonByText(wrapper, 'Lock')!.trigger('click');

    expect(wrapper.getComponent({ name: 'LockChannelDialog' }).props('open')).toBe(
      true
    );
  });

  it('opens the unlock dialog for a locked channel', async () => {
    h.result = ref({ issues: [report({ locked: true })] });
    const wrapper = mountList();

    await buttonByText(wrapper, 'Unlock')!.trigger('click');

    expect(
      wrapper.getComponent({ name: 'UnlockChannelDialog' }).props('open')
    ).toBe(true);
  });

  it('refetches after a channel is locked', async () => {
    const wrapper = mountList();
    await buttonByText(wrapper, 'Lock')!.trigger('click');

    await wrapper.getComponent({ name: 'LockChannelDialog' }).vm.$emit('locked');

    expect(h.refetch).toHaveBeenCalled();
  });

  it('refetches after a channel is unlocked', async () => {
    h.result = ref({ issues: [report({ locked: true })] });
    const wrapper = mountList();
    await buttonByText(wrapper, 'Unlock')!.trigger('click');

    await wrapper.getComponent({ name: 'UnlockChannelDialog' }).vm.$emit('unlocked');

    expect(h.refetch).toHaveBeenCalled();
  });
});
