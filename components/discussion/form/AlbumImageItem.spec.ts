import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AlbumImageItem from './AlbumImageItem.vue';

vi.mock('@/composables/useDisplay', () => ({ useDisplay: () => ({ mdAndDown: false }) }));

const image = { url: 'https://img.test/a.png', alt: 'A', caption: 'C', copyright: '' };

const mountItem = (props: Record<string, unknown> = {}) =>
  mount(AlbumImageItem, {
    props: {
      image,
      index: 0,
      isFirst: false,
      isLast: false,
      isLoading: false,
      ...props,
    },
    global: {
      stubs: {
        XmarkIcon: true,
        LoadingSpinner: true,
        ExpandableImage: true,
        ModelViewer: true,
        StlViewer: true,
        ClientOnly: { template: '<div><slot /></div>' },
        FormRow: { template: '<div><slot name="content" /></div>' },
        TextInput: {
          props: ['value'],
          template: '<input class="ti" @input="$emit(\'update\', \'changed\')" >',
        },
      },
    },
  });

describe('AlbumImageItem', () => {
  it('labels the image with its 1-based index', () => {
    expect(mountItem({ index: 2 }).text()).toContain('Image 3');
  });

  it('disables the move-up button for the first image', () => {
    const upButton = mountItem({ isFirst: true }).findAll('button')[0];
    expect((upButton.element as HTMLButtonElement).disabled).toBe(true);
  });

  it('emits delete when the delete button is clicked', async () => {
    const wrapper = mountItem();
    await wrapper.findAll('button').at(-1)?.trigger('click');
    expect(wrapper.emitted('delete')).toBeTruthy();
  });

  it('emits move-down when the down button is clicked', async () => {
    const wrapper = mountItem();
    await wrapper.findAll('button')[1].trigger('click');
    expect(wrapper.emitted('move-down')).toBeTruthy();
  });

  it('emits update-field with the field key when a text input changes', async () => {
    const wrapper = mountItem();
    await wrapper.findAll('.ti')[0].trigger('input');
    expect(wrapper.emitted('update-field')?.[0]).toEqual(['url', 'changed']);
  });
});
