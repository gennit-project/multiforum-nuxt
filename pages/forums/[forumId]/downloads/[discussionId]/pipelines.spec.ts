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
    'eventType',
    'discussionId',
    'channelName',
    'ownerUsername',
    'uploaderUsername',
  ],
  template: '<div data-testid="pipeline-page" />',
};

const NuxtLinkStub = {
  name: 'NuxtLink',
  props: ['to'],
  template: '<a><slot /></a>',
};

const mountPage = async (discussion: Record<string, unknown>) => {
  const Page = (await import('./pipelines.vue')).default;
  return shallowMount(Page, {
    props: { discussion },
    global: {
      stubs: {
        NuxtLink: NuxtLinkStub,
        PublicDownloadPipelines: PipelineViewStub,
      },
    },
  });
};

describe('download checks page', () => {
  it('passes the download route and file identity to the public pipeline view', async () => {
    const wrapper = await mountPage({
      DownloadableFiles: [
        { id: 'file-1', uploadedByUsername: 'file-uploader' },
      ],
      Author: { username: 'alice' },
    });

    expect(wrapper.getComponent(PipelineViewStub).props()).toEqual({
      fileId: 'file-1',
      eventType: 'downloadableFile.created',
      discussionId: 'discussion-1',
      channelName: 'cats',
      ownerUsername: 'alice',
      uploaderUsername: 'file-uploader',
    });
  });

  it('links back to the download detail page', async () => {
    const wrapper = await mountPage({
      title: 'Desert Bloom',
      DownloadableFiles: [{ id: 'file-1', fileName: 'Desert_Bloom.zip' }],
    });

    expect(wrapper.getComponent(NuxtLinkStub).props('to')).toEqual({
      name: 'forums-forumId-downloads-discussionId',
      params: { forumId: 'cats', discussionId: 'discussion-1' },
    });
  });

  it('shows the download and file names for context', async () => {
    const wrapper = await mountPage({
      title: 'Desert Bloom',
      DownloadableFiles: [{ id: 'file-1', fileName: 'Desert_Bloom.zip' }],
    });

    expect({
      heading: wrapper.get('h1').text(),
      fileName: wrapper.get('header p').text(),
    }).toEqual({
      heading: 'Checks for Desert Bloom',
      fileName: 'Desert_Bloom.zip',
    });
  });

  it('shows an unavailable state when the discussion has no file', async () => {
    expect((await mountPage({ DownloadableFiles: [] })).text()).toContain(
      'Check information is unavailable'
    );
  });
});
