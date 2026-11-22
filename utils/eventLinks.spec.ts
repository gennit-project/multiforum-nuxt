import { describe, it, expect } from 'vitest';
import {
  getEventEditUrl,
  getEventFeedbackRoute,
  getEventLinkRoute,
  getEventLinkTarget,
  getEventLinkUrl,
  getEventNumberForForum,
} from '@/utils/eventLinks';

const event = {
  id: 'e-uuid',
  title: 'Game Night!',
  EventChannels: [
    { channelUniqueName: 'dogs', eventNumber: 3 },
    { channelUniqueName: 'cats', eventNumber: 7 },
  ],
};

describe('eventLinks', () => {
  it('picks the number of the forum the link points at', () => {
    expect(getEventNumberForForum({ event, forumId: 'cats' })).toBe(7);
  });

  it('returns null when the forum has no selected number', () => {
    expect(getEventNumberForForum({ event, forumId: 'birds' })).toBeNull();
  });

  it('defaults to the first forum when none is given', () => {
    expect(getEventLinkTarget({ event })).toEqual({
      forumId: 'dogs',
      eventNumber: 3,
      title: 'Game Night!',
      eventId: 'e-uuid',
    });
  });

  it('builds the event URL from number and title slug', () => {
    expect(getEventLinkUrl({ event, forumId: 'cats' })).toBe(
      '/forums/cats/events/7-game-night'
    );
  });

  it('builds a named route carrying the short segment', () => {
    expect(getEventLinkRoute({ event, forumId: 'cats' })).toEqual({
      name: 'forums-forumId-events-eventId',
      params: { forumId: 'cats', eventId: '7-game-night' },
    });
  });

  it('builds the edit URL from the short segment', () => {
    expect(getEventEditUrl({ event, forumId: 'cats' })).toBe(
      '/forums/cats/events/edit/7-game-night'
    );
  });

  it('builds the feedback route from the short segment', () => {
    expect(getEventFeedbackRoute({ event, forumId: 'cats' })).toEqual({
      name: 'forums-forumId-events-feedback-eventId',
      params: { forumId: 'cats', eventId: '7-game-night' },
    });
  });

  it('falls back to the raw id when no number is available', () => {
    expect(
      getEventLinkUrl({ event: { id: 'e-uuid', title: 'x' }, forumId: 'cats' })
    ).toBe('/forums/cats/events/e-uuid');
  });
});
