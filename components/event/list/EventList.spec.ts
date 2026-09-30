import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import type { Event } from '@/__generated__/graphql';

import EventList from '@/components/event/list/EventList.vue';

const h = vi.hoisted(() => ({ route: null as unknown, push: vi.fn() }));

vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useRouter: () => ({ push: h.push }),
}));
vi.mock('@/cache', () => ({ sideNavIsOpenVar: false }));

const event = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'e1',
    location: { latitude: 1, longitude: 2 },
    EventChannels: [{ channelUniqueName: 'cats' }],
    ...overrides,
  }) as unknown as Event;

const mountList = (props: Record<string, unknown> = {}) =>
  mount(EventList, {
    props: { events: [event()], resultCount: 1, ...props },
    global: {
      stubs: {
        MapEventCard: {
          name: 'MapEventCard',
          props: ['event', 'isHighlighted'],
          emits: [
            'mouseover',
            'mouseleave',
            'focusin',
            'focusout',
            'open-preview',
            'filter-by-tag',
          ],
          template: '<li />',
        },
        EventListItem: {
          name: 'EventListItem',
          props: ['event'],
          emits: [
            'select',
            'mouseover',
            'mouseleave',
            'clicked-event-list-item',
            'filter-by-tag',
            'filter-by-channel',
            'open-preview',
          ],
          template: '<li />',
        },
        LoadMore: {
          name: 'LoadMore',
          props: ['reachedEndOfResults'],
          emits: ['load-more'],
          template: '<div />',
        },
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

const firstItem = (w: ReturnType<typeof mount>) =>
  w.findComponent({ name: 'MapEventCard' }).exists()
    ? w.getComponent({ name: 'MapEventCard' })
    : w.getComponent({ name: 'EventListItem' });

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { params: { forumId: 'cats' } };
});

describe('EventList empty states', () => {
  it('prompts to create an event in list mode', () => {
    const wrapper = mountList({ events: [] });

    expect(wrapper.text()).toContain('Could not find any events');
  });

  it('shows the map empty message in map mode', () => {
    const wrapper = mountList({ events: [], showMap: true });

    expect(wrapper.text()).toContain('shown on a map');
  });
});

describe('EventList rendering', () => {
  it('renders an item per event', () => {
    const wrapper = mountList({
      events: [event(), event({ id: 'e2' })],
    });

    expect(wrapper.findAllComponents({ name: 'EventListItem' })).toHaveLength(
      2
    );
  });

  it('reports the end of results when all events are loaded', () => {
    const wrapper = mountList({ events: [event()], resultCount: 1 });

    expect(
      wrapper.getComponent({ name: 'LoadMore' }).props('reachedEndOfResults')
    ).toBe(true);
  });
});

describe('EventList navigation', () => {
  it('navigates to the event using the forum from the route', async () => {
    const wrapper = mountList();

    await firstItem(wrapper).vm.$emit('clicked-event-list-item');

    expect(h.push).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { eventId: 'e1', forumId: 'cats' },
      })
    );
  });

  it('falls back to the event channel when no forum is in the route', async () => {
    h.route = { params: {} };
    const wrapper = mountList();

    await firstItem(wrapper).vm.$emit('clicked-event-list-item');

    expect(h.push).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { eventId: 'e1', forumId: 'cats' },
      })
    );
  });

  it('opens a preview instead of navigating in map mode', async () => {
    const wrapper = mountList({ showMap: true });

    await firstItem(wrapper).vm.$emit('open-preview');
    await flushPromises();
    expect({
      event: wrapper.emitted('openPreview')?.[0],
      navigated: h.push.mock.calls.length,
    }).toEqual({ event: [event()], navigated: 0 });
  });
});

describe('EventList map interactions', () => {
  it('highlights an event on hover in map mode', async () => {
    const wrapper = mountList({ showMap: true });

    await firstItem(wrapper).vm.$emit('mouseover');

    expect(wrapper.emitted('highlightEvent')?.[0]?.[1]).toBe('e1');
  });

  it('unhighlights on mouse leave in map mode', async () => {
    const wrapper = mountList({ showMap: true });

    await firstItem(wrapper).vm.$emit('mouseleave');

    expect(wrapper.emitted('unhighlight')).toBeTruthy();
  });

  it('does not highlight on hover outside map mode', async () => {
    const wrapper = mountList({ showMap: false });

    await firstItem(wrapper).vm.$emit('mouseover');

    expect(wrapper.emitted('highlightEvent')).toBeUndefined();
  });
});

describe('EventList re-emits', () => {
  it('re-emits filterByTag', async () => {
    const wrapper = mountList();

    await firstItem(wrapper).vm.$emit('filter-by-tag', 'music');

    expect(wrapper.emitted('filterByTag')?.[0]).toEqual(['music']);
  });

  it('re-emits select', async () => {
    const wrapper = mountList();

    await firstItem(wrapper).vm.$emit('select', 'e1');

    expect(wrapper.emitted('select')?.[0]).toEqual(['e1']);
  });

  it('highlights then opens a preview on open-preview', async () => {
    const wrapper = mountList({ showMap: true });

    await firstItem(wrapper).vm.$emit('open-preview');
    await flushPromises();

    expect(wrapper.emitted('highlightEvent')).toBeTruthy();
    expect(wrapper.emitted('openPreview')).toBeTruthy();
  });
});

describe('map card keyboard interactions', () => {
  it('highlights a card when keyboard focus enters it', async () => {
    const wrapper = mountList({ showMap: true });
    await firstItem(wrapper).vm.$emit('focusin');
    expect(wrapper.emitted('highlightEvent')?.[0]?.[1]).toBe('e1');
  });
  it('clears the highlight when focus leaves', async () => {
    const wrapper = mountList({ showMap: true });
    await firstItem(wrapper).vm.$emit('focusout');
    expect(wrapper.emitted('unhighlight')).toBeTruthy();
  });
});
