import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ConfirmUndoCommentFeedbackModal from '@/components/discussion/detail/ConfirmUndoCommentFeedbackModal.vue';
import type { Comment } from '@/__generated__/graphql';

const h = vi.hoisted(() => ({
  getError: null as unknown,
  onResult: undefined as undefined | ((r: unknown) => void),
  deleteFeedback: vi.fn(),
  deleteError: null as unknown,
  onDone: undefined as undefined | (() => void),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    error: h.getError,
    onResult: (cb: (r: unknown) => void) => {
      h.onResult = cb;
    },
  }),
  useMutation: () => ({
    mutate: h.deleteFeedback,
    loading: ref(false),
    error: h.deleteError,
    onDone: (cb: () => void) => {
      h.onDone = cb;
    },
  }),
}));

const genericModalStub = {
  name: 'GenericModal',
  props: ['open', 'title', 'body', 'loading'],
  emits: ['primary-button-click', 'secondary-button-click'],
  template: '<div><slot name="content" /></div>',
};

const mountModal = () =>
  mount(ConfirmUndoCommentFeedbackModal, {
    props: {
      commentId: 'c1',
      commentToRemoveFeedbackFrom: { id: 'c1' } as unknown as Comment,
      modName: 'mod1',
      open: true,
    },
    global: {
      stubs: {
        GenericModal: genericModalStub,
        CommentHeader: { name: 'CommentHeader', props: ['commentData'], template: '<div class="header" />' },
        MarkdownPreview: { name: 'MarkdownPreview', props: ['text'], template: '<div class="md">{{ text }}</div>' },
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
      },
    },
  });

const modal = (w: ReturnType<typeof mount>) => w.getComponent({ name: 'GenericModal' });

beforeEach(() => {
  vi.clearAllMocks();
  h.getError = ref(null);
  h.onResult = undefined;
  h.deleteError = ref(null);
  h.onDone = undefined;
});

describe('ConfirmUndoCommentFeedbackModal', () => {
  it('shows the confirm title', () => {
    const wrapper = mountModal();

    expect(modal(wrapper).props('title')).toBe('Delete your feedback?');
  });

  it('renders the feedback comment once the query resolves', async () => {
    const wrapper = mountModal();

    h.onResult?.({ data: { comments: [{ id: 'fb1', text: 'mean note' }] } });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.md').text()).toBe('mean note');
  });

  it('ignores a query result with no feedback', async () => {
    const wrapper = mountModal();

    h.onResult?.({ data: { comments: [] } });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.md').exists()).toBe(false);
  });

  it('deletes the loaded feedback on confirm', async () => {
    const wrapper = mountModal();
    h.onResult?.({ data: { comments: [{ id: 'fb1', text: 'mean note' }] } });
    await wrapper.vm.$nextTick();

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.deleteFeedback).toHaveBeenCalledWith({ id: 'fb1' });
  });

  it('emits close when the deletion completes', () => {
    const wrapper = mountModal();

    h.onDone?.();

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits close from the secondary button', async () => {
    const wrapper = mountModal();

    await modal(wrapper).vm.$emit('secondary-button-click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('shows a delete error banner', () => {
    h.deleteError = ref({ message: 'delete boom' });
    const wrapper = mountModal();

    expect(wrapper.find('.err').text()).toContain('delete boom');
  });
});
