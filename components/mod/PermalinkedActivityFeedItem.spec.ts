import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import PermalinkedActivityFeedItem from '@/components/mod/PermalinkedActivityFeedItem.vue';

const h = vi.hoisted(() => ({
  result: null as unknown as { value: any },
  error: null as unknown as { value: any },
  loading: null as unknown as { value: boolean },
}));

h.result = ref(null);
h.error = ref(null);
h.loading = ref(false);

const mockUseQuery = vi.hoisted(() => vi.fn());

// The route's commentId is a comment shortId, resolved to the global id.
const mockResolved = vi.hoisted(() => ({
  id: null as unknown as { value: string },
  loading: null as unknown as { value: boolean },
  notFound: null as unknown as { value: boolean },
}));

mockResolved.id = ref('c1');
mockResolved.loading = ref(false);
mockResolved.notFound = ref(false);

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { commentId: 'shortc1' } }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

vi.mock('@/composables/useRouteContentIds', () => ({
  useResolvedCommentId: () => mockResolved,
}));

vi.mock('@/graphQLData/comment/queries', () => ({
  GET_ACTIVITY_FEED_COMMENT: 'GET_ACTIVITY_FEED_COMMENT',
}));

const mountItem = () =>
  mount(PermalinkedActivityFeedItem, {
    slots: {
      'moderation-action': '<div class="slot-rendered">Action</div>',
    },
    global: {
      stubs: {
        ErrorBanner: {
          name: 'ErrorBanner',
          props: ['text'],
          template: '<div class="error">{{ text }}</div>',
        },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuery.mockReturnValue({
    result: h.result,
    error: h.error,
    loading: h.loading,
  });
  mockResolved.id.value = 'c1';
  mockResolved.loading.value = false;
  mockResolved.notFound.value = false;
  h.result.value = null;
  h.error.value = null;
  h.loading.value = false;
});

describe('PermalinkedActivityFeedItem', () => {
  it('shows the loading state while the query is in flight', () => {
    h.loading.value = true;
    expect(mountItem().text()).toContain('Loading...');
  });

  it('shows the query error banner', () => {
    h.error.value = { message: 'boom' };
    expect(mountItem().text()).toContain('boom');
  });

  it('renders the moderation-action slot when a moderation action is present', () => {
    h.result.value = {
      comments: [{ ModerationAction: [{ id: 'a1', __typename: 'ModerationAction' }] }],
    };

    const wrapper = mountItem();
    expect(wrapper.find('.slot-rendered').exists()).toBe(true);
  });

  it('shows the not-found state when the comment has no moderation action', () => {
    h.result.value = {
      comments: [{ ModerationAction: [] }],
    };

    expect(mountItem().text()).toContain('Mod action not found');
  });

  it('queries the activity feed with the resolved global id', () => {
    mountItem();
    expect(mockUseQuery.mock.calls[0]![1]()).toEqual({ id: 'c1' });
  });

  it('shows loading while the shortId lookup is in flight', () => {
    mockResolved.id.value = '';
    mockResolved.loading.value = true;
    expect(mountItem().text()).toContain('Loading...');
  });

  it('falls back to the route param as a raw id when the lookup finds nothing', () => {
    mockResolved.id.value = '';
    mockResolved.notFound.value = true;
    mountItem();
    expect(mockUseQuery.mock.calls[0]![1]()).toEqual({ id: 'shortc1' });
  });
});
