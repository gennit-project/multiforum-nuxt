import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import SuspendUserButton from '@/components/mod/SuspendUserButton.vue';
import type { Issue } from '@/__generated__/graphql';

const h = vi.hoisted(() => ({ result: null as unknown }));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.result, loading: ref(false), error: ref(null) }),
}));

const issue = {
  id: 'issue-1',
  relatedDiscussionId: 'disc-1',
} as unknown as Issue;

const modalStub = (name: string) => ({
  name,
  props: ['open', 'title'],
  emits: ['close', 'suspended-user-successfully', 'unsuspended-successfully'],
  template: '<div />',
});

const mountButton = (props: Record<string, unknown> = {}) =>
  mount(SuspendUserButton, {
    props: { issue, channelUniqueName: 'cats', ...props },
    global: {
      stubs: {
        BrokenRulesModal: modalStub('BrokenRulesModal'),
        UnsuspendUserModal: modalStub('UnsuspendUserModal'),
        Notification: { name: 'Notification', props: ['show', 'title'], template: '<div />' },
        UserPlus: true,
        UserMinus: true,
      },
    },
  });

const suspensionResult = (suspended: boolean) => ({
  isOriginalPosterSuspended: suspended,
  discussionChannels: [{ id: 'dc1' }],
  eventChannels: [{ id: 'ec1' }],
});

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref(suspensionResult(false));
});

describe('SuspendUserButton label', () => {
  it('shows the author suspend label by default', () => {
    const wrapper = mountButton();

    expect(wrapper.text()).toContain('Suspend Author');
  });

  it('shows the bot suspend label when isBot', () => {
    const wrapper = mountButton({ isBot: true });

    expect(wrapper.text()).toContain('Suspend Bot');
  });

  it('shows the unsuspend label when the user is suspended', () => {
    h.result = ref(suspensionResult(true));
    const wrapper = mountButton();

    expect(wrapper.text()).toContain('Unsuspend Author');
  });

  it('shows the bot unsuspend label when suspended and isBot', () => {
    h.result = ref(suspensionResult(true));
    const wrapper = mountButton({ isBot: true });

    expect(wrapper.text()).toContain('Unsuspend Bot');
  });
});

describe('SuspendUserButton disabled state', () => {
  it('applies disabled styling when disabled', () => {
    const wrapper = mountButton({ disabled: true });

    expect(wrapper.get('button').classes()).toContain('cursor-not-allowed');
  });

  it('does not open the suspend modal when disabled', async () => {
    const wrapper = mountButton({ disabled: true });

    await wrapper.get('button').trigger('click');

    expect(wrapper.getComponent({ name: 'BrokenRulesModal' }).props('open')).toBe(
      false
    );
  });
});

describe('SuspendUserButton modal flow', () => {
  it('opens the suspend modal on click', async () => {
    const wrapper = mountButton();

    await wrapper.get('button').trigger('click');

    expect(wrapper.getComponent({ name: 'BrokenRulesModal' }).props('open')).toBe(
      true
    );
  });

  it('opens the unsuspend modal on click when suspended', async () => {
    h.result = ref(suspensionResult(true));
    const wrapper = mountButton();

    await wrapper.get('button').trigger('click');

    expect(
      wrapper.getComponent({ name: 'UnsuspendUserModal' }).props('open')
    ).toBe(true);
  });

  it('re-emits suspended-successfully from the modal', async () => {
    const wrapper = mountButton();

    await wrapper
      .getComponent({ name: 'BrokenRulesModal' })
      .vm.$emit('suspended-user-successfully');

    expect(wrapper.emitted('suspended-successfully')).toBeTruthy();
  });

  it('re-emits unsuspended-successfully from the modal', async () => {
    h.result = ref(suspensionResult(true));
    const wrapper = mountButton();

    await wrapper
      .getComponent({ name: 'UnsuspendUserModal' })
      .vm.$emit('unsuspended-successfully');

    expect(wrapper.emitted('unsuspended-successfully')).toBeTruthy();
  });
});
