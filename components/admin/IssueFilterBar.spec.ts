import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import IssueFilterBar from '@/components/admin/IssueFilterBar.vue';
import SearchBar from '@/components/SearchBar.vue';

const buildWrapper = () => {
  return mount(IssueFilterBar, {
    props: {
      searchInput: 'spam',
      selectedChannels: ['announcements'],
      channelLabel: '1 channel',
      startDate: '2026-05-01',
      endDate: '2026-07-01',
      showOnlyServerRuleViolations: true,
    },
    global: {
      stubs: {
        FilterChip: {
          name: 'FilterChip',
          template: '<div><slot name="icon" /><slot name="content" /></div>',
        },
        SearchableForumList: {
          name: 'SearchableForumList',
          props: ['selectedChannels'],
          emits: ['toggle-selection'],
          template: '<button class="forum-list" @click="$emit(\'toggle-selection\', \'cats\')" />',
        },
      },
    },
  });
};

describe('IssueFilterBar', () => {
  it('emits search updates', async () => {
    const wrapper = buildWrapper();

    await wrapper
      .getComponent(SearchBar)
      .vm.$emit('update-search-input', 'needle');

    expect(wrapper.emitted('update-search-input')).toEqual([['needle']]);
  });

  it('emits date updates', async () => {
    const wrapper = buildWrapper();

    await wrapper.get('[data-testid="admin-issues-start-date"]').setValue('2026-06-01');
    await wrapper.get('[data-testid="admin-issues-end-date"]').setValue('2026-06-30');

    expect(wrapper.emitted('update:startDate')).toEqual([['2026-06-01']]);
    expect(wrapper.emitted('update:endDate')).toEqual([['2026-06-30']]);
  });

  it('emits selected channel toggles', async () => {
    const wrapper = buildWrapper();

    await wrapper.get('.forum-list').trigger('click');

    expect(wrapper.emitted('toggle-selected-channel')).toEqual([['cats']]);
  });

  it('emits checkbox updates', async () => {
    const wrapper = buildWrapper();

    await wrapper
      .get('[data-testid="show-only-server-rule-violations"]')
      .setValue(false);

    expect(wrapper.emitted('update:showOnlyServerRuleViolations')).toEqual([
      [false],
    ]);
  });
});
