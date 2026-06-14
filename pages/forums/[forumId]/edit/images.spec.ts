import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ImageSettingsPage from './images.vue';

const mountPage = () =>
  mount(ImageSettingsPage, {
    props: {
      formValues: {
        imageUploadsEnabled: true,
        markdownImagesEnabled: true,
      },
    },
    global: {
      stubs: {
        CheckBox: {
          props: ['id', 'checked', 'label'],
          template:
            '<button type="button" :data-testid="id" @click="$emit(\'update\', false)">{{ label }}</button>',
        },
      },
    },
  });

describe('ImageSettingsPage', () => {
  it('emits an upload preference update', async () => {
    const wrapper = mountPage();

    await wrapper.get('[data-testid="image-uploads-enabled"]').trigger('click');

    expect(wrapper.emitted('updateFormValues')?.[0]?.[0]).toEqual({
      imageUploadsEnabled: false,
    });
  });

  it('emits a markdown rendering preference update', async () => {
    const wrapper = mountPage();

    await wrapper
      .get('[data-testid="markdown-images-enabled"]')
      .trigger('click');

    expect(wrapper.emitted('updateFormValues')?.[0]?.[0]).toEqual({
      markdownImagesEnabled: false,
    });
  });
});
