import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import CrosspostedDiscussionEmbed from '@/components/discussion/detail/CrosspostedDiscussionEmbed.vue';
import type { Discussion } from '@/__generated__/graphql';

const discussion = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'd1',
    title: 'A crosspost',
    body: 'some body',
    Author: { username: 'alice' },
    DiscussionChannels: [{ channelUniqueName: 'cats', Channel: { displayName: 'Cats' } }],
    Album: { Images: [] },
    ...overrides,
  }) as unknown as Discussion;

const mountEmbed = (props: Record<string, unknown> = {}) =>
  mount(CrosspostedDiscussionEmbed, {
    props: { discussion: discussion(), ...props },
    global: {
      stubs: {
        MarkdownPreview: { name: 'MarkdownPreview', props: ['text'], template: '<div class="md">{{ text }}</div>' },
        DiscussionAlbum: { name: 'DiscussionAlbum', template: '<div class="album" />' },
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

describe('CrosspostedDiscussionEmbed content', () => {
  it('shows the crosspost label', () => {
    const wrapper = mountEmbed();

    expect(wrapper.text()).toContain('Crossposted Discussion');
  });

  it('shows the title as a link when the discussion is linkable', () => {
    const wrapper = mountEmbed();

    expect(wrapper.find('a').text()).toContain('A crosspost');
  });

  it('shows the title as plain text without a channel', () => {
    const wrapper = mountEmbed({
      discussion: discussion({ DiscussionChannels: [] }),
    });

    expect(wrapper.find('a').exists()).toBe(false);
  });

  it('shows the author and channel', () => {
    const wrapper = mountEmbed();

    expect(wrapper.text()).toContain('alice');
  });

  it('shows the channel display name', () => {
    const wrapper = mountEmbed();

    expect(wrapper.text()).toContain('in Cats');
  });

  it('falls back to Unknown user for a missing author', () => {
    const wrapper = mountEmbed({ discussion: discussion({ Author: null }) });

    expect(wrapper.text()).toContain('Unknown user');
  });
});

describe('CrosspostedDiscussionEmbed body', () => {
  it('renders the body preview when there is a body', () => {
    const wrapper = mountEmbed();

    expect(wrapper.find('.md').text()).toBe('some body');
  });

  it('shows a no-description message when there is no body', () => {
    const wrapper = mountEmbed({ discussion: discussion({ body: '' }) });

    expect(wrapper.text()).toContain('No description provided');
  });

  it('renders the album when there are images', async () => {
    const wrapper = mountEmbed({
      discussion: discussion({ Album: { Images: [{ id: 'i1' }] } }),
    });
    await flushPromises();

    expect(wrapper.find('.album').exists()).toBe(true);
  });

  it('shows the embed notice when requested', () => {
    const wrapper = mountEmbed({ showEmbedNotice: true });

    expect(wrapper.text()).toContain('will be embedded with your discussion');
  });
});
