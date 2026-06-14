import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import SuspendModButton from '@/components/mod/SuspendModButton.vue';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    result: ref({ isOriginalPosterSuspended: false }),
    loading: ref(false),
    error: ref(null),
  })),
}));

vi.mock('@/composables/useSuspensionActionUI', () => ({
  useSuspensionActionUI: () => ({
    showSuspendModal: ref(false),
    showUnsuspendModal: ref(false),
    showSuccessfullySuspended: ref(false),
    showSuccessfullyUnsuspended: ref(false),
    openSuspendModal: vi.fn(),
    openUnsuspendModal: vi.fn(),
    closeSuspendModal: vi.fn(),
    closeUnsuspendModal: vi.fn(),
    handleSuspendedSuccessfully: vi.fn(),
    handleUnsuspendedSuccessfully: vi.fn(),
    dismissSuspendedNotification: vi.fn(),
    dismissUnsuspendedNotification: vi.fn(),
  }),
}));

const mockIssue = {
  id: 'issue-1',
  issueNumber: 42,
  relatedDiscussionId: 'disc-1',
  relatedModProfileName: 'TestMod',
};

describe('SuspendModButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders suspend button when mod is not suspended', () => {
    const wrapper = mount(SuspendModButton, {
      props: {
        issue: mockIssue,
      },
      global: {
        stubs: {
          SuspendModModal: { template: '<div />' },
          UnsuspendModModal: { template: '<div />' },
          Notification: { template: '<div />' },
          UserPlus: { template: '<span>+</span>' },
          UserMinus: { template: '<span>-</span>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Suspend Mod');
    expect(wrapper.text()).not.toContain('Unsuspend Mod');
  });

  it('renders unsuspend button when mod is suspended', async () => {
    const apolloModule = await import('@vue/apollo-composable');
    vi.mocked(apolloModule.useQuery).mockReturnValue({
      result: ref({ isOriginalPosterSuspended: true }),
      loading: ref(false),
      error: ref(null),
    } as ReturnType<typeof apolloModule.useQuery>);

    const wrapper = mount(SuspendModButton, {
      props: {
        issue: mockIssue,
      },
      global: {
        stubs: {
          SuspendModModal: { template: '<div />' },
          UnsuspendModModal: { template: '<div />' },
          Notification: { template: '<div />' },
          UserPlus: { template: '<span>+</span>' },
          UserMinus: { template: '<span>-</span>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Unsuspend Mod');
    expect(wrapper.text()).not.toContain('Suspend Mod');
  });

  it('disables button when disabled prop is true', () => {
    const wrapper = mount(SuspendModButton, {
      props: {
        issue: mockIssue,
        disabled: true,
      },
      global: {
        stubs: {
          SuspendModModal: { template: '<div />' },
          UnsuspendModModal: { template: '<div />' },
          Notification: { template: '<div />' },
          UserPlus: { template: '<span>+</span>' },
          UserMinus: { template: '<span>-</span>' },
        },
      },
    });

    const button = wrapper.find('button');
    expect(button.classes()).toContain('cursor-not-allowed');
    expect(button.classes()).toContain('bg-gray-500');
  });

  it('applies active styling when not disabled', () => {
    const wrapper = mount(SuspendModButton, {
      props: {
        issue: mockIssue,
        disabled: false,
      },
      global: {
        stubs: {
          SuspendModModal: { template: '<div />' },
          UnsuspendModModal: { template: '<div />' },
          Notification: { template: '<div />' },
          UserPlus: { template: '<span>+</span>' },
          UserMinus: { template: '<span>-</span>' },
        },
      },
    });

    const button = wrapper.find('button');
    expect(button.classes()).toContain('cursor-pointer');
    // When not disabled, button should have hover transition styling
    expect(button.classes()).toContain('transition');
  });
});
