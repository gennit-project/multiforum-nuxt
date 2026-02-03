<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import TabButton from '@/components/channel/TabButton.vue';
import type { User } from '@/__generated__/graphql';
// import { usernameVar, isAuthenticatedVar } from "@/cache"; // Unused for now
import { useRoute } from 'nuxt/app';

const route = useRoute();

type TabData = {
  name: string;
  href: string;
  current: boolean;
  count?: number | null;
};

type UserProfileCounts = User & {
  DownloadsAggregate?: {
    count?: number | null;
  } | null;
  AlbumsAggregate?: {
    count?: number | null;
  } | null;
};

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
      href: `/u/${usernameInParams.value}/comments`,
      current: true,
      count: props.user?.CommentsAggregate?.count,
    },
    {
      name: 'Discussions',
      href: `/u/${usernameInParams.value}/discussions`,
      current: false,
      count: props.user?.DiscussionsAggregate?.count,
    },
    {
      name: 'Downloads',
      href: `/u/${usernameInParams.value}/downloads`,
      current: false,
      count: props.user?.DownloadsAggregate?.count,
    },
    {
      name: 'Events',
      href: `/u/${usernameInParams.value}/events`,
      current: false,
      count: props.user?.EventsAggregate?.count,
    },
    {
      name: 'Images',
      href: `/u/${usernameInParams.value}/images`,
      current: false,
      count: props.user?.ImagesAggregate?.count,
    },
    {
      name: 'Albums',
      href: `/u/${usernameInParams.value}/albums`,
      current: false,
      count: props.user?.AlbumsAggregate?.count,
    },
    {
      name: 'Owned Forums',
      href: `/u/${usernameInParams.value}/ownedForums`,
      current: false,
      count: props.user?.AdminOfChannelsAggregate?.count,
    },
    {
      name: 'Modded Forums',
      href: `/u/${usernameInParams.value}/moddedForums`,
      current: false,
      count: props.user?.ModOfChannelsAggregate?.count,
    },
  ];

  return tabList;
});
</script>

<template>
  <nav class="max-w-screen-2xl space-x-2 pt-1 text-sm" aria-label="Tabs">
    <TabButton
      v-for="tab in tabs"
      :key="tab.name"
      :to="tab.href"
      :label="tab.name"
      :is-active="
        route.path === tab.href || route.path.startsWith(tab.href + '/')
      "
      :count="tab.count || undefined"
      :show-count="showCounts && !!tab.count"
    />
  </nav>
</template>
