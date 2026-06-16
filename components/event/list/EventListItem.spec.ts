import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRoute, createMockRouter } from '@/tests/utils/mockRouter';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { makeEvent } from '@/tests/utils/factories';
import type { Event } from '@/__generated__/graphql';

import EventListItem from '@/components/event/list/EventListItem.vue';

// Demonstrates the round-2 test infra working together: a fixture factory
// (makeEvent), the router mock, and the one-call mount harness.

const route = createMockRoute({ params: { forumId: 'cats' } });
const router = createMockRouter();

vi.mock('nuxt/app', () => ({
  useRoute: () => route,
  useRouter: () => router,
}));

const mountItem = (event: Event) =>
  mountWithDefaults(EventListItem, {
    props: {
      event,
      currentChannelId: 'cats',
      showMap: false,
    },
    global: {
      stubs: {
        Tag: true,
        SeriesOccurrenceButtons: true,
        ChevronDownIcon: true,
      },
    },
  });

describe('EventListItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the event title from a factory-built event', () => {
    const wrapper = mountItem(makeEvent());
    expect(wrapper.text()).toContain('Test Event');
  });

  it('reflects an overridden title', () => {
    const wrapper = mountItem(makeEvent({ title: 'Trivia Night' }));
    expect(wrapper.text()).toContain('Trivia Night');
  });

  it('tags the root element with a per-event test id', () => {
    const wrapper = mountItem(makeEvent({ title: 'Trivia Night' }));
    expect(
      wrapper.find('[data-testid="event-list-item-Trivia Night"]').exists()
    ).toBe(true);
  });
});
