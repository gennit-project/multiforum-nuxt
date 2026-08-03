import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import DownloadMetadata from './DownloadMetadata.vue';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: ref({
      discussions: [
        {
          DiscussionChannels: [
            {
              LabelOptions: [
                {
                  value: 'beginner',
                  displayName: 'Beginner',
                  group: { key: 'difficulty', displayName: 'Difficulty' },
                },
                {
                  value: 'cc-by',
                  displayName: 'CC BY',
                  group: { key: 'license', displayName: 'License' },
                },
              ],
            },
          ],
        },
      ],
    }),
  }),
}));

describe('DownloadMetadata', () => {
  it('shows non-license metadata without exposing license labels', () => {
    const wrapper = mount(DownloadMetadata, {
      props: {
        discussionId: 'discussion-1',
        channelUniqueName: 'models',
      },
    });

    expect(wrapper.text()).toEqual(
      expect.stringMatching(/Metadata.*Difficulty.*Beginner/s)
    );
  });

  it('does not show license metadata', () => {
    const wrapper = mount(DownloadMetadata, {
      props: {
        discussionId: 'discussion-1',
        channelUniqueName: 'models',
      },
    });

    expect(wrapper.text()).not.toContain('CC BY');
  });
});
