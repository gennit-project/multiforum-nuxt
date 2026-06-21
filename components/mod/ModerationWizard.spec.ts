import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ModerationWizard from './ModerationWizard.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: {},
    query: {},
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: ref({
      discussionChannels: [{ archived: false }],
      eventChannels: [{ archived: false }],
      comments: [{ archived: false }],
      isOriginalPosterSuspended: false,
      discussions: [{ hasDownload: false }],
    }),
  }),
}));

vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return { useModProfileName: () => ref('mod-alice'), setModProfileName: vi.fn() };
});

describe('ModerationWizard', () => {
  const mountWrapper = () =>
    mount(ModerationWizard, {
      props: {
        issue: {
          id: 'issue-1',
          isOpen: true,
        },
        commentId: 'comment-1',
        channelUniqueName: 'cats',
        contextText: 'Reported comment',
        isSuspendedMod: true,
        canEditComments: true,
        reportCount: 1,
      },
      global: {
        stubs: {
          RequireAuth: { template: '<div><slot name="has-auth" /></div>' },
          AdminIcon: true,
          ScalesIcon: true,
          PencilIcon: true,
          CloseIssueAction: {
            template:
              '<button data-testid="close-issue-action" :disabled="false">Close</button>',
          },
          ArchiveButton: {
            template:
              '<div data-testid="archive-button" :data-disabled="String(disabled)"></div>',
            props: ['disabled'],
          },
          SuspendUserButton: {
            template:
              '<div data-testid="suspend-user-button" :data-disabled="String(disabled)"></div>',
            props: ['disabled'],
          },
          SuspendModButton: {
            template:
              '<div data-testid="suspend-mod-button" :data-disabled="String(disabled)"></div>',
            props: ['disabled'],
          },
          EditContentModal: true,
        },
      },
    });

  it('shows the suspended-mod message', () => {
    const wrapper = mountWrapper();

    expect(wrapper.text()).toContain(
      'Mod actions are disabled because your moderator account is suspended. This does not suspend your user account.'
    );
  });

  it('disables the archive button when the moderator is suspended', () => {
    const wrapper = mountWrapper();

    expect(wrapper.get('[data-testid="archive-button"]').attributes('data-disabled')).toBe(
      'true'
    );
  });

  it('disables the suspend-user button when the moderator is suspended', () => {
    const wrapper = mountWrapper();

    expect(wrapper.get('[data-testid="suspend-user-button"]').attributes('data-disabled')).toBe(
      'true'
    );
  });

  it('disables the edit action when the moderator is suspended', () => {
    const wrapper = mountWrapper();

    expect(wrapper.get('[data-test="edit-comment"]').attributes('disabled')).toBeDefined();
  });
});
