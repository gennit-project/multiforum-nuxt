import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import DownloadsIndexPage from './index.vue';
import SitewideDownloadList from '@/components/discussion/list/SitewideDownloadList.vue';
import DiscussionFilterBar from '@/components/discussion/list/DiscussionFilterBar.vue';

const SlotRenderingStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const buildWrapper = () =>
  shallowMount(DownloadsIndexPage, {
    global: {
      stubs: {
        NuxtLayout: SlotRenderingStub,
        // Render the list's default slot so we can assert the filter bar
        // is provided into it.
        SitewideDownloadList: SlotRenderingStub,
      },
    },
  });

describe('sitewide downloads index page', () => {
  it('renders the sitewide download list', () => {
    expect(buildWrapper().findComponent(SitewideDownloadList).exists()).toBe(
      true
    );
  });

  it('provides the discussion filter bar to the download list', () => {
    expect(buildWrapper().findComponent(DiscussionFilterBar).exists()).toBe(
      true
    );
  });
});
