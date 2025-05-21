import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";

// Mock dependencies before importing
vi.mock("@vue/apollo-composable", () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn().mockResolvedValue({ data: { id: "issue-123" } }),
    loading: false,
    error: undefined,
    onDone: vi.fn((fn) => fn),
  })),
  useLazyQuery: vi.fn(() => ({
    load: vi.fn(),
    loading: false,
    error: undefined,
    result: { value: { data: {} } },
  })),
  useQuery: vi.fn(() => ({
    loading: false,
    error: undefined,
    result: { value: {} },
  })),
}));

vi.mock("nuxt/app", () => ({
  useRoute: () => ({
    params: { forumId: "test-forum" },
  }),
}));

vi.mock("luxon", () => ({
  DateTime: {
    now: () => ({
      plus: () => ({
        toISO: () => "2024-04-29T12:00:00Z",
      }),
    }),
  },
}));

vi.mock("@/components/GenericModal.vue", () => ({
  default: {
    name: "GenericModal",
    template: `
      <div data-testid="generic-modal">
        <div class="icons">
          <slot name="icon"></slot>
        </div>
        <div class="content">
          <slot name="content"></slot>
        </div>
      </div>
    `,
    props: {
      open: Boolean,
      title: String,
      body: String,
      highlightColor: String,
      primaryButtonText: String,
      secondaryButtonText: String,
      loading: Boolean,
      error: String,
      primaryButtonDisabled: Boolean,
      dataTestid: String,
    },
    emits: ["close", "primaryButtonClick"],
  },
}));

vi.mock("@/components/icons/FlagIcon.vue", () => ({
  default: {
    name: "FlagIcon",
    template: '<div data-testid="flag-icon"></div>',
  },
}));

vi.mock("@/components/icons/ArchiveBox.vue", () => ({
  default: {
    name: "ArchiveBox",
    template: '<div data-testid="archive-box-icon"></div>',
  },
}));

vi.mock("@/components/TextEditor.vue", () => ({
  default: {
    name: "TextEditor",
    template: '<div data-testid="text-editor"></div>',
    props: {
      testId: String,
      initialValue: String,
      placeholder: String,
      disableAutoFocus: Boolean,
      allowImageUpload: Boolean,
    },
    emits: ["update"],
  },
}));

vi.mock("@/components/admin/SelectBrokenRules.vue", () => ({
  default: {
    name: "SelectBrokenRules",
    template: '<div data-testid="select-broken-rules"></div>',
    emits: ["toggleForumRuleSelection", "toggleServerRuleSelection"],
  },
}));

describe("BrokenRulesModal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mountComponent = async (props = {}) => {
    const BrokenRulesModal = await import("@/components/mod/BrokenRulesModal.vue").then(
      (m) => m.default
    );
    return mount(BrokenRulesModal, {
      props: {
        open: true,
        discussionId: "123",
        ...props,
      },
      shallow: true,
    });
  };

  it("renders the correct title for reporting a discussion", async () => {
    const wrapper = await mountComponent({
      discussionId: "123",
      archiveAfterReporting: false,
    });

    expect(wrapper.vm.modalTitle).toBe("Report Discussion");
  });

  it("renders the correct title for archiving a discussion", async () => {
    const wrapper = await mountComponent({
      discussionId: "123",
      archiveAfterReporting: true,
    });

    expect(wrapper.vm.modalTitle).toBe("Archive Discussion");
  });

  it("renders the correct title for reporting a comment", async () => {
    const wrapper = await mountComponent({
      commentId: "456",
      discussionId: "",
      archiveAfterReporting: false,
    });

    expect(wrapper.vm.modalTitle).toBe("Report Comment");
  });

  it("renders the correct title for archiving a comment", async () => {
    const wrapper = await mountComponent({
      commentId: "456",
      discussionId: "",
      archiveAfterReporting: true,
    });

    expect(wrapper.vm.modalTitle).toBe("Archive Comment");
  });

  it("renders the correct title for reporting an event", async () => {
    const wrapper = await mountComponent({
      eventId: "789",
      discussionId: "",
      archiveAfterReporting: false,
    });

    expect(wrapper.vm.modalTitle).toBe("Report Event");
  });

  it("renders the correct title for archiving an event", async () => {
    const wrapper = await mountComponent({
      eventId: "789",
      discussionId: "",
      archiveAfterReporting: true,
    });

    expect(wrapper.vm.modalTitle).toBe("Archive Event");
  });

  it("toggles forum rule selection correctly", async () => {
    const wrapper = await mountComponent();

    expect(wrapper.vm.selectedForumRules).toEqual([]);

    // Add a rule
    wrapper.vm.toggleForumRuleSelection("rule1");
    expect(wrapper.vm.selectedForumRules).toEqual(["rule1"]);

    // Add another rule
    wrapper.vm.toggleForumRuleSelection("rule2");
    expect(wrapper.vm.selectedForumRules).toEqual(["rule1", "rule2"]);

    // Toggle off a rule
    wrapper.vm.toggleForumRuleSelection("rule1");
    expect(wrapper.vm.selectedForumRules).toEqual(["rule2"]);
  });

  it("toggles server rule selection correctly", async () => {
    const wrapper = await mountComponent();

    expect(wrapper.vm.selectedServerRules).toEqual([]);

    // Add a rule
    wrapper.vm.toggleServerRuleSelection("server-rule1");
    expect(wrapper.vm.selectedServerRules).toEqual(["server-rule1"]);

    // Add another rule
    wrapper.vm.toggleServerRuleSelection("server-rule2");
    expect(wrapper.vm.selectedServerRules).toEqual(["server-rule1", "server-rule2"]);

    // Toggle off a rule
    wrapper.vm.toggleServerRuleSelection("server-rule1");
    expect(wrapper.vm.selectedServerRules).toEqual(["server-rule2"]);
  });

  it("emits close event when close method is called", async () => {
    const wrapper = await mountComponent();

    wrapper.vm.close();
    await nextTick();

    expect(wrapper.emitted()).toHaveProperty("close");

    // Also check that fields are reset
    expect(wrapper.vm.selectedForumRules).toEqual([]);
    expect(wrapper.vm.selectedServerRules).toEqual([]);
    expect(wrapper.vm.reportText).toBe("");
    expect(wrapper.vm.suspensionLength).toBe("");
  });

  it("generates correct formatted comment text", async () => {
    const wrapper = await mountComponent();

    const input = {
      selectedForumRules: ["Forum Rule 1", "Forum Rule 2"],
      selectedServerRules: ["Server Rule 1"],
      reportText: "This is a test report",
    };

    const result = wrapper.vm.getFinalCommentText(input);

    // Check that all rules are included in the result
    expect(result).toContain("Forum Rule 1");
    expect(result).toContain("Forum Rule 2");
    expect(result).toContain("Server Rule 1");
    expect(result).toContain("This is a test report");
  });
});
