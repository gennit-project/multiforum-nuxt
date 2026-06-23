import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { DateTime } from 'luxon';
import { mount } from '@vue/test-utils';

import SidebarEventList from '@/components/channel/SidebarEventList.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  loading: null as unknown,
  error: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.result, loading: h.loading, error: h.error }),
}));
vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' } }),
}));

let idCounter = 0;
const event = (overrides: Record<string, unknown> = {}) => ({
  id: `e${idCounter++}`,
  title: 'Some Event',
  isAllDay: false,
  virtualEventUrl: '',
  ...overrides,
});

const nowEvent = (overrides = {}) =>
  event({
    // happeningNow() compares against new Date().toISOString() (UTC "Z"), so
    // these must be the same format rather than luxon's offset ISO.
    startTime: new Date(Date.now() - 3_600_000).toISOString(),
    endTime: new Date(Date.now() + 3_600_000).toISOString(),
    ...overrides,
  });

const tomorrowEvent = (overrides = {}) =>
  event({
    startTime: DateTime.now().startOf('day').plus({ days: 1, hours: 12 }).toISO(),
    endTime: DateTime.now().startOf('day').plus({ days: 1, hours: 13 }).toISO(),
    ...overrides,
  });

const futureEvent = (overrides = {}) =>
  event({
    startTime: DateTime.now().startOf('day').plus({ days: 3, hours: 12 }).toISO(),
    endTime: DateTime.now().startOf('day').plus({ days: 3, hours: 13 }).toISO(),
    ...overrides,
  });

const mountList = (events: unknown[], eventChannelsAggregate = events.length) =>
  mount(SidebarEventList, {
    props: { eventChannelsAggregate },
    global: {
      stubs: {
        NuxtLink: { template: '<a><slot /></a>' },
        'nuxt-link': { template: '<a><slot /></a>' },
      },
    },
  });

beforeEach(() => {
  idCounter = 0;
  h.result = ref({ events: [] });
  h.loading = ref(false);
  h.error = ref(null);
});

describe('SidebarEventList loading and empty states', () => {
  it('renders nothing while the events query is loading', () => {
    (h.loading as { value: boolean }).value = true;
    const wrapper = mountList([nowEvent()]);

    expect(wrapper.text().trim()).toBe('');
  });

  it('renders nothing when there are no events', () => {
    const wrapper = mountList([]);

    expect(wrapper.text().trim()).toBe('');
  });
});

describe('SidebarEventList time buckets', () => {
  it('shows the Happening Now section for an in-progress event', () => {
    (h.result as { value: unknown }).value = { events: [nowEvent()] };
    const wrapper = mountList([nowEvent()]);

    expect(wrapper.text()).toContain('Happening Now');
  });

  it('shows the Tomorrow section for an event starting tomorrow', () => {
    (h.result as { value: unknown }).value = { events: [tomorrowEvent()] };
    const wrapper = mountList([tomorrowEvent()]);

    expect(wrapper.text()).toContain('Tomorrow');
  });

  it('groups later events under a date heading', () => {
    const e = futureEvent();
    (h.result as { value: unknown }).value = { events: [e] };
    const wrapper = mountList([e]);
    const heading = DateTime.fromISO(e.startTime as string).toLocaleString({
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    expect(wrapper.text()).toContain(heading);
  });
});

describe('SidebarEventList link text', () => {
  it('prefixes timed events with the start time', () => {
    (h.result as { value: unknown }).value = {
      events: [nowEvent({ title: 'Standup' })],
    };
    const wrapper = mountList([nowEvent()]);

    expect(wrapper.text()).toContain('· Standup');
  });

  it('labels all-day events as "All Day"', () => {
    (h.result as { value: unknown }).value = {
      events: [nowEvent({ isAllDay: true, title: 'Festival' })],
    };
    const wrapper = mountList([nowEvent()]);

    expect(wrapper.text()).toContain('All Day · Festival');
  });

  it('shows an online-event link when a virtual URL is present', () => {
    (h.result as { value: unknown }).value = {
      events: [nowEvent({ virtualEventUrl: 'https://meet.example.com' })],
    };
    const wrapper = mountList([nowEvent()]);

    expect(wrapper.text()).toContain('Go to online event');
  });
});

describe('SidebarEventList view-all link', () => {
  it('shows "View all events" when more events exist than are shown', () => {
    (h.result as { value: unknown }).value = { events: [nowEvent()] };
    const wrapper = mountList([nowEvent()], 25);

    expect(wrapper.text()).toContain('View all events');
  });

  it('hides "View all events" when all events are shown', () => {
    (h.result as { value: unknown }).value = { events: [nowEvent()] };
    const wrapper = mountList([nowEvent()], 1);

    expect(wrapper.text()).not.toContain('View all events');
  });
});
