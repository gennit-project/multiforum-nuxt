<script lang="ts" setup>
  import { computed } from "vue";
  import type { PropType } from "vue";
  import Tag from "@/components/TagComponent.vue";
  import type { Channel } from "@/__generated__/graphql";
  import ChannelRules from "@/components/channel/Rules.vue";
  import SidebarEventList from "@/components/channel/SidebarEventList.vue";
  import MarkdownPreview from "@/components/MarkdownPreview.vue";
  import { useRouter, useRoute } from "nuxt/app";
  import FontSizeControl from "@/components/channel/FontSizeControl.vue";

  const props = defineProps({
    channel: {
      type: Object as PropType<Channel>,
      required: true,
    },
    useScrollbar: {
      type: Boolean,
      default: true,
    },
  });

  const route = useRoute();
  const router = useRouter();
  const eventChannelsAggregate = computed(() => {
    return props.channel?.EventChannelsAggregate?.count ?? 0;
  });

  const channelId = computed(() => {
    return typeof route.params.forumId === "string" ? route.params.forumId : "";
  });

  const channelRules = computed(() => props.channel?.rules ?? "");
  const filterChannelsByTag = (tag: string) => {
    router.push({
      name: "forums",
      query: { tag },
    });
  };
</script>

<template>
  <div
    class="bg-white pb-8 pt-4 dark:bg-gray-800"
    :class="[useScrollbar ? 'max-h-screen overflow-auto' : '']"
  >
    <div
      v-if="channelId && channel"
      class="items-center gap-2"
    />

    <div>
      <div class="flex justify-between">
        <ExpandableImage
          v-if="channel?.channelIconURL"
          :alt="channelId"
          class="h-20 w-20 dark:border-gray-300"
          :full-width="true"
          :rounded="true"
          :src="channel?.channelIconURL ?? ''"
        />
        <AvatarComponent
          v-if="!channel?.channelIconURL"
          class="h-20 w-20 dark:border-gray-300"
          :full-width="true"
          :is-square="false"
          :src="channel?.channelIconURL ?? ''"
          :text="channelId"
        />
      </div>
      <div class="flex w-full items-center gap-4">
        <div
          v-if="channelId"
          class="flex items-center"
        >
          <div class="mb-1 mt-3">
            <span
              class="flex space-y-2 rounded-full border-gray-700 text-xl leading-6 text-black dark:bg-gray-900 dark:text-gray-200"
            >
              {{ channel?.displayName ? channel.displayName : channelId }}
            </span>
            <span
              v-if="channel?.uniqueName && channel?.displayName"
              class="rounded-full bg-white font-mono text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-300"
            >
              {{ `${channel.uniqueName}` }}
            </span>
          </div>
        </div>
      </div>
      <MarkdownPreview
        v-if="channel?.description"
        :text="channel?.description"
        :word-limit="1000"
      />
      <p
        v-else
        class="text-xs dark:text-white"
      >
        Welcome to {{ channelId }}!
      </p>
    </div>

    <slot />

    <div class="w-full">
      <div v-if="channel">
        <div class="mt-6 flex w-full flex-col gap-6">
          <div
            v-if="channelRules && channelRules !== '[]'"
            :key="channelRules"
          >
            <span class="my-2 mb-2 text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
              >Forum Rules</span
            >
            <ChannelRules :rules="channelRules" />
          </div>

          <SidebarEventList :event-channels-aggregate="eventChannelsAggregate" />

          <div v-if="channel.Tags.length > 0">
            <div class="flex justify-between border-gray-300">
              <span class="my-2 mb-2 text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
                >Tags</span
              >
            </div>
            <div class="mb-6 mt-2 flex flex-wrap gap-2">
              <Tag
                v-for="tag in channel.Tags"
                :key="tag.text"
                class="mb-1"
                :tag="tag.text"
                @click="filterChannelsByTag(tag.text)"
              />
            </div>
          </div>

          <FontSizeControl class="mb-6" />

          <div class="flex justify-between">
            <span class="my-2 text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
              >Admins</span
            >
          </div>

          <div
            v-if="channel.Admins.length > 0"
            class="flex-col space-y-2 text-sm font-bold"
          >
            <div
              v-for="admin in channel.Admins"
              :key="admin.username"
            >
              <nuxt-link
                class="flex items-center dark:text-white"
                :to="{ name: 'u-username', params: { username: admin.username } }"
              >
                <AvatarComponent
                  class="mr-2 h-6 w-6"
                  :src="admin.profilePicURL ?? ''"
                  :text="admin.username"
                />
                <span class="flex flex-row items-center gap-1">
                  <span
                    v-if="!admin.displayName"
                    class="font-bold"
                    >{{ admin.username }}</span
                  >
                  <span
                    v-else
                    class="font-bold"
                    >{{ admin.displayName }}</span
                  >
                  <span
                    v-if="admin.displayName"
                    class="text-gray-500 dark:text-gray-300"
                    >{{ `(u/${admin.username})` }}</span
                  >
                </span>
              </nuxt-link>
            </div>
          </div>

          <p
            v-else
            class="my-3 mb-6 text-sm dark:text-gray-400"
          >
            This forum does not have any admins.
          </p>
        </div>
      </div>
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
