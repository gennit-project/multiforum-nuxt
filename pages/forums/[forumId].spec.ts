import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';

vi.stubGlobal('definePageMeta', vi.fn());

const routeRef = { params: { forumId: 'cats' }, name: 'forums-forumId', query: {} };

vi.mock('nuxt/app', () => ({
  useRoute: () => routeRef,
  useRouter: () => ({ push: vi.fn() }),
  useHead: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('viewer'),
}));

vi.mock('@/utils/localStorageUtils', () => ({
  getLocalStorageItem: vi.fn(() => []),
  setLocalStorageItem: vi.fn(),
}));

const ChannelHeaderMobileStub = defineComponent({
  name: 'ChannelHeaderMobile',
  template: '<div class="channel-header-mobile-stub" />',
});

const ChannelHeaderDesktopStub = defineComponent({
  name: 'ChannelHeaderDesktop',
  template: '<div class="channel-header-desktop-stub" />',
});

const DiscussionTitleEditFormStub = defineComponent({
  name: 'DiscussionTitleEditForm',
  template: '<div><slot /></div>',
});

const EventTitleEditFormStub = defineComponent({
  name: 'EventTitleEditForm',
  template: '<div><slot /></div>',
});

const IssueTitleEditFormStub = defineComponent({
  name: 'IssueTitleEditForm',
  template: '<div><slot /></div>',
});

const DiscussionDetailContentStub = defineComponent({
  name: 'DiscussionDetailContent',
  template: '<div class="discussion-detail-content-stub" />',
});

const DiscussionDetailEmptyStateStub = defineComponent({
  name: 'DiscussionDetailEmptyState',
  template: '<div class="discussion-detail-empty-state-stub" />',
});

const EventDetailStub = defineComponent({
  name: 'EventDetail',
  template: '<div class="event-detail-stub" />',
});

const ChannelSidebarStub = defineComponent({
  name: 'ChannelSidebar',
  template: '<div class="channel-sidebar-stub" />',
});

const IssueDetailStub = defineComponent({
  name: 'IssueDetail',
  template: '<div class="issue-detail-stub" />',
});

const ChannelLockedBannerStub = defineComponent({
  name: 'ChannelLockedBanner',
  template: '<div class="channel-locked-banner-stub" />',
});

const BackLinkStub = defineComponent({
  name: 'BackLink',
  template: '<a><slot /></a>',
});

const PageNotFoundStub = defineComponent({
  name: 'PageNotFound',
  template: '<div class="page-not-found-stub" />',
});

const ChannelTabsStub = defineComponent({
  name: 'ChannelTabs',
  template: '<div class="channel-tabs-stub" />',
});

vi.mock('@/components/PageNotFound.vue', () => ({
  default: PageNotFoundStub,
}));

vi.mock('@/components/channel/ChannelTabs.vue', () => ({
  default: ChannelTabsStub,
}));

vi.mock('@/components/channel/ChannelHeaderMobile.vue', () => ({
  default: ChannelHeaderMobileStub,
}));

vi.mock('@/components/channel/ChannelHeaderDesktop.vue', () => ({
  default: ChannelHeaderDesktopStub,
}));

vi.mock('@/components/discussion/detail/DiscussionTitleEditForm.vue', () => ({
  default: DiscussionTitleEditFormStub,
}));

vi.mock('@/components/event/detail/EventTitleEditForm.vue', () => ({
  default: EventTitleEditFormStub,
}));

vi.mock('@/components/mod/IssueTitleEditForm.vue', () => ({
  default: IssueTitleEditFormStub,
}));

vi.mock('@/components/discussion/detail/DiscussionDetailContent.vue', () => ({
  default: DiscussionDetailContentStub,
}));

vi.mock('@/components/discussion/list/DiscussionDetailEmptyState.vue', () => ({
  default: DiscussionDetailEmptyStateStub,
}));

vi.mock('@/components/event/detail/EventDetail.vue', () => ({
  default: EventDetailStub,
}));

vi.mock('@/components/channel/ChannelSidebar.vue', () => ({
  default: ChannelSidebarStub,
}));

vi.mock('@/components/mod/IssueDetail.vue', () => ({
  default: IssueDetailStub,
}));

vi.mock('@/components/channel/ChannelLockedBanner.vue', () => ({
  default: ChannelLockedBannerStub,
}));

vi.mock('@/components/BackLink.vue', () => ({
  default: BackLinkStub,
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (channels: unknown[]) => {
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({ channels }),
      onResult: vi.fn(),
      loading: ref(false),
      refetch: vi.fn(),
    })
    .mockReturnValueOnce({ result: ref(null) });
  const Page = (await import('./[forumId].vue')).default;
  return shallowMount(Page);
};

describe('forum shell page', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    routeRef.name = 'forums-forumId';
  });

  it('shows the not-found page when the channel does not exist', async () => {
    const wrapper = await mountWith([]);
    expect(wrapper.findComponent(PageNotFoundStub).exists()).toBe(true);
  });

  it('renders the channel tabs on the plain forum route', async () => {
    const wrapper = await mountWith([{ uniqueName: 'cats', displayName: 'Cats' }]);
    expect(wrapper.findComponent(ChannelTabsStub).exists()).toBe(true);
  });
});
