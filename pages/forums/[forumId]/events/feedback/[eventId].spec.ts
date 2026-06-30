import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, nextTick } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import PageNotFound from '@/components/PageNotFound.vue';
import EventHeader from '@/components/event/detail/EventHeader.vue';
import EventBody from '@/components/event/detail/EventBody.vue';
import FeedbackSection from '@/components/comments/FeedbackSection.vue';

const hState = vi.hoisted(() => ({
  route: { params: { forumId: 'cats', eventId: 'e1' } },
  fetchMore: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => hState.route,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const stubs = {
  EventHeader: {
    name: 'EventHeader',
    props: ['eventData'],
    template: '<div data-testid="event-header" />',
  },
  EventBody: {
    name: 'EventBody',
    props: ['event'],
    template: '<div data-testid="event-body" />',
  },
  FeedbackSection: defineComponent({
    name: 'FeedbackSection',
    props: ['feedbackComments', 'feedbackCommentsAggregate', 'loadMore'],
    template:
      '<div><button data-testid="load-more" @click="$props.loadMore()">load</button></div>',
  }),
  ErrorBanner: {
    name: 'ErrorBanner',
    props: ['text'],
    template: '<div data-testid="error-banner" />',
  },
  PageNotFound: {
    name: 'PageNotFound',
    template: '<div data-testid="page-not-found" />',
  },
};

const mountPage = async (event: unknown, opts: { loading?: boolean; error?: unknown } = {}) => {
  const { loading = false, error = null } = opts;
  mockedUseQuery.mockReturnValue({
    result: ref({ events: event ? [event] : [] }),
    error: ref(error),
    loading: ref(loading),
    fetchMore: hState.fetchMore,
  });
  const Page = (await import('./[eventId].vue')).default;
  return shallowMount(Page, { global: { stubs } });
};

beforeEach(() => {
  vi.clearAllMocks();
  hState.route = { params: { forumId: 'cats', eventId: 'e1' } };
});

describe('event feedback page', () => {
  it('shows the not-found page when the event is missing', async () => {
    const wrapper = await mountPage(null);
    expect(wrapper.findComponent(PageNotFound).exists()).toBe(true);
  });

  it('renders the event details and feedback list', async () => {
    const wrapper = await mountPage({
      id: 'e1',
      title: 'Cat Meetup',
      description: 'A nice gathering',
      FeedbackComments: [{ id: 'c1' }],
      FeedbackCommentsAggregate: { count: 2 },
    });

    expect(wrapper.findComponent(EventHeader).exists()).toBe(true);
    expect(wrapper.findComponent(EventBody).exists()).toBe(true);
    expect(wrapper.findComponent(FeedbackSection).exists()).toBe(true);
  });

  it('loads more feedback comments from the current offset', async () => {
    const wrapper = await mountPage({
      id: 'e1',
      title: 'Cat Meetup',
      FeedbackComments: [{ id: 'c1' }, { id: 'c2' }],
      FeedbackCommentsAggregate: { count: 3 },
    });

    await wrapper.get('[data-testid="load-more"]').trigger('click');
    await nextTick();

    expect(hState.fetchMore).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { offset: 2 },
      })
    );
  });
});
