import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import FeedbackModalManager from './FeedbackModalManager.vue';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: vi.fn(),
    error: ref(null),
    loading: ref(false),
    onDone: vi.fn(),
  }),
}));

vi.mock('@/components/NotificationComponent.vue', () => ({
  default: {
    template: '<div />',
    props: ['show', 'title'],
  },
}));

vi.mock('@/components/GenericFeedbackFormModal.vue', () => ({
  default: {
    template: '<div data-testid="feedback-modal" />',
    props: ['open', 'error', 'loading', 'primaryButtonDisabled'],
  },
}));

vi.mock('@/components/discussion/detail/ConfirmUndoDiscussionFeedbackModal.vue', () => ({
  default: {
    template: '<div />',
    props: ['discussionId', 'modName', 'open'],
  },
}));

vi.mock('@/components/discussion/detail/EditFeedbackModal.vue', () => ({
  default: {
    template: '<div />',
    props: ['discussionId', 'modName', 'open'],
  },
}));

describe('FeedbackModalManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const buildWrapper = (feedbackEnabled: boolean) =>
    mount(FeedbackModalManager, {
      props: {
        discussionId: 'discussion-1',
        loggedInUserModName: 'mod-alice',
        activeDiscussionChannel: {
          id: 'discussion-channel-1',
          channelUniqueName: 'cats',
          Channel: {
            feedbackEnabled,
          },
        },
      },
      global: {
        stubs: {
          GenericFeedbackFormModal: {
            template: '<div data-testid="feedback-modal" />',
          },
          ConfirmUndoDiscussionFeedbackModal: {
            template: '<div />',
          },
          EditFeedbackModal: {
            template: '<div />',
          },
          Notification: {
            template: '<div />',
          },
        },
      },
    });

  it.each([
    { feedbackEnabled: true, expectedModalCount: 1 },
    { feedbackEnabled: false, expectedModalCount: 0 },
  ])(
    'renders $expectedModalCount feedback modal when feedbackEnabled is $feedbackEnabled',
    async ({ feedbackEnabled, expectedModalCount }) => {
      const wrapper = buildWrapper(feedbackEnabled);

      wrapper.vm.handleClickGiveFeedback();
      await wrapper.vm.$nextTick();

      expect(wrapper.findAll('[data-testid="feedback-modal"]')).toHaveLength(
        expectedModalCount
      );
    }
  );
});
