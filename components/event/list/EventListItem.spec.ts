import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRoute, createMockRouter } from '@/tests/utils/mockRouter';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { makeEvent } from '@/tests/utils/factories';
import type { Event, EventChannel } from '@/__generated__/graphql';

import EventListItem from '@/components/event/list/EventListItem.vue';
import Tag from '@/components/TagComponent.vue';

// Minimal EventChannel shape the component reads (channelUniqueName / archived /
// CommentsAggregate). Typed loosely so test fixtures stay terse.
const eventChannel = (overrides: Record<string, unknown> = {}): Partial<EventChannel> => ({
  __typename: 'EventChannel',
  channelUniqueName: 'cats',
  archived: false,
  CommentsAggregate: { __typename: 'EventChannelCommentsAggregationSelection', count: 0 },
  ...overrides,
});

// Demonstrates the round-2 test infra working together: a fixture factory
// (makeEvent), the router mock, and the one-call mount harness.

const route = createMockRoute({ params: { forumId: 'cats' } });
const router = createMockRouter();

vi.mock('nuxt/app', () => ({
  useRoute: () => route,
  useRouter: () => router,
}));

const mountItem = (event: Event, extraProps: Record<string, unknown> = {}) =>
  mountWithDefaults(EventListItem, {
    props: {
      event,
      currentChannelId: 'cats',
      showMap: false,
      ...extraProps,
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
    // handleClick (on the <li>) probes matchMedia on desktop; jsdom omits it.
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  it('renders the event title from a factory-built event', () => {
    const wrapper = mountItem(makeEvent());
    expect(wrapper.text()).toContain('Test Event');
  });

  it('reflects an overridden title', () => {
    const wrapper = mountItem(makeEvent({ title: 'Trivia Night' }));
    expect(wrapper.text()).toContain('Trivia Night');
  });

  it('updates the rendered date when the event prop changes', async () => {
    const wrapper = mountItem(
      makeEvent({ startTime: '2026-08-01T18:00:00.000Z' })
    );

    expect(wrapper.text()).toContain('Aug');

    await wrapper.setProps({
      event: makeEvent({ startTime: '2026-09-15T18:00:00.000Z' }),
    });

    expect(wrapper.text()).toContain('Sep');
  });

  it('tags the root element with a per-event test id', () => {
    const wrapper = mountItem(makeEvent({ title: 'Trivia Night' }));
    expect(
      wrapper.find('[data-testid="event-list-item-Trivia Night"]').exists()
    ).toBe(true);
  });

  describe('status badges', () => {
    it('shows an Archived badge when any channel posting is archived', () => {
      const wrapper = mountItem(
        makeEvent({ EventChannels: [eventChannel({ archived: true })] })
      );
      expect(wrapper.text()).toContain('Archived');
    });

    it('does not show an Archived badge when no posting is archived', () => {
      const wrapper = mountItem(
        makeEvent({ EventChannels: [eventChannel({ archived: false })] })
      );
      expect(wrapper.text()).not.toContain('Archived');
    });

    it('shows a Canceled badge for a canceled event', () => {
      const wrapper = mountItem(makeEvent({ canceled: true }));
      expect(wrapper.text()).toContain('Canceled');
    });

    it('shows the location name and an Online event note', () => {
      const wrapper = mountItem(
        makeEvent({
          locationName: 'The Park',
          virtualEventUrl: 'https://example.com/live',
        })
      );
      expect(wrapper.text()).toContain('The Park');
      expect(wrapper.text()).toContain('Online event');
    });
  });

  describe('selection', () => {
    it('emits select with the event id and title when selectable', async () => {
      const wrapper = mountItem(makeEvent({ id: 'e1', title: 'Picnic' }), {
        isSelectable: true,
        selectedEventId: 'e1',
      });
      await wrapper.get('button[type="button"]').trigger('click');
      expect(wrapper.emitted('select')?.[0]).toEqual([
        { eventId: 'e1', title: 'Picnic' },
      ]);
    });

    it('does not emit select when the item is not selectable', async () => {
      const wrapper = mountItem(makeEvent({ id: 'e1', title: 'Picnic' }));
      await wrapper.get('button[type="button"]').trigger('click');
      expect(wrapper.emitted('select')).toBeUndefined();
    });
  });

  describe('tag filtering', () => {
    it('adds a tag to the route query when a tag is clicked', async () => {
      const wrapper = mountItem(
        makeEvent({ Tags: [{ __typename: 'Tag', text: 'music' }] as never })
      );
      await wrapper.findComponent(Tag).trigger('click');
      expect(router.replace).toHaveBeenCalledWith({
        query: { tags: 'music' },
      });
    });
  });
});
