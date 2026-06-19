import { describe, it, expect, vi } from 'vitest';
import { createMockRoute } from '@/tests/utils/mockRouter';
import { createQueryMock, createMutationMock } from '@/tests/utils/mockApollo';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { makeDiscussion } from '@/tests/utils/factories';
import type { Discussion } from '@/__generated__/graphql';

import SitewideDownloadListItem from '@/components/discussion/list/SitewideDownloadListItem.vue';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => createQueryMock({}),
  useMutation: () => createMutationMock(),
}));
vi.mock('nuxt/app', () => ({ useRoute: () => createMockRoute() }));

const mountItem = (title: string) =>
  mountWithDefaults(SitewideDownloadListItem, {
    props: {
      discussion: makeDiscussion({
        title,
        hasDownload: true,
        Author: { username: 'alice' },
        DiscussionChannels: [
          { channelUniqueName: 'cats' },
        ] as Discussion['DiscussionChannels'],
      } as Partial<Discussion>),
    },
    global: {
      stubs: {
        AddToDiscussionFavorites: true,
        UsernameWithTooltip: true,
        ImageIcon: true,
        ChevronDownIcon: true,
      },
    },
  });

describe('SitewideDownloadListItem', () => {
  it('renders the download title', () => {
    expect(mountItem('Cool Model').text()).toContain('Cool Model');
  });

  it('reflects an overridden title', () => {
    expect(mountItem('Another Model').text()).toContain('Another Model');
  });
});
