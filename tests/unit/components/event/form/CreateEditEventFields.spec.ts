import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { DateTime } from "luxon";
import type { CreateEditEventFormValues } from "@/types/Event";
import { EVENT_TITLE_CHAR_LIMIT, MAX_CHARS_IN_EVENT_DESCRIPTION } from "@/utils/constants";
// Import actual component
import CreateEditEventFields from "@/components/event/form/CreateEditEventFields.vue";

// Mock the components
const mockComponents = {
  FormRow: {
    template: '<div><slot /><slot name="content" /></div>',
    props: ["sectionTitle", "required", "description"],
  },
  TextInput: {
    template: `
      <div>
        <div>
          <input 
            type="text" 
            :value="value" 
            @input="$emit('update', $event.target.value)" 
            data-testid="title-input" 
          />
        </div>
      </div>
    `,
    props: ["value", "fullWidth", "placeholder", "testId"],
    emits: ["update"],
    methods: {
      focus() {
        // Mock focus method
      },
    },
  },
  CharCounter: {
    template: '<div data-testid="char-counter">{{ current }}/{{ max }}</div>',
    props: ["current", "max"],
  },
  ForumPicker: {
    template: '<div data-testid="forum-picker"></div>',
    props: ["selectedChannels"],
    emits: ["setSelectedChannels"],
  },
  ErrorMessage: {
    template: '<div class="text-red-500" data-testid="error-message">{{ text }}</div>',
    props: ["text"],
  },
  ErrorBanner: {
    template:
      '<div class="text-red-500 bg-red-100 p-3 my-2 pl-4 rounded dark:bg-red-500 dark:text-white text-wrap" data-testid="error-banner">{{ text }}</div>',
    props: ["text"],
  },
  FormComponent: {
    template: `
      <form data-testid="event-form">
        <div class="form-title">{{ formTitle }}</div>
        <div v-if="needsChanges" class="validation-error" data-testid="validation-error">
          Changes required
        </div>
        <slot></slot>
      </form>
    `,
    props: [
      "formTitle",
      "needsChanges",
      "loading",
      "showCancelButton",
      "showButtonsInHeader",
      "description",
    ],
  },
  TextEditor: {
    template: '<textarea data-testid="description-input"></textarea>',
    props: [
      "initialValue",
      "placeholder",
      "fieldName",
      "disableAutoFocus",
      "showCharCounter",
      "maxChars",
    ],
    emits: ["update"],
  },
  LocationSearchBar: {
    template:
      "<div data-testid=\"location-search-bar\"><input type=\"text\" @input=\"$emit('updateLocationInput', {name: 'Test Location', formatted_address: '123 Test St', lat: 0, lng: 0})\" /></div>",
    props: ["initialValue", "searchPlaceholder", "fullWidth"],
    emits: ["updateLocationInput"],
  },
  AddImage: {
    template: '<div data-testid="add-image"></div>',
    props: ["fieldName", "label"],
    emits: ["fileChange"],
  },
  TagPicker: {
    template: '<div data-testid="tag-picker"></div>',
    props: ["selectedTags"],
    emits: ["setSelectedTags"],
  },
  CheckBox: {
    template:
      '<input type="checkbox" :checked="checked" @change="$emit(\'input\', $event.target.checked)" />',
    props: ["checked"],
    emits: ["input"],
  },
};

// Mock the needed Nuxt and Vue modules
vi.mock("nuxt/app", () => ({
  useRouter: () => ({
    go: vi.fn(),
    resolve: vi.fn(() => ({ href: "/test-url" })),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock Apollo composable
vi.mock("@vue/apollo-composable", () => ({
  useMutation: () => ({
    mutate: vi.fn(),
    error: { value: null },
  }),
  useQuery: () => ({
    result: { value: null },
    loading: { value: false },
    error: { value: null },
  }),
}));

// Mock cache
vi.mock("@/cache", () => ({
  usernameVar: { value: "testuser" },
}));

describe("CreateEditEventFields Component", () => {
  // Default form values for testing
  const defaultStartTime = DateTime.now().plus({ hours: 1 }).startOf("hour").toISO();
  const defaultEndTime = DateTime.now().plus({ hours: 3 }).startOf("hour").toISO();

  const defaultFormValues: CreateEditEventFormValues = {
    title: "",
    description: "",
    selectedTags: [],
    selectedChannels: [],
    address: "",
    latitude: 0,
    longitude: 0,
    locationName: "",
    isInPrivateResidence: false,
    virtualEventUrl: "",
    startTime: defaultStartTime,
    startTimeDayOfWeek: "",
    startTimeHourOfDay: 0,
    endTime: defaultEndTime,
    canceled: false,
    deleted: false,
    cost: "",
    free: false,
    isHostedByOP: false,
    isAllDay: false,
  };

  // Helper function to mount component
  const mountComponent = (formValues = defaultFormValues, editMode = false) => {
    return mount(CreateEditEventFields, {
      props: {
        editMode,
        createEventError: null,
        createEventLoading: false,
        formValues,
        getEventError: null,
        updateEventError: null,
        eventLoading: false,
        updateEventLoading: false,
      },
      global: {
        stubs: mockComponents,
        mocks: {
          $route: {
            params: {},
          },
        },
      },
    });
  };

  describe("Form validation", () => {
    it("validates that title is required", async () => {
      const wrapper = mountComponent({
        ...defaultFormValues,
        title: "", // Empty title
        selectedChannels: ["test-channel"], // Valid channel selection
      });

      // Trigger input to set touched state to true
      await wrapper.find('[data-testid="title-input"]').trigger("input");
      await nextTick();

      // Find error banner
      const errorBanner = wrapper.find('[data-testid="error-banner"]');

      // Validation error should be about missing title
      expect(errorBanner.exists()).toBe(true);
      expect(errorBanner.text()).toContain("A title is required");
    });

    it("validates that at least one channel must be selected", async () => {
      const wrapper = mountComponent({
        ...defaultFormValues,
        title: "Test Event", // Valid title
        selectedChannels: [], // No channels selected
      });

      // Trigger input to set touched state to true
      await wrapper.find('[data-testid="title-input"]').trigger("input");
      await nextTick();

      // Find error banner
      const errorBanner = wrapper.find('[data-testid="error-banner"]');

      // Validation error should be about missing channel selection
      expect(errorBanner.exists()).toBe(true);
      expect(errorBanner.text()).toContain("At least one channel must be selected");
    });

    it("validates that title cannot exceed character limit", async () => {
      // Create a title that's too long
      const longTitle = "A".repeat(EVENT_TITLE_CHAR_LIMIT + 10);

      const wrapper = mountComponent({
        ...defaultFormValues,
        title: longTitle,
        selectedChannels: ["test-channel"], // Valid channel selection
      });

      // Trigger input to set touched state to true
      await wrapper.find('[data-testid="title-input"]').trigger("input");
      await nextTick();

      // Find error banner
      const errorBanner = wrapper.find('[data-testid="error-banner"]');

      // Validation error should be about title length
      expect(errorBanner.exists()).toBe(true);
      expect(errorBanner.text()).toContain(
        `Title cannot exceed ${EVENT_TITLE_CHAR_LIMIT} characters`
      );
    });

    it("validates that description cannot exceed character limit", async () => {
      // Create a description that's too long
      const longDescription = "A".repeat(MAX_CHARS_IN_EVENT_DESCRIPTION + 10);

      const wrapper = mountComponent({
        ...defaultFormValues,
        title: "Test Event", // Valid title
        selectedChannels: ["test-channel"], // Valid channel selection
        description: longDescription,
      });

      // Trigger input to set touched state to true
      await wrapper.find('[data-testid="title-input"]').trigger("input");
      await nextTick();

      // Find error banner
      const errorBanner = wrapper.find('[data-testid="error-banner"]');

      // Validation error should be about description length
      expect(errorBanner.exists()).toBe(true);
      expect(errorBanner.text()).toContain(
        `Description cannot exceed ${MAX_CHARS_IN_EVENT_DESCRIPTION} characters`
      );
    });

    it("validates that virtual event URL must be valid", async () => {
      const wrapper = mountComponent({
        ...defaultFormValues,
        title: "Test Event", // Valid title
        selectedChannels: ["test-channel"], // Valid channel selection
        virtualEventUrl: "invalid-url", // Invalid URL
      });

      // Need to simulate user interaction to set touched to true
      await wrapper.find('[data-testid="title-input"]').trigger("input");
      await nextTick();

      // The form should show that it has errors
      expect(wrapper.find('[data-testid="validation-error"]').exists()).toBe(true);

      // Find any error message about URL validity
      expect(wrapper.html()).toContain("Virtual event URL must be valid");
    });
  });

  describe("Date validation", () => {
    it("warns when start time is in the past", async () => {
      // Set start time to one day ago
      const pastStartTime = DateTime.now().minus({ days: 1 }).toISO();

      const wrapper = mountComponent({
        ...defaultFormValues,
        title: "Test Event", // Valid title
        selectedChannels: ["test-channel"], // Valid channel selection
        startTime: pastStartTime,
      });

      // Trigger input to set touched state to true
      await wrapper.find('[data-testid="title-input"]').trigger("input");
      await nextTick();

      // Should find ErrorMessage component containing the warning text
      expect(wrapper.html()).toContain("Are you sure you want the start time to be in the past");
    });

    it("validates that start time must be before end time", async () => {
      // Start time is after end time
      const invalidStartTime = DateTime.now().plus({ days: 1 }).toISO();
      const invalidEndTime = DateTime.now().toISO();

      const wrapper = mountComponent({
        ...defaultFormValues,
        title: "Test Event", // Valid title
        selectedChannels: ["test-channel"], // Valid channel selection
        startTime: invalidStartTime,
        endTime: invalidEndTime,
      });

      // Trigger input to set touched state to true
      await wrapper.find('[data-testid="title-input"]').trigger("input");
      await nextTick();

      // Should find text about start time needing to be before end time
      expect(wrapper.html()).toContain("The start time must be before the end time");

      // The validation state should indicate errors
      expect(wrapper.find('[data-testid="validation-error"]').exists()).toBe(true);
    });
  });

  describe("Form interactivity", () => {
    it("emits update events when form fields change", async () => {
      const wrapper = mountComponent();

      // Find title input and change its value
      const titleInput = wrapper.find('[data-testid="title-input"]');
      await titleInput.setValue("New Event Title");

      // Check for updateFormValues event
      expect(wrapper.emitted()).toHaveProperty("updateFormValues");

      const updateEvents = wrapper.emitted("updateFormValues");
      expect(updateEvents).toBeTruthy();

      // Check that at least one update event contains the title
      const hasUpdateWithTitle = updateEvents?.some(
        (event) => event[0]?.title === "New Event Title"
      );

      expect(hasUpdateWithTitle).toBe(true);
    });

    it("calculates event duration correctly", async () => {
      // Test with a 3 hour and 30 minute event
      const startTime = DateTime.fromObject({
        year: 2025,
        month: 6,
        day: 15,
        hour: 9,
        minute: 0,
      }).toISO();

      const endTime = DateTime.fromObject({
        year: 2025,
        month: 6,
        day: 15,
        hour: 12,
        minute: 30,
      }).toISO();

      const wrapper = mountComponent({
        ...defaultFormValues,
        startTime,
        endTime,
      });

      await nextTick();

      // Check that the duration is displayed correctly
      expect(wrapper.html()).toContain("3h 30m");
    });
  });
});
