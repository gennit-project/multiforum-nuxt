import { describe, it, expect, vi } from 'vitest';
import { useQuery } from '@vue/apollo-composable';
import { asMock, createQueryMock } from '@/tests/utils/mockApollo';
import { createMockRoute } from '@/tests/utils/mockRouter';
import { createAuthStateMock } from '@/tests/utils/mockAuth';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { makeDiscussion } from '@/tests/utils/factories';
import type { Discussion } from '@/__generated__/graphql';

import SitewideDiscussionListItem from '@/components/discussion/list/SitewideDiscussionListItem.vue';

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));
vi.mock('nuxt/app', () => ({ useRoute: () => createMockRoute() }));
vi.mock('@/composables/useAuthState', () =>
  createAuthStateMock({ username: 'alice' })
);

const mountItem = (discussion: Discussion) => {
  asMock(useQuery).mockReturnValue(createQueryMock({ users: [] }));
  return mountWithDefaults(SitewideDiscussionListItem, {
    props: { discussion },
    global: {
      stubs: {
        AddToDiscussionFavorites: true,
        AvatarComponent: true,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const channel = (uniqueName: string, channelIconURL = ''): any => ({
  channelUniqueName: uniqueName,
  Channel: { uniqueName, displayName: uniqueName, channelIconURL },
  CommentsAggregate: { count: 0 },
});

const album = (
  images: { id: string; url: string }[],
  imageOrder: string[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => ({ id: 'album-1', imageOrder, Images: images });

// The channel-icon wrapper carries the `group/chicon` class; each holds a
// hover tooltip element carrying `group-hover/chicon`.
const channelIcons = (wrapper: ReturnType<typeof mountItem>) =>
  wrapper.findAll('[class~="group/chicon"]');
const thumbnail = (wrapper: ReturnType<typeof mountItem>) =>
  wrapper.find('img[class*="object-cover"]');

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

describe('SitewideDiscussionListItem channel icons', () => {
  it('renders one icon for a single-channel discussion', () => {
    const wrapper = mountItem(
      discussion({ DiscussionChannels: [channel('cats')] })
    );
    expect(channelIcons(wrapper)).toHaveLength(1);
  });

  it('caps the icon stack at three for a many-channel discussion', () => {
    const wrapper = mountItem(
      discussion({
        DiscussionChannels: [
          channel('a'),
          channel('b'),
          channel('c'),
          channel('d'),
        ],
      })
    );
    expect(channelIcons(wrapper)).toHaveLength(3);
  });

  it('shows an "and N more" label when posted to more than three channels', () => {
    const wrapper = mountItem(
      discussion({
        DiscussionChannels: [
          channel('a'),
          channel('b'),
          channel('c'),
          channel('d'),
        ],
      })
    );
    expect(wrapper.text()).toContain('and 1 more');
  });

  it('omits the "and N more" label at three or fewer channels', () => {
    const wrapper = mountItem(
      discussion({
        DiscussionChannels: [channel('a'), channel('b'), channel('c')],
      })
    );
    expect(wrapper.text()).not.toContain('more');
  });

  it('labels each channel icon with its uniqueName via a hover tooltip', () => {
    const wrapper = mountItem(
      discussion({ DiscussionChannels: [channel('cats')] })
    );
    expect(wrapper.find('[class*="group-hover/chicon"]').text()).toBe('cats');
  });
});

describe('SitewideDiscussionListItem thumbnail', () => {
  it('uses the first album image as the thumbnail', () => {
    const wrapper = mountItem(
      discussion({
        DiscussionChannels: [channel('cats')],
        Album: album([{ id: 'i1', url: 'https://img/a.jpg' }]),
      })
    );
    expect(thumbnail(wrapper).attributes('src')).toBe('https://img/a.jpg');
  });

  it('respects imageOrder when choosing the album thumbnail', () => {
    const wrapper = mountItem(
      discussion({
        DiscussionChannels: [channel('cats')],
        Album: album(
          [
            { id: 'i1', url: 'https://img/a.jpg' },
            { id: 'i2', url: 'https://img/b.jpg' },
          ],
          ['i2']
        ),
      })
    );
    expect(thumbnail(wrapper).attributes('src')).toBe('https://img/b.jpg');
  });

  it('falls back to the first markdown image in the body when there is no album', () => {
    const wrapper = mountItem(
      discussion({
        DiscussionChannels: [channel('cats')],
        Album: null,
        body: 'look ![cat](https://img/body.png) at this',
      })
    );
    expect(thumbnail(wrapper).attributes('src')).toBe('https://img/body.png');
  });

  it('renders no thumbnail for a text-only discussion', () => {
    const wrapper = mountItem(
      discussion({
        DiscussionChannels: [channel('cats')],
        Album: null,
        body: 'just text, no images here',
      })
    );
    expect(thumbnail(wrapper).exists()).toBe(false);
  });
});
