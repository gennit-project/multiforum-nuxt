<script lang="ts" setup>
  import { computed } from "vue";
  import { useQuery } from "@vue/apollo-composable";
  import { GET_CHANNEL } from "@/graphQLData/channel/queries";
  import ChannelSidebar from "@/components/channel/ChannelSidebar.vue";
  import RequireAuth from "@/components/auth/RequireAuth.vue";
  import { useRoute } from "nuxt/app";

  const route = useRoute();
  const channelId = computed(() => {
    if (typeof route.params.forumId === "string") {
      return route.params.forumId;
    }
    return "";
  });
  const {
    error: getChannelError,
    result: getChannelResult,
    loading: getChannelLoading,
  } = useQuery(GET_CHANNEL, {
    uniqueName: channelId.value,
    now: new Date().toISOString(),
  });

  const channel = computed(() => {
    if (getChannelLoading.value || getChannelError.value) {
      return null;
    }
    return getChannelResult.value.channels[0];
  });

  const admins = computed(() => channel.value?.Admins ?? []);

  const ownerList = computed(() => admins.value.map((adminData: any) => adminData?.username));
</script>

<template>
  <div class="max-w-4xl justify-center p-8 dark:bg-gray-900">
    <div class="w-full py-3">
      <ChannelSidebar
        v-if="channel"
        :channel="channel"
        :use-scrollbar="false"
      />
      <RequireAuth
        class="w-full"
        :justify-left="true"
        :owners="ownerList"
        :require-ownership="true"
      >
        <template #has-auth>
          <div class="flex w-full justify-between border-b border-gray-500">
            <span
              class="my-2 mb-2 w-full text-sm font-bold leading-6 text-gray-600 dark:text-gray-100"
            >
              Admin Actions
            </span>
          </div>
          <nuxt-link
            class="my-3 text-sm underline dark:text-gray-200"
            :to="{
              name: 'forums-forumId-edit',
              params: { forumId: channelId },
            }"
          >
            Edit
          </nuxt-link>
        </template>
      </RequireAuth>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  /* Apply the user's preferred color scheme by default */
  @media (prefers-color-scheme: dark) {
    #md-editor-v3-preview,
    #md-editor-v3-preview-wrapper {
      background-color: black;
    }
  }

  @media (prefers-color-scheme: light) {
    #md-editor-v3-preview,
    #md-editor-v3-preview-wrapper {
      background-color: orange;
    }
  }
</style>
