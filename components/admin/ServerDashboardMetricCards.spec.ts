import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ServerDashboardMetricCards from '@/components/admin/ServerDashboardMetricCards.vue';

const baseSummary = {
  activeChannelCount: 12,
  discussionCount: 1000,
  commentCount: 2500,
  eventCount: 500,
  voteCount: 4500,
  openIssueCount: 3,
  issueOpenedCount: 7,
  issueClosedCount: 1,
  moderationActionCount: 11,
  medianOpenIssueAgeDays: 8.4,
};

const mountCards = (
  summary: Record<string, unknown> = {},
  channelCount?: number | null
) =>
  mount(ServerDashboardMetricCards, {
    props: {
      summary: { ...baseSummary, ...summary },
      channelCount,
    },
  });

const cardText = (wrapper: ReturnType<typeof mountCards>, key: string) =>
  wrapper.get(`[data-testid="metric-card-${key}"]`).text();

describe('ServerDashboardMetricCards', () => {
  it('renders exactly four key number cards', () => {
    const wrapper = mountCards();

    expect(
      wrapper.findAll('[data-testid^="metric-card-"]').map((card) =>
        card.attributes('data-testid')
      )
    ).toEqual([
      'metric-card-contributions',
      'metric-card-active-channels',
      'metric-card-open-issues',
      'metric-card-moderation-actions',
    ]);
  });

  it('sums discussions, comments and events into the contributions card', () => {
    expect(cardText(mountCards(), 'contributions')).toMatch(
      /^Contributions\s*4,000\s*1,000 discussions · 2,500 comments · 500 events$/
    );
  });

  it('uses singular nouns when a count is exactly one', () => {
    const wrapper = mountCards({
      discussionCount: 1,
      commentCount: 1,
      eventCount: 1,
    });

    expect(cardText(wrapper, 'contributions')).toContain(
      '1 discussion · 1 comment · 1 event'
    );
  });

  it('shows the total channel count next to active channels when it is known', () => {
    expect(cardText(mountCards({}, 23), 'active-channels')).toMatch(
      /^Active channels\s*12 of 23\s*4,500 votes cast$/
    );
  });

  it('omits the total when no channel count is available', () => {
    expect(cardText(mountCards({}, null), 'active-channels')).toMatch(
      /^Active channels\s*12\s*4,500 votes cast$/
    );
  });

  it('omits an impossible total smaller than the active channel count', () => {
    expect(cardText(mountCards({}, 5), 'active-channels')).not.toContain('of 5');
  });

  it('reports opened issues and the rounded median age', () => {
    expect(cardText(mountCards(), 'open-issues')).toMatch(
      /^Open admin issues\s*3\s*7 opened this period · median age 8 days$/
    );
  });

  it('drops the median age when no issues are open', () => {
    const wrapper = mountCards({ openIssueCount: 0, medianOpenIssueAgeDays: null });

    expect(cardText(wrapper, 'open-issues')).toMatch(
      /^Open admin issues\s*0\s*7 opened this period$/
    );
  });

  it('reports closed issues beside moderation actions', () => {
    expect(cardText(mountCards(), 'moderation-actions')).toMatch(
      /^Moderation actions\s*11\s*1 issue closed$/
    );
  });
});
