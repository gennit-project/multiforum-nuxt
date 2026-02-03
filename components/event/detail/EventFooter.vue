<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, computed } from 'vue';
import type { Event as EventData, EventChannel } from '@/__generated__/graphql';
import { useRoute } from 'nuxt/app';
import { DateTime } from 'luxon';
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import { stableRelativeTime } from '@/utils';

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
      return (
        props.eventData?.id ||
        (typeof route.params.eventId === 'string' ? route.params.eventId : '')
      );
    });

    const channelId = computed(() => {
      if (typeof route.params.forumId === 'string') {
        return route.params.forumId;
      }
      return '';
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
      if (serverRole?.showAdminTag) {
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
      if (channelRole?.showModTag) {
        return true;
      }
      return false;
    });

    const postedText = computed(() => {
      if (!props.eventData?.createdAt) {
        return '';
      }
      return `posted this event ${stableRelativeTime(
        '' + props.eventData.createdAt
      )}`;
    });

    const editedText = computed(() => {
      if (!props.eventData?.updatedAt) {
        return '';
      }
      return `Edited ${stableRelativeTime('' + props.eventData.updatedAt)}`;
    });

    return {
      channelId,
      posterIsMod,
      eventId,
      posterIsAdmin,
      postedText,
      editedText,
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
    <div v-if="showPoster" class="organizer flex items-center gap-1">
      <UsernameWithTooltip
        v-if="eventData.Poster?.username"
        :is-admin="posterIsAdmin"
        :is-mod="posterIsMod"
        :username="eventData.Poster.username"
        :src="eventData.Poster.profilePicURL ?? ''"
        :display-name="eventData.Poster.displayName || ''"
        :comment-karma="eventData.Poster.commentKarma ?? 0"
        :discussion-karma="eventData.Poster.discussionKarma ?? 0"
        :account-created="eventData.Poster.createdAt"
      />
      <span v-else>[Deleted]</span>
      <span v-if="postedText">{{ postedText }}</span>
      <span v-if="postedText && editedText"> &#8226; </span>
      <span v-if="editedText">{{ editedText }}</span>
    </div>
    <div class="time-zone">
      {{ `Time zone: ${getTimeZone(eventData.startTime)}` }}
    </div>
    <p v-if="!eventData.virtualEventUrl && !eventData.address" class="xs">
      This event won't show in site-wide search results because it doesn't have
      a location or a virtual event URL. It will only appear in forum specific
      search results.
    </p>
  </div>
</template>
