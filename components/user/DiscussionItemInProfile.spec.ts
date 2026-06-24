import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import DiscussionItemInProfile from '@/components/user/DiscussionItemInProfile.vue';
import type { Discussion } from '@/__generated__/graphql';

const h = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('nuxt/app', () => ({ useRouter: () => ({ push: h.push }) }));

const discussion = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'd1',
    title: 'A discussion',
    createdAt: '2024-01-01T00:00:00Z',
    Author: { username: 'alice' },
    Tags: [{ text: 'pets' }],
    DiscussionChannels: [{ Channel: { uniqueName: 'cats' }, channelUniqueName: 'cats' }],
    hasDownload: false,
    ...overrides,
  }) as unknown as Discussion;

const highlightStub = { name: 'HighlightedSearchTerms', props: ['text', 'searchInput'], template: '<span>{{ text }}</span>' };
const tagStub = { name: 'Tag', props: ['tag', 'active'], emits: ['click'], template: '<button class="tag" @click="$emit(\'click\')">{{ tag }}</button>' };

const mountItem = (props: Record<string, unknown> = {}) =>
  mount(DiscussionItemInProfile, {
    props: { discussion: discussion(), ...props },
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

describe('DiscussionItemInProfile content', () => {
  it('shows the title', () => {
    const wrapper = mountItem();

    expect(wrapper.text()).toContain('A discussion');
  });

  it('shows the posted-by line', () => {
    const wrapper = mountItem();

    expect(wrapper.text()).toContain('by alice');
  });

  it('falls back to Deleted for a missing author', () => {
    const wrapper = mountItem({ discussion: discussion({ Author: null }) });

    expect(wrapper.text()).toContain('by Deleted');
  });

  it('renders the tags', () => {
    const wrapper = mountItem();

    expect(wrapper.find('.tag').text()).toBe('pets');
  });

  it('emits filterByTag when a tag is clicked', async () => {
    const wrapper = mountItem();

    await wrapper.find('.tag').trigger('click');

    expect(wrapper.emitted('filterByTag')?.[0]).toEqual(['pets']);
  });
});

describe('DiscussionItemInProfile navigation', () => {
  it('navigates to the discussion on click', async () => {
    const wrapper = mountItem();

    await wrapper.find('li').trigger('click');

    expect(h.push).toHaveBeenCalledWith('/forums/cats/discussions/d1');
  });

  it('navigates to the download path for a download', async () => {
    const wrapper = mountItem({ discussion: discussion({ hasDownload: true }) });

    await wrapper.find('li').trigger('click');

    expect(h.push).toHaveBeenCalledWith('/forums/cats/downloads/d1');
  });

  it('does not navigate without a channel', async () => {
    const wrapper = mountItem({ discussion: discussion({ DiscussionChannels: [] }) });

    await wrapper.find('li').trigger('click');

    expect(h.push).not.toHaveBeenCalled();
  });

  it('shows a download view link for downloads', () => {
    const wrapper = mountItem({ discussion: discussion({ hasDownload: true }) });

    expect(wrapper.text()).toContain('View this download in');
  });
});
