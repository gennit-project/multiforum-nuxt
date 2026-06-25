import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import AboutPage from './about.vue';
import MarkdownLoader from '@/components/MarkdownLoader.vue';

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const buildWrapper = () =>
  shallowMount(AboutPage, {
    global: { stubs: { NuxtLayout: NuxtLayoutStub } },
  });

describe('about page', () => {
  it('loads the "about" markdown content', () => {
    const loader = buildWrapper().findComponent(MarkdownLoader);
    expect(loader.props('slug')).toBe('about');
  });
});
