import { describe, it, expect, vi, beforeEach } from 'vitest';
import { h as createElement } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { errorBannerStub } from '@/tests/utils/componentStubs';
import PermalinkedFeedbackComment from '@/components/comments/PermalinkedFeedbackComment.vue';

const h = vi.hoisted(() => ({
  route: { params: { feedbackId: 'fb1' } },
  result: null as null | { comments?: Array<{ id: string; text: string }> },
  error: null as null | { message: string },
  loading: false,
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
}));

vi.mock('@vue/apollo-composable', async () => {
  const { computed } = await import('vue');
  return {
    useQuery: () => ({
      result: computed(() => h.result),
      error: computed(() => h.error),
      loading: computed(() => h.loading),
    }),
  };
});

vi.mock('@/graphQLData/comment/queries', () => ({
  GET_FEEDBACK_COMMENT: 'GET_FEEDBACK_COMMENT',
}));

const mountComment = () =>
  mountWithDefaults(PermalinkedFeedbackComment, {
    global: {
      stubs: {
        ErrorBanner: errorBannerStub,
      },
    },
    slots: {
      comment: ({ commentData }: { commentData: { id: string; text: string } }) =>
        createElement(
          'div',
          { class: 'slot-comment' },
          `${commentData.id}:${commentData.text}`
        ),
    },
  });

beforeEach(() => {
  h.route.params.feedbackId = 'fb1';
  h.result = null;
  h.error = null;
  h.loading = false;
});

describe('PermalinkedFeedbackComment', () => {
  it('shows a loading state while the query is pending', () => {
    h.loading = true;
    const wrapper = mountComment();

    expect(wrapper.text()).toContain('Loading...');
  });

  it('shows the query error in the banner', () => {
    h.error = { message: 'query failed' };
    const wrapper = mountComment();

    expect(wrapper.find('.error-banner').text()).toContain('query failed');
  });

  it('renders the comment slot with the fetched feedback comment', () => {
    h.result = { comments: [{ id: 'fb1', text: 'Helpful note' }] };
    const wrapper = mountComment();

    expect(wrapper.find('.slot-comment').text()).toBe('fb1:Helpful note');
  });

  it('shows the not-found state when the query returns no comment', () => {
    h.result = { comments: [] };
    const wrapper = mountComment();

    expect(wrapper.text()).toContain('Comment not found');
  });
});
