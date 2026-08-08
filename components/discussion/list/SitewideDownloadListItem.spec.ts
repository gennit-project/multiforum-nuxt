import { describe, it, expect, vi } from 'vitest';
import { defineComponent } from 'vue';
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

const UsernameWithTooltipStub = defineComponent({
  name: 'UsernameWithTooltip',
  props: {
    username: { type: String, default: '' },
    variantSource: { type: Object, default: null },
  },
  template: '<div><slot /></div>',
});

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
        UsernameWithTooltip: UsernameWithTooltipStub,
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

  it('renders a sized lazy-loaded album preview', () => {
    const wrapper = mountWithDefaults(SitewideDownloadListItem, {
      props: {
        discussion: makeDiscussion({
          title: 'Cool Model',
          hasDownload: true,
          Author: { username: 'alice' },
          Album: {
            Images: [{ id: 'img-1', url: 'https://example.com/a.jpg' }],
          },
          DiscussionChannels: [
            { channelUniqueName: 'cats' },
          ] as Discussion['DiscussionChannels'],
        } as Partial<Discussion>),
      },
      global: {
        stubs: {
          AddToDiscussionFavorites: true,
          UsernameWithTooltip: UsernameWithTooltipStub,
          ImageIcon: true,
          ChevronDownIcon: true,
        },
      },
    });

    expect(wrapper.get('img').attributes()).toMatchObject({
      src: 'https://example.com/a.jpg',
      width: '320',
      height: '320',
      loading: 'lazy',
      decoding: 'async',
    });
  });

  it('passes the full author as the avatar variant source', () => {
    const discussion = makeDiscussion({
      title: 'Cool Model',
      hasDownload: true,
      Author: {
        username: 'alice',
        profilePicURL: 'https://img.test/original.png',
        avatar32Url: 'https://img.test/avatar-32.png',
      },
      DiscussionChannels: [
        { channelUniqueName: 'cats' },
      ] as Discussion['DiscussionChannels'],
    } as Partial<Discussion>);

    const wrapper = mountWithDefaults(SitewideDownloadListItem, {
      props: { discussion },
      global: {
        stubs: {
          AddToDiscussionFavorites: true,
          UsernameWithTooltip: UsernameWithTooltipStub,
          ImageIcon: true,
          ChevronDownIcon: true,
        },
      },
    });

    expect(
      wrapper.getComponent(UsernameWithTooltipStub).props('variantSource')
    ).toEqual(discussion.Author);
  });
});
