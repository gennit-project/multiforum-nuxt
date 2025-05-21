<script lang="ts">
  import type { PropType } from "vue";
  import { defineComponent, computed } from "vue";
  import type { Event as EventData, EventChannel } from "@/__generated__/graphql";
  import { useRoute } from "nuxt/app";
  import { DateTime } from "luxon";
  import UsernameWithTooltip from "@/components/UsernameWithTooltip.vue";
  import { relativeTime } from "@/utils";

  export default defineComponent({
    components: {
      UsernameWithTooltip,
    },
    props: {
      eventData: {
        type: Object as PropType<EventData>,
        required: true,
      },
      compactMode: {
        type: Boolean,
        default: false,
      },
      channelsExceptCurrent: {
        type: Array as PropType<EventChannel[]>,
        default: () => [],
      },
      showPoster: {
        type: Boolean,
        default: true,
      },
    },
    setup(props) {
      const route = useRoute();

      const eventId = computed(() => {
        if (typeof route.params.eventId === "string") {
          return route.params.eventId;
        }
        return "";
      });

      const channelId = computed(() => {
        if (typeof route.params.forumId === "string") {
          return route.params.forumId;
        }
        return "";
      });

      const posterIsAdmin = computed(() => {
        const serverRoles = props.eventData.Poster?.ServerRoles;
        if (!serverRoles) {
          return false;
        }
        if (serverRoles.length === 0) {
          return false;
        }
        const serverRole = serverRoles[0];
        if (serverRole.showAdminTag) {
          return true;
        }
        return false;
      });

      const posterIsMod = computed(() => {
        const channelRoles = props.eventData.Poster?.ChannelRoles;
        if (!channelRoles) {
          return false;
        }
        if (channelRoles.length === 0) {
          return false;
        }
        const channelRole = channelRoles[0];
        if (channelRole.showModTag) {
          return true;
        }
        return false;
      });

      return {
        channelId,
        posterIsMod,
        eventId,
        posterIsAdmin,
        relativeTime,
        route,
      };
    },
    methods: {
      getTimeZone(startTime: string) {
        const startTimeObj = DateTime.fromISO(startTime);

        return startTimeObj.zoneName;
      },
    },
  });
</script>
<template>
  <div class="mt-4 text-xs text-gray-700 dark:text-gray-200">
    <div
      v-if="showPoster"
      class="organizer flex items-center gap-1"
    >
      <nuxt-link
        v-if="eventData.Poster"
        class="underline"
        :to="{
          name: 'u-username',
          params: { username: eventData.Poster.username },
        }"
      >
        <UsernameWithTooltip
          v-if="eventData.Poster.username"
          :account-created="eventData.Poster.createdAt"
          :comment-karma="eventData.Poster.commentKarma ?? 0"
          :discussion-karma="eventData.Poster.discussionKarma ?? 0"
          :display-name="eventData.Poster.displayName || ''"
          :is-admin="posterIsAdmin"
          :is-mod="posterIsMod"
          :src="eventData.Poster.profilePicURL ?? ''"
          :username="eventData.Poster.username"
        />
      </nuxt-link>
      <span v-else>[Deleted]</span>
      {{
        `${
          eventData.createdAt ? `posted this event ${relativeTime("" + eventData.createdAt)}` : ""
        }`
      }}
      <span v-if="eventData.updatedAt"> &#8226; </span>
      {{ eventData.updatedAt ? `Edited ${relativeTime("" + eventData.updatedAt)}` : "" }}
    </div>
    <div class="time-zone">
      {{ `Time zone: ${getTimeZone(eventData.startTime)}` }}
    </div>
    <p
      v-if="!eventData.virtualEventUrl && !eventData.address"
      class="xs"
    >
      This event won't show in site-wide search results because it doesn't have a location or a
      virtual event URL. It will only appear in forum specific search results.
    </p>
  </div>
</template>
