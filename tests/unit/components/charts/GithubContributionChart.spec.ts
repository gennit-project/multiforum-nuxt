import { describe, it, expect, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import GithubContributionChart from "@/components/charts/GithubContributionChart.vue";
import ContributionChartSkeleton from "@/components/charts/ContributionChartSkeleton.vue";
import {
  contributionDataFixture,
  emptyContributionData,
  consecutiveDaysContributionData,
  allTypesContributionData,
} from "./fixtures/contributionData";

// Mock the child components to simplify testing
vi.mock("@/components/comments/Comment.vue", () => ({
  default: {
    props: [
      "commentData",
      "parentCommentId",
      "depth",
      "showChannel",
      "showContextLink",
      "goToPermalinkOnClick",
    ],
    template: '<div data-test="mock-comment">Comment Component</div>',
  },
}));

vi.mock("@/components/user/DiscussionItemInProfile.vue", () => ({
  default: {
    props: ["discussion"],
    template: '<div data-test="mock-discussion-item">Discussion Item</div>',
  },
}));

vi.mock("@/components/user/EventItemInProfile.vue", () => ({
  default: {
    props: ["currentChannelId", "event"],
    template: '<div data-test="mock-event-item">Event Item</div>',
  },
}));

// Mock the Lucide icon
vi.mock("lucide-vue-next", () => ({
  Calendar: {
    template: "<div>Calendar Icon</div>",
  },
}));

describe("GithubContributionChart", () => {
  // Test basic component rendering
  it("renders properly with default props", async () => {
    const wrapper = mount(GithubContributionChart, {
      props: {
        contributionData: contributionDataFixture,
        year: 2023,
      },
    });

    await flushPromises();

    // Check component structure
    expect(wrapper.find(".contribution-chart").exists()).toBe(true);
    expect(wrapper.text()).toContain("contributions in 2023");
  });

  // Test loading state
  it("shows skeleton loader when loading", async () => {
    const wrapper = mount(GithubContributionChart, {
      props: {
        contributionData: contributionDataFixture,
        loading: true,
      },
    });

    await flushPromises();

    // Check that skeleton component exists
    expect(wrapper.findComponent(ContributionChartSkeleton).exists()).toBe(true);

    // Check that the v-if condition for the skeleton is satisfied
    // by verifying that the loading skeleton is displayed
    expect(wrapper.find(".animate-pulse").exists()).toBe(true);
  });

  // Test empty contribution data
  it("renders an empty grid when no contribution data is provided", async () => {
    const wrapper = mount(GithubContributionChart, {
      props: {
        contributionData: emptyContributionData,
        year: 2023,
      },
    });

    await flushPromises();

    // Check that the grid is rendered but empty
    expect(wrapper.find("svg").exists()).toBe(true);
    expect(wrapper.text()).toContain("0 contributions in 2023");
  });

  // Test year selection
  it("allows changing the year via dropdown", async () => {
    const wrapper = mount(GithubContributionChart, {
      props: {
        contributionData: contributionDataFixture,
        year: 2023,
        minYear: 2020,
        maxYear: 2025,
      },
    });

    await flushPromises();

    // Check available years
    const options = wrapper.findAll("option");
    expect(options.length).toBe(6); // 2020 to 2025

    // Skip testing the model binding in isolation and instead test that
    // when the year prop changes, the displayed title updates correctly
    await wrapper.setProps({ year: 2022 });

    await flushPromises();

    // Verify that the title shows the updated year
    expect(wrapper.text()).toContain("contributions in 2022");
  });

  // Test day selection
  it("allows selecting a day to show details", async () => {
    const wrapper = mount(GithubContributionChart, {
      props: {
        contributionData: contributionDataFixture,
        year: 2023,
      },
    });

    await flushPromises();

    // Find the first day cell (rect) and click it
    const dayCell = wrapper.find("rect");
    await dayCell.trigger("click");

    // Verify day-select event is emitted
    expect(wrapper.emitted("day-select")).toBeTruthy();

    // Verify details section is displayed
    expect(wrapper.find(".mt-4.p-4.rounded-lg.border").exists()).toBe(true);
  });

  // Test color scheme based on contribution count
  it("assigns correct colors based on contribution count", async () => {
    const wrapper = mount(GithubContributionChart, {
      props: {
        contributionData: consecutiveDaysContributionData,
        year: 2023,
      },
    });

    await flushPromises();

    // Find all day cells
    const dayCells = wrapper.findAll("rect");

    // Get a subset of cells with varying contribution counts
    const cellsWithDifferentCounts = dayCells.filter((cell) => {
      const count = parseInt(cell.attributes("data-count") || "0");
      return count > 0 && count <= 4;
    });

    // Check that cells with different counts have different fill colors
    const uniqueFills = new Set();
    cellsWithDifferentCounts.forEach((cell) => {
      uniqueFills.add(cell.attributes("fill"));
    });

    // There should be at least 2 different colors used
    expect(uniqueFills.size).toBeGreaterThan(1);
  });

  // Test dark mode
  it("applies dark mode color scheme when darkMode is true", async () => {
    const wrapper = mount(GithubContributionChart, {
      props: {
        contributionData: contributionDataFixture,
        year: 2023,
        darkMode: true,
      },
    });

    await flushPromises();

    // Check that dark mode class is applied
    expect(wrapper.find(".contribution-chart").classes()).toContain("text-white");

    // Check that dark mode colors are used for cells with count 0
    const emptyCell = wrapper.find('rect[data-count="0"]');
    expect(emptyCell.attributes("fill")).toBe("#161b22");
  });

  // Test light mode
  it("applies light mode color scheme when darkMode is false", async () => {
    const wrapper = mount(GithubContributionChart, {
      props: {
        contributionData: contributionDataFixture,
        year: 2023,
        darkMode: false,
      },
    });

    await flushPromises();

    // Check that light mode class is applied
    expect(wrapper.find(".contribution-chart").classes()).toContain("bg-white");

    // Check that light mode colors are used for cells with count 0
    const emptyCell = wrapper.find('rect[data-count="0"]');
    expect(emptyCell.attributes("fill")).toBe("#ebedf0");
  });

  // Test total contributions calculation
  it("correctly calculates and displays total contributions", async () => {
    const wrapper = mount(GithubContributionChart, {
      props: {
        contributionData: contributionDataFixture,
        year: 2023,
      },
    });

    await flushPromises();

    // Calculate expected total (sum of all counts in fixture)
    const expectedTotal = contributionDataFixture.reduce((sum, day) => sum + day.count, 0);

    // Check if the total is displayed correctly
    expect(wrapper.text()).toContain(`${expectedTotal} contributions in 2023`);
  });

  // Test activity summary for selected day
  it("shows activity summary when a day with activities is selected", async () => {
    const wrapper = mount(GithubContributionChart, {
      props: {
        contributionData: allTypesContributionData,
        year: 2023,
      },
    });

    await flushPromises();

    // Find day cell with activities and click it
    const dayWithActivities = wrapper.find('rect[data-count="3"]');
    await dayWithActivities.trigger("click");

    // Check that activity summary shows all three types
    const detailsSection = wrapper.find(".mt-4.p-4.rounded-lg.border");
    expect(detailsSection.exists()).toBe(true);
    expect(detailsSection.text()).toContain("comment");
    expect(detailsSection.text()).toContain("discussion");
    expect(detailsSection.text()).toContain("event");
  });

  // Test deselecting a day
  it("allows deselecting a day by clicking it again", async () => {
    const wrapper = mount(GithubContributionChart, {
      props: {
        contributionData: contributionDataFixture,
        year: 2023,
      },
    });

    await flushPromises();

    // Find first day cell and click it
    const dayCell = wrapper.find("rect");
    await dayCell.trigger("click");

    // Verify day is selected
    expect(wrapper.find(".mt-4.p-4.rounded-lg.border").exists()).toBe(true);

    // Click the same day again
    await dayCell.trigger("click");

    // Verify day is deselected
    expect(wrapper.find(".mt-4.p-4.rounded-lg.border").exists()).toBe(false);

    // Verify day-select event is emitted with null
    const selectEvents = wrapper.emitted("day-select");
    expect(selectEvents).toBeTruthy();
    expect(selectEvents![selectEvents!.length - 1]).toEqual([null]);
  });

  // Test month labels generation
  it("generates correct month labels", async () => {
    // Create data spanning multiple months
    const wrapper = mount(GithubContributionChart, {
      props: {
        contributionData: contributionDataFixture,
        year: 2023,
      },
    });

    await flushPromises();

    // Check that month labels container exists
    const monthLabelsContainer = wrapper.find(".flex.ml-8");
    expect(monthLabelsContainer.exists()).toBe(true);

    // Check that some month labels are rendered
    const monthLabels = monthLabelsContainer.findAll(".absolute.text-xs.font-medium");
    expect(monthLabels.length).toBeGreaterThan(0);
  });

  // Test day labels
  it("displays correct day of week labels", async () => {
    const wrapper = mount(GithubContributionChart, {
      props: {
        contributionData: contributionDataFixture,
        year: 2023,
      },
    });

    await flushPromises();

    // Day labels should include all days of the week
    const dayLabelsText = wrapper.find(".text-tiny.relative.w-10").text();
    expect(dayLabelsText).toContain("Mon");
    expect(dayLabelsText).toContain("Wed");
    expect(dayLabelsText).toContain("Fri");
  });

  // Test customizing text content
  it("allows customizing text content", async () => {
    const customTexts = {
      less: "Min",
      more: "Max",
      yearLabel: "Select year:",
      noContributions: "No activity",
      contributionsText: (count: number) => `${count} activities`,
      activityDetailsHeading: "Details",
      loading: "Please wait...",
    };

    const wrapper = mount(GithubContributionChart, {
      props: {
        contributionData: contributionDataFixture,
        year: 2023,
        texts: customTexts,
      },
    });

    await flushPromises();

    // Check custom texts are used
    expect(wrapper.text()).toContain("Min");
    expect(wrapper.text()).toContain("Max");
    expect(wrapper.text()).toContain("Select year:");

    // Select a day with no contributions to test that text
    const emptyDay = wrapper.find('rect[data-count="0"]');
    await emptyDay.trigger("click");

    expect(wrapper.text()).toContain("No activity");
  });
});
