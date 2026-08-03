import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import type { Discussion } from '@/__generated__/graphql';
import ActivityPage from './activity.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: 'cats', discussionId: 'discussion-1' },
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: ref(null) }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ref(''),
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
});
