import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import CommentDetails from '@/components/mod/CommentDetails.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  error: null as unknown,
  loading: null as unknown,
  onResult: undefined as undefined | ((r: unknown) => void),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: h.result,
    error: h.error,
    loading: h.loading,
    onResult: (cb: (r: unknown) => void) => {
      h.onResult = cb;
    },
  }),
}));
vi.mock('nuxt/app', () => ({ useRoute: () => ({ params: { forumId: 'cats' }, name: 'forums-forumId-discussions-discussionId' }) }));
vi.mock('@/composables/useForumRoleMembership', () => ({
  useForumRoleMembership: () => ({
    forumAdminUsernames: ref([]),
    forumModUsernames: ref([]),
    forumModProfileNames: ref([]),
  }),
}));

const comment = (overrides: Record<string, unknown> = {}) => ({
  id: 'c1',
  text: 'A reported comment',
  CommentAuthor: { __typename: 'User', username: 'alice' },
  DiscussionChannel: { discussionId: 'd1', channelUniqueName: 'cats' },
  ...overrides,
});

const mountDetails = () =>
  mount(CommentDetails, {
    props: { commentId: 'c1' },
    global: {
      stubs: {
        CommentHeader: { name: 'CommentHeader', props: ['commentData', 'forumRoleBadge'], template: '<div class="header" />' },
        MarkdownPreview: { name: 'MarkdownPreview', props: ['text'], template: '<div class="md">{{ text }}</div>' },
        LoadingSpinner: { name: 'LoadingSpinner', template: '<div class="spinner" />' },
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref({ comments: [comment()] });
  h.error = ref(null);
  h.loading = ref(false);
  h.onResult = undefined;
});

describe('CommentDetails states', () => {
  it('shows a spinner while loading', () => {
    h.loading = ref(true);
    const wrapper = mountDetails();

    expect(wrapper.find('.spinner').exists()).toBe(true);
  });

  it('shows an error banner on query error', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountDetails();

    expect(wrapper.find('.err').text()).toContain('boom');
  });

  it('shows a not-found message when there is no comment', () => {
    h.result = ref({ comments: [] });
    const wrapper = mountDetails();

    expect(wrapper.text()).toContain("Can't find the content");
  });
});

describe('CommentDetails content', () => {
  it('renders the comment header', () => {
    const wrapper = mountDetails();

    expect(wrapper.find('.header').exists()).toBe(true);
  });

  it('renders the comment text', () => {
    const wrapper = mountDetails();

    expect(wrapper.find('.md').text()).toBe('A reported comment');
  });

  it('falls back to [Deleted] when the text is empty', () => {
    h.result = ref({ comments: [comment({ text: '' })] });
    const wrapper = mountDetails();

    expect(wrapper.find('.md').text()).toBe('[Deleted]');
  });
});

describe('CommentDetails permalink context', () => {
  it('links an event comment', () => {
    h.result = ref({
      comments: [
        comment({ DiscussionChannel: null, Event: { id: 'e1' }, Channel: { uniqueName: 'cats' } }),
      ],
    });
    const wrapper = mountDetails();

    expect(wrapper.text()).toContain('Context');
  });

  it('links a feedback comment', () => {
    h.result = ref({
      comments: [
        comment({
          DiscussionChannel: null,
          GivesFeedbackOnDiscussion: { id: 'd9' },
        }),
      ],
    });
    const wrapper = mountDetails();

    expect(wrapper.text()).toContain('Context');
  });
});

describe('CommentDetails author emit', () => {
  it('emits the original author username from the query result', () => {
    const wrapper = mountDetails();

    h.onResult?.({ data: { comments: [comment()] } });

    expect(wrapper.emitted('fetchedOriginalAuthorUsername')?.[0]).toEqual([
      'alice',
    ]);
  });

  it('does not emit a username when there are no comments', () => {
    const wrapper = mountDetails();

    h.onResult?.({ data: { comments: [] } });

    expect(wrapper.emitted('fetchedOriginalAuthorUsername')).toBeUndefined();
  });
});
