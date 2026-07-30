import { describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { discussionId: 'discussion-1', forumId: 'cats' },
  }),
}));

const PipelineViewStub = {
  name: 'PublicDownloadPipelines',
  props: [
    'fileId',
    'discussionId',
    'channelName',
    'ownerUsername',
    'uploaderUsername',
  ],
  template: '<div data-testid="pipeline-page" />',
};

const mountPage = async (discussion: Record<string, unknown>) => {
  const Page = (await import('./pipelines.vue')).default;
  return shallowMount(Page, {
    props: { discussion },
    global: {
      stubs: { PublicDownloadPipelines: PipelineViewStub },
    },
  });
};

describe('download pipelines tab', () => {
  it('passes the download route and file identity to the public pipeline view', async () => {
    const wrapper = await mountPage({
      DownloadableFiles: [
        { id: 'file-1', uploadedByUsername: 'file-uploader' },
      ],
      Author: { username: 'alice' },
    });

    expect(wrapper.getComponent(PipelineViewStub).props()).toEqual({
      fileId: 'file-1',
      discussionId: 'discussion-1',
      channelName: 'cats',
      ownerUsername: 'alice',
      uploaderUsername: 'file-uploader',
    });
  });

  it('shows an unavailable state when the discussion has no file', async () => {
    expect((await mountPage({ DownloadableFiles: [] })).text()).toContain(
      'Pipeline information is unavailable'
    );
  });
});
