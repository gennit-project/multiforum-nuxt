import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Comment } from '@/__generated__/graphql';

import FeedbackSection from '@/components/comments/FeedbackSection.vue';

vi.mock('nuxt/app', () => ({ useRoute: () => ({ params: { forumId: 'cats' } }) }));

const stub = (name: string, props: string[] = [], emits: string[] = []) => ({
  name,
  props,
  emits,
  template: '<div />',
});

const comment = (id: string) => ({ id }) as unknown as Comment;

const defaultProps = () => ({
  addFeedbackCommentToCommentError: '',
  addFeedbackCommentToCommentLoading: false,
  feedbackCommentsAggregate: 2,
  feedbackComments: [comment('c1'), comment('c2')],
  loading: false,
  loadMore: vi.fn(),
  reachedEndOfResults: false,
  showFeedbackFormModal: false,
  showFeedbackSubmittedSuccessfully: false,
});

const mountSection = (props: Record<string, unknown> = {}) =>
  mount(FeedbackSection, {
    props: { ...defaultProps(), ...props },
    global: {
      stubs: {
        NuxtPage: stub('NuxtPage'),
        InfoBanner: true,
        LoadMore: stub('LoadMore', ['reachedEndOfResults'], ['load-more']),
        CommentOnFeedbackPage: stub(
          'CommentOnFeedbackPage',
          ['comment'],
          ['click-feedback', 'click-undo-feedback', 'click-edit-feedback', 'click-report', 'click-archive', 'click-unarchive', 'click-archive-and-suspend']
        ),
        Notification: stub('Notification', ['show']),
        GenericFeedbackFormModal: stub(
          'GenericFeedbackFormModal',
          ['open', 'loading', 'error'],
          ['close', 'update-feedback', 'primary-button-click']
        ),
        ConfirmUndoCommentFeedbackModal: stub('ConfirmUndoCommentFeedbackModal', ['open'], ['close']),
        EditCommentFeedbackModal: stub('EditCommentFeedbackModal', ['open'], ['close']),
        BrokenRulesModal: stub('BrokenRulesModal', ['open', 'commentId'], ['close']),
        UnarchiveModal: stub('UnarchiveModal', ['open'], ['close']),
      },
    },
  });

const firstComment = (w: ReturnType<typeof mount>) =>
  w.findAllComponents({ name: 'CommentOnFeedbackPage' })[0];
const feedbackModal = (w: ReturnType<typeof mount>) =>
  w.getComponent({ name: 'GenericFeedbackFormModal' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FeedbackSection rendering', () => {
  it('shows the feedback count', () => {
    const wrapper = mountSection({ feedbackCommentsAggregate: 7 });

    expect(wrapper.text()).toContain('Feedback Comments (7)');
  });

  it('shows an empty state when there is no feedback', () => {
    const wrapper = mountSection({ feedbackCommentsAggregate: 0, feedbackComments: [] });

    expect(wrapper.text()).toContain('No feedback yet');
  });

  it('renders a comment per feedback item', () => {
    const wrapper = mountSection();

    expect(
      wrapper.findAllComponents({ name: 'CommentOnFeedbackPage' })
    ).toHaveLength(2);
  });

  it('shows a loading indicator while loading', () => {
    const wrapper = mountSection({ loading: true });

    expect(wrapper.text()).toContain('Loading');
  });

  it('loads more results when requested', async () => {
    const loadMore = vi.fn();
    const wrapper = mountSection({ loadMore });

    await wrapper.getComponent({ name: 'LoadMore' }).vm.$emit('load-more');

    expect(loadMore).toHaveBeenCalled();
  });
});

describe('FeedbackSection feedback actions', () => {
  it('opens the feedback form on give-feedback', async () => {
    const wrapper = mountSection();

    await firstComment(wrapper).vm.$emit('click-feedback', {
      commentData: comment('c1'),
      parentCommentId: 'p1',
    });

    expect(wrapper.emitted('openFeedbackFormModal')).toBeTruthy();
  });

  it('opens the undo modal on undo-feedback', async () => {
    const wrapper = mountSection({ commentToRemoveFeedbackFrom: comment('c1') });

    await firstComment(wrapper).vm.$emit('click-undo-feedback', {
      commentData: comment('c1'),
      parentCommentId: 'p1',
    });

    expect(
      wrapper.findComponent({ name: 'ConfirmUndoCommentFeedbackModal' }).exists()
    ).toBe(true);
  });

  it('opens the edit modal on edit-feedback', async () => {
    const wrapper = mountSection();

    await firstComment(wrapper).vm.$emit('click-edit-feedback', {
      commentData: comment('c1'),
    });

    expect(
      wrapper.findComponent({ name: 'EditCommentFeedbackModal' }).exists()
    ).toBe(true);
  });
});

describe('FeedbackSection submit', () => {
  it('emits feedback when a comment and mod name are present', async () => {
    const wrapper = mountSection({
      commentToGiveFeedbackOn: comment('c1'),
      loggedInUserModName: 'mod1',
    });

    await feedbackModal(wrapper).vm.$emit('primary-button-click');

    expect(wrapper.emitted('addFeedbackCommentToComment')?.[0]?.[0]).toMatchObject({
      commentId: 'c1',
      modProfileName: 'mod1',
      channelId: 'cats',
    });
  });

  it('does not emit feedback without a target comment', async () => {
    const wrapper = mountSection({ loggedInUserModName: 'mod1' });

    await feedbackModal(wrapper).vm.$emit('primary-button-click');

    expect(wrapper.emitted('addFeedbackCommentToComment')).toBeUndefined();
  });

  it('does not emit feedback without a mod name', async () => {
    const wrapper = mountSection({ commentToGiveFeedbackOn: comment('c1') });

    await feedbackModal(wrapper).vm.$emit('primary-button-click');

    expect(wrapper.emitted('addFeedbackCommentToComment')).toBeUndefined();
  });

  it('closes the feedback form on close', async () => {
    const wrapper = mountSection();

    await feedbackModal(wrapper).vm.$emit('close');

    expect(wrapper.emitted('closeFeedbackFormModal')).toBeTruthy();
  });
});

describe('FeedbackSection moderation', () => {
  it('opens the report modal on click-report', async () => {
    const wrapper = mountSection();

    await firstComment(wrapper).vm.$emit('click-report');

    expect(wrapper.findComponent({ name: 'BrokenRulesModal' }).exists()).toBe(true);
  });

  it('opens the unarchive modal on click-unarchive', async () => {
    const wrapper = mountSection();

    await firstComment(wrapper).vm.$emit('click-unarchive');

    expect(wrapper.findComponent({ name: 'UnarchiveModal' }).exists()).toBe(true);
  });
});
