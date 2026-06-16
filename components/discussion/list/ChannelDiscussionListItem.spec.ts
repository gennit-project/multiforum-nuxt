import { describe, it, expect, vi } from 'vitest';
import { useQuery } from '@vue/apollo-composable';
import {
  asMock,
  createQueryMock,
  createMutationMock,
} from '@/tests/utils/mockApollo';
import { createMockRoute, createMockRouter } from '@/tests/utils/mockRouter';
import { createCacheMock } from '@/tests/utils/mockAuth';
import { createSSRAuthMock } from '@/tests/utils/mockSSRAuth';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { makeDiscussion } from '@/tests/utils/factories';
import type { Discussion, DiscussionChannel } from '@/__generated__/graphql';

import ChannelDiscussionListItem from '@/components/discussion/list/ChannelDiscussionListItem.vue';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: () => createMutationMock(),
}));
// A child imports the Transition family from @headlessui/vue, which the global
// setup mock omits; provide passthrough stubs.
vi.mock('@headlessui/vue', () => {
  const passthrough = { template: '<div><slot /></div>' };
  return {
    TransitionRoot: passthrough,
    TransitionChild: passthrough,
    Dialog: passthrough,
    DialogPanel: passthrough,
    DialogTitle: passthrough,
  };
});
vi.mock('nuxt/app', () => ({
  useRoute: () => createMockRoute(),
  useRouter: () => createMockRouter(),
}));
vi.mock('@/cache', () => createCacheMock({ username: 'alice' }));
vi.mock('@/composables/useSSRAuth', () => createSSRAuthMock());

const mountItem = (title: string) => {
  asMock(useQuery).mockReturnValue(createQueryMock({ users: [] }));
  const discussion = makeDiscussion({
    title,
    Author: { username: 'alice' },
  } as Partial<Discussion>);
  const discussionChannel = {
    __typename: 'DiscussionChannel',
    channelUniqueName: 'cats',
    Discussion: discussion,
    CommentsAggregate: { count: 0 },
  } as unknown as DiscussionChannel;

  return mountWithDefaults(ChannelDiscussionListItem, {
    props: { discussionChannel, discussion },
    global: {
      stubs: {
        AddToDiscussionFavorites: true,
        MarkdownPreview: true,
        UsernameWithTooltip: true,
        TagComponent: true,
        ErrorBanner: true,
        CheckCircleIcon: true,
        DiscussionVotes: true,
        DiscussionAlbum: true,
      },
    },
  });
};

describe('ChannelDiscussionListItem', () => {
  it('renders the discussion title', () => {
    expect(mountItem('My Discussion').text()).toContain('My Discussion');
  });

  it('reflects an overridden title', () => {
    expect(mountItem('Another One').text()).toContain('Another One');
  });
});
