import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ModelPreviewTile from './ModelPreviewTile.vue';

describe('ModelPreviewTile', () => {
  it.each([
    ['https://x.test/model.glb', '3D · GLB'],
    ['https://x.test/model.STL', '3D · STL'],
  ])('labels %s with its format', (modelUrl, label) => {
    expect(mount(ModelPreviewTile, { props: { modelUrl } }).text()).toBe(label);
  });

  it('exposes the alt text as an image label', () => {
    const wrapper = mount(ModelPreviewTile, {
      props: { modelUrl: 'm.glb', alt: 'A tiny warrior' },
    });

    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe(
      'A tiny warrior'
    );
  });
});
