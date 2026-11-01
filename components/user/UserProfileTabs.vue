<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import TabButton from '@/components/channel/TabButton.vue';
import type { GetPublicUserProfileQuery } from '@/__generated__/operations';
// import { usernameVar, isAuthenticatedVar } from "@/cache"; // Unused for now
import { useRoute } from 'nuxt/app';
import type { RouteLocationRaw } from 'vue-router';

const route = useRoute();

type TabData = {
  name: string;
  path: string;
  to: RouteLocationRaw;
  current: boolean;
  count?: number | null;
};

type UserProfileCounts = Pick<GetPublicUserProfileQuery['users'][number], 'username'> & Partial<GetPublicUserProfileQuery['users'][number]> & { wikiEditsCount?: number | null };

const props = defineProps({
  vertical: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object as () => UserProfileCounts,
    required: true,
  },
  showCounts: {
    type: Boolean,
    default: false,
  },
});

const channelId = ref(route.params.forumId);
const usernameInParams = computed(() => {
  return typeof route.params.username === 'string' ? route.params.username : '';
});
const channelsQuery = computed(() => {
  const channels = route.query.channels;
  if (typeof channels === 'string') {
    return channels ? [channels] : [];
  }
  if (Array.isArray(channels)) {
    return channels.filter(
      (value): value is string => typeof value === 'string' && !!value
    );
  }
  return [];
});

const getTabTo = (path: string): RouteLocationRaw => {
  const query = channelsQuery.value.length
    ? { channels: channelsQuery.value }
    : undefined;
  return {
    path,
    query,
  };
};

watch(
  () => route,
  (to) => {
    channelId.value = to.params.channelId;
  }
);

// Define the tabs based on the user data and authentication status
const tabs = computed(() => {
  const tabList: TabData[] = [
    {
      name: 'Comments',
      path: `/u/${usernameInParams.value}/comments`,
      to: getTabTo(`/u/${usernameInParams.value}/comments`),
      current: true,
      count: props.user?.CommentsConnection?.aggregate?.count?.nodes,
    },
    {
      name: 'Discussions',
      path: `/u/${usernameInParams.value}/discussions`,
      to: getTabTo(`/u/${usernameInParams.value}/discussions`),
      current: false,
      count: props.user?.DiscussionsConnection?.aggregate?.count?.nodes,
    },
    {
      name: 'Downloads',
      path: `/u/${usernameInParams.value}/downloads`,
      to: getTabTo(`/u/${usernameInParams.value}/downloads`),
      current: false,
      count: props.user?.DownloadsConnection?.aggregate?.count?.nodes,
    },
    {
      name: 'Events',
      path: `/u/${usernameInParams.value}/events`,
      to: getTabTo(`/u/${usernameInParams.value}/events`),
      current: false,
      count: props.user?.EventsConnection?.aggregate?.count?.nodes,
    },
    {
      name: 'Wiki Edits',
      path: `/u/${usernameInParams.value}/wiki-edits`,
      to: getTabTo(`/u/${usernameInParams.value}/wiki-edits`),
      current: false,
      count:
        props.user?.wikiEditsCount ??
        props.user?.AuthoredWikiPageVersionsConnection?.aggregate?.count?.nodes,
    },
    {
      name: 'Images',
      path: `/u/${usernameInParams.value}/images`,
      to: getTabTo(`/u/${usernameInParams.value}/images`),
      current: false,
      count: props.user?.ImagesConnection?.aggregate?.count?.nodes,
    },
    {
      name: 'Albums',
      path: `/u/${usernameInParams.value}/albums`,
      to: getTabTo(`/u/${usernameInParams.value}/albums`),
      current: false,
      count: props.user?.AlbumsConnection?.aggregate?.count?.nodes,
    },
    {
      name: 'Owned Forums',
      path: `/u/${usernameInParams.value}/ownedForums`,
      to: getTabTo(`/u/${usernameInParams.value}/ownedForums`),
      current: false,
      count: props.user?.AdminOfChannelsConnection?.aggregate?.count?.nodes,
    },
    {
      name: 'Modded Forums',
      path: `/u/${usernameInParams.value}/moddedForums`,
      to: getTabTo(`/u/${usernameInParams.value}/moddedForums`),
      current: false,
      count: props.user?.ModOfChannelsConnection?.aggregate?.count?.nodes,
    },
  ];

  return tabList;
});
</script>

<template>
  <nav
    class="max-w-[theme(screens.2xl)] space-x-2 pt-1 text-sm"
    aria-label="Tabs"
  >
    <TabButton
      v-for="tab in tabs"
      :key="tab.name"
      :to="tab.to"
      :label="tab.name"
      :is-active="
        route.path === tab.path || route.path.startsWith(tab.path + '/')
      "
      :count="tab.count || undefined"
      :show-count="showCounts && !!tab.count"
    />
  </nav>
</template>
