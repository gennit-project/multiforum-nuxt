import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Event } from '@/__generated__/graphql';
import MapEventCard from './MapEventCard.vue';
import SeriesOccurrenceButtons from '../list/SeriesOccurrenceButtons.vue';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('nuxt/app', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ path: '/events/list/search', query: {} }),
}));

const event = {
  id: 'trivia',
  title: 'Crescent Ballroom Trivia',
  startTime: '2026-11-17T18:00:00',
  endTime: '2026-11-17T20:00:00',
  locationName: 'Crescent Ballroom',
  isAllDay: false,
  free: false,
  canceled: false,
  coverImageURL: '',
  EventChannels: [],
  Tags: [{ text: 'Trivia' }],
} as Event;
const mountCard = (overrides: Partial<Event> = {}, props = {}) =>
  mount(MapEventCard, {
    props: { event: { ...event, ...overrides }, ...props },
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        SeriesOccurrenceButtons: true,
        AppImage: {
          props: ['src', 'alt'],
          template: '<img :src="src" :alt="alt">',
        },
        HighlightedSearchTerms: {
          props: ['text'],
          template: '<span>{{ text }}</span>',
        },
      },
    },
  });

describe('MapEventCard', () => {
  it('opens a preview from its named native button', async () => {
    const wrapper = mountCard();
    await wrapper
      .get('button[aria-label="Preview Crescent Ballroom Trivia"]')
      .trigger('click');
    expect(wrapper.emitted('openPreview')).toHaveLength(1);
  });
  it('filters by tag without opening the preview', async () => {
    const wrapper = mountCard();
    await wrapper.get('button[aria-pressed]').trigger('click');
    expect({
      filter: wrapper.emitted('filterByTag'),
      preview: wrapper.emitted('openPreview'),
    }).toEqual({ filter: [['Trivia']], preview: undefined });
  });
  it('announces active tags', () => {
    expect(
      mountCard({}, { selectedTags: ['Trivia'] })
        .get('button[aria-pressed]')
        .attributes('aria-pressed')
    ).toBe('true');
  });
  it('shows a full machine-readable start date', () => {
    expect(mountCard().get('time').attributes('datetime')).toBe(
      event.startTime
    );
  });
  it('shows venue and start time', () => {
    expect(mountCard().text()).toMatch(/Crescent Ballroom.*6:00 PM/);
  });
  it('renders an optional thumbnail as decorative beside the title', () => {
    expect(
      mountCard({ coverImageURL: '/trivia.jpg' }).get('img').attributes('alt')
    ).toBe('');
  });
  it('omits the thumbnail when there is no image', () => {
    expect(mountCard().find('img').exists()).toBe(false);
  });
  it.each([
    [{ canceled: true }, 'Canceled'],
    [{ free: true }, 'Free'],
    [{ isAllDay: true }, 'all day'],
    [{ EventChannels: [{ archived: true }] }, 'Archived'],
    [{ EventSeries: { id: 'series' } }, 'Series'],
    [{ endTime: '2026-11-20T18:00:00' }, 'Multiple days'],
  ])('preserves event status %j', (overrides, label) => {
    expect(mountCard(overrides as Partial<Event>).text()).toContain(label);
  });
  it('uses a visible outline for a highlighted event', () => {
    expect(mountCard({}, { isHighlighted: true }).classes()).toContain(
      'ring-1'
    );
  });
  it('supports events without tags or a venue', () => {
    expect(
      mountCard({ Tags: [], locationName: '' }).findAll('button')
    ).toHaveLength(1);
  });
});

it('preserves links to other dates in a series', () => {
  const occurrences = [
    { id: 'trivia', startTime: '2030-11-17T18:00:00' },
    { id: 'next', startTime: '2030-11-24T18:00:00' },
  ];
  const wrapper = mountCard({
    EventSeries: { id: 'series', Occurrences: occurrences },
  } as Partial<Event>);
  expect(
    wrapper.getComponent(SeriesOccurrenceButtons).props('occurrences')
  ).toEqual(occurrences);
});

describe('online discovery cards', () => {
  it('shows one event-wide count even when forum submissions have different counts', () => {
    const wrapper = mountCard(
      {
        CommentsAggregate: { count: 9 },
        EventChannels: [
          { channelUniqueName: 'cats', CommentsAggregate: { count: 4 } },
          { channelUniqueName: 'books', CommentsAggregate: { count: 5 } },
        ],
      } as Partial<Event>,
      { onlineList: true }
    );
    expect(wrapper.text()).toContain('9 comments · Shared across all forums');
  });
  it('marks the selected online event', () => {
    expect(
      mountCard({}, { onlineList: true, selectedEventId: 'trivia' }).classes()
    ).toContain('ring-1');
  });
  it('selects the event in the desktop reading pane', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true }))
    );
    const wrapper = mountCard({}, { onlineList: true });
    await wrapper.get('button[aria-label]').trigger('click');
    expect(wrapper.emitted('select')).toEqual([
      [{ eventId: 'trivia', title: event.title }],
    ]);
    vi.unstubAllGlobals();
  });
  it('opens the full event on mobile', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false }))
    );
    const wrapper = mountCard(
      { EventChannels: [{ channelUniqueName: 'books' }] } as Partial<Event>,
      { onlineList: true }
    );
    await wrapper.get('button[aria-label]').trigger('click');
    expect(push).toHaveBeenCalledWith('/forums/books/events/trivia');
    vi.unstubAllGlobals();
  });
});
