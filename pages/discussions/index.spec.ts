import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import DiscussionsIndexPage from './index.vue';
import SearchDiscussions from '@/components/discussion/list/SearchDiscussions.vue';

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

describe('sitewide discussions index page', () => {
  it('renders the discussion search in sitewide (non-forum-scoped) mode', () => {
    const search = shallowMount(DiscussionsIndexPage, {
      global: { stubs: { NuxtLayout: NuxtLayoutStub } },
    }).findComponent(SearchDiscussions);
    expect(search.props('isForumScoped')).toBe(false);
  });
});
