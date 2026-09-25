import { describe, expect, it } from 'vitest';
import { buildSchema, NoUnusedVariablesRule, print, validate } from 'graphql';
import {
  GET_DISCUSSION_ACTIVITY,
  GET_DISCUSSION_DETAIL,
  GET_DOWNLOAD_ACTIVITY,
  GET_DOWNLOAD_DETAIL,
} from './queries';

const source = print(GET_DOWNLOAD_DETAIL);
const discussionSource = print(GET_DISCUSSION_DETAIL);
const activitySource = print(GET_DISCUSSION_ACTIVITY);
const downloadActivitySource = print(GET_DOWNLOAD_ACTIVITY);
const discussionValidationSchema = buildSchema(`
  type Query {
    discussions(where: DiscussionWhere): [Discussion!]!
  }

  input DiscussionWhere {
    id: ID
  }

  type Discussion {
    id: ID!
  }
`);

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
    expect(source).toContain('isFavorited(username: $loggedInUsername)');
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

describe('GET_DISCUSSION_DETAIL', () => {
  it('does not declare variables unused by the focused query', () => {
    expect(
      validate(discussionValidationSchema, GET_DISCUSSION_DETAIL, [
        NoUnusedVariablesRule,
      ])
    ).toEqual([]);
  });

  it('keeps fields required by the initial discussion view', () => {
    expect(discussionSource).toContain('query getDiscussionDetail');
    expect(discussionSource).toContain('DiscussionChannels');
    expect(discussionSource).toContain('Answers');
    expect(discussionSource).toContain('SharedCollection');
    expect(discussionSource).toContain('CrosspostedDiscussion');
  });

  it('leaves revision and label activity out of the initial response', () => {
    expect(discussionSource).not.toContain('LabelChangeHistory');
    expect(discussionSource).not.toContain('PastTitleVersions');
    expect(discussionSource).not.toContain('PastBodyVersions');
    expect(discussionSource).not.toContain('BodyLastEditedBy');
    expect(discussionSource).not.toContain('LabelOptions');
  });
});

describe('GET_DISCUSSION_ACTIVITY', () => {
  it('loads the revision fields deferred from the initial response', () => {
    expect(activitySource).toContain('query getDiscussionActivity');
    expect(activitySource).toContain('PastTitleVersions');
    expect(activitySource).toContain('PastBodyVersions');
    expect(activitySource).toContain('BodyLastEditedBy');
  });
});

describe('GET_DOWNLOAD_ACTIVITY', () => {
  it('loads only the deferred fields used by the download activity tab', () => {
    expect({
      operation: downloadActivitySource.includes('query getDownloadActivity'),
      titleHistory: downloadActivitySource.includes('PastTitleVersions'),
      labelHistory: downloadActivitySource.includes('LabelChangeHistory'),
      fileId: downloadActivitySource.includes('DownloadableFiles'),
      bodyHistory: downloadActivitySource.includes('PastBodyVersions'),
    }).toEqual({
      operation: true,
      titleHistory: true,
      labelHistory: true,
      fileId: true,
      bodyHistory: false,
    });
  });
});
