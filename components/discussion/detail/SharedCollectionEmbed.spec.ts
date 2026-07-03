import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import SharedCollectionEmbed from '@/components/discussion/detail/SharedCollectionEmbed.vue';
import type { Collection } from '@/__generated__/graphql';

const collection = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'col-1',
    name: 'Sims 4 builds',
    description: 'My favorite lots.',
    collectionType: 'DOWNLOADS',
    itemCount: 3,
    CreatedBy: { username: 'alice', displayName: 'Alice' },
    ...overrides,
  }) as Partial<Collection>;

const mountEmbed = (props: Record<string, unknown> = {}) =>
  mount(SharedCollectionEmbed, {
    props: { collection: collection(), ...props },
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a :data-to="to"><slot /></a>' },
        'nuxt-link': {
          props: ['to'],
          template: '<a :data-to="to"><slot /></a>',
        },
      },
    },
  });

describe('SharedCollectionEmbed', () => {
  it('shows the shared collection label', () => {
    expect(mountEmbed().text()).toContain('Shared Collection');
  });

  it('links to the public collection page', () => {
    const wrapper = mountEmbed();

    expect(wrapper.find('a').text()).toContain('Sims 4 builds');
    expect(wrapper.find('a').attributes('data-to')).toBe('/collections/col-1');
  });

  it('shows owner, type, item count, and description', () => {
    const text = mountEmbed().text();

    expect(text).toContain('Alice');
    expect(text).toContain('Downloads');
    expect(text).toContain('3 items');
    expect(text).toContain('My favorite lots.');
  });

  it('falls back when owner and description are missing', () => {
    const wrapper = mountEmbed({
      collection: collection({ CreatedBy: null, description: '' }),
    });

    expect(wrapper.text()).toContain('Unknown user');
    expect(wrapper.text()).toContain('No description provided');
  });

  it('shows the embed notice when requested', () => {
    expect(mountEmbed({ showEmbedNotice: true }).text()).toContain(
      'will be embedded with your discussion'
    );
  });
});
