<script lang="ts">
import { defineComponent, computed } from "vue";
import { GET_USER_EVENTS } from "@/graphQLData/user/queries";
import { useQuery } from "@vue/apollo-composable";
import EventListItemInProfile from "@/components/user/EventItemInProfile.vue";
import { useRoute } from "nuxt/app";

export default defineComponent({
  name: "DownvotedEvents",
  components: {
    EventListItemInProfile,
  },

  setup() {
    const route = useRoute();

    const username = computed(() => {
      if (typeof route.params.username === "string") {
        return route.params.username;
      }
      return "";
    });

    const { result, loading, error } = useQuery(GET_USER_EVENTS, () => ({
      username: username.value,
    }),{
      fetchPolicy: "cache-first",
    });

    return {
      loading,
      error,
      result,
    };
  },
});
</script>
<template>
  <div class="flex flex-col gap-3 py-3">
    <div v-if="loading">
      Loading...
    </div>
    <div v-else-if="error">
      Error
    </div>
    <div v-else-if="result?.users?.length === 0 || result?.users[0]?.Events.length === 0">
      No events yet
    </div>
    <EventListItemInProfile
      v-for="event in result.users[0].Events"
      v-else-if="result && result.users.length > 0"
      :key="event.id"
      :current-channel-id="''"
      :event="event"
    />
  </div>
</template>
