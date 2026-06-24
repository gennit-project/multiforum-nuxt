import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import AlbumDropZone from '@/components/discussion/form/AlbumDropZone.vue';

const mountZone = (props: Record<string, unknown> = {}) =>
  mount(AlbumDropZone, {
    props: { isLimitReached: false, maxImages: 5, ...props },
  });

const buttonByText = (w: ReturnType<typeof mount>, text: string) =>
  w.findAll('button').find((b) => b.text() === text);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('alert', vi.fn());
});

describe('AlbumDropZone rendering', () => {
  it('shows the upload controls when under the limit', () => {
    const wrapper = mountZone();

    expect(buttonByText(wrapper, 'Choose Files')).toBeTruthy();
  });

  it('shows the limit message when the limit is reached', () => {
    const wrapper = mountZone({ isLimitReached: true });

    expect(wrapper.text()).toContain('Maximum limit of 5 images reached');
  });

  it('hides the controls when the limit is reached', () => {
    const wrapper = mountZone({ isLimitReached: true });

    expect(buttonByText(wrapper, 'Choose Files')).toBeUndefined();
  });
});

describe('AlbumDropZone actions', () => {
  it('opens the file picker when Choose Files is clicked', async () => {
    const wrapper = mountZone();
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');

    await buttonByText(wrapper, 'Choose Files')!.trigger('click');

    expect(clickSpy).toHaveBeenCalled();
  });

  it('emits files-selected when files are chosen', async () => {
    const wrapper = mountZone();
    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', {
      value: [new File(['x'], 'a.png')],
      configurable: true,
    });

    await input.trigger('change');

    expect(wrapper.emitted('files-selected')).toBeTruthy();
  });

  it('ignores a change event with no files', async () => {
    const wrapper = mountZone();
    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [], configurable: true });

    await input.trigger('change');

    expect(wrapper.emitted('files-selected')).toBeUndefined();
  });

  it('emits show-url-input from Link to Image', async () => {
    const wrapper = mountZone();

    await buttonByText(wrapper, 'Link to Image')!.trigger('click');

    expect(wrapper.emitted('show-url-input')).toBeTruthy();
  });

  it('emits drop when files are dropped', async () => {
    const wrapper = mountZone();

    await wrapper.find('.border-dotted').trigger('drop');

    expect(wrapper.emitted('drop')).toBeTruthy();
  });

  it('handles dragover without emitting', async () => {
    const wrapper = mountZone();

    await wrapper.find('.border-dotted').trigger('dragover');

    expect(wrapper.emitted('drop')).toBeUndefined();
  });
});
