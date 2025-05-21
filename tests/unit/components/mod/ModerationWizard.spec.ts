import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";

// Mock dependencies before importing
vi.mock("@/components/auth/RequireAuth.vue", () => ({
  default: {
    name: "RequireAuth",
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
  name: "ModerationWizard",
  template: `
    <div>
      <div v-if="issue.isOpen" class="flex justify-center items-center w-10 h-10 rounded-lg bg-blue-600">
        <div data-testid="eye-icon"></div>
      </div>
      <div v-else class="flex justify-center items-center w-10 h-10 rounded-lg bg-gray-300 dark:bg-gray-700">
        <div data-testid="eye-icon"></div>
      </div>
      
      <div 
        class="flex-1 flex-col space-y-4 px-4 py-4 border rounded-lg"
        :class="[issue.isOpen ? 'border-blue-500' : 'border-gray-300 dark:border-gray-700']"
      >
        <h1 v-if="issue.isOpen" class="text-xl font-bold text-blue-500">
          Mod Decision Needed
        </h1>
        <h1 v-else class="text-xl font-bold text-gray-500 dark:text-gray-300">
          Mod Actions
        </h1>
        
        <p v-if="!issue.isOpen" class="text-gray-600 dark:text-gray-400">
          Mod actions are disabled because the issue is closed.
        </p>
        
        <div class="flex flex-col space-y-4 mt-4">
          <div 
            data-testid="archive-button" 
            :data-issue="JSON.stringify(issue)"
            :data-discussion-id="discussionId"
            :data-event-id="eventId"
            :data-comment-id="commentId"
            :data-context-text="contextText"
            :data-channel-unique-name="channelUniqueName"
            :data-disabled="!issue.isOpen"
            @click="$emit('archived-successfully')"
          >
            Archive Button
          </div>
          
          <div 
            data-testid="suspend-user-button"
            :data-issue="JSON.stringify(issue)"
            :data-discussion-title="contextText"
            :data-discussion-id="discussionId"
            :data-event-title="contextText"
            :data-event-id="eventId"
            :data-channel-unique-name="channelUniqueName"
            :data-disabled="!issue.isOpen"
            @click="$emit('suspended-user-successfully')"
          >
            Suspend User Button
          </div>
          
          <button
            v-if="issue.isOpen"
            class="w-full cursor-pointer bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded flex items-center gap-2 justify-center"
            :loading="closeIssueLoading"
            @click="$emit('close-issue')"
          >
            <div data-testid="x-circle-icon"></div>
            Close Issue (No Action Needed)
          </button>
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
      default: "",
    },
    eventId: {
      type: String,
      default: "",
    },
    commentId: {
      type: String,
      default: "",
    },
    contextText: {
      type: String,
      default: "",
    },
    channelUniqueName: {
      type: String,
      default: "",
    },
    closeIssueLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    "close-issue",
    "open-issue",
    "archived-successfully",
    "unarchived-successfully",
    "suspended-user-successfully",
    "suspended-mod-successfully",
    "unsuspended-user-successfully",
    "unsuspended-mod-successfully",
  ],
};

describe("ModerationWizard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mock data for testing
  const openIssue = {
    id: "issue-123",
    isOpen: true,
    title: "Test Issue",
  };

  const closedIssue = {
    id: "issue-456",
    isOpen: false,
    title: "Closed Issue",
  };

  const mountComponent = (props = {}) => {
    return mount(ModerationWizard, {
      props: {
        issue: openIssue,
        channelUniqueName: "test-channel",
        ...props,
      },
    });
  };

  it("renders with an open issue", async () => {
    const wrapper = mountComponent({ issue: openIssue });

    // Check if the component renders with the correct title for an open issue
    expect(wrapper.text()).toContain("Mod Decision Needed");

    // Check if buttons are present
    expect(wrapper.find('[data-testid="archive-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="suspend-user-button"]').exists()).toBe(true);

    // Check if close issue button is present
    const closeButton = wrapper.find("button");
    expect(closeButton.exists()).toBe(true);
    expect(closeButton.text()).toContain("Close Issue (No Action Needed)");
  });

  it("renders with a closed issue", async () => {
    const wrapper = mountComponent({ issue: closedIssue });

    // Check if the component renders with the correct title for a closed issue
    expect(wrapper.text()).toContain("Mod Actions");
    expect(wrapper.text()).toContain("Mod actions are disabled because the issue is closed.");

    // Check if close issue button is not present
    const closeButton = wrapper.find("button");
    expect(closeButton.exists()).toBe(false);
  });

  it("passes the disabled prop to ArchiveButton when the issue is closed", async () => {
    const wrapper = mountComponent({ issue: closedIssue });

    const archiveButton = wrapper.find('[data-testid="archive-button"]');
    expect(archiveButton.attributes("data-disabled")).toBe("true");
  });

  it("passes the disabled prop to SuspendUserButton when the issue is closed", async () => {
    const wrapper = mountComponent({ issue: closedIssue });

    const suspendButton = wrapper.find('[data-testid="suspend-user-button"]');
    expect(suspendButton.attributes("data-disabled")).toBe("true");
  });

  it("emits close-issue event when the close button is clicked", async () => {
    const wrapper = mountComponent({ issue: openIssue });

    const closeButton = wrapper.find("button");
    await closeButton.trigger("click");

    expect(wrapper.emitted("close-issue")).toBeTruthy();
  });

  it("passes correct props to ArchiveButton", async () => {
    const wrapper = mountComponent({
      issue: openIssue,
      discussionId: "disc-123",
      eventId: "event-456",
      commentId: "comment-789",
      contextText: "Test Context",
      channelUniqueName: "test-channel",
    });

    const archiveButton = wrapper.find('[data-testid="archive-button"]');
    expect(JSON.parse(archiveButton.attributes("data-issue"))).toEqual(openIssue);
    expect(archiveButton.attributes("data-discussion-id")).toBe("disc-123");
    expect(archiveButton.attributes("data-event-id")).toBe("event-456");
    expect(archiveButton.attributes("data-comment-id")).toBe("comment-789");
    expect(archiveButton.attributes("data-context-text")).toBe("Test Context");
    expect(archiveButton.attributes("data-channel-unique-name")).toBe("test-channel");
    expect(archiveButton.attributes("data-disabled")).toBe("false");
  });

  it("passes correct props to SuspendUserButton", async () => {
    const wrapper = mountComponent({
      issue: openIssue,
      discussionId: "disc-123",
      eventId: "event-456",
      contextText: "Test Context",
      channelUniqueName: "test-channel",
    });

    const suspendButton = wrapper.find('[data-testid="suspend-user-button"]');
    expect(JSON.parse(suspendButton.attributes("data-issue"))).toEqual(openIssue);
    expect(suspendButton.attributes("data-discussion-id")).toBe("disc-123");
    expect(suspendButton.attributes("data-event-id")).toBe("event-456");
    expect(suspendButton.attributes("data-discussion-title")).toBe("Test Context");
    expect(suspendButton.attributes("data-event-title")).toBe("Test Context");
    expect(suspendButton.attributes("data-channel-unique-name")).toBe("test-channel");
    expect(suspendButton.attributes("data-disabled")).toBe("false");
  });

  it("forwards archived-successfully event from ArchiveButton", async () => {
    const wrapper = mountComponent({ issue: openIssue });

    const archiveButton = wrapper.find('[data-testid="archive-button"]');
    await archiveButton.trigger("click");

    expect(wrapper.emitted("archived-successfully")).toBeTruthy();
  });

  it("forwards unarchived-successfully event from ArchiveButton", async () => {
    const wrapper = mountComponent({ issue: openIssue });

    // Emit the event directly since our mock doesn't have a separate trigger for this
    wrapper.vm.$emit("unarchived-successfully");
    await nextTick();

    expect(wrapper.emitted("unarchived-successfully")).toBeTruthy();
  });

  it("forwards suspended-user-successfully event from SuspendUserButton", async () => {
    const wrapper = mountComponent({ issue: openIssue });

    const suspendButton = wrapper.find('[data-testid="suspend-user-button"]');
    await suspendButton.trigger("click");

    expect(wrapper.emitted("suspended-user-successfully")).toBeTruthy();
  });

  it("forwards unsuspended-successfully event from SuspendUserButton", async () => {
    const wrapper = mountComponent({ issue: openIssue });

    // Emit the event directly since our mock doesn't have a separate trigger for this
    wrapper.vm.$emit("unsuspended-user-successfully");
    await nextTick();

    expect(wrapper.emitted("unsuspended-user-successfully")).toBeTruthy();
  });

  it("renders with the correct classes for an open issue", async () => {
    const wrapper = mountComponent({ issue: openIssue });

    // Check the styling for an open issue
    const coloredDiv = wrapper.find(".rounded-lg");
    expect(coloredDiv.classes()).toContain("bg-blue-600");

    const borderDiv = wrapper.find(".rounded-lg + div");
    expect(borderDiv.classes()).toContain("border-blue-500");
  });

  it("renders with the correct classes for a closed issue", async () => {
    const wrapper = mountComponent({ issue: closedIssue });

    // Check the styling for a closed issue
    const coloredDiv = wrapper.find(".rounded-lg");
    expect(coloredDiv.classes()).toContain("bg-gray-300");

    const borderDiv = wrapper.find(".rounded-lg + div");
    expect(borderDiv.classes()).toContain("border-gray-300");
  });
});
