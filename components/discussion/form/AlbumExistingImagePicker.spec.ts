import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import AlbumExistingImagePicker from '@/components/discussion/form/AlbumExistingImagePicker.vue';

const { usernameRef } = vi.hoisted(() => ({
  usernameRef: { value: 'alice' as string },
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => usernameRef,
}));

const UserImagesTabStub = {
  name: 'AlbumReusableUserImagesTab',
  props: ['source', 'searchTerm', 'selectedImageIds', 'isLimitReached'],
  emits: ['add-image'],
  template:
    '<div class="user-images-tab" :data-source="source" :data-search="searchTerm" />',
};

const CollectionsTabStub = {
  name: 'AlbumReusableCollectionsTab',
  props: ['searchTerm', 'selectedImageIds', 'isLimitReached'],
  emits: ['add-image'],
  template: '<div class="collections-tab" :data-search="searchTerm" />',
};

const mountPicker = (selectedImageIds: string[] = []) =>
  mountWithDefaults(AlbumExistingImagePicker, {
    props: {
      selectedImageIds,
      isLimitReached: false,
    },
    global: {
      stubs: {
        AlbumReusableUserImagesTab: UserImagesTabStub,
        AlbumReusableCollectionsTab: CollectionsTabStub,
      },
    },
  });

const tabButton = (
  wrapper: ReturnType<typeof mountPicker>,
  label: string
) => wrapper.findAll('[role="tab"]').find((b) => b.text() === label);

beforeEach(() => {
  usernameRef.value = 'alice';
});

describe('AlbumExistingImagePicker', () => {
  it('renders a tab for each reusable image source', () => {
    const wrapper = mountPicker();
    expect(wrapper.findAll('[role="tab"]').map((b) => b.text())).toEqual([
      'Your uploads',
      'Favorites',
      'Collections',
    ]);
  });

  it('shows the uploads tab by default', () => {
    const wrapper = mountPicker();
    expect(wrapper.findComponent(UserImagesTabStub).props('source')).toBe(
      'uploads'
    );
  });

  it('switches the user-images tab to favorites when Favorites is selected', async () => {
    const wrapper = mountPicker();
    await tabButton(wrapper, 'Favorites')!.trigger('click');
    expect(wrapper.findComponent(UserImagesTabStub).props('source')).toBe(
      'favorites'
    );
  });

  it('shows the collections tab when Collections is selected', async () => {
    const wrapper = mountPicker();
    await tabButton(wrapper, 'Collections')!.trigger('click');
    expect(wrapper.findComponent(CollectionsTabStub).exists()).toBe(true);
  });

  it('passes the search term down to the active tab', async () => {
    const wrapper = mountPicker();
    await wrapper.find('#existing-image-search').setValue('sunset');
    expect(wrapper.findComponent(UserImagesTabStub).props('searchTerm')).toBe(
      'sunset'
    );
  });

  it('forwards addImage from the active tab', () => {
    const wrapper = mountPicker();
    wrapper
      .findComponent(UserImagesTabStub)
      .vm.$emit('add-image', { id: 'img-9', url: 'https://img.test/9.jpg' });
    expect(wrapper.emitted('addImage')?.[0]?.[0]).toMatchObject({
      id: 'img-9',
    });
  });

  it('emits close when the close button is clicked', async () => {
    const wrapper = mountPicker();
    await wrapper
      .get('button[aria-label="Close reusable image picker"]')
      .trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('prompts to sign in instead of showing tabs when there is no username', () => {
    usernameRef.value = '';
    const wrapper = mountPicker();
    expect({
      signInText: wrapper.text().includes('Sign in to reuse images'),
      tabCount: wrapper.findAll('[role="tab"]').length,
    }).toEqual({ signInText: true, tabCount: 0 });
  });
});
