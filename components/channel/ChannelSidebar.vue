<script lang="ts">
import { defineComponent, computed, PropType } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { useRoute, useRouter } from "vue-router";
import Tag from "@/components/Tag.vue";
import "md-editor-v3/lib/style.css";
import { useDisplay } from "vuetify";
import gql from "graphql-tag";
import UsernameWithTooltip from "../UsernameWithTooltip.vue";
import { Channel } from "@/__generated__/graphql";
import ChannelRules from "./Rules.vue";
import SidebarEventList from "./SidebarEventList.vue";
import MarkdownPreview from '@/components/MarkdownPreview.vue'

export default defineComponent({
  name: "ChannelSidebar",
  components: {
    Tag,
    ChannelRules,
    MarkdownPreview,
    SidebarEventList,
    UsernameWithTooltip,
  },
  props: {
    channel: {
      type: Object as PropType<Channel>,
      required: true,
    },
    useScrollbar: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const route = useRoute();
    const router = useRouter();
    const eventChannelsAggregate = computed(() => {
      if (props.channel) {
        return props.channel?.EventChannelsAggregate?.count ?? 0;
      }
      return 0;
    });

    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });

    const tags = computed(() => {
      if (props.channel) {
        return props.channel.Tags;
      }
      return [];
    });

    const admins = computed(() => {
      if (props.channel) {
        return props.channel.Admins;
      }
      return [];
    });

    const ownerList = computed(() => {
      // Used to determine whether the logged in
      // user should be able to see the buttons for
      // admin actions
      return admins.value.map((adminData: any) => adminData.username);
    });

    const { mdAndDown } = useDisplay();
    const GET_THEME = gql`
      query getTheme {
        theme @client
      }
    `;

    const {
      result: themeResult,
      loading: themeLoading,
      error: themeError,
    } = useQuery(GET_THEME);

    const theme = computed(() => {
      if (themeLoading.value || themeError.value) {
        return "";
      }
      return themeResult.value.theme;
    });

    const channelRules = computed(() => {
      if (props.channel) {
        return props.channel.rules;
      }
      return "";
    });

    return {
      admins,
      channelId,
      channelRules,
      eventChannelsAggregate,
      mdAndDown,
      ownerList,
      router,
      tags,
      theme,
    };
  },

  methods: {
    filterChannelsByTag(tag: string) {
      this.router.push({
        name: "FilterChannelsByTag",
        params: {
          tag,
        },
      });
    },
  },
});
</script>

<template>
  <div
    :class="[useScrollbar ? 'max-h-screen overflow-auto' : '']"
    class="bg-white pb-8 pt-4 dark:bg-gray-800"
  >
    <div
      v-if="channelId && channel"
      class="items-center gap-2"
    />
    <div>
      <h2 class="mt-2 px-6 text-xl font-bold">
        Forum Intro
      </h2>
      <MarkdownPreview
        v-if="channel?.description"
        :text="channel?.description"
        :word-limit="1000"
        class="ml-2"
      />
      <p
        v-else
        class="p-6 text-xs"
      >
        Welcome to {{ channelId }}!
      </p>
    </div>
    <slot />

    <div class="w-full px-6">
      <div v-if="channel">
        <div class="mt-6 flex w-full flex-col gap-6">
          <div
            v-if="channelRules && channelRules !== '[]'"
            :key="channelRules"
          >
            <span
              class="my-2 mb-2 text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
            >
              Rules
            </span>
            <ChannelRules
              :key="channelRules"
              :rules="channelRules"
            />
          </div>
          <SidebarEventList
            :event-channels-aggregate="eventChannelsAggregate"
          />
          <div v-if="channel.Tags.length > 0">
            <div class="flex justify-between border-gray-300">
              <span
                class="my-2 mb-2 text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
              >
                Tags
              </span>
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
          <div class="flex justify-between">
            <span
              class="my-2 text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
            >
              Admins
            </span>
          </div>
          <div
            v-if="channel.Admins.length > 0"
            class="flex-col text-sm font-bold"
          >
            <div
              v-for="admin in channel.Admins"
              :key="admin.username"
            >
              <router-link
                :key="admin.username"
                :to="`/u/${admin.username}`"
                class="flex items-center"
              >
                <Avatar
                  :text="admin.username"
                  :src="admin.profilePicURL ?? ''"
                  class="mr-2 h-6 w-6"
                />
                <UsernameWithTooltip
                  v-if="admin.username"
                  :username="admin.username"
                  :src="admin.profilePicURL ?? ''"
                  :display-name="admin.displayName ?? ''"
                  :comment-karma="admin.commentKarma ?? 0"
                  :discussion-karma="admin.discussionKarma ?? 0"
                  :account-created="admin.createdAt ?? ''"
                />
              </router-link>
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
    background-color: blue;
  }
}
</style>
