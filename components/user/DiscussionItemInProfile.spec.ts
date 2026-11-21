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
    DiscussionChannels: [
      {
        Channel: { uniqueName: 'cats' },
        channelUniqueName: 'cats',
        discussionNumber: 12,
      },
    ],
    hasDownload: false,
    ...overrides,
  }) as unknown as Discussion;

const highlightStub = { name: 'HighlightedSearchTerms', props: ['text', 'searchInput'], template: '<span>{{ text }}</span>' };
const tagStub = { name: 'Tag', props: { tag: String, active: Boolean, interactive: { type: Boolean, default: false } }, emits: ['click'], template: '<button class="tag" @click="$emit(\'click\')">{{ tag }}</button>' };

const mountItem = (props: Record<string, unknown> = {}) =>
  mount(DiscussionItemInProfile, {
    props: { discussion: discussion(), ...props },
    global: {
      stubs: {
        HighlightedSearchTerms: highlightStub,
        Tag: tagStub,
        TagComponent: tagStub,
        NuxtLink: {
          props: ['to'],
          template: `<a :href="typeof to === 'string' ? to : ''"><slot /></a>`,
        },
        'nuxt-link': {
          props: ['to'],
          template: `<a :href="typeof to === 'string' ? to : ''"><slot /></a>`,
        },
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

  it('renders tags as non-interactive because no page filters by tag', () => {
    const wrapper = mountItem();

    expect(wrapper.getComponent(tagStub).props('interactive')).toBe(false);
  });
});

describe('DiscussionItemInProfile navigation', () => {
  const titleLink = (wrapper: ReturnType<typeof mountItem>) =>
    wrapper.findAll('a').find((a) => a.text().includes('A discussion'));

  it('links the keyboard-focusable title to the discussion', () => {
    const wrapper = mountItem();

    expect(titleLink(wrapper)?.attributes('href')).toBe(
      '/forums/cats/discussions/12-a-discussion'
    );
  });

  it('links the title to the download path for a download', () => {
    const wrapper = mountItem({ discussion: discussion({ hasDownload: true }) });

    expect(titleLink(wrapper)?.attributes('href')).toBe(
      '/forums/cats/downloads/12-a-discussion'
    );
  });

  it('renders the title without a link when there is no channel', () => {
    const wrapper = mountItem({
      discussion: discussion({ DiscussionChannels: [] }),
    });

    expect(titleLink(wrapper)).toBeUndefined();
  });

  it('shows a download view link for downloads', () => {
    const wrapper = mountItem({ discussion: discussion({ hasDownload: true }) });

    expect(wrapper.text()).toContain('View this download in');
  });
});
