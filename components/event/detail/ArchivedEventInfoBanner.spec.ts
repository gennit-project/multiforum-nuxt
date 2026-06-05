import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ArchivedEventInfoBanner from './ArchivedEventInfoBanner.vue';

const eventIssueResult = ref();

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: eventIssueResult,
  }),
}));

describe('ArchivedEventInfoBanner', () => {
  beforeEach(() => {
    eventIssueResult.value = {
      eventChannels: [
        {
          RelatedIssues: [],
        },
      ],
    };
  });

  const mountBanner = () =>
    mount(ArchivedEventInfoBanner, {
      props: {
        channelId: 'cats',
        eventChannelId: 'event-channel-1',
      },
      global: {
        stubs: {
          ArchiveBox: { template: '<span />' },
          InfoBanner: {
            props: ['text', 'testId'],
            template: '<section :data-testid="testId">{{ text }}</section>',
          },
        },
      },
    });

  it('renders the related issue markdown link when an issue exists', () => {
    eventIssueResult.value = {
      eventChannels: [
        {
          RelatedIssues: [{ issueNumber: 9 }],
        },
      ],
    };

    expect(mountBanner().text()).toContain('[archived](/forums/cats/issues/9)');
  });

  it('renders fallback archived text when no issue exists', () => {
    expect(mountBanner().text()).toContain('This event is archived.');
  });
});
