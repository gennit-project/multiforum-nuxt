import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import IssueFilterBar from '@/components/admin/IssueFilterBar.vue';
import SearchBar from '@/components/SearchBar.vue';
import { issueSortValues } from '@/utils/issueSortOptions';

const buildWrapper = (props: Record<string, unknown> = {}) => {
  return mount(IssueFilterBar, {
    props: {
      searchInput: 'spam',
      selectedChannels: ['announcements'],
      channelLabel: '1 channel',
      startDate: '2026-05-01',
      endDate: '2026-07-01',
      showOnlyServerRuleViolations: true,
      selectedSort: issueSortValues.NEWEST,
      selectedSortLabel: 'Newest',
      ...props,
    },
    global: {
      stubs: {
        TextButtonDropdown: {
          name: 'TextButtonDropdown',
          props: ['label', 'items', 'showSortIcon'],
          emits: ['clicked-item'],
          template:
            '<button class="text-dropdown" @click="$emit(\'clicked-item\', showSortIcon ? \'oldest\' : \'all\')" />',
        },
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

  it('defaults the search placeholder to "Search issues"', () => {
    const wrapper = buildWrapper();

    expect(wrapper.getComponent(SearchBar).props('searchPlaceholder')).toBe(
      'Search issues'
    );
  });

  it('uses a custom search placeholder when provided', () => {
    const wrapper = buildWrapper({ searchPlaceholder: 'Search closed issues' });

    expect(wrapper.getComponent(SearchBar).props('searchPlaceholder')).toBe(
      'Search closed issues'
    );
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

  it('emits issue scope updates', async () => {
    const wrapper = buildWrapper();

    await wrapper.findAll('.text-dropdown')[1].trigger('click');

    expect(wrapper.emitted('update:showOnlyServerRuleViolations')).toEqual([
      [false],
    ]);
  });

  it('emits sort updates', async () => {
    const wrapper = buildWrapper();

    await wrapper.findAll('.text-dropdown')[0].trigger('click');

    expect(wrapper.emitted('update:sort')).toEqual([[issueSortValues.OLDEST]]);
  });

  it('hides the involvement filters when not enabled', () => {
    const wrapper = buildWrapper();

    expect(
      wrapper.find('[data-testid="issue-involvement-filters"]').exists()
    ).toBe(false);
  });

  it('shows the involvement filters when enabled', () => {
    const wrapper = buildWrapper({ showInvolvementFilters: true });

    expect(
      wrapper.find('[data-testid="issue-involvement-filters"]').exists()
    ).toBe(true);
  });

  it('reflects the checked state of an involvement filter prop', () => {
    const wrapper = buildWrapper({
      showInvolvementFilters: true,
      filterIReported: true,
    });

    expect(
      (
        wrapper.get('[data-testid="issue-filter-filterIReported"]')
          .element as HTMLInputElement
      ).checked
    ).toBe(true);
  });

  it('emits an involvement filter update when a checkbox is toggled', async () => {
    const wrapper = buildWrapper({ showInvolvementFilters: true });

    await wrapper
      .get('[data-testid="issue-filter-filterCreatedByMe"]')
      .setValue(true);

    expect(wrapper.emitted('update:involvementFilter')).toEqual([
      [{ key: 'filterCreatedByMe', value: true }],
    ]);
  });
});
