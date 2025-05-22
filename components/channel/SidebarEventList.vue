<script setup lang="ts">
  import { computed } from "vue";
  import { DateTime } from "luxon";
  import type { Event } from "@/__generated__/graphql";
  import { useQuery } from "@vue/apollo-composable";
  import { GET_SOONEST_EVENTS_IN_CHANNEL } from "@/graphQLData/channel/queries";
  import { useRoute } from "nuxt/app";

  defineProps({
    eventChannelsAggregate: {
      type: Number,
      required: true,
    },
  });

  const route = useRoute();

  const channelId = computed(() => {
    if (typeof route.params.forumId === "string") {
      return route.params.forumId;
    }
    return "";
  });

  const {
    error: getEventsError,
    result: getEventsResult,
    loading: getEventsLoading,
  } = useQuery(
    GET_SOONEST_EVENTS_IN_CHANNEL,
    {
      uniqueName: channelId,
      now: DateTime.local().startOf("hour").toISO(),
    },
    {
      fetchPolicy: "cache-first",
    }
  );

  const soonestEventsInChannel = computed(() => {
    if (getEventsLoading.value || getEventsError.value) {
      return [];
    }
    return getEventsResult.value.events;
  });

  // Helper functions
  const getDateSectionFormat = (date: string) => {
    const dateObj = DateTime.fromISO(date);
    // The date should be in the format "Thu Nov 9"
    return dateObj.toLocaleString({
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const happeningNow = (e: Event) => {
    // We consider an event to be happening now if the start time is in the past
    // and the end time is in the future
    return (
      e.startTime < new Date().toISOString() && // start time is in the past
      e.endTime > new Date().toISOString()
    ); // end time is in the future
  };

  const happeningToday = (e: Event) => {
    const startTime = DateTime.fromISO(e.startTime ?? "");
    const now = DateTime.now();
    return (
      startTime.day === now.day && startTime.month === now.month && startTime.year === now.year
    );
  };

  const happeningTomorrow = (e: Event) => {
    const startTime = DateTime.fromISO(e.startTime ?? "");
    const tomorrow = DateTime.now().startOf("day").plus({ days: 1 });
    return (
      startTime.day === tomorrow.day &&
      startTime.month === tomorrow.month &&
      startTime.year === tomorrow.year
    );
  };

  const afterTomorrow = (e: Event) => {
    const startTime = DateTime.fromISO(e.startTime ?? "");
    const tomorrow = DateTime.now().startOf("day").plus({ days: 1 });
    return startTime > tomorrow;
  };

  const getSidebarLinkText = (event: Event) => {
    // If event.isAllDay is true, simply return event?.title.
    // Otherwise, state the title in this format: "10:00 AM · Event Title"
    if (event.isAllDay) {
      return event.title ?? "";
    }
    const startTime = DateTime.fromISO(event.startTime ?? "");
    return `${startTime.toLocaleString(DateTime.TIME_SIMPLE)} · ${event.title}`;
  };

  const dateObj = computed(() => {
    const res: Record<string, Event[]> = {
      happeningNow: [],
      happeningToday: [],
      happeningTomorrow: [],
      afterTomorrow: [],
    };

    if (!soonestEventsInChannel.value) {
      return res;
    }

    for (let i = 0; i < soonestEventsInChannel.value.length; i++) {
      const event = soonestEventsInChannel.value[i];

      if (!event) {
        continue;
      }

      if (happeningNow(event)) {
        res.happeningNow.push(event);
      } else if (happeningToday(event)) {
        res.happeningToday.push(event);
      } else if (happeningTomorrow(event)) {
        res.happeningTomorrow.push(event);
      } else if (afterTomorrow(event)) {
        res.afterTomorrow.push(event);
      }
    }

    return res;
  });

  const dateSectionObj = computed(() => {
    const res: Record<string, Event[]> = {};

    for (let i = 0; i < dateObj.value.afterTomorrow.length; i++) {
      const event = dateObj.value.afterTomorrow[i];

      const date = getDateSectionFormat(event.startTime ?? "");
      if (!res[date]) {
        res[date] = [];
      }
      res[date].push(event);
    }

    return res;
  });
</script>

<template>
  <div
    v-if="dateObj.happeningNow.length > 0"
    class="flex flex-col"
  >
    <span
      class="my-2 mb-2 flex items-center text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
    >
      <i class="fa-solid fa-circle-play mr-2 text-orange-500"></i>Happening Now
    </span>
    <div
      v-for="event in dateObj.happeningNow"
      :key="event?.id"
      class="my-1 mb-2 flex flex-col gap-2 border-l-4 border-orange-500 pl-2 text-xs leading-6 text-gray-500 dark:text-gray-300"
    >
      <nuxt-link
        class="flex items-center"
        :to="{
          name: 'forums-forumId-events-eventId',
          params: {
            forumId: channelId,
            eventId: event?.id,
          },
        }"
      >
        <span class="text-xs leading-6 text-gray-500 dark:text-gray-300">
          {{ event?.title }}
        </span>
      </nuxt-link>
      <nuxt-link
        v-if="event?.virtualEventUrl"
        class="w-fit rounded-sm bg-orange-600 px-4 py-1 text-orange-100"
        target="_blank"
        :to="event?.virtualEventUrl"
      >
        Go to online event
        <i class="fa-solid fa-arrow-up-right-from-square" />
      </nuxt-link>
    </div>
  </div>

  <div
    v-if="dateObj.happeningToday.length > 0"
    class="flex flex-col"
  >
    <span
      class="my-2 mb-2 flex items-center text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
    >
      <i class="fa-solid fa-calendar-day mr-2"></i>Today
    </span>
    <div
      v-for="event in dateObj.happeningToday"
      :key="event?.id"
      class="my-1 mb-2 flex flex-col gap-2 border-l-4 border-l-orange-500 pl-2 text-xs leading-6 text-gray-500 dark:text-gray-300"
    >
      <nuxt-link
        class="flex items-center"
        :to="{
          name: 'forums-forumId-events-eventId',
          params: {
            forumId: channelId,
            eventId: event?.id,
          },
        }"
      >
        <span class="text-xs leading-6 text-gray-500 dark:text-gray-300">
          {{ getSidebarLinkText(event) }}
        </span>
      </nuxt-link>
    </div>
  </div>

  <div
    v-if="dateObj.happeningTomorrow.length > 0"
    class="flex flex-col"
  >
    <span
      class="my-2 mb-2 flex items-center text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
    >
      <i class="fa-solid fa-calendar-plus mr-2"></i>Tomorrow
    </span>
    <div
      v-for="event in dateObj.happeningTomorrow"
      :key="event?.id"
      class="my-1 mb-2 flex flex-col gap-2 border-l-4 border-l-orange-500 pl-2 text-xs leading-6 text-gray-500 dark:text-gray-300"
    >
      <nuxt-link
        class="flex items-center"
        :to="{
          name: 'forums-forumId-events-eventId',
          params: {
            forumId: channelId,
            eventId: event?.id,
          },
        }"
      >
        <span class="text-xs leading-6 text-gray-500 dark:text-gray-300">
          {{ getSidebarLinkText(event) }}
        </span>
      </nuxt-link>
    </div>
  </div>

  <div v-if="dateObj.afterTomorrow.length > 0">
    <div
      v-for="(events, date) in dateSectionObj"
      :key="date"
      class="flex flex-col"
    >
      <span class="my-2 mb-2 flex items-center text-sm leading-6 text-gray-500 dark:text-gray-400">
        <i class="fa-solid fa-calendar-week mr-2"></i>{{ date }}
      </span>
      <div
        v-for="event in events"
        :key="event?.id"
        class="my-1 mb-2 flex flex-col gap-2 border-l-4 border-l-orange-500 pl-2 text-xs leading-6 text-gray-500 dark:text-gray-300"
      >
        <nuxt-link
          class="flex items-center"
          :to="{
            name: 'forums-forumId-events-eventId',
            params: {
              forumId: channelId,
              eventId: event?.id,
            },
          }"
        >
          <span class="text-xs leading-6 text-gray-500 dark:text-gray-300">
            {{ getSidebarLinkText(event) }}
          </span>
        </nuxt-link>
      </div>
    </div>
  </div>

  <div
    v-if="
      soonestEventsInChannel.length > 0 && eventChannelsAggregate > soonestEventsInChannel.length
    "
  >
    <nuxt-link
      class="flex items-center underline"
      :to="{
        name: 'forums-forumId-events',
        params: { forumId: channelId },
      }"
    >
      <span class="text-xs leading-6 dark:text-white"> View all events </span>
    </nuxt-link>
  </div>
</template>
