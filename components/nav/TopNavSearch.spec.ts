import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchBar from '@/components/SearchBar.vue';
import { createMockRouter } from '@/tests/utils/mockRouter';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import TopNavSearch from '@/components/nav/TopNavSearch.vue';

const router = createMockRouter();

vi.mock('nuxt/app', () => ({
  useRouter: () => router,
}));

// getChannelLabel is the only real util used by the template's computeds.
vi.mock('@/utils', () => ({
  getChannelLabel: (channels: string[]) =>
    channels.length ? channels.join(', ') : 'All Forums',
}));

const mountSearch = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(TopNavSearch, {
    props,
    global: {
      stubs: {
        FilterChip: true,
        SearchableForumList: true,
        ChannelIcon: true,
        SearchIcon: true,
      },
    },
  });

const submitSearch = async (
  wrapper: ReturnType<typeof mountSearch>,
  value: string
) => {
  await wrapper.findComponent(SearchBar).vm.$emit('submit', value);
};

describe('TopNavSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('pushes the discussions route for the default search type', async () => {
    const wrapper = mountSearch();
    await submitSearch(wrapper, 'cats');
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/discussions' })
    );
  });

  it('includes the trimmed search input in the route query', async () => {
    const wrapper = mountSearch();
    await submitSearch(wrapper, '  cats  ');
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ searchInput: 'cats' }),
      })
    );
  });

  it('marks the search as open in the route query', async () => {
    const wrapper = mountSearch();
    await submitSearch(wrapper, 'cats');
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ searchOpen: 'true' }),
      })
    );
  });

  describe('popover open/close', () => {
    it('opens on the "/" shortcut and closes on Escape', async () => {
      const wrapper = mountSearch();
      expect(wrapper.text()).not.toContain('Recent searches');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain('Recent searches');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).not.toContain('Recent searches');
      wrapper.unmount();
    });

    it('ignores the "/" shortcut while typing in an input', async () => {
      const wrapper = mountSearch();
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: '/', bubbles: true })
      );
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).not.toContain('Recent searches');
      input.remove();
      wrapper.unmount();
    });

    it('closes when a click lands outside the component', async () => {
      const wrapper = mountSearch();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain('Recent searches');

      document.body.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true })
      );
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).not.toContain('Recent searches');
      wrapper.unmount();
    });

    it('toggles open and closed from the icon-only search button', async () => {
      const wrapper = mountSearch({ iconOnly: true });
      const button = wrapper.get(
        '[data-testid="mobile-top-nav-search-button"]'
      );

      await button.trigger('click');
      expect(wrapper.text()).toContain('Recent searches');

      await button.trigger('click');
      expect(wrapper.text()).not.toContain('Recent searches');
      wrapper.unmount();
    });
  });

  describe('recent searches', () => {
    it('starts empty', async () => {
      const wrapper = mountSearch();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain('No recent searches yet.');
      wrapper.unmount();
    });

    it('records a submitted search and re-runs it on click', async () => {
      const wrapper = mountSearch();
      await submitSearch(wrapper, 'dogs');

      // Re-open the popover; the just-recorded search should be listed.
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
      await wrapper.vm.$nextTick();
      const recent = wrapper.get('ul[aria-label="Recent searches"] button');
      expect(recent.text()).toContain('dogs');

      router.push.mockClear();
      await recent.trigger('click');
      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ searchInput: 'dogs' }),
        })
      );
      wrapper.unmount();
    });
  });
});
