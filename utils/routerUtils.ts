import type LocationFilterTypes from "@/components/event/list/filters/locationFilterTypes";
import type { LocationQuery, Router } from "vue-router";
import type { Comment, Discussion, Event } from "@/__generated__/graphql";

type FeedbackPermalinkInput = {
  routeName: string;
  forumId: string;
  isFeedbackOnDiscussion?: boolean;
  isFeedbackOnEvent?: boolean;
  discussionId?: string;
  eventId?: string;
  commentId?: string;
  GivesFeedbackOnComment?: Comment;
  GivesFeedbackOnDiscussion?: Discussion;
  GivesFeedbackOnEvent?: Event;
};

type DiscussionCommentPermalinkInput = {
  forumId: string;
  discussionId: string;
  commentId: string;
};
export const getPermalinkToDiscussionComment = (input: DiscussionCommentPermalinkInput) => {
  const { forumId, discussionId, commentId } = input;
  return {
    name: "forums-forumId-discussions-discussionId-comments-commentId",
    params: {
      forumId,
      discussionId,
      commentId,
    },
  };
};

type DiscussionPermalinkInput = {
  forumId: string;
  discussionId: string;
};

export const getPermalinkToDiscussion = (input: DiscussionPermalinkInput) => {
  const { forumId, discussionId } = input;
  return {
    name: "forums-forumId-discussions-discussionId",
    params: {
      forumId,
      discussionId,
    },
  };
};

type EventCommentPermalinkInput = {
  forumId: string;
  eventId: string;
  commentId: string;
};

export const getPermalinkToEventComment = (input: EventCommentPermalinkInput) => {
  const { forumId, eventId, commentId } = input;
  return {
    name: "forums-forumId-events-eventId-comments-commentId",
    params: {
      forumId,
      eventId,
      commentId,
    },
  };
};

type EventPermalinkInput = {
  forumId: string;
  eventId: string;
};

export const getPermalinkToEvent = (input: EventPermalinkInput) => {
  const { forumId, eventId } = input;
  return {
    name: "forums-forumId-events-eventId",
    params: {
      forumId,
      eventId,
    },
  };
};

export const getFeedbackPermalinkObject = (input: FeedbackPermalinkInput) => {
  const {
    routeName,
    forumId,
    discussionId,
    commentId,
    GivesFeedbackOnComment,
    GivesFeedbackOnDiscussion,
    GivesFeedbackOnEvent,
  } = input;
  // If this is feedback on a discussion, give the discussion feedback permalink
  if (
    routeName === "forums-forumId-discussions-feedback-discussionId" ||
    GivesFeedbackOnDiscussion
  ) {
    if (!forumId || !commentId || !GivesFeedbackOnDiscussion) {
      console.error("Missing required parameters for permalink to feedback on discussion");
      return null;
    }
    return {
      name: "forums-forumId-discussions-feedback-discussionId-feedbackPermalink-feedbackId",
      params: {
        forumId,
        discussionId: GivesFeedbackOnDiscussion.id,
        feedbackId: commentId,
      },
    };
  }

  // If this is feedback on an event, give the event feedback permalink
  if (routeName === "forums-forumId-events-feedback-eventId" || GivesFeedbackOnEvent) {
    if (!forumId || !commentId || !GivesFeedbackOnEvent) {
      console.error("Missing required parameters for permalink to feedback on event");
      return null;
    }
    return {
      name: "forums-forumId-events-feedback-eventId-feedbackPermalink-feedbackId",
      params: {
        forumId,
        eventId: GivesFeedbackOnEvent.id,
        feedbackId: commentId,
      },
    };
  }

  // If this is feedback on a comment, give the comment feedback permalink
  if (!commentId || !forumId || !GivesFeedbackOnComment) {
    console.error("Missing required parameters for permalink to feedback on comment");
    return null;
  }
  if (discussionId) {
    // For feedback on comments on a discussion
    return {
      name: "forums-forumId-discussions-commentFeedback-discussionId-commentId-feedbackPermalink-feedbackId",
      params: {
        forumId,
        discussionId,
        commentId: GivesFeedbackOnComment.id,
        feedbackId: commentId,
      },
    };
  }
  // Note: we do not handle the case to permalink to feedback on comments on an event
  // because feedback on event comments is not currently supported in the app.
  return {};
};

export type UpdateStateInput = {
  channels?: string[];
  tags?: string[];
  searchInput?: string;
  latitude?: number;
  longitude?: number;
  placeName?: string;
  placeAddress?: string;
  radius?: number;
  showCanceledEvents?: boolean;
  showOnlyFreeEvents?: boolean;
  locationFilter?: LocationFilterTypes;
  showArchived?: boolean;
};

type UpdateFiltersInput = {
  params: UpdateStateInput;
  router: Router;
  route: any;
};

export const updateFilters = (input: UpdateFiltersInput) => {
  const { params, router, route } = input;
  const updatedQuery: LocationQuery = Object.assign({}, route.query);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete updatedQuery[key];
    } else if (Array.isArray(value)) {
      updatedQuery[key] = [...value];
    } else {
      updatedQuery[key] = value as string;
    }
  });

  router.replace({
    path: route.path,
    query: { ...updatedQuery },
    force: true,
  });
};
