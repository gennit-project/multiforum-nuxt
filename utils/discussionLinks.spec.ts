import { describe, expect, it } from 'vitest';
import {
  getDiscussionEditUrl,
  getDiscussionFeedbackRoute,
  getDiscussionLinkTarget,
  getDownloadEditUrl,
  getDownloadTabRoute,
  getDownloadTabUrl,
  getLoadedDiscussionSegment,
} from './discussionLinks';

const discussion = {
  id: 'global-id',
  title: 'Trail conditions',
  DiscussionChannels: [
    { channelUniqueName: 'hiking', discussionNumber: 42 },
    { channelUniqueName: 'cats', discussionNumber: 7 },
  ],
};

describe('getLoadedDiscussionSegment', () => {
  it('uses the number for the requested forum and the title slug', () => {
    expect(getLoadedDiscussionSegment({ discussion, channelId: 'cats' })).toBe(
      '7-trail-conditions'
    );
  });

  it('falls back to the raw id when the forum has no number', () => {
    expect(getLoadedDiscussionSegment({ discussion, channelId: 'dogs' })).toBe(
      'global-id'
    );
  });
});

describe('getDiscussionLinkTarget', () => {
  it('describes a missing discussion with only the forum', () => {
    expect(
      getDiscussionLinkTarget({ discussion: null, channelId: 'cats' })
    ).toEqual({
      forumId: 'cats',
      discussionNumber: undefined,
      title: undefined,
      discussionId: undefined,
    });
  });
});

describe('sub-page links', () => {
  const target = getDiscussionLinkTarget({ discussion, channelId: 'cats' });

  it('builds the download edit url from the segment', () => {
    expect(getDownloadEditUrl(target)).toBe(
      '/forums/cats/downloads/edit/7-trail-conditions'
    );
  });

  it('builds the discussion edit url from the segment', () => {
    expect(getDiscussionEditUrl(target)).toBe(
      '/forums/cats/discussions/edit/7-trail-conditions'
    );
  });

  it('builds the feedback route with the segment param', () => {
    expect(getDiscussionFeedbackRoute(target)).toEqual({
      name: 'forums-forumId-discussions-feedback-discussionId',
      params: { forumId: 'cats', discussionId: '7-trail-conditions' },
    });
  });

  it('builds a download tab url', () => {
    expect(getDownloadTabUrl({ target, tab: 'pipelines' })).toBe(
      '/forums/cats/downloads/7-trail-conditions/pipelines'
    );
  });

  it('builds a download tab route', () => {
    expect(getDownloadTabRoute({ target, tab: 'activity' })).toEqual({
      name: 'forums-forumId-downloads-discussionId-activity',
      params: { forumId: 'cats', discussionId: '7-trail-conditions' },
    });
  });
});
