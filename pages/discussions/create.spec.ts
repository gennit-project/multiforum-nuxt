import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import CreateDiscussionPage from './create.vue';
import CreateDiscussion from '@/components/discussion/form/CreateDiscussion.vue';

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

describe('sitewide create discussion page', () => {
  it('renders the create discussion form', () => {
    const wrapper = shallowMount(CreateDiscussionPage, {
      global: { stubs: { NuxtLayout: NuxtLayoutStub } },
    });
    expect(wrapper.findComponent(CreateDiscussion).exists()).toBe(true);
  });
});
