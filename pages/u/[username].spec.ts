import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineComponent, h, Suspense } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import UserProfileContainer from './[username].vue';

// Controllable route + nuxt helpers.
const h = vi.hoisted(() => ({
  route: { path: '/u/alice/comments', params: { username: 'alice' } as Record<string, unknown> },
  useHead: null as unknown as ReturnType<typeof vi.fn>,
  resultRef: null as unknown as { value: unknown },
  loadingRef: null as unknown as { value: boolean },
  errorRef: null as unknown as { value: unknown },
  admins: null as unknown as { value: string[] },
  mods: null as unknown as { value: string[] },
  modProfiles: null as unknown as { value: string[] },
}));

vi.stubGlobal('definePageMeta', vi.fn());

vi.mock('nuxt/app', () => {
  h.useHead = vi.fn();
  return {
    useRoute: () => h.route,
    useHead: (...args: unknown[]) => h.useHead(...args),
  };
});

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  h.resultRef = ref(null);
  h.loadingRef = ref(false);
  h.errorRef = ref(null);
  return {
    useQuery: () => ({
      result: h.resultRef,
      loading: h.loadingRef,
      error: h.errorRef,
    }),
  };
});

vi.mock('@/composables/useServerRoleMembership', async () => {
  const { ref } = await import('vue');
  h.admins = ref([]);
  h.mods = ref([]);
  h.modProfiles = ref([]);
  return {
    useServerRoleMembership: () => ({
      serverAdminUsernames: h.admins,
      serverModUsernames: h.mods,
      serverModProfileNames: h.modProfiles,
    }),
  };
});

vi.mock('@/config', () => ({
  config: { serverDisplayName: 'Test Server' },
}));
vi.mock('@/graphQLData/user/queries', () => ({
  GET_PUBLIC_USER_PROFILE: 'GET_PUBLIC_USER_PROFILE',
}));

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  username: 'alice',
  displayName: 'Alice',
  bio: '',
  profilePicURL: '',
  ...overrides,
});

const stubs = {
  UserProfileSidebar: {
    name: 'UserProfileSidebar',
    props: ['serverRoleBadge'],
    template: '<div class="sidebar"><slot /></div>',
  },
  UserContributionChart: { template: '<div />' },
  ContributionChartSkeleton: { template: '<div />' },
  UserProfileChannelFilter: {
    name: 'UserProfileChannelFilter',
    template: '<div class="channel-filter" />',
  },
  ProfileKudosPreview: {
    name: 'ProfileKudosPreview',
    template: '<div class="profile-kudos-preview" />',
  },
  UserProfileTabs: {
    name: 'UserProfileTabs',
    props: ['user', 'showCounts', 'vertical'],
    template: '<div class="profile-tabs" />',
  },
  NuxtPage: { name: 'NuxtPage', template: '<div class="nuxt-page" />' },
};

// The container uses top-level `await` in <script setup> (async setup), so it
// must render under a Suspense boundary.
const Harness = defineComponent({
  render: () =>
    h(Suspense, null, { default: () => h(UserProfileContainer) }),
});

const mountContainer = async () => {
  const wrapper = mountWithDefaults(Harness, { global: { stubs } });
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { path: '/u/alice/comments', params: { username: 'alice' } };
  h.resultRef.value = { users: [makeUser()] };
  h.loadingRef.value = false;
  h.errorRef.value = null;
  h.admins.value = [];
  h.mods.value = [];
  h.modProfiles.value = [];
});

describe('User profile container', () => {
  it('renders the profile tabs once the user has loaded', async () => {
    const wrapper = await mountContainer();
    expect(wrapper.findComponent({ name: 'UserProfileTabs' }).exists()).toBe(true);
  });

  it('shows the channel filter on a filterable tab', async () => {
    h.route = { path: '/u/alice/comments', params: { username: 'alice' } };
    const wrapper = await mountContainer();
    expect(
      wrapper.findComponent({ name: 'UserProfileChannelFilter' }).exists()
    ).toBe(true);
  });

  it('hides the channel filter on a non-filterable tab', async () => {
    h.route = { path: '/u/alice/kudos', params: { username: 'alice' } };
    const wrapper = await mountContainer();
    expect(
      wrapper.findComponent({ name: 'UserProfileChannelFilter' }).exists()
    ).toBe(false);
  });

  it('renders the kudos preview inside the sidebar layout', async () => {
    const wrapper = await mountContainer();

    expect(
      wrapper.findComponent({ name: 'ProfileKudosPreview' }).exists()
    ).toBe(true);
  });

  it('uses the full-width image layout on an image detail page', async () => {
    h.route = {
      path: '/u/alice/images/img-1',
      params: { username: 'alice' },
    };
    const wrapper = await mountContainer();
    // The image-detail branch renders NuxtPage without the sidebar/tabs.
    expect(wrapper.findComponent({ name: 'UserProfileSidebar' }).exists()).toBe(
      false
    );
    expect(wrapper.findComponent({ name: 'NuxtPage' }).exists()).toBe(true);
  });

  it('passes a server-role badge to the sidebar for an admin user', async () => {
    h.admins.value = ['alice'];
    const wrapper = await mountContainer();
    expect(
      wrapper.findComponent({ name: 'UserProfileSidebar' }).props('serverRoleBadge')
    ).not.toBeNull();
  });

  it('passes no badge for a user without a server role', async () => {
    const wrapper = await mountContainer();
    expect(
      wrapper.findComponent({ name: 'UserProfileSidebar' }).props('serverRoleBadge')
    ).toBeNull();
  });

  it('passes the dedicated wiki edits count through to the tabs', async () => {
    h.resultRef.value = {
      getUserWikiEditsCount: 3,
      users: [makeUser({ AuthoredWikiPageVersionsAggregate: { count: 11 } })],
    };

    const wrapper = await mountContainer();

    expect(wrapper.findComponent({ name: 'UserProfileTabs' }).props('user'))
      .toMatchObject({ wikiEditsCount: 3 });
  });
});
