import { describe, expect, it } from 'vitest';

import SearchableForumListItem from '@/components/channel/SearchableForumListItem.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const mountItem = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(SearchableForumListItem, {
    props: {
      channel: {
        uniqueName: 'cats',
        displayName: 'Cats Forum',
        icon: '',
        description: 'All about cats',
      },
      selected: [],
      ...props,
    },
  });

describe('SearchableForumListItem', () => {
  it('renders the unique name test id', () => {
    const wrapper = mountItem();

    expect(wrapper.get('[data-testid="forum-picker-cats"]').text()).toBe('cats');
  });

  it('shows the display name when it differs from the unique name', () => {
    const wrapper = mountItem();

    expect(wrapper.text()).toContain('(Cats Forum)');
  });

  it('does not repeat the display name when it matches the unique name', () => {
    const wrapper = mountItem({
      channel: {
        uniqueName: 'cats',
        displayName: 'cats',
        icon: '',
        description: 'All about cats',
      },
    });

    expect(wrapper.text()).not.toContain('(cats)');
  });

  it('checks the box when the channel is selected', () => {
    const wrapper = mountItem({ selected: ['cats'] });

    expect((wrapper.get('input').element as HTMLInputElement).checked).toBe(true);
  });

  it('emits toggleSelection with the unique name on change', async () => {
    const wrapper = mountItem();

    await wrapper.get('input').trigger('change');

    expect(wrapper.emitted('toggleSelection')?.[0]).toEqual(['cats']);
  });
});
