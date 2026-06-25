import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import ChannelReportsPage from './channel-reports.vue';
import ChannelReportsList from '@/components/admin/ChannelReportsList.vue';

// FormRow is a Nuxt auto-import; render its #content slot so the list shows.
const FormRowStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.content?.() ?? slots.default?.());
  },
});

describe('admin channel reports page', () => {
  it('renders the channel reports list', () => {
    const wrapper = shallowMount(ChannelReportsPage, {
      global: { stubs: { FormRow: FormRowStub } },
    });
    expect(wrapper.findComponent(ChannelReportsList).exists()).toBe(true);
  });
});
