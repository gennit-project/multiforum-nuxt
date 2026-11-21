import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import CollectionPage from './[collectionId].vue';

const h = vi.hoisted(() => ({
  route: {
    params: { username: 'alice', collectionId: '3-reading-list' } as Record<
      string,
      unknown
    >,
  },
  authUsername: null as unknown as { value: string },
  resolvedId: null as unknown as { value: string },
  resolvedLoading: null as unknown as { value: boolean },
  resolvedNotFound: null as unknown as { value: boolean },
}));

vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => h.authUsername,
}));

vi.mock('@/composables/useRouteContentIds', () => {
  return {
    useResolvedCollectionId: () => ({
      id: h.resolvedId,
      loading: h.resolvedLoading,
      notFound: h.resolvedNotFound,
    }),
  };
});

h.authUsername = ref('alice');
h.resolvedId = ref('col-1');
h.resolvedLoading = ref(false);
h.resolvedNotFound = ref(false);

const stubs = {
  OwnedCollectionDetail: {
    name: 'OwnedCollectionDetail',
    props: ['collectionId'],
    template: '<div class="owned" />',
  },
  PublicCollectionDetail: {
    name: 'PublicCollectionDetail',
    props: ['collectionId'],
    template: '<div class="public" />',
  },
};

const mountPage = () =>
  mountWithDefaults(CollectionPage, { global: { stubs } });

beforeEach(() => {
  h.route.params = { username: 'alice', collectionId: '3-reading-list' };
  h.authUsername.value = 'alice';
  h.resolvedId.value = 'col-1';
  h.resolvedLoading.value = false;
  h.resolvedNotFound.value = false;
});

describe('user collection detail page', () => {
  it('shows the loading state while the collection number is resolved', () => {
    h.resolvedId.value = '';
    h.resolvedLoading.value = true;
    expect(mountPage().find('[role="status"]').exists()).toBe(true);
  });

  it('shows the not-found banner when the number matches nothing', () => {
    h.resolvedId.value = '';
    h.resolvedNotFound.value = true;
    expect(mountPage().get('[role="alert"]').text()).toContain("doesn't exist");
  });

  it('shows the not-found banner for a segment without a number', () => {
    h.route.params = { username: 'alice', collectionId: 'reading-list' };
    h.resolvedId.value = '';
    expect(mountPage().find('[role="alert"]').exists()).toBe(true);
  });

  it('gives the owner the management view with the resolved id', () => {
    expect(
      mountPage()
        .findComponent({ name: 'OwnedCollectionDetail' })
        .props('collectionId')
    ).toBe('col-1');
  });

  it('gives other viewers the public view with the resolved id', () => {
    h.authUsername.value = 'bob';
    expect(
      mountPage()
        .findComponent({ name: 'PublicCollectionDetail' })
        .props('collectionId')
    ).toBe('col-1');
  });

  it('gives signed-out viewers the public view', () => {
    h.authUsername.value = '';
    expect(
      mountPage().findComponent({ name: 'OwnedCollectionDetail' }).exists()
    ).toBe(false);
  });
});
