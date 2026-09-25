import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import type { Discussion } from '@/__generated__/graphql';
import ActivityPage from './activity.vue';
import DiscussionTitleVersions from '@/components/discussion/detail/activityFeed/DiscussionTitleVersions.vue';
import LabelChangeHistory from '@/components/discussion/detail/activityFeed/LabelChangeHistory.vue';
import { GET_DOWNLOAD_ACTIVITY } from '@/graphQLData/discussion/queries';

const mockUseQuery = vi.hoisted(() => vi.fn());

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: 'cats', discussionId: 'discussion-1' },
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: mockUseQuery,
}));

vi.mock('@/composables/useDownloadPipelineOverview', () => ({
  useSharedDownloadPipelineOverview: () => ({
    attempts: ref([
      {
        pipelineId: 'pipeline-1',
        scope: 'SERVER',
        status: 'TIMED_OUT',
        finishedAt: '2026-07-30T12:00:00.000Z',
        updatedAt: '2026-07-30T12:00:00.000Z',
      },
      {
        pipelineId: 'pipeline-active',
        scope: 'SERVER',
        status: 'RUNNING',
        updatedAt: '2026-07-30T12:00:00.000Z',
      },
    ]),
  }),
}));

describe('download activity', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseQuery.mockReturnValue({ result: ref(null) });
  });

  it('shows terminal pipeline events with stable attempt links', () => {
    const discussion = {
      id: 'discussion-1',
      DownloadableFiles: [{ id: 'file-1' }],
      DiscussionChannels: [],
      PastTitleVersions: [],
    } as unknown as Discussion;
    const wrapper = mount(ActivityPage, {
      props: { discussion },
      global: {
        stubs: {
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
          DiscussionTitleVersions: true,
          LabelChangeHistory: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Pipeline activity');
    expect(wrapper.text()).toContain('timed out');
    expect(wrapper.text()).not.toContain('pipeline-active');
    expect(wrapper.get('a').attributes('href')).toContain(
      '?attempt=pipeline-1#attempt-pipeline-1'
    );
  });

  it('merges deferred activity into the download passed by the parent route', () => {
    const activity = {
      id: 'discussion-1',
      PastTitleVersions: [{ id: 'version-1', body: 'Old title' }],
      DiscussionChannels: [
        {
          id: 'channel-1',
          channelUniqueName: 'cats',
          LabelChangeHistory: [{ id: 'label-change-1' }],
        },
      ],
    };
    mockUseQuery.mockReturnValue({
      result: ref({ discussions: [activity] }),
    });

    const wrapper = shallowMount(ActivityPage, {
      props: {
        discussion: {
          id: 'discussion-1',
          DownloadableFiles: [{ id: 'file-1' }],
        } as unknown as Discussion,
      },
    });
    const queryCall = mockUseQuery.mock.calls[0]!;

    expect({
      document: queryCall[0],
      variables: queryCall[1](),
      prefetch: queryCall[2].prefetch,
      titleVersions: wrapper
        .findComponent(DiscussionTitleVersions)
        .props('discussion').PastTitleVersions,
      labelChanges: wrapper
        .findComponent(LabelChangeHistory)
        .props('labelChangeHistory'),
    }).toEqual({
      document: GET_DOWNLOAD_ACTIVITY,
      variables: { id: 'discussion-1', channelUniqueName: 'cats' },
      prefetch: false,
      titleVersions: activity.PastTitleVersions,
      labelChanges: activity.DiscussionChannels[0]!.LabelChangeHistory,
    });
  });
});
