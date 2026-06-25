import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import PrivacyPolicyPage from './privacy-policy.vue';
import MarkdownLoader from '@/components/MarkdownLoader.vue';

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

describe('privacy policy page', () => {
  it('loads the privacy policy markdown content', () => {
    const loader = shallowMount(PrivacyPolicyPage, {
      global: { stubs: { NuxtLayout: NuxtLayoutStub } },
    }).findComponent(MarkdownLoader);
    expect(loader.props('slug')).toBe('terms/privacy-policy');
  });
});
