import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AlbumImageItem from './AlbumImageItem.vue';

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
        TrashIcon: true,
        ChevronDownIcon: true,
        LoadingSpinner: true,
        ExpandableImage: true,
        ModelViewer: true,
        StlViewer: true,
        ClientOnly: { template: '<div><slot /></div>' },
        TextInput: {
          props: ['value'],
          template: '<input class="ti" @input="$emit(\'update\', \'changed\')" >',
        },
      },
    },
  });

const buttonByName = (wrapper: ReturnType<typeof mountItem>, name: string) =>
  wrapper.get(`button[aria-label="${name}"]`);

const moreToggle = (wrapper: ReturnType<typeof mountItem>) =>
  wrapper.get('button[aria-expanded]');

describe('AlbumImageItem', () => {
  it('labels the image with its 1-based index for screen readers', () => {
    expect(mountItem({ index: 2 }).get('.sr-only').text()).toBe('Image 3');
  });

  it('gives each icon control a descriptive accessible name', () => {
    expect(
      mountItem({ index: 1 })
        .findAll('button[aria-label]')
        .map((button) => button.attributes('aria-label'))
    ).toEqual([
      'Move image 2 up',
      'Move image 2 down',
      'Remove image 2 from album',
    ]);
  });

  it('disables the move-up button for the first image', () => {
    const upButton = buttonByName(mountItem({ isFirst: true }), 'Move image 1 up');
    expect((upButton.element as HTMLButtonElement).disabled).toBe(true);
  });

  it('emits delete when the delete button is clicked', async () => {
    const wrapper = mountItem();
    await buttonByName(wrapper, 'Remove image 1 from album').trigger('click');
    expect(wrapper.emitted('delete')).toBeTruthy();
  });

  it('emits move-down when the down button is clicked', async () => {
    const wrapper = mountItem();
    await buttonByName(wrapper, 'Move image 1 down').trigger('click');
    expect(wrapper.emitted('move-down')).toBeTruthy();
  });

  it.each([
    { isFirst: true, expected: true },
    { isFirst: false, expected: false },
  ])('shows the cover badge only on the first image (isFirst: $isFirst)', ({ isFirst, expected }) => {
    expect(mountItem({ isFirst }).text().includes('Cover')).toBe(expected);
  });

  it.each([
    { alt: '', expected: 'Alt text missing' },
    { alt: '   ', expected: 'Alt text missing' },
    { alt: '07-21-25_5-25-45PM.png', expected: 'Alt text is a file name' },
    { alt: 'model.GLB', expected: 'Alt text is a file name' },
  ])('flags unhelpful alt text (alt: "$alt")', ({ alt, expected }) => {
    expect(
      mountItem({ image: { ...image, alt } })
        .get('[data-testid="missing-alt-hint"]')
        .text()
    ).toBe(expected);
  });

  it.each(['A porch at dusk', 'Front porch. Sunset lighting.'])(
    'does not flag descriptive alt text (%s)',
    (alt) => {
      expect(
        mountItem({ image: { ...image, alt } })
          .find('[data-testid="missing-alt-hint"]')
          .exists()
      ).toBe(false);
    }
  );

  it('shows only caption and alt text fields until More is opened', () => {
    expect(mountItem().findAll('.ti')).toHaveLength(2);
  });

  it('reveals attribution and image URL fields when More is opened', async () => {
    const wrapper = mountItem();
    await moreToggle(wrapper).trigger('click');
    expect(wrapper.findAll('.ti')).toHaveLength(4);
  });

  it('marks the More toggle as expanded when opened', async () => {
    const wrapper = mountItem();
    await moreToggle(wrapper).trigger('click');
    expect(moreToggle(wrapper).attributes('aria-expanded')).toBe('true');
  });

  it.each([
    [0, 'caption'],
    [1, 'alt'],
    [2, 'copyright'],
    [3, 'url'],
  ])('emits update-field for input %i with key %s', async (inputIndex, field) => {
    const wrapper = mountItem();
    await moreToggle(wrapper).trigger('click');
    await wrapper.findAll('.ti')[inputIndex].trigger('input');
    expect(wrapper.emitted('update-field')?.[0]).toEqual([field, 'changed']);
  });
});
