import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import TermsOfUsePage from './terms-of-use.vue';
import MarkdownLoader from '@/components/MarkdownLoader.vue';

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

describe('terms of use page', () => {
  it('loads the terms of use markdown content', () => {
    const loader = shallowMount(TermsOfUsePage, {
      global: { stubs: { NuxtLayout: NuxtLayoutStub } },
    }).findComponent(MarkdownLoader);
    expect(loader.props('slug')).toBe('terms/terms-of-use');
  });
});
