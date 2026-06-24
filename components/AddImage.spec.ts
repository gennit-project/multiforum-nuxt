import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import AddImage from '@/components/AddImage.vue';

const mountAdd = (props: Record<string, unknown> = {}) =>
  mount(AddImage, { props });

describe('AddImage', () => {
  it('renders the default label', () => {
    const wrapper = mountAdd();

    expect(wrapper.text()).toContain('Add Image');
  });

  it('renders a custom label', () => {
    const wrapper = mountAdd({ label: 'Upload' });

    expect(wrapper.text()).toContain('Upload');
  });

  it('emits file-change with the field name on selection', async () => {
    const wrapper = mountAdd({ fieldName: 'avatar' });

    await wrapper.find('input[type="file"]').trigger('change');

    expect(wrapper.emitted('file-change')?.[0]?.[0]).toMatchObject({
      fieldName: 'avatar',
    });
  });

  it('does not emit when disabled', async () => {
    const wrapper = mountAdd({ disabled: true });

    await wrapper.find('input[type="file"]').trigger('change');

    expect(wrapper.emitted('file-change')).toBeUndefined();
  });

  it('disables the input when disabled', () => {
    const wrapper = mountAdd({ disabled: true });

    expect(wrapper.find('input[type="file"]').attributes('disabled')).toBeDefined();
  });
});
