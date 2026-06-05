import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ArchivedDiscussionInfoBanner from './ArchivedDiscussionInfoBanner.vue';

const discussionIssueResult = ref();

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: discussionIssueResult,
  }),
}));

describe('ArchivedDiscussionInfoBanner', () => {
  beforeEach(() => {
    discussionIssueResult.value = {
      discussionChannels: [
        {
          RelatedIssues: [],
        },
      ],
    };
  });

  const mountBanner = () =>
    mount(ArchivedDiscussionInfoBanner, {
      props: {
        channelId: 'cats',
        discussionChannelId: 'discussion-channel-1',
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
    discussionIssueResult.value = {
      discussionChannels: [
        {
          RelatedIssues: [{ issueNumber: 7 }],
        },
      ],
    };

    expect(mountBanner().text()).toContain(
      '[archived](/forums/cats/issues/7)'
    );
  });

  it('renders fallback archived text when no issue exists', () => {
    expect(mountBanner().text()).toContain(
      'This discussion has been archived.'
    );
  });
});
