<script setup lang="ts">
import { computed } from 'vue';
import type { Event as EventData, EventChannel } from '@/__generated__/graphql';
import { DateTime } from 'luxon';
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import { stableRelativeTime } from '@/utils';
import { useServerRoleMembership } from '@/composables/useServerRoleMembership';
import { getServerRoleBadge } from '@/utils/serverRoleBadges';

const props = withDefaults(
  defineProps<{
    eventData: EventData;
    compactMode?: boolean;
    channelsExceptCurrent?: EventChannel[];
    showPoster?: boolean;
  }>(),
  {
    compactMode: false,
    channelsExceptCurrent: () => [],
    showPoster: true,
  }
);

const { serverAdminUsernames } = useServerRoleMembership();

const posterIsAdmin = computed(() => {
  return (
    getServerRoleBadge({
      username: props.eventData.Poster?.username,
      adminUsernames: serverAdminUsernames.value,
    }) === 'serverAdmin'
  );
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

function getTimeZone(startTime: string) {
  const startTimeObj = DateTime.fromISO(startTime);
  return startTimeObj.zoneName;
}
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
