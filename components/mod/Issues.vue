<script lang="ts">
import { computed, defineComponent } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "vue-router";
import {
  COUNT_CLOSED_ISSUES,
  COUNT_OPEN_ISSUES,
} from "@/graphQLData/mod/queries";

export default defineComponent({
  name: "BackLink",

  props: {
    link: {
      type: String,
      default: "",
    },
    dataTestid: {
      type: String,
      default: "",
    },
  },
  setup() {
    const route = useRoute();

    const channelId = computed(() => {
      if (typeof route.params.channelId !== "string") {
        return "";
      }
      return route.params.channelId;
    });

    const {
      result: issuesResult,
      error: issuesError,
      loading: issuesLoading,
    } = useQuery(COUNT_OPEN_ISSUES, {
      channelUniqueName: channelId.value,
    });

    const {
      result: closedIssuesResult,
      error: closedIssuesError,
      loading: closedIssuesLoading,
    } = useQuery(COUNT_CLOSED_ISSUES, {
      channelUniqueName: channelId.value,
    });

    const openCount = computed(() => {
      if (issuesLoading.value || issuesError.value) {
        return 0;
      }
      return issuesResult.value.issuesAggregate?.count || 0;
    });

    const closedCount = computed(() => {
      if (closedIssuesLoading.value || closedIssuesError.value) {
        return 0;
      }
      return closedIssuesResult.value.issuesAggregate?.count || 0;
    });
    const showClosed = false;

    return {
      channelId,
      openCount,
      closedCount,
      showClosed,
    };
  },
});
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-t-lg border border-b border-gray-200 dark:border-gray-600">
    <div class="flex items-center rounded-t-lg gap-4 py-3 pl-8">
      <!-- Use router-link for navigating to open issues -->
      <router-link
        :to="{
          name: 'OpenIssues',
          params: {
            channelId: channelId,
          },
        }"
        class="flex flex-row items-center gap-2"
        :class="{
          'text-gray-500 dark:text-gray-400': $route.name === 'ClosedIssues',
        }"
      >
        <i class="far fa-dot-circle" />{{ openCount }} Open
      </router-link>
      <router-link
        :to="{
          name: 'ClosedIssues',
          params: {
            channelId: channelId,
          },
        }"
        class="flex flex-row items-center gap-1 whitespace-nowrap"
        :class="{
          'text-gray-500 dark:text-gray-400': $route.name === 'OpenIssues',
        }"
      >
        <i class="fa-regular fa-circle-check" /> {{ closedCount }} Closed
      </router-link>
    </div>
    <router-view />
  </div>
</template>

<style>
/* Add your table styling here */
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
th {
  background-color: #f4f4f4;
}
.list-item-icon {
  /* Style for the dot circle icon */
  margin-right: 8px;
  color: green; /* or any color you prefer */
}
</style>
