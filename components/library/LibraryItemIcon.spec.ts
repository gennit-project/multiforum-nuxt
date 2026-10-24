import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import LibraryItemIcon from './LibraryItemIcon.vue';

describe('LibraryItemIcon', () => {
  it.each([
    [{ itemId: 'all-favorites' }, 'favorites'],
    [
      { itemId: 'uploaded-files', collectionType: 'DOWNLOADS' },
      'uploaded-files',
    ],
    [{ collectionType: 'IMAGES' }, 'images'],
    [{ collectionType: 'DOWNLOADS' }, 'downloads'],
    [{ collectionType: 'COMMENTS' }, 'comments'],
    [{ collectionType: 'CHANNELS' }, 'forums'],
    [{ collectionType: 'DISCUSSIONS' }, 'collections'],
  ])('selects the matching content icon', (props, expectedIcon) => {
    const wrapper = mount(LibraryItemIcon, { props });

    expect(wrapper.attributes('data-library-icon')).toBe(expectedIcon);
  });
});
