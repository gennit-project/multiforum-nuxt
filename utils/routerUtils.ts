import type LocationFilterTypes from "@/components/event/list/filters/locationFilterTypes";
import type { LocationQuery, Router } from "vue-router";

type FeedbackPermalinkInput = {
  routeName: string;
  forumId: string;
  isFeedbackOnDiscussion?: boolean;
  isFeedbackOnEvent?: boolean;
  discussionId?: string;
  eventId?: string;
  feedbackId?: string;
  commentId?: string;
};

export const getFeedbackPermalinkObject = (input: FeedbackPermalinkInput) => {
  const { routeName, forumId, discussionId, eventId, feedbackId, commentId, isFeedbackOnDiscussion, isFeedbackOnEvent } = input;
  // If this is feedback on a discussion, give the discussion feedback permalink
  if (routeName === "forums-forumId-discussions-feedback-discussionId" || isFeedbackOnDiscussion) {
    if (!discussionId || !commentId || !feedbackId) {
      throw new Error("Missing required parameters for feedback permalink");
    }
    return {
      name: "forums-forumId-discussions-feedback-discussionId-feedbackPermalink-feedbackId",
      params: {
        forumId,
        discussionId,
        feedbackId: commentId,
      },
    };
  }

  // If this is feedback on an event, give the event feedback permalink
  if (routeName === "forums-forumId-events-feedback-eventId" || isFeedbackOnEvent) {
    if (!eventId || !commentId || !feedbackId) {
      throw new Error("Missing required parameters for feedback permalink");
    }
    return {
      name: "forums-forumId-events-feedback-eventId-feedbackPermalink-feedbackId",
      params: {
        forumId,
        eventId,
        feedbackId: commentId,
      },
    };
  }

  // If this is feedback on a comment, give the comment feedback permalink
  if (!discussionId || !commentId || !feedbackId || !forumId) {
    throw new Error("Missing required parameters for feedback permalink");
  }
  return {
    name: "forums-forumId-discussions-commentFeedback-discussionId-commentId-feedbackPermalink-feedbackId",
    params: {
      forumId,
      discussionId,
      commentId: feedbackId,
      feedbackId: commentId,
    },
  };
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
    if (
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
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
