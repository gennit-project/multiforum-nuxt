<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import TabButton from "@/components/channel/TabButton.vue";
import type { User } from "@/__generated__/graphql";
import { usernameVar } from "@/cache";

type TabData = {
  name: string;
  href: string;
  current: boolean;
  count?: number | null;
};

const props = defineProps({
  route: {
    type: Object,
    required: true,
  },
  vertical: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object as () => User,
    required: true,
  },
  showCounts: {
    type: Boolean,
    default: false,
  },
});

const channelId = ref(props.route.params.forumId);
const { isAuthenticated } = useAuth0();

const usernameInParams = computed(() => {
  return typeof props.route.params.username === "string" ? props.route.params.username : "";
});

// Watch for route changes to update the `channelId`
watch(
  () => props.route,
  (to) => {
    channelId.value = to.params.channelId;
  }
);

const username = computed(() => {
  return usernameVar || "";
});

// Define the tabs based on the user data and authentication status
const tabs = computed(() => {
  const tabList: TabData[] = [
    {
      name: "Comments",
      href: `/u/${usernameInParams.value}/comments`,
      current: true,
      count: props.user?.CommentsAggregate?.count,
    },
    {
      name: "Discussions",
      href: `/u/${usernameInParams.value}/discussions`,
      current: false,
      count: props.user?.DiscussionsAggregate?.count,
    },
    {
      name: "Events",
      href: `/u/${usernameInParams.value}/events`,
      current: false,
      count: props.user?.EventsAggregate?.count,
    },
  ];

  if (isAuthenticated && username.value === usernameInParams.value) {
    tabList.push({
      name: "Settings",
      href: `/u/${usernameInParams.value}/settings`,
      current: false,
      count: null,
    });
  }
  return tabList;
});

</script>

<template>
  <div>
    <nav
      v-if="vertical"
      class="text-md flex max-w-screen-2xl flex-col"
      aria-label="Tabs"
    >
      <TabButton
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.href"
        :label="tab.name"
        :vertical="true"
        :count="tab.count || undefined"
        :show-count="showCounts && !!tab.count"
      />
    </nav>
    <nav
      v-else
      class="max-w-screen-2xl space-x-2 pt-1 text-sm"
      aria-label="Tabs"
    >
      <TabButton
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.href"
        :label="tab.name"
        :is-active="route.name.includes(tab.name)"
        :count="tab.count || undefined"
        :show-count="showCounts && !!tab.count"
      />
    </nav>
  </div>
</template>
