import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { useMutation } from '@vue/apollo-composable';
import { asMock, createMutationRouter } from '@/tests/utils/mockApollo';
import FeedbackModalManager from './FeedbackModalManager.vue';

vi.mock('@vue/apollo-composable', () => ({ useMutation: vi.fn() }));

const router = createMutationRouter(['addFeedbackCommentToDiscussion']);
const feedbackMutation = () => router.get('addFeedbackCommentToDiscussion');

const FormModalStub = {
  name: 'GenericFeedbackFormModal',
  template: '<div data-testid="feedback-modal" />',
  props: ['open', 'error', 'loading', 'primaryButtonDisabled'],
  emits: ['close', 'primary-button-click', 'update-feedback'],
};

const stubs = {
  GenericFeedbackFormModal: FormModalStub,
  ConfirmUndoDiscussionFeedbackModal: {
    name: 'ConfirmUndoDiscussionFeedbackModal',
    template: '<div data-testid="undo-modal" />',
    props: ['open', 'discussionId', 'modName'],
    emits: ['close'],
  },
  EditFeedbackModal: {
    name: 'EditFeedbackModal',
    template: '<div data-testid="edit-modal" />',
    props: ['open', 'discussionId', 'modName'],
    emits: ['close'],
  },
  Notification: {
    name: 'Notification',
    template: '<div data-testid="notification" :data-show="String(show)" />',
    props: ['show', 'title'],
    emits: ['close-notification'],
  },
};

const mountManager = (overrides: Record<string, unknown> = {}) =>
  mount(FeedbackModalManager, {
    props: {
      discussionId: 'discussion-1',
      loggedInUserModName: 'mod-alice',
      activeDiscussionChannel: {
        id: 'dc-1',
        channelUniqueName: 'cats',
        Channel: { feedbackEnabled: true },
      },
      ...overrides,
    },
    global: { stubs },
  });

type Vm = {
  handleClickGiveFeedback: () => void;
  handleClickUndoFeedback: () => void;
  handleClickEditFeedback: () => void;
  $nextTick: () => Promise<void>;
};

// Opens the feedback form, sets its text, and submits — the standard path to
// handleSubmitFeedback (which is wired to the modal, not exposed directly).
const submitFeedback = async (
  wrapper: ReturnType<typeof mountManager>,
  text: string | null
) => {
  (wrapper.vm as unknown as Vm).handleClickGiveFeedback();
  await (wrapper.vm as unknown as Vm).$nextTick();
  const modal = wrapper.findComponent(FormModalStub);
  if (text !== null) await modal.vm.$emit('update-feedback', text);
  await modal.vm.$emit('primary-button-click');
};

beforeEach(() => {
  router.reset();
  asMock(useMutation).mockImplementation(router.useMutation);
});

describe('FeedbackModalManager', () => {
  it('opens the feedback form when feedback is enabled', async () => {
    const wrapper = mountManager();
    (wrapper.vm as unknown as Vm).handleClickGiveFeedback();
    await (wrapper.vm as unknown as Vm).$nextTick();
    expect(wrapper.find('[data-testid="feedback-modal"]').exists()).toBe(true);
  });

  it('does not open the feedback form when feedback is disabled', async () => {
    const wrapper = mountManager({
      activeDiscussionChannel: {
        id: 'dc-1',
        channelUniqueName: 'cats',
        Channel: { feedbackEnabled: false },
      },
    });
    (wrapper.vm as unknown as Vm).handleClickGiveFeedback();
    await (wrapper.vm as unknown as Vm).$nextTick();
    expect(wrapper.find('[data-testid="feedback-modal"]').exists()).toBe(false);
  });

  describe('submitting feedback', () => {
    it('calls the mutation with the discussion, text, mod and channel', async () => {
      const wrapper = mountManager();
      await submitFeedback(wrapper, 'This breaks the rules');
      expect(feedbackMutation().mutate).toHaveBeenCalledWith({
        discussionId: 'discussion-1',
        text: 'This breaks the rules',
        modProfileName: 'mod-alice',
        channelId: 'cats',
        discussionChannelId: 'dc-1',
      });
    });

    it('does not submit when no feedback text was entered', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mountManager();
      await submitFeedback(wrapper, null);
      errorSpy.mockRestore();
      expect(feedbackMutation().mutate).not.toHaveBeenCalled();
    });

    it('does not submit when the moderator name is missing', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mountManager({ loggedInUserModName: '' });
      await submitFeedback(wrapper, 'text');
      errorSpy.mockRestore();
      expect(feedbackMutation().mutate).not.toHaveBeenCalled();
    });

    it('does not submit when the active channel has no unique name', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mountManager({
        activeDiscussionChannel: {
          id: 'dc-1',
          channelUniqueName: '',
          Channel: { feedbackEnabled: true },
        },
      });
      await submitFeedback(wrapper, 'text');
      errorSpy.mockRestore();
      expect(feedbackMutation().mutate).not.toHaveBeenCalled();
    });

    it('does not submit when feedback was disabled after the form opened', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mountManager();
      (wrapper.vm as unknown as Vm).handleClickGiveFeedback();
      await (wrapper.vm as unknown as Vm).$nextTick();
      await wrapper.setProps({
        activeDiscussionChannel: {
          id: 'dc-1',
          channelUniqueName: 'cats',
          Channel: { feedbackEnabled: false },
        },
      });
      const modal = wrapper.findComponent(FormModalStub);
      await modal.vm.$emit('update-feedback', 'text');
      await modal.vm.$emit('primary-button-click');
      errorSpy.mockRestore();
      expect(feedbackMutation().mutate).not.toHaveBeenCalled();
    });
  });

  describe('on successful submission', () => {
    it('emits feedbackSubmitted and shows the success notification', async () => {
      const wrapper = mountManager();
      (wrapper.vm as unknown as Vm).handleClickGiveFeedback();
      await (wrapper.vm as unknown as Vm).$nextTick();
      feedbackMutation().fireDone();
      await (wrapper.vm as unknown as Vm).$nextTick();
      expect([
        !!wrapper.emitted('feedbackSubmitted'),
        wrapper.get('[data-testid="notification"]').attributes('data-show'),
      ]).toEqual([true, 'true']);
    });

    it('closes the feedback form after submission', async () => {
      const wrapper = mountManager();
      (wrapper.vm as unknown as Vm).handleClickGiveFeedback();
      await (wrapper.vm as unknown as Vm).$nextTick();
      feedbackMutation().fireDone();
      await (wrapper.vm as unknown as Vm).$nextTick();
      expect(wrapper.find('[data-testid="feedback-modal"]').exists()).toBe(false);
    });
  });

  describe('undo and edit modals', () => {
    it('opens the undo-feedback modal', async () => {
      const wrapper = mountManager();
      (wrapper.vm as unknown as Vm).handleClickUndoFeedback();
      await (wrapper.vm as unknown as Vm).$nextTick();
      expect(wrapper.find('[data-testid="undo-modal"]').exists()).toBe(true);
    });

    it('opens the edit-feedback modal', async () => {
      const wrapper = mountManager();
      (wrapper.vm as unknown as Vm).handleClickEditFeedback();
      await (wrapper.vm as unknown as Vm).$nextTick();
      expect(wrapper.find('[data-testid="edit-modal"]').exists()).toBe(true);
    });
  });

  describe('dismissing modals', () => {
    it('closes the feedback form on its close event', async () => {
      const wrapper = mountManager();
      (wrapper.vm as unknown as Vm).handleClickGiveFeedback();
      await (wrapper.vm as unknown as Vm).$nextTick();
      await wrapper.findComponent(FormModalStub).vm.$emit('close');
      expect(wrapper.find('[data-testid="feedback-modal"]').exists()).toBe(false);
    });

    it('closes the undo modal on its close event', async () => {
      const wrapper = mountManager();
      (wrapper.vm as unknown as Vm).handleClickUndoFeedback();
      await (wrapper.vm as unknown as Vm).$nextTick();
      await wrapper
        .findComponent({ name: 'ConfirmUndoDiscussionFeedbackModal' })
        .vm.$emit('close');
      expect(wrapper.find('[data-testid="undo-modal"]').exists()).toBe(false);
    });

    it('closes the edit modal on its close event', async () => {
      const wrapper = mountManager();
      (wrapper.vm as unknown as Vm).handleClickEditFeedback();
      await (wrapper.vm as unknown as Vm).$nextTick();
      await wrapper
        .findComponent({ name: 'EditFeedbackModal' })
        .vm.$emit('close');
      expect(wrapper.find('[data-testid="edit-modal"]').exists()).toBe(false);
    });

    it('dismisses the success notification on its close event', async () => {
      const wrapper = mountManager();
      (wrapper.vm as unknown as Vm).handleClickGiveFeedback();
      await (wrapper.vm as unknown as Vm).$nextTick();
      feedbackMutation().fireDone();
      await (wrapper.vm as unknown as Vm).$nextTick();
      await wrapper
        .findComponent({ name: 'Notification' })
        .vm.$emit('close-notification');
      expect(
        wrapper.get('[data-testid="notification"]').attributes('data-show')
      ).toBe('false');
    });
  });
});
