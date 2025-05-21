<script lang="ts">
  import { defineComponent, computed } from "vue";
  import { GET_USER_DISCUSSIONS } from "@/graphQLData/user/queries";
  import { useQuery } from "@vue/apollo-composable";
  import DiscussionItemInProfile from "@/components/user/DiscussionItemInProfile.vue";
  import { useRoute } from "nuxt/app";

  export default defineComponent({
    name: "UserDiscussions",
    components: {
      DiscussionItemInProfile,
    },

    setup() {
      const route = useRoute();

      const username = computed(() => {
        if (typeof route.params.username === "string") {
          return route.params.username;
        }
        return "";
      });

      const { result, loading, error } = useQuery(
        GET_USER_DISCUSSIONS,
        () => ({
          username: username.value,
        }),
        {
          fetchPolicy: "cache-first",
        }
      );

      return {
        loading,
        error,
        result,
      };
    },
  });
</script>
<template>
  <div class="flex flex-col gap-3 py-3 dark:text-white">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error</div>
    <div v-else-if="result?.users?.length === 0 || result.users[0]?.Discussions?.length === 0">
      No discussions yet
    </div>
    <DiscussionItemInProfile
      v-for="discussion in result.users[0].Discussions"
      v-else-if="result && result.users.length > 0"
      :key="discussion.id"
      :discussion="discussion"
    />
  </div>
</template>
