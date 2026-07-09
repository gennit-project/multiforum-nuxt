import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import IssueDetailPage from './[issueNumber].vue';
import IssueDetail from '@/components/mod/IssueDetail.vue';

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

describe('public server issue detail page', () => {
  it('renders the issue detail component', () => {
    const wrapper = shallowMount(IssueDetailPage, {
      global: { stubs: { NuxtLayout: NuxtLayoutStub } },
    });
    expect(wrapper.findComponent(IssueDetail).exists()).toBe(true);
  });
});
