import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import ImageReportsPage from './image-reports.vue';
import ImageReportsList from '@/components/admin/ImageReportsList.vue';

// FormRow is a Nuxt auto-import; render its #content slot so the list shows.
const FormRowStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.content?.() ?? slots.default?.());
  },
});

describe('admin image reports page', () => {
  it('renders the image reports list', () => {
    const wrapper = shallowMount(ImageReportsPage, {
      global: { stubs: { FormRow: FormRowStub } },
    });
    expect(wrapper.findComponent(ImageReportsList).exists()).toBe(true);
  });
});
