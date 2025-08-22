import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import DiscussionBody from '@/components/discussion/detail/DiscussionBody.vue';
import type { Discussion } from '@/__generated__/graphql';

// Mock the required modules
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn()
}));

vi.mock('@/cache', () => ({
  usernameVar: ref(''),
  isAuthenticatedVar: ref(false)
}));

vi.mock('nuxt/app', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: vi.fn(() => ({}))
}));

vi.mock('pinia', () => ({
  storeToRefs: vi.fn(() => ({
    fontSize: ref('medium')
  }))
}));

// Mock child components
vi.mock('@/components/MarkdownPreview.vue', () => ({
  default: { template: '<div data-testid="markdown-preview"><slot /></div>' }
}));

vi.mock('@/components/comments/EmojiButtons.vue', () => ({
  default: { template: '<div data-testid="emoji-buttons"></div>' }
}));

vi.mock('@/components/comments/NewEmojiButton.vue', () => ({
  default: { template: '<div data-testid="new-emoji-button"></div>' }
}));

vi.mock('../../TagComponent.vue', () => ({
  default: { template: '<div data-testid="tag-component"></div>' }
}));

// Create a global variable to control RequireAuth behavior in tests
let mockRequireAuthShowsAuth = false;

vi.mock('@/components/auth/RequireAuth.vue', () => ({
  default: {
    template: `
      <div data-testid="require-auth">
        <slot v-if="showAuth" name="has-auth" />
        <slot v-else name="does-not-have-auth" />
      </div>
    `,
    props: ['requireOwnership', 'owners'],
    computed: {
      showAuth() {
        return mockRequireAuthShowsAuth;
      }
    }
  }
}));

describe('DiscussionBody Sensitive Content', () => {
  let mockUseQuery: any;
  let mockUsernameVar: any;
  let mockIsAuthenticatedVar: any;
  
  const createMockDiscussion = (hasSensitiveContent = false): Discussion => ({
    id: 'test-discussion-id',
    title: 'Test Discussion',
    body: 'This is test content that may be sensitive.',
    hasSensitiveContent,
    Tags: [],
    Author: {
      id: 'author-id',
      username: 'testauthor',
      profilePicURL: null
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    Album: null
  } as Discussion);

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get mocked modules
    const apolloComposable = await vi.importMock('@vue/apollo-composable');
    const cache = await vi.importMock('@/cache');
    
    mockUseQuery = apolloComposable.useQuery;
    mockUsernameVar = cache.usernameVar;
    mockIsAuthenticatedVar = cache.isAuthenticatedVar;
    
    // Reset cache values
    mockUsernameVar.value = '';
    mockIsAuthenticatedVar.value = false;
  });

  describe('Non-authenticated user', () => {
    beforeEach(() => {
      mockIsAuthenticatedVar.value = false;
      mockUsernameVar.value = '';
      mockRequireAuthShowsAuth = false;
      
      // Mock query to return no user data (query not enabled)
      mockUseQuery.mockReturnValue({
        result: ref(null)
      });
    });

    it('should show sensitive content warning div for sensitive content', () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      const sensitiveContentDiv = wrapper.find('[data-testid="require-auth"]').element.parentElement;
      expect(sensitiveContentDiv?.classList.contains('bg-gray-200')).toBe(true);
    });

    it('should show sensitive content warning text for sensitive content', () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      expect(wrapper.text()).toContain('This content has been marked as potentially sensitive.');
    });

    it('should show login prompt button text for sensitive content', () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      expect(wrapper.text()).toContain('Log in to reveal sensitive content');
    });

    it('should not show actual content for sensitive content', () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      expect(wrapper.find('[data-testid="markdown-preview"]').exists()).toBe(false);
    });

    it('should not show sensitive content warning for non-sensitive content', () => {
      const mockDiscussion = createMockDiscussion(false);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      const sensitiveContentWarnings = wrapper.findAll('.bg-gray-200');
      expect(sensitiveContentWarnings.length).toBe(0);
    });

    it('should show actual content for non-sensitive content', () => {
      const mockDiscussion = createMockDiscussion(false);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      expect(wrapper.find('[data-testid="markdown-preview"]').exists()).toBe(true);
    });
  });

  describe('Authenticated user with preference to NOT see sensitive content by default', () => {
    beforeEach(() => {
      mockIsAuthenticatedVar.value = true;
      mockUsernameVar.value = 'testuser';
      mockRequireAuthShowsAuth = true;
      
      // Mock query to return user with enableSensitiveContentByDefault: false
      mockUseQuery.mockReturnValue({
        result: ref({
          users: [{
            enableSensitiveContentByDefault: false
          }]
        })
      });
    });

    it('should show sensitive content warning div for sensitive content', () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      const sensitiveContentDiv = wrapper.find('[data-testid="require-auth"]').element.parentElement;
      expect(sensitiveContentDiv?.classList.contains('bg-gray-200')).toBe(true);
    });

    it('should show sensitive content warning text for sensitive content', () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      expect(wrapper.text()).toContain('This content has been marked as potentially sensitive.');
    });

    it('should show reveal button text for sensitive content', () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      expect(wrapper.text()).toContain('Reveal sensitive content');
    });

    it('should not show actual content initially for sensitive content', () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      expect(wrapper.find('[data-testid="markdown-preview"]').exists()).toBe(false);
    });

    it('should find reveal button when user wants to click it', async () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      const buttons = wrapper.findAll('button');
      const revealButton = buttons.find(button => button.text().includes('Reveal sensitive content'));
      expect(revealButton?.exists()).toBe(true);
    });

    it('should show content after user clicks reveal button', async () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      const buttons = wrapper.findAll('button');
      const revealButton = buttons.find(button => button.text().includes('Reveal sensitive content'));
      
      await revealButton!.trigger('click');
      await wrapper.vm.$nextTick();
      
      expect(wrapper.find('[data-testid="markdown-preview"]').exists()).toBe(true);
    });

    it('should hide warning after user clicks reveal button', async () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      const buttons = wrapper.findAll('button');
      const revealButton = buttons.find(button => button.text().includes('Reveal sensitive content'));
      
      await revealButton!.trigger('click');
      await wrapper.vm.$nextTick();
      
      const sensitiveContentWarnings = wrapper.findAll('.bg-gray-200');
      expect(sensitiveContentWarnings.length).toBe(0);
    });
  });

  describe('Authenticated user with preference to see sensitive content by default', () => {
    beforeEach(() => {
      mockIsAuthenticatedVar.value = true;
      mockUsernameVar.value = 'testuser';
      mockRequireAuthShowsAuth = true;
      
      // Mock query to return user with enableSensitiveContentByDefault: true
      mockUseQuery.mockReturnValue({
        result: ref({
          users: [{
            enableSensitiveContentByDefault: true
          }]
        })
      });
    });

    it('should not show sensitive content warning for sensitive content', () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      const sensitiveContentWarnings = wrapper.findAll('.bg-gray-200');
      expect(sensitiveContentWarnings.length).toBe(0);
    });

    it('should not show sensitive content warning text for sensitive content', () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      expect(wrapper.text()).not.toContain('This content has been marked as potentially sensitive.');
    });

    it('should show actual content immediately for sensitive content', () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      expect(wrapper.find('[data-testid="markdown-preview"]').exists()).toBe(true);
    });

    it('should not show sensitive content warning for non-sensitive content', () => {
      const mockDiscussion = createMockDiscussion(false);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      const sensitiveContentWarnings = wrapper.findAll('.bg-gray-200');
      expect(sensitiveContentWarnings.length).toBe(0);
    });

    it('should show actual content for non-sensitive content', () => {
      const mockDiscussion = createMockDiscussion(false);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      expect(wrapper.find('[data-testid="markdown-preview"]').exists()).toBe(true);
    });
  });

  describe('Query reactivity and edge cases', () => {
    it('should handle query not being enabled initially', () => {
      mockIsAuthenticatedVar.value = false;
      mockUsernameVar.value = '';
      mockRequireAuthShowsAuth = false;
      
      // Mock query to return null (query disabled)
      mockUseQuery.mockReturnValue({
        result: ref(null)
      });
      
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      const sensitiveContentDiv = wrapper.find('[data-testid="require-auth"]').element.parentElement;
      expect(sensitiveContentDiv?.classList.contains('bg-gray-200')).toBe(true);
    });

    it('should handle missing user data in query result', () => {
      mockIsAuthenticatedVar.value = true;
      mockUsernameVar.value = 'testuser';
      mockRequireAuthShowsAuth = true;
      
      // Mock query to return empty users array
      mockUseQuery.mockReturnValue({
        result: ref({
          users: []
        })
      });
      
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      const sensitiveContentDiv = wrapper.find('[data-testid="require-auth"]').element.parentElement;
      expect(sensitiveContentDiv?.classList.contains('bg-gray-200')).toBe(true);
    });

    it('should show reveal button text when missing user data', () => {
      mockIsAuthenticatedVar.value = true;
      mockUsernameVar.value = 'testuser';
      mockRequireAuthShowsAuth = true;
      
      // Mock query to return empty users array
      mockUseQuery.mockReturnValue({
        result: ref({
          users: []
        })
      });
      
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      expect(wrapper.text()).toContain('Reveal sensitive content');
    });

    it('should call useQuery with correct structure', () => {
      mockIsAuthenticatedVar.value = true;
      mockUsernameVar.value = 'testuser';
      
      mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: createMockDiscussion()
        }
      });
      
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.any(Object), // GET_USER query
        expect.any(Function), // Variables function
        expect.any(Function)  // Options function
      );
    });

    it('should call useQuery with correct variables function', () => {
      mockIsAuthenticatedVar.value = true;
      mockUsernameVar.value = 'testuser';
      
      mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: createMockDiscussion()
        }
      });
      
      const [, variablesFunc] = mockUseQuery.mock.calls[0];
      const variables = variablesFunc();
      expect(variables).toEqual({
        username: 'testuser'
      });
    });

    it('should call useQuery with correct options function', () => {
      mockIsAuthenticatedVar.value = true;
      mockUsernameVar.value = 'testuser';
      
      mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: createMockDiscussion()
        }
      });
      
      const [, , optionsFunc] = mockUseQuery.mock.calls[0];
      const options = optionsFunc();
      expect(options).toEqual({
        enabled: true // isAuthenticatedVar.value && !!usernameVar.value
      });
    });
  });
});