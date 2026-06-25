import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import CreateDownloadPage from './create.vue';
import CreateDownload from '@/components/download/form/CreateDownload.vue';

describe('forum create download page', () => {
  it('renders the create download form', () => {
    const wrapper = shallowMount(CreateDownloadPage);
    expect(wrapper.findComponent(CreateDownload).exists()).toBe(true);
  });
});
