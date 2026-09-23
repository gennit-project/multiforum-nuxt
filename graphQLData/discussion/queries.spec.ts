import { describe, expect, it } from 'vitest';
import { print } from 'graphql';
import { GET_DOWNLOAD_DETAIL } from './queries';

const source = print(GET_DOWNLOAD_DETAIL);

describe('GET_DOWNLOAD_DETAIL', () => {
  it('keeps the fields required by the initial download view', () => {
    expect(source).toContain('query getDownloadDetail');
    expect(source).toContain(
      'DiscussionChannels(where: {channelUniqueName: $channelUniqueName})'
    );
    expect(source).toContain('DownloadableFiles');
    expect(source).toContain('scanStatus');
    expect(source).toContain('LabelOptions');
    expect(source).toContain('CrosspostedDiscussion');
  });

  it('leaves activity and edit history to their dedicated views', () => {
    expect(source).not.toContain('LabelChangeHistory');
    expect(source).not.toContain('PastTitleVersions');
    expect(source).not.toContain('PastBodyVersions');
    expect(source).not.toContain('BodyLastEditedBy');
    expect(source).not.toContain('SharedCollection');
    expect(source).not.toContain('Answers');
  });
});
