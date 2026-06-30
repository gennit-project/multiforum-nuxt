import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import UserProfileSidebar from '@/components/user/UserProfileSidebar.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  loading: null as unknown,
  error: null as unknown,
  route: null as unknown,
  username: null as unknown,
  profilePicURL: null as unknown,
  useQuerySpy: null as unknown as ReturnType<typeof vi.fn>,
}));

vi.mock('@vue/apollo-composable', () => {
  h.useQuerySpy = vi.fn(() => ({
    result: h.result,
    loading: h.loading,
    error: h.error,
  }));
  return {
    useQuery: (...args: unknown[]) => h.useQuerySpy(...args),
  };
});
vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => h.username,
  useProfilePicURL: () => h.profilePicURL,
}));

const user = (overrides: Record<string, unknown> = {}) => ({
  username: 'alice',
  profilePicURL: 'https://x/query.png',
  createdAt: '2024-01-01T00:00:00Z',
  commentKarma: 3,
  discussionKarma: 5,
  ...overrides,
});

const mountSidebar = (props: Record<string, unknown> = {}) =>
  mount(UserProfileSidebar, {
    props,
    global: {
      stubs: {
        AvatarComponent: { name: 'AvatarComponent', props: ['src', 'text'], template: '<div class="avatar" />' },
        MarkdownPreview: { name: 'MarkdownPreview', props: ['text'], template: '<div class="bio">{{ text }}</div>' },
        ReportProfilePictureModal: { name: 'ReportProfilePictureModal', props: ['open'], template: '<div class="report-modal" />' },
        RequireAuth: { template: '<div><slot name="has-auth" /></div>' },
        FlagIcon: true,
      },
    },
  });

const avatar = (w: ReturnType<typeof mount>) => w.getComponent({ name: 'AvatarComponent' });

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref({ users: [user()] });
  h.loading = ref(false);
  h.error = ref(null);
  // Default: viewing alice's profile as bob (another user).
  h.route = { params: { username: 'alice' } };
  h.username = ref('bob');
  h.profilePicURL = ref('');
});

describe('UserProfileSidebar query configuration', () => {
  it('enables the profile query for public profiles even when the viewer is logged out', () => {
    h.username = ref('');
    mountSidebar();

    const queryOptions = h.useQuerySpy.mock.calls[0][2] as {
      enabled?: { value: boolean };
    };

    expect(queryOptions.enabled?.value).toBe(true);
  });
});

describe('UserProfileSidebar identity', () => {
  it('shows the username when there is no display name', () => {
    h.route = { params: { username: 'alice' } };
    h.username = ref('alice');
    const wrapper = mountSidebar();

    expect(wrapper.text()).toContain('alice');
  });

  it('shows the display name and handle', () => {
    h.result = ref({ users: [user({ displayName: 'Alice A' })] });
    const wrapper = mountSidebar();

    expect(wrapper.text()).toContain('Alice A');
  });

  it('shows a Server Admin badge for a server admin', () => {
    const wrapper = mountSidebar({ serverRoleBadge: 'serverAdmin' });

    expect(wrapper.text()).toContain('Server Admin');
  });

  it('shows a Server Mod badge for a server moderator', () => {
    const wrapper = mountSidebar({ serverRoleBadge: 'serverMod' });

    expect(wrapper.text()).toContain('Server Mod');
  });

  it('shows no server badge for a regular user', () => {
    const wrapper = mountSidebar();

    expect(wrapper.text()).not.toContain('Server');
  });
});

describe('UserProfileSidebar profile picture', () => {
  it('uses the query profile pic for another user', () => {
    const wrapper = mountSidebar();

    expect(avatar(wrapper).props('src')).toBe('https://x/query.png');
  });

  it('prefers the reactive profile pic for your own profile', () => {
    h.route = { params: { username: 'alice' } };
    h.username = ref('alice');
    h.profilePicURL = ref('https://x/reactive.png');
    const wrapper = mountSidebar();

    expect(avatar(wrapper).props('src')).toBe('https://x/reactive.png');
  });

  it('shows a report button for another user with a picture', () => {
    const wrapper = mountSidebar();

    expect(wrapper.find('button[title="Report profile picture"]').exists()).toBe(
      true
    );
  });

  it('hides the report button on your own profile', () => {
    h.route = { params: { username: 'alice' } };
    h.username = ref('alice');
    const wrapper = mountSidebar();

    expect(wrapper.find('button[title="Report profile picture"]').exists()).toBe(
      false
    );
  });

  it('opens the report modal from the report button', async () => {
    const wrapper = mountSidebar();

    await wrapper.find('button[title="Report profile picture"]').trigger('click');

    expect(wrapper.getComponent({ name: 'ReportProfilePictureModal' }).props('open')).toBe(
      true
    );
  });
});

describe('UserProfileSidebar content', () => {
  it('shows a stable joined date label', () => {
    const wrapper = mountSidebar();

    expect(wrapper.text()).toContain('Joined ');
  });

  it('renders the bio', () => {
    h.result = ref({ users: [user({ bio: 'hi there' })] });
    const wrapper = mountSidebar();

    expect(wrapper.find('.bio').text()).toBe('hi there');
  });

  it('shows karma counts', () => {
    const wrapper = mountSidebar();

    expect(wrapper.text()).toContain('3 comment karma');
  });

  it('shows a loading message', () => {
    h.loading = ref(true);
    h.result = ref(null);
    const wrapper = mountSidebar();

    expect(wrapper.text()).toContain('Loading');
  });

  it('keeps the last loaded profile data visible during a refetch', () => {
    h.loading = ref(true);
    const wrapper = mountSidebar();

    expect(wrapper.text()).toContain('3 comment karma');
    expect(wrapper.text()).not.toContain('Loading');
  });

  it('shows query errors', () => {
    h.error = ref({ graphQLErrors: [{ message: 'boom' }] });
    const wrapper = mountSidebar();

    expect(wrapper.text()).toContain('boom');
  });
});
