<script lang="ts" setup>
  import { computed, ref } from "vue";
  import type { PropType } from "vue";
  import { useRoute } from "nuxt/app";
  import type { Discussion, DiscussionChannel, Tag } from "@/__generated__/graphql";
  import TagComponent from "@/components/TagComponent.vue";
  import HighlightedSearchTerms from "@/components/HighlightedSearchTerms.vue";
  import MarkdownPreview from "@/components/MarkdownPreview.vue";
  import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
  import UsernameWithTooltip from "@/components/UsernameWithTooltip.vue";
  import AvatarComponent from "@/components/AvatarComponent.vue";
  import MenuButton from "@/components/MenuButton.vue";
  import { relativeTime } from "@/utils";
  import DiscussionAlbum from "@/components/discussion/detail/DiscussionAlbum.vue";

  const props = defineProps({
    discussion: {
      type: Object as PropType<Discussion>,
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
      type: Array,
      default: () => [],
    },
    selectedChannels: {
      type: Array,
      default: () => [],
    },
    defaultExpanded: {
      type: Boolean,
      default: false,
    },
  });

  defineEmits(["filterByTag"]);

  const route = useRoute();

  const forumId = computed(() => {
    if (!props.discussion) return "";
    return props.discussion.DiscussionChannels[0].channelUniqueName;
  });

  // UI state is now handled via props

  // Local state for this specific discussion item's expanded/collapsed state
  // Initial value is based on the defaultExpanded prop
  const isExpanded = ref(props.defaultExpanded);

  const commentCount = computed(() => {
    let count = 0;
    if (props.discussion) {
      props.discussion.DiscussionChannels.forEach((dc: DiscussionChannel) => {
        count += dc.CommentsAggregate?.count || 0;
      });
    }
    return count;
  });

  const submittedToMultipleChannels = computed(
    () => props.discussion?.DiscussionChannels?.length > 1
  );

  const channelCount = computed(() => props.discussion?.DiscussionChannels.length || 0);

  const discussionDetailOptions = computed(() => {
    if (!props.discussion) return [];
    return props.discussion.DiscussionChannels.map((dc) => {
      const commentCount = dc.CommentsAggregate?.count || 0;
      const discussionDetailLink = `/forums/${dc.channelUniqueName}/discussions/${props.discussion?.id}`;
      return {
        label: `${commentCount} ${commentCount === 1 ? "comment" : "comments"} in ${dc.channelUniqueName}`,
        value: discussionDetailLink,
        event: "",
      };
    }).sort((a, b) => b.label.localeCompare(a.label));
  });

  const authorIsAdmin = computed(() => {
    const serverRoles = props.discussion?.Author?.ServerRoles;
    return serverRoles?.[0]?.showAdminTag || false;
  });

  const getDetailLink = () => {
    if (!props.discussion) {
      return {
        name: "forums-forumId-discussions",
        params: {
          forumId: forumId.value,
        },
      };
    }
    return {
      name: "forums-forumId-discussions-discussionId",
      params: {
        forumId: forumId.value,
        discussionId: props.discussion.id,
      },
    };
  };

  const discussionIdInParams = computed(() =>
    typeof route.params.discussionId === "string" ? route.params.discussionId : ""
  );
  const discussionId = computed(() => props.discussion?.id || "");
  const title = computed(() => props.discussion?.title || "[Deleted]");
  const tags = computed(() => props.discussion?.Tags.map((tag: Tag) => tag.text) || []);
  const authorUsername = computed(() => props.discussion?.Author?.username || "Deleted");
  const relative = computed(() =>
    props.discussion ? relativeTime(props.discussion.createdAt) : ""
  );
</script>

<template>
  <li
    class="list-none px-4 pb-2 pt-2"
    :class="{
      'bg-gray-100 dark:bg-gray-700': discussionIdInParams === discussionId,
    }"
  >
    <div class="flex w-full justify-between">
      <div class="w-full">
        <nuxt-link
          v-if="discussion"
          class="-ml-0.5 mb-1 flex items-center gap-2 text-xs dark:text-white"
          :to="getDetailLink()"
        >
          <div class="flex items-center text-orange-700 dark:text-white">
            <AvatarComponent
              class="mr-1 h-6 w-6"
              :is-square="true"
              :text="discussion.DiscussionChannels[0].channelUniqueName || ''"
            />
            <span>{{ discussion.DiscussionChannels[0].channelUniqueName || "" }}</span>
          </div>
        </nuxt-link>
        <div class="flex gap-2">
          <div class="flex-1">
            <nuxt-link
              v-if="discussion"
              :to="getDetailLink(discussion.DiscussionChannels[0].channelUniqueName)"
            >
              <span
                class="cursor-pointer text-sm text-gray-900 hover:text-gray-500 dark:text-gray-100 dark:hover:text-gray-300"
                :class="discussionIdInParams === discussionId ? 'text-black dark:text-white' : ''"
              >
                <HighlightedSearchTerms
                  :search-input="searchInput"
                  :text="title"
                />
              </span>
            </nuxt-link>
            <div class="pt-1 text-xs text-gray-500 no-underline dark:text-gray-300">
              <!-- Use div instead of p to avoid invalid HTML (button inside p) -->
              <div class="whitespace-normal">
                <!-- Comment count -->
                <nuxt-link
                  v-if="discussion && !submittedToMultipleChannels"
                  class="inline"
                  :to="getDetailLink(discussion.DiscussionChannels[0].channelUniqueName)"
                >
                  {{ commentCount }} {{ commentCount === 1 ? "comment" : "comments" }}
                </nuxt-link>

                <MenuButton
                  v-else-if="discussion"
                  class="inline"
                  :items="discussionDetailOptions"
                >
                  <span class="inline cursor-pointer">
                    <i class="fa-regular fa-comment mr-1 h-4 w-4" />
                    {{ commentCount }} {{ commentCount === 1 ? "comment" : "comments" }} in
                    {{ channelCount }} {{ channelCount === 1 ? "forum" : "forums" }}
                    <ChevronDownIcon
                      aria-hidden="true"
                      class="ml-1 inline h-4 w-4"
                    />
                  </span>
                </MenuButton>

                <!-- Dot separator and posted info all inline -->
                <span class="mx-1 inline">•</span>
                Posted {{ relative }} by
                <UsernameWithTooltip
                  v-if="authorUsername"
                  :account-created="discussion?.Author?.createdAt"
                  :comment-karma="discussion?.Author?.commentKarma ?? 0"
                  :discussion-karma="discussion?.Author?.discussionKarma ?? 0"
                  :display-name="discussion?.Author?.displayName || ''"
                  :is-admin="authorIsAdmin"
                  :src="discussion?.Author?.profilePicURL || ''"
                  :username="authorUsername"
                />
              </div>
            </div>
            <button
              v-if="discussion && (discussion.body || discussion.Album)"
              class="text-xs text-gray-600 hover:underline dark:text-gray-300"
              @click="isExpanded = !isExpanded"
            >
              <template v-if="!isExpanded">
                <i
                  class="fa-solid fa-expand text-md mr-1 text-gray-600 hover:underline dark:text-gray-300"
                />
                Expand
              </template>
              <template v-else>
                <i
                  class="fa-solid fa-x mr-1 text-xs text-gray-600 hover:underline dark:text-gray-300"
                />
                Collapse
              </template>
            </button>
            <div
              v-if="discussion && (discussion.body || discussion.Album) && isExpanded"
              class="my-2 w-full border-l-2 border-gray-300 bg-gray-100 pt-2 dark:bg-black"
            >
              <MarkdownPreview
                class="ml-2 pb-2"
                :disable-gallery="false"
                :text="discussion.body"
                :word-limit="50"
              />
              <div
                v-if="discussion.Album"
                class="my-4 overflow-x-auto bg-black"
              >
                <DiscussionAlbum
                  :album="discussion.Album"
                  :carousel-format="true"
                  :discussion-author="authorUsername"
                  :discussion-id="discussion.id"
                  :show-edit-album="false"
                />
              </div>
            </div>
            <div class="mt-1 flex space-x-1 text-sm font-medium text-gray-600 hover:no-underline">
              <TagComponent
                v-for="tag in tags"
                :key="tag"
                :active="selectedTags.includes(tag)"
                class="my-1"
                :tag="tag"
                @click="$emit('filterByTag', tag)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </li>
</template>

<style scoped>
  .highlighted {
    background-color: #f9f95d;
  }
</style>
