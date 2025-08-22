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

    it('should show blocked view with login prompt for sensitive content', () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      // Should show the sensitive content warning
      const sensitiveContentDiv = wrapper.find('[data-testid="require-auth"]').element.parentElement;
      expect(sensitiveContentDiv?.classList.contains('bg-gray-200')).toBe(true);
      expect(wrapper.text()).toContain('This content has been marked as potentially sensitive.');
      expect(wrapper.text()).toContain('Log in to reveal sensitive content');
      
      // Should not show the actual content
      expect(wrapper.find('[data-testid="markdown-preview"]').exists()).toBe(false);
    });

    it('should show content normally when not sensitive', () => {
      const mockDiscussion = createMockDiscussion(false);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      // Should not show sensitive content warning
      const sensitiveContentWarnings = wrapper.findAll('.bg-gray-200');
      expect(sensitiveContentWarnings.length).toBe(0);
      
      // Should show the actual content
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

    it('should show blocked view by default for sensitive content', () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      // Should show the sensitive content warning with reveal button
      const sensitiveContentDiv = wrapper.find('[data-testid="require-auth"]').element.parentElement;
      expect(sensitiveContentDiv?.classList.contains('bg-gray-200')).toBe(true);
      expect(wrapper.text()).toContain('This content has been marked as potentially sensitive.');
      expect(wrapper.text()).toContain('Reveal sensitive content');
      
      // Should not show the actual content initially
      expect(wrapper.find('[data-testid="markdown-preview"]').exists()).toBe(false);
    });

    it('should reveal content when user clicks reveal button', async () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      // Initially content should be hidden
      expect(wrapper.find('[data-testid="markdown-preview"]').exists()).toBe(false);
      
      // Find and click the reveal button
      const buttons = wrapper.findAll('button');
      const revealButton = buttons.find(button => button.text().includes('Reveal sensitive content'));
      expect(revealButton?.exists()).toBe(true);
      
      await revealButton!.trigger('click');
      await wrapper.vm.$nextTick();
      
      // Content should now be visible
      expect(wrapper.find('[data-testid="markdown-preview"]').exists()).toBe(true);
      
      // Warning should be hidden
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

    it('should NOT show blocked view for sensitive content', () => {
      const mockDiscussion = createMockDiscussion(true);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      // Should NOT show the sensitive content warning
      const sensitiveContentWarnings = wrapper.findAll('.bg-gray-200');
      expect(sensitiveContentWarnings.length).toBe(0);
      expect(wrapper.text()).not.toContain('This content has been marked as potentially sensitive.');
      
      // Should show the actual content immediately
      expect(wrapper.find('[data-testid="markdown-preview"]').exists()).toBe(true);
    });

    it('should show content normally when not sensitive', () => {
      const mockDiscussion = createMockDiscussion(false);
      
      const wrapper = mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: mockDiscussion
        }
      });
      
      // Should not show sensitive content warning
      const sensitiveContentWarnings = wrapper.findAll('.bg-gray-200');
      expect(sensitiveContentWarnings.length).toBe(0);
      
      // Should show the actual content
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
      
      // Should treat as user does not allow sensitive content by default
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
      
      // Should treat as user does not allow sensitive content by default
      const sensitiveContentDiv = wrapper.find('[data-testid="require-auth"]').element.parentElement;
      expect(sensitiveContentDiv?.classList.contains('bg-gray-200')).toBe(true);
      expect(wrapper.text()).toContain('Reveal sensitive content');
    });

    it('should call useQuery with correct reactive parameters', () => {
      mockIsAuthenticatedVar.value = true;
      mockUsernameVar.value = 'testuser';
      
      mount(DiscussionBody, {
        props: {
          channelId: 'test-channel',
          discussion: createMockDiscussion()
        }
      });
      
      // Verify useQuery was called with the correct structure
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.any(Object), // GET_USER query
        expect.any(Function), // Variables function
        expect.any(Function)  // Options function
      );
      
      // Get the functions that were passed to useQuery
      const [, variablesFunc, optionsFunc] = mockUseQuery.mock.calls[0];
      
      // Test variables function
      const variables = variablesFunc();
      expect(variables).toEqual({
        username: 'testuser'
      });
      
      // Test options function
      const options = optionsFunc();
      expect(options).toEqual({
        enabled: true // isAuthenticatedVar.value && !!usernameVar.value
      });
    });
  });
});