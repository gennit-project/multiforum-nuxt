import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import LibraryListSkeleton from './LibraryListSkeleton.vue';

describe('LibraryListSkeleton', () => {
  it('exposes a polite loading label through status semantics', () => {
    const wrapper = mount(LibraryListSkeleton, {
      props: { label: 'Loading downloads' },
    });

    expect(wrapper.get('[role="status"]').attributes('aria-label')).toBe(
      'Loading downloads'
    );
  });

  it('renders the requested number of row placeholders', () => {
    const wrapper = mount(LibraryListSkeleton, {
      props: { label: 'Loading comments', count: 3, variant: 'rows' },
    });

    expect(
      wrapper.get('[data-testid="library-list-skeleton"]').element.children
    ).toHaveLength(3);
  });

  it('uses an image-shaped grid for image lists', () => {
    const wrapper = mount(LibraryListSkeleton, {
      props: { label: 'Loading images', count: 1, variant: 'images' },
    });

    expect(wrapper.find('.aspect-square').exists()).toBe(true);
  });
});
