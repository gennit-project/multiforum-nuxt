import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Collection } from '@/__generated__/graphql';
import PublicCollectionListItem from './PublicCollectionListItem.vue';

const mountItem = (collection: Partial<Collection>) =>
  mount(PublicCollectionListItem, {
    props: { collection },
    global: {
      stubs: {
        NuxtLink: { template: '<a><slot /></a>' },
        CollectionDownloadListItem: { template: '<li class="dl" />' },
      },
    },
  });

describe('PublicCollectionListItem', () => {
  it('renders the collection name', () => {
    expect(mountItem({ id: 'c1', name: 'My Models' }).text()).toContain(
      'My Models'
    );
  });

  it('shows the creator display name with username', () => {
    const wrapper = mountItem({
      id: 'c1',
      name: 'X',
      CreatedBy: { username: 'alice', displayName: 'Alice' },
    } as unknown as Partial<Collection>);
    expect(wrapper.text()).toContain('Alice (alice)');
  });

  it('falls back to "Unknown user" with no creator', () => {
    expect(mountItem({ id: 'c1', name: 'X' }).text()).toContain('Unknown user');
  });

  it('shows the empty-downloads message when there are none', () => {
    expect(mountItem({ id: 'c1', name: 'X' }).text()).toContain(
      'No downloads in this collection yet.'
    );
  });

  it('renders at most five download previews', () => {
    const downloads = Array.from({ length: 7 }, (_, i) => ({ id: `d${i}` }));
    const wrapper = mountItem({
      id: 'c1',
      name: 'X',
      Downloads: downloads,
    } as unknown as Partial<Collection>);
    expect(wrapper.findAll('.dl')).toHaveLength(5);
  });
});
