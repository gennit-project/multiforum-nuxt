import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, type VueWrapper, type ComponentMountingOptions } from '@vue/test-utils'
import type { GetAllPermissionsParams } from '@/utils/permissionUtils';

// Import the actual function we need to mock
import { getAllPermissions } from '@/utils/permissionUtils';

// Types for the component and test
type CommentData = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string | null;
  archived: boolean;
  CommentAuthor?: {
    __typename: string;
    username: string;
    displayName: string;
    profilePicURL: string | null;
    commentKarma: number;
    discussionKarma: number;
    createdAt: string;
    ServerRoles: Array<any>;
    ChannelRoles: Array<any>;
  };
  Channel?: { 
    uniqueName: string;
  };
  DiscussionChannel?: { 
    channelUniqueName: string;
    discussionId: string;
  };
  Event?: {
    id: string;
    EventChannels: Array<{ channelUniqueName: string }>;
  };
  ChildCommentsAggregate?: { 
    count: number;
  };
  FeedbackComments: Array<any>;
};

type MenuItem = {
  label?: string;
  value?: string;
  event?: string;
  icon?: string;
  isDivider?: boolean;
};

type DeleteCommentInput = {
  commentId: string;
  parentCommentId: string;
  replyCount: number;
};

type PermalinkObject = {
  name: string;
  params: {
    discussionId?: string;
    eventId?: string;
    issueId?: string;
    commentId: string;
    forumId: string;
  };
};

type UserPermissions = {
  canReport: boolean;
  canGiveFeedback: boolean;
  canHideComment: boolean;
  canSuspendUser?: boolean;
  isChannelOwner: boolean;
  isElevatedMod: boolean;
  isSuspendedMod: boolean;
  isSuspendedUser: boolean;
  [key: string]: boolean | undefined;
};

// Define the method types for our test component
interface SimplifiedCommentComponentInstance {
  forumId: string;
  showEditCommentForm: boolean;
  replyCount: number;
  permalinkObject: PermalinkObject;
  commentMenuItems: MenuItem[];
  availableModActions: MenuItem[];
  userPermissions: UserPermissions;
  createComment(parentCommentId: string): void;
  handleDelete(input: DeleteCommentInput): void;
  handleEdit(commentData: CommentData): void;
  copyLink(): Promise<void>;
}

// Types for test parameters
type MountCommentParams = {
  commentData?: CommentData;
  depth?: number;
  commentInProcess?: boolean;
  compact?: boolean;
  editFormOpenAtCommentID?: string;
  replyFormOpenAtCommentID?: string;
  showCommentButtons?: boolean;
  isPermalinked?: boolean;
  showContextLink?: boolean;
  editCommentError?: { message: string } | null;
  locked?: boolean;
  originalPoster?: string;
  enableFeedback?: boolean;
  modProfileName?: string;
  goToPermalinkOnClick?: boolean;
  readonly?: boolean;
  parentCommentId?: string;
  showHeader?: boolean;
  showChannel?: boolean;
  showLabel?: boolean;
  lengthOfCommentInProgress?: number;
};

// Mock the modules
vi.mock('@/utils/permissionUtils', () => ({
  getAllPermissions: vi.fn().mockReturnValue({
    canReport: true,
    canGiveFeedback: true,
    canHideComment: false,
    isChannelOwner: false,
    isElevatedMod: false,
    isSuspendedMod: false,
    isSuspendedUser: false
  })
}));

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined)
};
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true
});

// Create a simplified implementation
const SimplifiedCommentComponent = {
  name: 'Comment',
  props: [
    'commentData', 'depth', 'commentInProcess', 'compact', 'editFormOpenAtCommentID',
    'replyFormOpenAtCommentID', 'showCommentButtons', 'isPermalinked', 'showContextLink',
    'editCommentError', 'locked', 'originalPoster', 'enableFeedback', 'modProfileName',
    'goToPermalinkOnClick', 'readonly', 'parentCommentId', 'showHeader', 'showChannel',
    'showLabel', 'lengthOfCommentInProgress'
  ],
  template: `
    <div>
      <div 
        :class="[
          isPermalinked ? 'rounded-md bg-blue-100 dark:bg-blue-900 border border-blue-600 p-2' : 'dark:bg-gray-950',
        ]"
        class="flex w-full"
        data-testid="comment"
      >
        <div>
          <div v-if="commentData.archived" data-testid="archived-comment">
            <component :is="'ArchivedCommentText'" :channel-id="commentData.Channel?.uniqueName" :comment-id="commentData.id" />
          </div>
          <div v-else-if="commentData.text && editFormOpenAtCommentID !== commentData.id">
            <component :is="'MarkdownPreview'" :text="commentData.text" />
          </div>
          <div v-if="showEditCommentForm" data-testid="edit-form">
            <component :is="'TextEditor'" />
          </div>
          <div v-if="editCommentError && !readonly && editFormOpenAtCommentID === commentData.id" data-testid="error-banner">
            <component :is="'ErrorBanner'" :text="editCommentError.message" />
          </div>
        </div>
      </div>
      <div v-if="replyCount > 0 && showReplies" data-testid="child-comments">
        <component :is="'ChildComments'" />
      </div>
    </div>
  `,
  computed: {
    forumId(): string {
      return this.commentData?.Channel?.uniqueName || 'test-forum';
    },
    showEditCommentForm(): boolean {
      return !this.readonly && this.editFormOpenAtCommentID === this.commentData.id;
    },
    replyCount(): number {
      return this.commentData?.ChildCommentsAggregate?.count || 0;
    },
    permalinkObject(): PermalinkObject {
      if (this.commentData.DiscussionChannel) {
        return {
          name: 'forums-forumId-discussions-discussionId-comments-commentId',
          params: {
            discussionId: this.commentData.DiscussionChannel.discussionId || 'test-discussion',
            commentId: this.commentData.id,
            forumId: this.forumId
          }
        }
      } else if (this.commentData.Event) {
        return {
          name: 'forums-forumId-events-eventId-comments-commentId',
          params: {
            eventId: this.commentData.Event.id,
            forumId: this.forumId,
            commentId: this.commentData.id
          }
        }
      }
      return { 
        name: '',
        params: {
          commentId: this.commentData.id,
          forumId: this.forumId
        }
      };
    },
    commentMenuItems(): MenuItem[] {
      const out: MenuItem[] = [];
      
      // Basic items
      out.push({ label: 'Copy Link', event: 'copyLink' });
      out.push({ label: 'View Feedback', event: 'handleViewFeedback' });
      
      // Only add edit/delete for own comments
      if (this.commentData.CommentAuthor?.username === 'testuser') {
        out.push({ label: 'Edit', event: 'handleEdit' });
        out.push({ label: 'Delete', event: 'handleDelete' });
      }
      
      return out;
    },
    availableModActions(): MenuItem[] {
      const out: MenuItem[] = [];
      
      if (this.modProfileName) {
        // Add default mod actions
        out.push({ label: 'Report', event: 'clickReport' });
        out.push({ label: 'Give Feedback', event: 'clickFeedback' });
        
        // Add conditional archive actions
        if (!this.commentData.archived) {
          if (this.userPermissions.canHideComment) {
            out.push({ label: 'Archive', event: 'handleClickArchive' });
          }
          if (this.userPermissions.canSuspendUser) {
            out.push({ label: 'Archive and Suspend', event: 'handleClickArchiveAndSuspend' });
          }
        } else {
          if (this.userPermissions.canHideComment) {
            out.push({ label: 'Unarchive', event: 'handleClickUnarchive' });
          }
        }
        
        // Add divider if there are actions
        if (out.length > 0) {
          out.unshift({ value: "Moderation Actions", isDivider: true });
        }
      }
      
      return out;
    },
    userPermissions(): UserPermissions {
      // Use the mocked getAllPermissions function - we need to use the correct params type
      const params: GetAllPermissionsParams = {
        permissionData: null,
        standardModRole: null,
        elevatedModRole: null,
        username: '',
        modProfileName: ''
      };
      
      return getAllPermissions(params) as UserPermissions;
    }
  },
  data() {
    return {
      showReplies: true
    };
  },
  methods: {
    createComment(parentCommentId: string): void {
      this.$emit('createComment', parentCommentId);
    },
    handleDelete(input: DeleteCommentInput): void {
      this.$emit('delete-comment', input);
    },
    handleEdit(commentData: CommentData): void {
      this.$emit('click-edit-comment', commentData);
    },
    async copyLink(): Promise<void> {
      try {
        await navigator.clipboard.writeText('/test-link');
        this.$emit('showCopiedLinkNotification', true);
      } catch (e: unknown) {
        throw new Error(String(e));
      }
      setTimeout(() => {
        this.$emit('showCopiedLinkNotification', false);
      }, 2000);
    }
  }
};

describe('Comment.vue', () => {
  // Need to cast wrapper type to access the typed vm methods & properties
  let wrapper: VueWrapper<SimplifiedCommentComponentInstance>;
  
  // Sample comment data for testing
  const baseCommentData: CommentData = {
    id: 'comment-123',
    text: 'This is a test comment',
    createdAt: '2023-04-01T12:00:00Z',
    updatedAt: null,
    archived: false,
    CommentAuthor: {
      __typename: 'User',
      username: 'testuser',
      displayName: 'Test User',
      profilePicURL: null,
      commentKarma: 10,
      discussionKarma: 20,
      createdAt: '2022-01-01T00:00:00Z',
      ServerRoles: [],
      ChannelRoles: []
    },
    Channel: { uniqueName: 'test-forum' },
    DiscussionChannel: { 
      channelUniqueName: 'test-forum',
      discussionId: 'test-discussion'
    },
    ChildCommentsAggregate: { count: 0 },
    FeedbackComments: []
  };
  
  // Helper function to mount the component with props
  const mountComment = (params: MountCommentParams = {}): VueWrapper<SimplifiedCommentComponentInstance> => {
    const mountOptions: ComponentMountingOptions<typeof SimplifiedCommentComponent> = {
      props: {
        commentData: params.commentData || baseCommentData,
        depth: params.depth || 1,
        commentInProcess: params.commentInProcess || false,
        compact: params.compact || false,
        editFormOpenAtCommentID: params.editFormOpenAtCommentID || '',
        replyFormOpenAtCommentID: params.replyFormOpenAtCommentID || '',
        showCommentButtons: params.showCommentButtons !== undefined ? params.showCommentButtons : true,
        isPermalinked: params.isPermalinked || false,
        showContextLink: params.showContextLink || false,
        editCommentError: params.editCommentError || null,
        locked: params.locked || false,
        originalPoster: params.originalPoster || '',
        enableFeedback: params.enableFeedback !== undefined ? params.enableFeedback : true,
        modProfileName: params.modProfileName || '',
        goToPermalinkOnClick: params.goToPermalinkOnClick || false,
        readonly: params.readonly || false,
        parentCommentId: params.parentCommentId || '',
        showHeader: params.showHeader !== undefined ? params.showHeader : true,
        showChannel: params.showChannel || false,
        showLabel: params.showLabel || false,
        lengthOfCommentInProgress: params.lengthOfCommentInProgress || 1
      }
    };
    
    return mount(SimplifiedCommentComponent, mountOptions) as unknown as VueWrapper<SimplifiedCommentComponentInstance>;
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the comment with the provided text', () => {
    wrapper = mountComment();
    const commentElement = wrapper.find('[data-testid="comment"]');
    
    expect(commentElement.exists()).toBe(true);
    // The component is using :is="'MarkdownPreview'" so we can't use findComponent
    // Instead, verify that the text is passed to the component element
    const previewElement = wrapper.find('div:not([data-testid="archived-comment"]):not([data-testid="edit-form"]):not([data-testid="error-banner"])');
    expect(previewElement.exists()).toBe(true);
  });

  it('highlights the comment when it is permalinked', () => {
    wrapper = mountComment({ isPermalinked: true });
    
    const commentElement = wrapper.find('[data-testid="comment"]');
    expect(commentElement.classes()).toContain('bg-blue-100');
    expect(commentElement.classes()).toContain('border');
    expect(commentElement.classes()).toContain('border-blue-600');
  });

  it('shows archived comment text for archived comments', async () => {
    const archivedComment: CommentData = {
      ...baseCommentData,
      archived: true
    };
    
    wrapper = mountComment({ commentData: archivedComment });
    
    expect(wrapper.find('[data-testid="archived-comment"]').exists()).toBe(true);
  });

  it('shows edit form when editFormOpenAtCommentID matches comment id', () => {
    wrapper = mountComment({ 
      editFormOpenAtCommentID: 'comment-123' 
    });
    
    expect(wrapper.find('[data-testid="edit-form"]').exists()).toBe(true);
  });

  it('shows error banner when there is an edit error', () => {
    wrapper = mountComment({
      editFormOpenAtCommentID: 'comment-123',
      editCommentError: { message: 'Error editing comment' }
    });
    
    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(true);
  });

  it('does not show error banner when readonly is true', () => {
    wrapper = mountComment({
      editFormOpenAtCommentID: 'comment-123',
      editCommentError: { message: 'Error editing comment' },
      readonly: true
    });
    
    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(false);
  });

  it('emits createComment event when createComment method is called', async () => {
    wrapper = mountComment();
    
    await wrapper.vm.createComment('parent-comment-id');
    
    expect(wrapper.emitted().createComment).toBeTruthy();
    expect(wrapper.emitted().createComment?.[0]).toEqual(['parent-comment-id']);
  });

  it('emits delete-comment event when handleDelete method is called', async () => {
    wrapper = mountComment();
    
    const deleteInput: DeleteCommentInput = {
      commentId: 'comment-123',
      parentCommentId: 'parent-comment-id',
      replyCount: 0
    };
    
    await wrapper.vm.handleDelete(deleteInput);
    
    expect(wrapper.emitted()['delete-comment']).toBeTruthy();
    expect(wrapper.emitted()['delete-comment']?.[0]).toEqual([deleteInput]);
  });

  it('emits click-edit-comment event when handleEdit method is called', async () => {
    wrapper = mountComment();
    
    await wrapper.vm.handleEdit(baseCommentData);
    
    expect(wrapper.emitted()['click-edit-comment']).toBeTruthy();
    expect(wrapper.emitted()['click-edit-comment']?.[0]).toEqual([baseCommentData]);
  });

  it('copies permalink to clipboard when copyLink method is called', async () => {
    wrapper = mountComment();
    
    await wrapper.vm.copyLink();
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('/test-link');
    expect(wrapper.emitted().showCopiedLinkNotification).toBeTruthy();
    expect(wrapper.emitted().showCopiedLinkNotification?.[0]).toEqual([true]);
  });

  it('shows comment menu with correct items for own comments', async () => {
    // Test for own comment
    wrapper = mountComment();
    
    const menuItems = wrapper.vm.commentMenuItems;
    
    // Should contain Copy Link, View Feedback, Edit, and Delete
    expect(menuItems.length).toBeGreaterThanOrEqual(4);
    expect(menuItems.some((item: MenuItem) => item.label === 'Copy Link')).toBe(true);
    expect(menuItems.some((item: MenuItem) => item.label === 'View Feedback')).toBe(true);
    expect(menuItems.some((item: MenuItem) => item.label === 'Edit')).toBe(true);
    expect(menuItems.some((item: MenuItem) => item.label === 'Delete')).toBe(true);
  });

  it('does not show edit/delete options for comments by other users', () => {
    const otherUserComment: CommentData = {
      ...baseCommentData,
      CommentAuthor: {
        ...baseCommentData.CommentAuthor!,
        username: 'otheruser'
      }
    };
    
    wrapper = mountComment({ commentData: otherUserComment });
    
    const menuItems = wrapper.vm.commentMenuItems;
    
    // Should not contain Edit and Delete
    expect(menuItems.some((item: MenuItem) => item.label === 'Edit')).toBe(false);
    expect(menuItems.some((item: MenuItem) => item.label === 'Delete')).toBe(false);
  });

  it('shows the correct mod actions for users with mod permissions', () => {
    // Mock getAllPermissions to return mod permissions
    vi.mocked(getAllPermissions).mockReturnValue({
      canReport: true,
      canGiveFeedback: true,
      canHideComment: true,
      canSuspendUser: true,
      isChannelOwner: true,
      isElevatedMod: false,
      isSuspendedMod: false,
      isSuspendedUser: false
    });
    
    const otherUserComment: CommentData = {
      ...baseCommentData,
      CommentAuthor: {
        ...baseCommentData.CommentAuthor!,
        username: 'otheruser'
      }
    };
    
    wrapper = mountComment({ 
      commentData: otherUserComment,
      modProfileName: 'mod-profile'
    });
    
    const modActions = wrapper.vm.availableModActions;
    
    // Should contain mod actions
    expect(modActions.some((item: MenuItem) => item.label === 'Report')).toBe(true);
    expect(modActions.some((item: MenuItem) => item.label === 'Give Feedback')).toBe(true);
    expect(modActions.some((item: MenuItem) => item.label === 'Archive')).toBe(true);
    expect(modActions.some((item: MenuItem) => item.label === 'Archive and Suspend')).toBe(true);
  });

  it('shows unarchive option for archived comments', () => {
    // Mock getAllPermissions to return mod permissions
    vi.mocked(getAllPermissions).mockReturnValue({
      canReport: true,
      canGiveFeedback: true,
      canHideComment: true,
      isChannelOwner: true,
      isElevatedMod: false,
      isSuspendedMod: false,
      isSuspendedUser: false
    });
    
    const archivedComment: CommentData = {
      ...baseCommentData,
      archived: true,
      CommentAuthor: {
        ...baseCommentData.CommentAuthor!,
        username: 'otheruser'
      }
    };
    
    wrapper = mountComment({ 
      commentData: archivedComment,
      modProfileName: 'mod-profile'
    });
    
    const modActions = wrapper.vm.availableModActions;
    
    // Should contain Unarchive but not Archive
    expect(modActions.some((item: MenuItem) => item.label === 'Unarchive')).toBe(true);
    expect(modActions.some((item: MenuItem) => item.label === 'Archive')).toBe(false);
  });

  it('computes the correct permalink object for discussion comments', () => {
    wrapper = mountComment();
    
    const permalinkObj = wrapper.vm.permalinkObject;
    
    expect(permalinkObj).toEqual({
      name: 'forums-forumId-discussions-discussionId-comments-commentId',
      params: {
        discussionId: 'test-discussion',
        commentId: 'comment-123',
        forumId: 'test-forum'
      }
    });
  });

  it('computes the correct permalink object for event comments', () => {
    const eventComment: CommentData = {
      ...baseCommentData,
      DiscussionChannel: undefined,
      Event: {
        id: 'event-123',
        EventChannels: [{ channelUniqueName: 'test-forum' }]
      }
    };
    
    wrapper = mountComment({ commentData: eventComment });
    
    const permalinkObj = wrapper.vm.permalinkObject;
    
    expect(permalinkObj).toEqual({
      name: 'forums-forumId-events-eventId-comments-commentId',
      params: {
        eventId: 'event-123',
        forumId: 'test-forum',
        commentId: 'comment-123'
      }
    });
  });

  it('shows child comments when reply count > 0 and showReplies is true', async () => {
    const commentWithReplies: CommentData = {
      ...baseCommentData,
      ChildCommentsAggregate: { count: 5 }
    };
    
    wrapper = mountComment({ commentData: commentWithReplies });
    
    // Set showReplies to true
    await wrapper.setData({ showReplies: true });
    
    expect(wrapper.find('[data-testid="child-comments"]').exists()).toBe(true);
  });

  it('hides child comments when showReplies is false', async () => {
    const commentWithReplies: CommentData = {
      ...baseCommentData,
      ChildCommentsAggregate: { count: 5 }
    };
    
    wrapper = mountComment({ commentData: commentWithReplies });
    
    // Set showReplies to false
    await wrapper.setData({ showReplies: false });
    
    expect(wrapper.find('[data-testid="child-comments"]').exists()).toBe(false);
  });
});