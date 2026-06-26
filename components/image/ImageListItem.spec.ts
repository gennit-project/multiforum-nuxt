import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Image } from '@/__generated__/graphql';
import ImageListItem from './ImageListItem.vue';

const mountItem = (image: Partial<Image>) =>
  mount(ImageListItem, {
    props: { image: image as Image, username: 'alice' },
    global: {
      stubs: {
        NuxtLink: { template: '<a><slot /></a>' },
        ClientOnly: { template: '<div><slot /></div>' },
        ModelViewer: { template: '<div class="model" />' },
        StlViewer: { template: '<div class="stl" />' },
        AddToImageFavorites: { template: '<div class="fav" />' },
      },
    },
  });

describe('ImageListItem', () => {
  it('renders a plain image for a regular url', () => {
    const wrapper = mountItem({ id: 'i1', url: 'https://img.test/a.png' });
    expect(wrapper.find('img').exists()).toBe(true);
  });

  it('uses alt, then caption, then a fallback for the image alt', () => {
    const wrapper = mountItem({ id: 'i1', url: 'a.png', caption: 'A cat' });
    expect(wrapper.find('img').attributes('alt')).toBe('A cat');
  });

  it('renders the 3D model viewer for a glb url', () => {
    const wrapper = mountItem({ id: 'i1', url: 'https://img.test/m.glb' });
    expect(wrapper.find('.model').exists()).toBe(true);
  });

  it('shows the sensitive-content overlay', () => {
    const wrapper = mountItem({
      id: 'i1',
      url: 'a.png',
      hasSensitiveContent: true,
    });
    expect(wrapper.text()).toContain('Sensitive');
  });

  it('hides the favorite button when showFavoriteButton is false', () => {
    const wrapper = mount(ImageListItem, {
      props: {
        image: { id: 'i1', url: 'a.png' } as Image,
        username: 'alice',
        showFavoriteButton: false,
      },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          ClientOnly: { template: '<div><slot /></div>' },
          ModelViewer: true,
          StlViewer: true,
          AddToImageFavorites: { template: '<div class="fav" />' },
        },
      },
    });
    expect(wrapper.find('.fav').exists()).toBe(false);
  });
});
