import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import EventItemInProfile from '@/components/user/EventItemInProfile.vue';
import type { Event } from '@/__generated__/graphql';

const h = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('nuxt/app', () => ({ useRouter: () => ({ push: h.push }) }));

const event = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'e1',
    title: 'An event',
    createdAt: '2024-01-01T00:00:00Z',
    Poster: { username: 'alice' },
    Tags: [{ text: 'music' }],
    EventChannels: [{ channelUniqueName: 'cats', Channel: { uniqueName: 'cats' } }],
    ...overrides,
  }) as unknown as Event;

const highlightStub = { name: 'HighlightedSearchTerms', props: ['text', 'searchInput'], template: '<span>{{ text }}</span>' };
const tagStub = { name: 'Tag', props: ['tag', 'active'], emits: ['click'], template: '<button class="tag" @click="$emit(\'click\')">{{ tag }}</button>' };

const mountItem = (props: Record<string, unknown> = {}) =>
  mount(EventItemInProfile, {
    props: { event: event(), ...props },
    global: {
      stubs: {
        HighlightedSearchTerms: highlightStub,
        Tag: tagStub,
        TagComponent: tagStub,
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EventItemInProfile content', () => {
  it('shows the title', () => {
    const wrapper = mountItem();

    expect(wrapper.text()).toContain('An event');
  });

  it('shows the posted-by line', () => {
    const wrapper = mountItem();

    expect(wrapper.text()).toContain('by alice');
  });

  it('falls back to Deleted for a missing poster', () => {
    const wrapper = mountItem({ event: event({ Poster: null }) });

    expect(wrapper.text()).toContain('by Deleted');
  });

  it('renders the tags', () => {
    const wrapper = mountItem();

    expect(wrapper.find('.tag').text()).toBe('music');
  });

  it('emits filterByTag when a tag is clicked', async () => {
    const wrapper = mountItem();

    await wrapper.find('.tag').trigger('click');

    expect(wrapper.emitted('filterByTag')?.[0]).toEqual(['music']);
  });

  it('links to the event channel', () => {
    const wrapper = mountItem();

    expect(wrapper.text()).toContain('c/cats');
  });
});

describe('EventItemInProfile navigation', () => {
  it('navigates to the event on click', async () => {
    const wrapper = mountItem();

    await wrapper.find('li').trigger('click');

    expect(h.push).toHaveBeenCalledWith('/forums/cats/events/e1');
  });

  it('does not navigate without a channel', async () => {
    const wrapper = mountItem({ event: event({ EventChannels: [] }) });

    await wrapper.find('li').trigger('click');

    expect(h.push).not.toHaveBeenCalled();
  });
});
