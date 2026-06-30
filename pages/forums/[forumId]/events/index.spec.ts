import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import type { computed} from 'vue';
import { defineComponent, h, ref } from 'vue';
import { createMockRoute } from '@/tests/utils/mockRouter';

vi.stubGlobal('definePageMeta', vi.fn());

const useQuery = vi.fn();
const mockRoute = createMockRoute({
  params: { forumId: 'cats' },
  path: '/forums/cats/events',
  fullPath: '/forums/cats/events',
  name: 'forums-forumId-events',
});

vi.mock('nuxt/app', () => ({
  useRoute: () => mockRoute,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery,
}));

vi.mock('@/config', () => ({
  config: {
    serverName: 'TestServer',
  },
}));

const mockEvaluateForumFeatureGate = vi.fn();

vi.mock('@/utils/forumFeatureGate', () => ({
  evaluateForumFeatureGate: mockEvaluateForumFeatureGate,
}));

const EventListViewStub = defineComponent({
  name: 'EventListView',
  setup() {
    return () => h('div', { 'data-testid': 'event-list-view' });
  },
});

describe('forum events index page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEvaluateForumFeatureGate.mockReturnValue({
      shouldShow: true,
      errorMessage: '',
    });
    useQuery.mockImplementation((_query, _variables, options) => ({
      result: ref(null),
      loading: ref(false),
      error: ref(null),
      options,
    }));
  });

  it('uses a reactive getter with a UTC hour for the channel query', async () => {
    const Page = (await import('./index.vue')).default;

    mount(Page, {
      global: {
        stubs: {
          EventListView: EventListViewStub,
        },
      },
    });

    const channelQueryCall = useQuery.mock.calls[0];
    const getVariables = channelQueryCall?.[1] as
      | (() => { uniqueName: string; now: string | null })
      | undefined;
    const queryOptions = channelQueryCall?.[2] as
      | { enabled?: ReturnType<typeof computed> }
      | undefined;

    expect(getVariables?.()).toMatchObject({
      uniqueName: 'cats',
    });
    expect(getVariables?.().now?.endsWith(':00.000Z')).toBe(true);
    expect(queryOptions?.enabled?.value).toBe(true);
  });

  it('renders the event list when the events gate allows it', async () => {
    const Page = (await import('./index.vue')).default;

    const wrapper = mount(Page, {
      global: {
        stubs: {
          EventListView: EventListViewStub,
        },
      },
    });

    expect(
      wrapper.find('[data-testid="event-list-view"]').exists()
    ).toBe(true);
  });

  it('shows the not-available message when events are disabled server-wide', async () => {
    mockEvaluateForumFeatureGate.mockReturnValue({
      shouldShow: false,
      errorMessage:
        'Cannot show the calendar because events are disabled at the server level.',
    });
    const Page = (await import('./index.vue')).default;

    const wrapper = mount(Page, {
      global: {
        stubs: {
          EventListView: EventListViewStub,
        },
      },
    });

    expect(wrapper.text()).toContain('Calendar Not Available');
  });
});
