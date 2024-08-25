<script lang="ts">
import { defineComponent, PropType, computed } from "vue";
import { Discussion as DiscussionData } from "@/__generated__/graphql";
import { useRoute } from "vue-router";
import Tag from "@/components/Tag.vue";
import HighlightedSearchTerms from "@/components/HighlightedSearchTerms.vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import { router } from "@/router";
import MenuButton from "@/components/buttons/MenuButton.vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import UsernameWithTooltip from "@/components/UsernameWithTooltip.vue";

export default defineComponent({
  components: {
    MenuButton,
    HighlightedSearchTerms,
    MarkdownPreview,
    Tag,
    ChevronDownIcon,
    UsernameWithTooltip,
  },
  inheritAttrs: false,
  props: {
    discussion: {
      type: Object as PropType<DiscussionData | null>,
      required: false,
      default: null,
    },
    score: {
      type: Number,
      default: 0,
    },
    searchInput: {
      type: String,
      default: "",
    },
    selectedTags: {
      type: Array as PropType<Array<string>>,
      default: () => {
        return [];
      },
    },
    selectedChannels: {
      type: Array as PropType<Array<string>>,
      default: () => {
        return [];
      },
    },
  },
  setup(props) {
    const route = useRoute();

    const commentCount = computed(() => {
      let count = 0;
      if (props.discussion) {
        const discussionChannels = props.discussion.DiscussionChannels;
        if (discussionChannels) {
          discussionChannels.forEach((dc) => {
            count += dc.CommentsAggregate?.count || 0;
          });
        }
      }
      return count;
    });

    const submittedToMultipleChannels = computed(() => {
      if (!props.discussion) {
        return false;
      }
      return props.discussion.DiscussionChannels.length > 1;
    });

    const channelCount = computed(() => {
      if (!props.discussion) {
        return 0;
      }
      return props.discussion.DiscussionChannels.length;
    });

    const discussionDetailOptions = computed(() => {
      if (!props.discussion) {
        return [];
      }
      return props.discussion.DiscussionChannels.map((dc) => {
        const commentCount = dc.CommentsAggregate?.count || 0;
        return {
          label: `${commentCount} ${
            commentCount === 1 ? "comment" : "comments"
          } in ${dc.channelUniqueName}`,
          value: router.resolve({
            name: "DiscussionDetail",
            params: {
              discussionId: props.discussion?.id,
              channelId: dc.channelUniqueName,
            },
          }).href,
          event: "",
        };
      }).sort((a, b) => {
        return b.label.localeCompare(a.label);
      });
    });

    const authorIsAdmin = computed(() => {
      if (!props.discussion) {
        return false;
      }
      const serverRoles = props.discussion.Author?.ServerRoles;
      if (!serverRoles) {
        return false;
      }
      if (serverRoles.length === 0) {
        return false;
      }
      const serverRole = serverRoles[0];
      if (serverRole.showAdminTag) {
        return true;
      }
      return false;
    
    })

    return {
      authorIsAdmin,
      channelCount,
      commentCount,
      discussionDetailOptions,
      route,
      submittedToMultipleChannels,
    };
  },

  data(props) {
    const route = useRoute();

    const discussionIdInParams = computed(() => {
      if (typeof route.params.discussionId === "string") {
        return route.params.discussionId;
      }
      return "";
    });

    return {
      discussionIdInParams,
      discussionId: props.discussion?.id || "",
      previewIsOpen: false,
      title: props.discussion?.title || "[Deleted]",
      body: props.discussion?.body || "[Deleted]",
      createdAt: props.discussion?.createdAt || "",
      relativeTime: props.discussion
        ? relativeTime(props.discussion?.createdAt)
        : "",
      authorUsername: props.discussion?.Author
        ? props.discussion.Author.username
        : "Deleted",
      tags: props.discussion
        ? props.discussion.Tags.map((tag) => {
            return tag.text;
          })
        : [],
    };
  },
  methods: {
    getDetailLink(channelId: string) {
      if (!this.discussion) {
        return "";
      }
      return router.resolve({
        name: "DiscussionDetail",
        params: {
          discussionId: this.discussion.id,
          channelId,
        },
      }).href;
    },
  },
});
</script>

<template>
  <li
    class="relative flex gap-3 space-x-2 md:rounded-lg bg-white border dark:border-gray-700 px-2 md:px-6 py-2 md:py-4 dark:bg-gray-800"
  >
    <div class="flex w-full justify-between">
      <div class="w-full">
        <div class="flex border-b pb-2 dark:border-b-gray-600">
          <div
            class="mr-2 flex items-center justify-center flex-start w-6 md:w-10 h-6 md:h-10 rounded-md bg-gray-100 p-1 text-sm md:text-xl dark:bg-gray-600"
          >
            💬
          </div>
          <div>
            <router-link
              v-if="discussion"
              :to="
                getDetailLink(
                  discussion.DiscussionChannels[0].channelUniqueName,
                )
              "
            >
              <span
                :class="
                  discussionIdInParams === discussionId ? 'text-black' : ''
                "
                class="cursor-pointer hover:text-gray-500 dark:text-gray-100 dark:hover:text-gray-300"
              >
                <HighlightedSearchTerms
                  :text="title"
                  :search-input="searchInput"
                  :classes="'font-medium text-sm md:text-md lg:text-lg'"
                />
              </span>
            </router-link>
            <div
              class="font-medium flex flex-wrap items-center gap-1 text-xs text-gray-600 no-underline dark:text-gray-300"
            >
              <span>{{ `Posted ${relativeTime} by ` }}
                <UsernameWithTooltip
                  v-if="authorUsername"
                  :is-admin="authorIsAdmin"
                  :username="authorUsername"
                  :src="discussion?.Author?.profilePicURL || ''"
                  :display-name="discussion?.Author?.displayName || ''"
                  :comment-karma="discussion?.Author?.commentKarma ?? 0"
                  :discussion-karma="discussion?.Author?.discussionKarma ?? 0"
                  :account-created="discussion?.Author?.createdAt"
                />
              </span>
            </div>
          </div>
        </div>
        <div
          v-if="discussion && discussion.body"
          class="border-l-2 border-gray-300"
        >
          <MarkdownPreview
            :text="discussion.body"
            :word-limit="50"
            :disable-gallery="false"
            class="-ml-2"
          />
        </div>
        <div
          class="font-medium mt-1 flex space-x-1 text-sm text-gray-600 hover:no-underline"
        >
          <Tag
            v-for="tag in tags"
            :key="tag"
            class="my-1"
            :active="selectedTags.includes(tag)"
            :tag="tag"
            @click="$emit('filterByTag', tag)"
          />
        </div>

        <router-link
          v-if="discussion && !submittedToMultipleChannels"
          :to="
            getDetailLink(discussion.DiscussionChannels[0].channelUniqueName)
          "
          class="mt-1 flex cursor-pointer items-center justify-start gap-1 text-xs text-gray-400 dark:text-gray-100"
        >
          <span class="font-bold underline">{{
            `View ${commentCount} ${
              commentCount === 1 ? "comment" : "comments"
            } in c/${discussion.DiscussionChannels[0].channelUniqueName}`
          }}</span>
        </router-link>

        <MenuButton
          v-else-if="discussion"
          :items="discussionDetailOptions"
        >
          <button
            class="-ml-1 flex items-center rounded-md bg-gray-100 px-4 pb-2 pt-2 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500"
          >
            <i class="fa-regular fa-comment mr-2 h-4 w-4" />
            {{
              `${commentCount} ${
                commentCount === 1 ? "comment" : "comments"
              } in ${channelCount} ${channelCount === 1 ? "forum" : "forums"}`
            }}
            <ChevronDownIcon
              class="-mr-1 ml-2 h-4 w-4"
              aria-hidden="true"
            />
          </button>
        </MenuButton>
      </div>
    </div>
  </li>
</template>
<style>
.highlighted {
  background-color: #f9f95d;
}
</style>
