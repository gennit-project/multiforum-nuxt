import { expect, test } from '../../helpers/testFixture';
import { buildServerHealthDashboard } from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

// Regression guard for the admin dashboard overflowing past the right edge of
// the viewport at medium widths. The activity-chart / issue-aging row used to
// fall back to `auto`-sized grid tracks below `xl`, so the chart's intrinsic
// width forced the whole page wider than the screen instead of scrolling inside
// its own container. These tests render the fully-populated dashboard and assert
// the document never scrolls horizontally.
const TEST_USER = 'alice';

const buildTimeSeries = () =>
  Array.from({ length: 28 }).map((_, i) => ({
    __typename: 'ServerHealthTimeSeriesPoint',
    date: new Date(Date.UTC(2026, 5, 1 + i)).toISOString().split('T')[0],
    discussions: (i % 5) + 1,
    comments: (i % 7) + 2,
    events: i % 3,
    downloads: 0,
    issuesOpened: 0,
    moderationActions: 0,
  }));

const buildChannelRows = () =>
  Array.from({ length: 8 }).map((_, i) => ({
    __typename: 'ChannelHealthRow',
    id: `chan-${i}`,
    channelUniqueName: `channel-number-${i}`,
    displayName: `Channel Number ${i}`,
    channelIconURL: '',
    discussionCount: 10,
    commentCount: 20,
    eventCount: 5,
    downloadCount: 0,
    voteCount: 30,
    uniqueContributorCount: 12,
    openIssueCount: i,
    issueOpenedCount: i,
    moderationActionCount: i,
    archivedContentCount: 0,
    lockedContentCount: 0,
    oldestOpenIssueAgeDays: i * 3,
    issuesPerHundredContributions: i * 1.5,
    activityScore: 40 - i,
    healthLabel: 'Active',
  }));

const buildIssueAging = () => [
  { __typename: 'IssueAgingBucket', label: '<1 day', minDays: 0, maxDays: 0, count: 3 },
  { __typename: 'IssueAgingBucket', label: '1-3 days', minDays: 1, maxDays: 3, count: 5 },
  { __typename: 'IssueAgingBucket', label: '4-7 days', minDays: 4, maxDays: 7, count: 2 },
  { __typename: 'IssueAgingBucket', label: '8-30 days', minDays: 8, maxDays: 30, count: 7 },
  { __typename: 'IssueAgingBucket', label: '30+ days', minDays: 31, maxDays: null, count: 1 },
];

// Medium widths between the `md` and `xl` Tailwind breakpoints, where the bug
// used to appear.
const MEDIUM_WIDTHS = [768, 900, 1024];

test.describe('Admin dashboard layout', () => {
  for (const width of MEDIUM_WIDTHS) {
    test(`does not overflow horizontally at ${width}px`, async ({
      context,
      page,
    }) => {
      await installMockAuth(context, page, {
        username: TEST_USER,
        email: 'alice@example.com',
      });
      const dashboardData = () => ({
        data: {
          getServerHealthDashboard: buildServerHealthDashboard({
            timeSeries: buildTimeSeries(),
            channelHealth: buildChannelRows(),
            issueAging: buildIssueAging(),
          }),
        },
      });
      await installGraphqlMocks(page, {
        ...createBaseHandlers({ username: TEST_USER }),
        getServerHealthDashboard: dashboardData,
        getServerHealthDashboardOverview: dashboardData,
        getServerHealthChannelHealth: dashboardData,
      });

      await page.setViewportSize({ width, height: 900 });
      await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });

      // Wait for the data-gated content (chart + table) to render so the layout
      // is fully settled before measuring.
      await expect(
        page.getByRole('heading', { name: 'Channel Health' })
      ).toBeVisible();

      // The reported bug is that dashboard content (specifically the activity /
      // issue-aging cards) visibly extended past the right edge. Assert that no
      // element visibly overflows the viewport. Elements clipped by an
      // overflow:auto/scroll/hidden ancestor (e.g. the channel-health table's own
      // horizontal scroll region) are intentionally scrollable and excluded — we
      // measure `documentElement.clientWidth`, not `scrollWidth`, so their
      // internal scroll does not count.
      const visibleOverflow = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const isClipped = (node: HTMLElement) => {
          let n: HTMLElement | null = node.parentElement;
          while (n && n !== document.documentElement) {
            const ox = getComputedStyle(n).overflowX;
            if (ox !== 'visible') return true;
            n = n.parentElement;
          }
          return false;
        };
        const offenders: Array<{ tag: string; cls: string; right: number }> = [];
        for (const node of Array.from(
          document.querySelectorAll('body *')
        ) as HTMLElement[]) {
          const r = node.getBoundingClientRect();
          if (r.right > vw + 1 && r.width > 0 && !isClipped(node)) {
            offenders.push({
              tag: node.tagName.toLowerCase(),
              cls: (node.getAttribute('class') || '').slice(0, 80),
              right: Math.round(r.right),
            });
          }
        }
        offenders.sort((a, b) => b.right - a.right);
        return { viewportWidth: vw, offenders: offenders.slice(0, 6) };
      });

      expect(
        visibleOverflow.offenders,
        JSON.stringify(visibleOverflow, null, 2)
      ).toEqual([]);
    });
  }
});
