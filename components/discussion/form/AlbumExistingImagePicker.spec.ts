import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import AlbumExistingImagePicker from '@/components/discussion/form/AlbumExistingImagePicker.vue';

const { usernameRef } = vi.hoisted(() => ({
  usernameRef: { value: 'alice' as string },
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => usernameRef,
}));

// tests/setup.ts mocks @headlessui/vue for the Tab components only; render the
// dialog pieces inline here so the modal contents can be queried directly.
vi.mock('@headlessui/vue', () => {
  const passthrough = (name: string, tag = 'div') => ({
    name,
    template: `<${tag}><slot /></${tag}>`,
  });
  return {
    Dialog: passthrough('Dialog'),
    DialogPanel: passthrough('DialogPanel'),
    DialogTitle: passthrough('DialogTitle', 'h3'),
    TransitionRoot: passthrough('TransitionRoot'),
    TransitionChild: passthrough('TransitionChild'),
  };
});

const tabProps = [
  'source',
  'searchTerm',
  'selectedImageIds',
  'pendingImageIds',
  'isLimitReached',
];

const UserImagesTabStub = {
  name: 'AlbumReusableUserImagesTab',
  props: tabProps,
  emits: ['toggle-image'],
  template:
    '<div class="user-images-tab" :data-source="source" :data-search="searchTerm" />',
};

const CollectionsTabStub = {
  name: 'AlbumReusableCollectionsTab',
  props: tabProps.filter((prop) => prop !== 'source'),
  emits: ['toggle-image'],
  template: '<div class="collections-tab" :data-search="searchTerm" />',
};

const passthrough = { template: '<div><slot /></div>' };

const mountPicker = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(AlbumExistingImagePicker, {
    props: {
      open: true,
      selectedImageIds: [],
      maxImages: 25,
      ...props,
    },
    global: {
      stubs: {
        ClientOnly: passthrough,
        AlbumReusableUserImagesTab: UserImagesTabStub,
        AlbumReusableCollectionsTab: CollectionsTabStub,
      },
    },
  });

type Wrapper = ReturnType<typeof mountPicker>;

const tabButton = (wrapper: Wrapper, label: string) =>
  wrapper.findAll('[role="tab"]').find((b) => b.text() === label);

const pick = (wrapper: Wrapper, id: string) =>
  wrapper
    .findComponent(UserImagesTabStub)
    .vm.$emit('toggle-image', { id, url: `https://img.test/${id}.jpg` });

const addButton = (wrapper: Wrapper) =>
  wrapper.get('[data-testid="album-library-add-button"]');

beforeEach(() => {
  usernameRef.value = 'alice';
});

describe('AlbumExistingImagePicker', () => {
  it('renders a tab for each reusable image source', () => {
    const wrapper = mountPicker();
    expect(wrapper.findAll('[role="tab"]').map((b) => b.text())).toEqual([
      'Uploads',
      'Favorites',
      'Collections',
    ]);
  });

  it('keeps a stable viewport-capped height on desktop', () => {
    expect(
      mountPicker().get('[data-testid="album-library-panel"]').classes()
    ).toContain('sm:h-[min(42rem,85vh)]');
  });

  it('shows the uploads tab by default', () => {
    const wrapper = mountPicker();
    expect(wrapper.findComponent(UserImagesTabStub).props('source')).toBe(
      'uploads'
    );
  });

  it('opens on the requested tab', () => {
    const wrapper = mountPicker({ initialTab: 'collections' });
    expect(wrapper.findComponent(CollectionsTabStub).exists()).toBe(true);
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

  it('starts with nothing selected', () => {
    const wrapper = mountPicker();
    expect(wrapper.get('[data-testid="album-library-summary"]').text()).toBe(
      'Nothing selected'
    );
  });

  it('disables the add button until an image is picked', () => {
    const wrapper = mountPicker();
    expect(addButton(wrapper).attributes('disabled')).toBeDefined();
  });

  it('counts picked images against the album total', async () => {
    const wrapper = mountPicker({ selectedImageIds: ['x', 'y'] });
    pick(wrapper, 'a');
    pick(wrapper, 'b');
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="album-library-summary"]').text()).toBe(
      '2 selected · 4 of 25 in album'
    );
  });

  it('labels the add button with the number of picked images', async () => {
    const wrapper = mountPicker();
    pick(wrapper, 'a');
    pick(wrapper, 'b');
    await wrapper.vm.$nextTick();
    expect(addButton(wrapper).text()).toBe('Add 2 to album');
  });

  it('passes picked ids to the active tab', async () => {
    const wrapper = mountPicker();
    pick(wrapper, 'a');
    await wrapper.vm.$nextTick();
    expect(
      wrapper.findComponent(UserImagesTabStub).props('pendingImageIds')
    ).toEqual(['a']);
  });

  it('unpicks an image that is toggled twice', async () => {
    const wrapper = mountPicker();
    pick(wrapper, 'a');
    pick(wrapper, 'a');
    await wrapper.vm.$nextTick();
    expect(
      wrapper.findComponent(UserImagesTabStub).props('pendingImageIds')
    ).toEqual([]);
  });

  it('keeps picks when switching tabs', async () => {
    const wrapper = mountPicker();
    pick(wrapper, 'a');
    await tabButton(wrapper, 'Favorites')!.trigger('click');
    expect(
      wrapper.findComponent(UserImagesTabStub).props('pendingImageIds')
    ).toEqual(['a']);
  });

  it('marks the tabs as limit-reached once the picks would fill the album', async () => {
    const wrapper = mountPicker({ selectedImageIds: ['x'], maxImages: 2 });
    pick(wrapper, 'a');
    await wrapper.vm.$nextTick();
    expect(
      wrapper.findComponent(UserImagesTabStub).props('isLimitReached')
    ).toBe(true);
  });

  it('emits every picked image, in pick order, when added', async () => {
    const wrapper = mountPicker();
    pick(wrapper, 'b');
    pick(wrapper, 'a');
    await wrapper.vm.$nextTick();
    await addButton(wrapper).trigger('click');
    expect(
      (wrapper.emitted('addImages')?.[0]?.[0] as Array<{ id: string }>).map(
        (image) => image.id
      )
    ).toEqual(['b', 'a']);
  });

  it('emits close when the close button is clicked', async () => {
    const wrapper = mountPicker();
    await wrapper.get('button[aria-label="Close library"]').trigger('click');
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
