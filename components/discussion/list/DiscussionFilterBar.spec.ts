import { describe, it, expect, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createMockRoute, createMockRouter } from '@/tests/utils/mockRouter';

import DiscussionFilterBar from '@/components/discussion/list/DiscussionFilterBar.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import SecondaryButton from '@/components/SecondaryButton.vue';

// Let the real useFilterBar run against a mocked route/router.
const route = createMockRoute({ name: 'DiscussionList' });
const router = createMockRouter();
vi.mock('nuxt/app', () => ({
  useRoute: () => route,
  useRouter: () => router,
}));

const heavyStubs = {
  SearchableForumList: true,
  SearchableTagList: true,
  SortButtons: true,
  FilterChip: true,
  PrimaryButton: true,
  SecondaryButton: true,
  ChannelIcon: true,
  TagIcon: true,
  FilterIcon: true,
  SearchIcon: true,
  SearchBar: true,
};

const mountBar = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(DiscussionFilterBar, {
    props: { isForumScoped: true, ...props },
    global: { stubs: heavyStubs },
  });

describe('DiscussionFilterBar', () => {
  it('renders the filter toggle button', () => {
    const wrapper = mountBar();
    expect(
      wrapper.find('[data-testid="discussion-filter-button"]').exists()
    ).toBe(true);
  });

  it('hides the search bar until the search toggle is clicked', async () => {
    const wrapper = mountBar();
    expect(
      wrapper.find('[data-testid="discussion-filter-search-bar"]').exists()
    ).toBe(false);
    await wrapper.get('[data-testid="discussion-search-button"]').trigger('click');
    expect(
      wrapper.find('[data-testid="discussion-filter-search-bar"]').exists()
    ).toBe(true);
  });

  it('reveals the filters section when the filter toggle is clicked', async () => {
    const wrapper = mountBar();
    expect(
      wrapper.find('[data-testid="show-archived-discussions"]').exists()
    ).toBe(false);
    await wrapper.get('[data-testid="discussion-filter-button"]').trigger('click');
    expect(
      wrapper.find('[data-testid="show-archived-discussions"]').exists()
    ).toBe(true);
  });

  it('emits openAbout when the inline about button is clicked', async () => {
    const wrapper = mountBar({ showAboutButton: true });
    const aboutButton = wrapper.findAll('button').find((button) => button.text() === 'About');
    expect(aboutButton).toBeTruthy();
    await aboutButton!.trigger('click');
    expect(wrapper.emitted('openAbout')).toBeTruthy();
  });

  it('uses the primary New Post button on a forum-scoped list', () => {
    const wrapper = mountBar({ isForumScoped: true });

    expect(wrapper.findComponent(PrimaryButton).exists()).toBe(true);
  });

  it('uses the secondary New Post button on the sitewide list', () => {
    const wrapper = mountBar({ isForumScoped: false });

    expect(wrapper.findComponent(SecondaryButton).exists()).toBe(true);
  });

  it('does not use the primary New Post button on the sitewide list', () => {
    const wrapper = mountBar({ isForumScoped: false });

    expect(wrapper.findComponent(PrimaryButton).exists()).toBe(false);
  });
});
