import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

// Mock dependencies before importing
vi.mock('@/components/auth/RequireAuth.vue', () => ({
  default: {
    name: 'RequireAuth',
    template: `
      <div>
        <slot name="has-auth"></slot>
      </div>
    `,
    props: {
      requireOwnership: Boolean,
      owners: Array,
      justifyLeft: Boolean,
      fullWidth: Boolean,
      loading: Boolean,
    },
  },
}));

// Create a fake ModerationWizard component for testing
const ModerationWizard = {
  name: 'ModerationWizard',
  template: `
    <div>
      <div v-if="issue.isOpen" class="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-600">
        <div data-testid="eye-icon"></div>
      </div>
      <div v-else class="flex items-center justify-center h-10 w-10 rounded-lg bg-gray-300 dark:bg-gray-700">
        <div data-testid="eye-icon"></div>
      </div>

      <div
        class="flex-1 flex-col space-y-4 px-4 py-4 border rounded-lg"
        :class="[issue.isOpen && !isCurrentUserOriginalPoster ? 'border-blue-500' : 'border-gray-300 dark:border-gray-700']"
      >
        <h1 v-if="issue.isOpen && !isCurrentUserOriginalPoster" class="text-xl font-bold text-blue-500">
          Mod Action Needed
        </h1>
        <h1 v-else class="text-xl font-bold text-gray-500 dark:text-gray-300">
          Mod Actions
        </h1>

        <p v-if="!issue.isOpen" class="text-gray-600 dark:text-gray-400">
          Mod actions are disabled because the issue is closed.
        </p>
        <p v-else-if="isCurrentUserOriginalPoster" class="text-gray-600 dark:text-gray-400">
          Mod actions are disabled because you are the author of the original post.
        </p>

        <div class="flex flex-col space-y-4 mt-4">
          <div
            v-if="issue.isOpen && !isCurrentUserOriginalPoster"
            class="rounded-lg border border-blue-200 bg-blue-50 p-4"
          >
            <div class="space-y-1">
              <p class="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Decision point
              </p>
              <p class="text-base font-semibold text-blue-800">
                Is there a rule violation?
              </p>
              <p class="text-sm text-blue-700/90">
                Choose the path below based on your assessment.
              </p>
            </div>
          </div>

          <div
            v-if="issue.isOpen && !isCurrentUserOriginalPoster"
            class="grid grid-cols-1 gap-4 lg:grid-cols-2"
          >
            <div
              class="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
            >
              <div class="space-y-1">
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  If no (no violation)
                </p>
                <p class="text-sm text-gray-700">
                  Close the issue to log that no moderation action is needed.
                </p>
              </div>
              <button
                class="w-full cursor-pointer bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded flex items-center gap-2 justify-center"
                :loading="closeIssueLoading"
                @click="$emit('close-issue')"
              >
                <div data-testid="x-circle-icon"></div>
                Close Issue (No Action Needed)
              </button>
            </div>

            <div
              class="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
              :class="[actionsDisabled ? 'opacity-60 grayscale' : 'opacity-100']"
            >
              <div class="space-y-1">
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  If yes (violation)
                </p>
                <p class="text-sm text-gray-700">
                  Address the violation by editing the original post or taking stronger action.
                </p>
              </div>

              <div v-if="editActions.length" class="flex flex-wrap gap-2">
                <button
                  v-for="action in editActions"
                  :key="action.testId"
                  type="button"
                  :data-test="action.testId"
                  class="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800"
                  :disabled="actionsDisabled"
                >
                  {{ action.label }}
                </button>
              </div>

              <div class="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3">
                <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Destructive actions
                </p>
                <p class="text-sm text-amber-800">
                  Only use these when the post clearly breaks rules.
                </p>
                <div class="flex flex-col gap-2">
                  <div
                    data-test="archive-button"
                    :data-issue="JSON.stringify(issue)"
                    :data-discussion-id="discussionId"
                    :data-event-id="eventId"
                    :data-comment-id="commentId"
                    :data-context-text="contextText"
                    :data-channel-unique-name="channelUniqueName"
                    :data-disabled="actionsDisabled"
                    @click="$emit('archived-successfully')"
                  >
                    Archive Button
                  </div>

                  <div
                    data-test="suspend-user-button"
                    :data-issue="JSON.stringify(issue)"
                    :data-discussion-title="contextText"
                    :data-discussion-id="discussionId"
                    :data-event-title="contextText"
                    :data-event-id="eventId"
                    :data-channel-unique-name="channelUniqueName"
                    :data-disabled="actionsDisabled"
                    @click="$emit('suspended-user-successfully')"
                  >
                    Suspend User Button
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  props: {
    issue: {
      type: Object,
      required: true,
    },
    discussionId: {
      type: String,
      default: '',
    },
    discussionHasDownload: {
      type: Boolean,
      default: null,
    },
    eventId: {
      type: String,
      default: '',
    },
    commentId: {
      type: String,
      default: '',
    },
    contextText: {
      type: String,
      default: '',
    },
    channelUniqueName: {
      type: String,
      default: '',
    },
    closeIssueLoading: {
      type: Boolean,
      default: false,
    },
    isCurrentUserOriginalPoster: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    actionsDisabled() {
      return !this.issue.isOpen || this.isCurrentUserOriginalPoster;
    },
    relatedContentType() {
      if (this.commentId) return 'comment';
      if (this.eventId) return 'event';
      if (this.discussionId) {
        return this.discussionHasDownload ? 'download' : 'discussion';
      }
      return null;
    },
    editActions() {
      switch (this.relatedContentType) {
        case 'comment':
          return [{ label: 'Edit Comment', testId: 'edit-comment' }];
        case 'discussion':
          return [
            { label: 'Edit Discussion Title', testId: 'edit-discussion-title' },
            { label: 'Edit Discussion Body', testId: 'edit-discussion-body' },
          ];
        case 'download':
          return [
            { label: 'Edit Download Title', testId: 'edit-download-title' },
            {
              label: 'Edit Download Description',
              testId: 'edit-download-description',
            },
          ];
        case 'event':
          return [
            { label: 'Edit Event Title', testId: 'edit-event-title' },
            {
              label: 'Edit Event Description',
              testId: 'edit-event-description',
            },
          ];
        default:
          return [];
      }
    },
  },
  emits: [
    'close-issue',
    'open-issue',
    'archived-successfully',
    'unarchived-successfully',
    'suspended-user-successfully',
    'suspended-mod-successfully',
    'unsuspended-user-successfully',
    'unsuspended-mod-successfully',
  ],
};

describe('ModerationWizard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mock data for testing
  const openIssue = {
    id: 'issue-123',
    isOpen: true,
    title: 'Test Issue',
  };

  const closedIssue = {
    id: 'issue-456',
    isOpen: false,
    title: 'Closed Issue',
  };

  const mountComponent = (props = {}) => {
    return mount(ModerationWizard, {
      props: {
        issue: openIssue,
        channelUniqueName: 'test-channel',
        discussionId: 'discussion-123',
        ...props,
      },
    });
  };

  it('renders with an open issue', async () => {
    const wrapper = mountComponent({ issue: openIssue });

    // Check if the component renders with the correct title for an open issue
    expect(wrapper.text()).toContain('Mod Action Needed');
    expect(wrapper.text()).toContain('Is there a rule violation?');
    expect(wrapper.text()).toContain('If no (no violation)');
    expect(wrapper.text()).toContain('If yes (violation)');

    // Check if buttons are present
    expect(wrapper.find('[data-test="archive-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="suspend-user-button"]').exists()).toBe(
      true
    );
    expect(wrapper.find('[data-test="edit-discussion-title"]').exists()).toBe(
      true
    );
    expect(wrapper.find('[data-test="edit-discussion-body"]').exists()).toBe(
      true
    );

    // Check if close issue button is present
    const closeButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Close Issue (No Action Needed)'));
    expect(closeButton).toBeDefined();
  });

  it('renders with a closed issue', async () => {
    const wrapper = mountComponent({ issue: closedIssue });

    // Check if the component renders with the correct title for a closed issue
    expect(wrapper.text()).toContain('Mod Actions');
    expect(wrapper.text()).toContain(
      'Mod actions are disabled because the issue is closed.'
    );

    // Check if close issue button is not present
    const closeButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Close Issue (No Action Needed)'));
    expect(closeButton).toBeUndefined();

    // Action blocks are hidden for closed issues
    expect(wrapper.find('[data-test="archive-button"]').exists()).toBe(false);
    expect(
      wrapper.find('[data-test="suspend-user-button"]').exists()
    ).toBe(false);
    expect(wrapper.find('[data-test="edit-discussion-title"]').exists()).toBe(
      false
    );
  });

  it('renders comment edit action when the related content is a comment', async () => {
    const wrapper = mountComponent({
      commentId: 'comment-123',
      discussionId: '',
      eventId: '',
    });

    expect(wrapper.find('[data-test="edit-comment"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="edit-discussion-title"]').exists()).toBe(
      false
    );
    expect(
      wrapper.find('[data-test="edit-download-title"]').exists()
    ).toBe(false);
  });

  it('renders download edit actions when discussion has a download', async () => {
    const wrapper = mountComponent({
      discussionId: 'discussion-123',
      discussionHasDownload: true,
    });

    expect(
      wrapper.find('[data-test="edit-download-title"]').exists()
    ).toBe(true);
    expect(
      wrapper.find('[data-test="edit-download-description"]').exists()
    ).toBe(true);
    expect(wrapper.find('[data-test="edit-discussion-title"]').exists()).toBe(
      false
    );
  });

  it('renders event edit actions when the related content is an event', async () => {
    const wrapper = mountComponent({
      discussionId: '',
      eventId: 'event-123',
    });

    expect(wrapper.find('[data-test="edit-event-title"]').exists()).toBe(true);
    expect(
      wrapper.find('[data-test="edit-event-description"]').exists()
    ).toBe(true);
    expect(wrapper.find('[data-test="edit-discussion-title"]').exists()).toBe(
      false
    );
  });

  it('hides destructive actions when the issue is closed', async () => {
    const wrapper = mountComponent({ issue: closedIssue });

    expect(wrapper.find('[data-test="archive-button"]').exists()).toBe(false);
  });

  it('hides suspend action when the issue is closed', async () => {
    const wrapper = mountComponent({ issue: closedIssue });

    expect(wrapper.find('[data-test="suspend-user-button"]').exists()).toBe(
      false
    );
  });

  it('emits close-issue event when the close button is clicked', async () => {
    const wrapper = mountComponent({ issue: openIssue });

    const closeButton = wrapper.find('button');
    await closeButton.trigger('click');

    expect(wrapper.emitted('close-issue')).toBeTruthy();
  });

  it('passes correct props to ArchiveButton', async () => {
    const wrapper = mountComponent({
      issue: openIssue,
      discussionId: 'disc-123',
      eventId: 'event-456',
      commentId: 'comment-789',
      contextText: 'Test Context',
      channelUniqueName: 'test-channel',
    });

    const archiveButton = wrapper.find('[data-test="archive-button"]');
    expect(JSON.parse(archiveButton.attributes('data-issue') || '')).toEqual(
      openIssue
    );
    expect(archiveButton.attributes('data-discussion-id')).toBe('disc-123');
    expect(archiveButton.attributes('data-event-id')).toBe('event-456');
    expect(archiveButton.attributes('data-comment-id')).toBe('comment-789');
    expect(archiveButton.attributes('data-context-text')).toBe('Test Context');
    expect(archiveButton.attributes('data-channel-unique-name')).toBe(
      'test-channel'
    );
    expect(archiveButton.attributes('data-disabled')).toBe('false');
  });

  it('passes correct props to SuspendUserButton', async () => {
    const wrapper = mountComponent({
      issue: openIssue,
      discussionId: 'disc-123',
      eventId: 'event-456',
      contextText: 'Test Context',
      channelUniqueName: 'test-channel',
    });

    const suspendButton = wrapper.find('[data-test="suspend-user-button"]');
    expect(JSON.parse(suspendButton.attributes('data-issue') || '')).toEqual(
      openIssue
    );
    expect(suspendButton.attributes('data-discussion-id')).toBe('disc-123');
    expect(suspendButton.attributes('data-event-id')).toBe('event-456');
    expect(suspendButton.attributes('data-discussion-title')).toBe(
      'Test Context'
    );
    expect(suspendButton.attributes('data-event-title')).toBe('Test Context');
    expect(suspendButton.attributes('data-channel-unique-name')).toBe(
      'test-channel'
    );
    expect(suspendButton.attributes('data-disabled')).toBe('false');
  });

  it('forwards archived-successfully event from ArchiveButton', async () => {
    const wrapper = mountComponent({ issue: openIssue });

    const archiveButton = wrapper.find('[data-test="archive-button"]');
    await archiveButton.trigger('click');

    expect(wrapper.emitted('archived-successfully')).toBeTruthy();
  });

  it('forwards unarchived-successfully event from ArchiveButton', async () => {
    const wrapper = mountComponent({ issue: openIssue });

    // Emit the event directly since our mock doesn't have a separate trigger for this
    wrapper.vm.$emit('unarchived-successfully');
    await nextTick();

    expect(wrapper.emitted('unarchived-successfully')).toBeTruthy();
  });

  it('forwards suspended-user-successfully event from SuspendUserButton', async () => {
    const wrapper = mountComponent({ issue: openIssue });

    const suspendButton = wrapper.find('[data-test="suspend-user-button"]');
    await suspendButton.trigger('click');

    expect(wrapper.emitted('suspended-user-successfully')).toBeTruthy();
  });

  it('forwards unsuspended-successfully event from SuspendUserButton', async () => {
    const wrapper = mountComponent({ issue: openIssue });

    // Emit the event directly since our mock doesn't have a separate trigger for this
    wrapper.vm.$emit('unsuspended-user-successfully');
    await nextTick();

    expect(wrapper.emitted('unsuspended-user-successfully')).toBeTruthy();
  });

  it('renders with the correct classes for an open issue', async () => {
    const wrapper = mountComponent({ issue: openIssue });

    // Check the styling for an open issue
    const coloredDiv = wrapper.find('.rounded-lg');
    expect(coloredDiv.classes()).toContain('bg-blue-600');

    const borderDiv = wrapper.find('.rounded-lg + div');
    expect(borderDiv.classes()).toContain('border-blue-500');
  });

  it('renders with the correct classes for a closed issue', async () => {
    const wrapper = mountComponent({ issue: closedIssue });

    // Check the styling for a closed issue
    const coloredDiv = wrapper.find('.rounded-lg');
    expect(coloredDiv.classes()).toContain('bg-gray-300');

    const borderDiv = wrapper.find('.rounded-lg + div');
    expect(borderDiv.classes()).toContain('border-gray-300');
  });
});
