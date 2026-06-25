import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import PageNotFound from '@/components/PageNotFound.vue';
import EventHeader from '@/components/event/detail/EventHeader.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats', eventId: 'e1' } }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (event: unknown) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ events: event ? [event] : [] }),
    error: ref(null),
    loading: ref(false),
    fetchMore: vi.fn(),
  });
  const Page = (await import('./[eventId].vue')).default;
  return shallowMount(Page);
};

describe('event feedback page', () => {
  it('shows the not-found page when the event is missing', async () => {
    const wrapper = await mountWith(null);
    expect(wrapper.findComponent(PageNotFound).exists()).toBe(true);
  });

  it('renders the event header when the event loads', async () => {
    const wrapper = await mountWith({
      id: 'e1',
      title: 'Cat Meetup',
      FeedbackComments: [],
      FeedbackCommentsAggregate: { count: 0 },
    });
    expect(wrapper.findComponent(EventHeader).exists()).toBe(true);
  });
});
