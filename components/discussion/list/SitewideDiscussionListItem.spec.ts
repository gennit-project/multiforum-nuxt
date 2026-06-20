import { describe, it, expect, vi } from 'vitest';
import { useQuery } from '@vue/apollo-composable';
import { asMock, createQueryMock } from '@/tests/utils/mockApollo';
import { createMockRoute } from '@/tests/utils/mockRouter';
import { createCacheMock } from '@/tests/utils/mockAuth';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { makeDiscussion } from '@/tests/utils/factories';
import type { Discussion } from '@/__generated__/graphql';

import SitewideDiscussionListItem from '@/components/discussion/list/SitewideDiscussionListItem.vue';

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));
vi.mock('nuxt/app', () => ({ useRoute: () => createMockRoute() }));
vi.mock('@/cache', () => createCacheMock({ username: 'alice' }));

const mountItem = (discussion: Discussion) => {
  asMock(useQuery).mockReturnValue(createQueryMock({ users: [] }));
  return mountWithDefaults(SitewideDiscussionListItem, {
    props: { discussion },
    global: {
      stubs: {
        AddToDiscussionFavorites: true,
        MarkdownPreview: true,
        UsernameWithTooltip: true,
        TagComponent: true,
        ChevronDownIcon: true,
      },
    },
  });
};

const discussion = (overrides: Record<string, unknown> = {}): Discussion =>
  makeDiscussion({
    Author: { username: 'alice' },
    DiscussionChannels: [],
    ...overrides,
  } as Partial<Discussion>);

describe('SitewideDiscussionListItem', () => {
  it('renders the discussion title', () => {
    const wrapper = mountItem(discussion({ title: 'My Discussion' }));
    expect(wrapper.text()).toContain('My Discussion');
  });

  it('reflects an overridden title', () => {
    const wrapper = mountItem(discussion({ title: 'Another One' }));
    expect(wrapper.text()).toContain('Another One');
  });
});
