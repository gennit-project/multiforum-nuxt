import { describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import LibraryFavoriteRow from './LibraryFavoriteRow.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import type { LibraryFavoriteItem } from '@/types/library';

vi.mock('@/utils', () => ({ timeAgo: () => '2 days ago' }));

const actionsStub = defineComponent({
  name: 'LibraryFavoriteRowActions',
  props: ['itemId', 'itemKind', 'itemTitle'],
  emits: ['removed'],
  template:
    '<button data-testid="actions" @click="$emit(\'removed\', itemId)">Actions</button>',
});

const item: LibraryFavoriteItem = {
  id: 'discussion-1',
  kind: 'discussion',
  title: 'Compact libraries',
  summary: 'A saved discussion about compact design.',
  href: '/forums/design/discussions/discussion-1',
  thumbnailUrl: '/cover.jpg',
  createdAt: '2026-09-27T12:00:00.000Z',
  source: {
    forumName: 'Design Forum',
    forumUniqueName: 'design',
    uploaderName: 'Maya',
    uploaderUsername: 'maya',
  },
};

const mountRow = () =>
  mountWithDefaults(LibraryFavoriteRow, {
    props: { item },
    global: { stubs: { LibraryFavoriteRowActions: actionsStub } },
  });

describe('LibraryFavoriteRow', () => {
  it('renders the content title', () => {
    expect(mountRow().text()).toContain('Compact libraries');
  });

  it('links the source forum independently', () => {
    expect(mountRow().find('a[href="/forums/design"]').exists()).toBe(true);
  });

  it('links the original uploader independently', () => {
    expect(mountRow().find('a[href="/u/maya"]').exists()).toBe(true);
  });

  it('does not render selection checkboxes', () => {
    expect(mountRow().find('input[type="checkbox"]').exists()).toBe(false);
  });

  it('passes the item kind to the action menu', () => {
    expect(mountRow().getComponent(actionsStub).props('itemKind')).toBe(
      'discussion'
    );
  });

  it('forwards removal events to the unified list', async () => {
    const wrapper = mountRow();
    await wrapper.get('[data-testid="actions"]').trigger('click');
    expect(wrapper.emitted('removed')).toEqual([['discussion-1']]);
  });
});
