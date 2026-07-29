import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import { mount } from '@vue/test-utils';
import DiscussionHeader from './DiscussionHeader.vue';

const serverAdminUsernames = ref<string[]>([]);

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    name: 'forums-forumId-discussions-discussionId',
    params: {
      forumId: 'cats',
      discussionId: 'discussion-1',
    },
    query: {},
    path: '/forums/cats/discussions/discussion-1',
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: ref({
      channels: [
        {
          feedbackEnabled: true,
        },
      ],
      serverConfigs: [{}],
      issues: [],
      discussionChannels: [],
    }),
  }),
  useMutation: () => ({
    mutate: vi.fn(),
    loading: ref(false),
    error: ref(null),
    onDone: vi.fn(),
  }),
}));

vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return {
    useUsername: () => ref('viewer'),
    useModProfileName: () => ref(''),
    setUsername: vi.fn(),
    setModProfileName: vi.fn(),
  };
});

vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({
    serverAdminUsernames: computed(() => serverAdminUsernames.value),
    serverModUsernames: ref([]),
    serverModProfileNames: ref([]),
  }),
}));

describe('DiscussionHeader', () => {
  beforeEach(() => {
    serverAdminUsernames.value = [];
  });

  const buildWrapper = () =>
    mount(DiscussionHeader, {
      props: {
        discussion: {
          id: 'discussion-1',
          title: 'Test discussion',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          hasSensitiveContent: false,
          Author: {
            username: 'alice',
            displayName: 'Alice',
            profilePicURL: '',
            ChannelRoles: [],
          },
          DiscussionChannels: [
            {
              channelUniqueName: 'cats',
            },
          ],
        },
        channelId: 'cats',
      },
      global: {
        stubs: {
          AvatarComponent: { template: '<div />' },
          WarningModal: { template: '<div />' },
          ErrorBanner: { template: '<div />' },
          NotificationComponent: { template: '<div />' },
          BrokenRulesModal: { template: '<div />' },
          EllipsisHorizontal: { template: '<div />' },
          AddToDiscussionFavorites: { template: '<div />' },
          UnarchiveModal: { template: '<div />' },
          LinkIcon: { template: '<div />' },
          EditsDropdown: { template: '<div />' },
          FloatingMenu: { template: '<div />' },
          DropdownMenu: { template: '<div />' },
          MenuButton: { template: '<div />' },
          RequireAuth: { template: '<div><slot /></div>' },
          NuxtLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    });

  it('shows the Server Admin label when the discussion author belongs to server admin membership', () => {
    serverAdminUsernames.value = ['alice'];

    const wrapper = buildWrapper();

    expect(wrapper.text()).toContain('Server Admin');
  });

  it('does not show the Server Admin label when the discussion author is not in server admin membership', () => {
    serverAdminUsernames.value = ['bob'];

    const wrapper = buildWrapper();

    expect(wrapper.text().includes('Server Admin')).toBe(false);
  });

  it('keeps the avatar and author details in one non-wrapping row', () => {
    const wrapper = buildWrapper();
    const classes = wrapper
      .get('[data-testid="discussion-author-row"]')
      .classes();

    expect({
      isFlexRow: classes.includes('flex'),
      alignsAtTop: classes.includes('items-start'),
      allowsOuterWrapping: classes.includes('flex-wrap'),
    }).toEqual({
      isFlexRow: true,
      alignsAtTop: true,
      allowsOuterWrapping: false,
    });
  });

  it('allows the author identity and badges to wrap within the details column', () => {
    const wrapper = buildWrapper();

    expect(
      wrapper
        .get('[data-testid="discussion-author-details"] a > span')
        .classes()
    ).toContain('flex-wrap');
  });

  it('keeps timestamps inside the author details column', () => {
    const wrapper = buildWrapper();

    expect(
      wrapper
        .get('[data-testid="discussion-author-details"]')
        .find('[data-testid="discussion-author-meta"]')
        .exists()
    ).toBe(true);
  });
});
