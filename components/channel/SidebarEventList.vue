<script lang="ts">
import { defineComponent, computed } from "vue";
import { DateTime } from "luxon";
import { Event } from "@/__generated__/graphql";
import { useQuery } from "@vue/apollo-composable";
import { GET_SOONEST_EVENTS_IN_CHANNEL } from "@/graphQLData/channel/queries";
import { useRoute } from "vue-router";

const getDateSectionFormat = (date: string) => {
  const dateObj = DateTime.fromISO(date);
  // The date should be in the format "Thu Nov 9"
  return dateObj.toLocaleString({
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export default defineComponent({
  name: "SidebarEventList",
  props: {
    eventChannelsAggregate: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const route = useRoute();

    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });

    const {
      error: getEventsError,
      result: getEventsResult,
      loading: getEventsLoading,
    } = useQuery(GET_SOONEST_EVENTS_IN_CHANNEL, {
      uniqueName: channelId,
      now: new Date().toISOString(),
    });

    const soonestEventsInChannel = computed(() => {
      if (getEventsLoading.value || getEventsError.value) {
        return [];
      }
      return getEventsResult.value.events;
    });

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
        startTime.day === now.day &&
        startTime.month === now.month &&
        startTime.year === now.year
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

    let dateObj: any = computed(() => {
      let res: Record<string, Event[]> = {
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
      let res: any = {};

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

    return {
      dateSectionObj,
      dateObj,
      channelId,
      soonestEventsInChannel,
      afterTomorrow,
    };
  },
  methods: {
    getSidebarLinkText(event: Event) {
      // If event.isAllDay is true,
      // simply return event?.title.
      // Otherwise, state the title in this format:
      // "10:00 AM · Event Title"
      if (event.isAllDay) {
        return event.title ?? "";
      }
      const startTime = DateTime.fromISO(event.startTime ?? "");
      return `${startTime.toLocaleString(DateTime.TIME_SIMPLE)} · ${
        event.title
      }`;
    },
  },
});
</script>

<template>
  <div
    v-if="dateObj.happeningNow.length > 0"
    class="flex flex-col"
  >
    <span
      class="my-2 mb-2 text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
    >
      Happening Now
    </span>
    <div
      v-for="event in dateObj.happeningNow"
      :key="event?.id"
      class="my-1 mb-2 flex flex-col gap-2 border-l-4 border-blue-500 pl-2 text-sm font-bold leading-6 text-gray-500 dark:text-gray-300"
    >
      <router-link
        :to="`/channels/c/${channelId}/events/e/${event?.id}`"
        class="flex items-center"
      >
        <span
          class="text-sm font-bold leading-6 text-gray-500 dark:text-gray-300"
        >
          {{ event?.title }}
        </span>
      </router-link>
      <a
        v-if="event?.virtualEventUrl"
        target="_blank"
        :href="event?.virtualEventUrl"
        class="w-fit rounded-md bg-blue-600 px-4 py-2 text-blue-100"
      >
        Go to online event
        <i class="fa-solid fa-arrow-up-right-from-square" />
      </a>
    </div>
  </div>

  <div
    v-if="dateObj.happeningToday.length > 0"
    class="flex flex-col"
  >
    <span
      class="my-2 mb-2 text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
    >
      Today
    </span>
    <div
      v-for="event in dateObj.happeningToday"
      :key="event?.id"
      class="my-1 mb-2 flex flex-col gap-2 border-l-4 border-l-blue-500 pl-2 text-sm font-bold leading-6 text-gray-500 dark:text-gray-300"
    >
      <router-link
        :to="`/channels/c/${channelId}/events/e/${event?.id}`"
        class="flex items-center"
      >
        <span
          class="text-sm font-bold leading-6 text-gray-500 dark:text-gray-300"
        >
          {{ getSidebarLinkText(event) }}
        </span>
      </router-link>
    </div>
  </div>

  <div
    v-if="dateObj.happeningTomorrow.length > 0"
    class="flex flex-col"
  >
    <span
      class="my-2 mb-2 text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
    >
      Tomorrow
    </span>
    <div
      v-for="event in dateObj.happeningTomorrow"
      :key="event?.id"
      class="my-1 mb-2 flex flex-col gap-2 border-l-4 border-l-blue-500 pl-2 text-sm font-bold leading-6 text-gray-500 dark:text-gray-300"
    >
      <router-link
        :to="`/channels/c/${channelId}/events/e/${event?.id}`"
        class="flex items-center"
      >
        <span
          class="text-sm font-bold leading-6 text-gray-500 dark:text-gray-300"
        >
          {{ getSidebarLinkText(event) }}
        </span>
      </router-link>
    </div>
  </div>

  <div v-if="dateObj.afterTomorrow.length > 0">
    <div
      v-for="(events, date) in dateSectionObj"
      :key="date"
      class="flex flex-col"
    >
      <span
        class="my-2 mb-2 text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
      >
        {{ date }}
      </span>
      <div
        v-for="event in events"
        :key="event?.id"
        class="my-1 mb-2 flex flex-col gap-2 border-l-4 border-l-blue-500 pl-2 text-sm leading-6 text-gray-500 dark:text-gray-300"
      >
        <router-link
          :to="`/channels/c/${channelId}/events/e/${event?.id}`"
          class="flex items-center"
        >
          <span
            class="text-sm leading-6 text-gray-500 dark:text-gray-300"
          >
            {{ getSidebarLinkText(event) }}
          </span>
        </router-link>
      </div>
    </div>
  </div>

  <div
    v-if="
      soonestEventsInChannel.length > 0 &&
        eventChannelsAggregate > soonestEventsInChannel.length
    "
  >
    <router-link
      :to="`/channels/c/${channelId}/events/search`"
      class="flex items-center underline"
    >
      <span class="text-sm font-bold leading-6"> View all events </span>
    </router-link>
  </div>
</template>
