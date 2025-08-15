<script setup lang="ts">
import { computed, ref } from "vue";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import type { Issue } from "@/__generated__/graphql";
import EyeIcon from "../icons/EyeIcon.vue";
import TrashIcon from "../icons/TrashIcon.vue";
import WarningModal from "@/components/WarningModal.vue";
import { useRoute, useRouter } from "nuxt/app";

const props = defineProps({
  issue: {
    type: Object as () => Issue,
    required: true,
  },
  discussionId: {
    type: String,
    required: false,
    default: "",
  },
  eventId: {
    type: String,
    required: false,
    default: "",
  },
  commentId: {
    type: String,
    required: false,
    default: "",
  },
  channelUniqueName: {
    type: String,
    required: false,
    default: "",
  },
  isCurrentUserOriginalPoster: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const emit = defineEmits([
  "delete-discussion",
  "delete-event", 
  "delete-comment"
]);

const route = useRoute();
const router = useRouter();
const showDeleteConfirmModal = ref(false);

// Determine what type of content this is
const contentType = computed(() => {
  if (props.discussionId) return "discussion";
  if (props.eventId) return "event";
  if (props.commentId) return "comment";
  return "post";
});

// Generate edit route based on content type
const editRoute = computed(() => {
  const forumId = props.channelUniqueName;
  
  if (props.discussionId) {
    return {
      name: 'forums-forumId-discussions-edit-discussionId',
      params: { forumId, discussionId: props.discussionId }
    };
  }
  if (props.eventId) {
    return {
      name: 'forums-forumId-events-edit-eventId', 
      params: { forumId, eventId: props.eventId }
    };
  }
  if (props.commentId) {
    // For comments, navigate to the comment permalink where they can edit inline
    return {
      name: 'forums-forumId-issues-issueId-comments-commentId',
      params: { forumId, issueId: props.issue.id, commentId: props.commentId }
    };
  }
  return null;
});

const handleEditPost = () => {
  if (editRoute.value) {
    const url = router.resolve(editRoute.value).href;
    window.open(url, '_blank');
  }
};

const handleDeletePost = () => {
  showDeleteConfirmModal.value = true;
};

const confirmDelete = () => {
  if (props.discussionId) {
    emit("delete-discussion", props.discussionId);
  } else if (props.eventId) {
    emit("delete-event", props.eventId);
  } else if (props.commentId) {
    emit("delete-comment", props.commentId);
  }
  showDeleteConfirmModal.value = false;
};

const cancelDelete = () => {
  showDeleteConfirmModal.value = false;
};
</script>

<template>
  <RequireAuth>
    <template #has-auth>
      <div class="flex pt-12 gap-x-2" data-test="op-actions">
        <div
          class="flex justify-center items-center w-10 h-10 rounded-lg"
          :class="[
            isCurrentUserOriginalPoster
              ? 'bg-blue-600'
              : 'bg-gray-300 dark:bg-gray-700',
          ]"
        >
          <div class="">
            <EyeIcon class="h-6 w-6 text-white" />
          </div>
        </div>
        <div
          class="flex-1 flex-col space-y-4 px-4 py-4 border rounded-lg"
          :class="[
            isCurrentUserOriginalPoster
              ? 'border-blue-500'
              : 'border-gray-300 dark:border-gray-700',
          ]"
        >
          <h1
            v-if="isCurrentUserOriginalPoster"
            class="text-xl font-bold text-blue-500 border-b border-gray-300 dark:border-gray-600 pb-2"
          >
            Original Poster Actions
          </h1>
          <h1
            v-else
            class="text-xl font-bold text-gray-500 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600 pb-2"
          >
            Original Poster Actions
          </h1>
          <p v-if="!isCurrentUserOriginalPoster" class="text-gray-600 dark:text-gray-400">
            {{ "Original poster actions are only available to the author of the post." }}
          </p>
          
          <RequireAuth :full-width="true">
            <template #has-auth>
              <div class="flex flex-col space-y-4 mt-4">
                <!-- Edit Post Button -->
                <button
                  v-if="editRoute"
                  :disabled="!isCurrentUserOriginalPoster"
                  class="w-full py-2 px-4 rounded flex items-center gap-2 justify-center text-white"
                  :class="[
                    isCurrentUserOriginalPoster
                      ? 'bg-blue-600 hover:bg-blue-500 cursor-pointer'
                      : 'bg-gray-400 cursor-not-allowed',
                  ]"
                  @click="handleEditPost"
                >
                  <i class="fa fa-external-link h-4 w-4" aria-hidden="true"></i>
                  Edit {{ contentType === 'discussion' ? 'Discussion' : contentType === 'event' ? 'Event' : 'Comment' }}
                </button>
                <p 
                  v-if="editRoute && isCurrentUserOriginalPoster"
                  class="text-xs text-gray-600 dark:text-gray-400 -mt-2"
                >
                  {{ contentType === 'comment' 
                    ? 'Opens the comment permalink where you can edit inline'
                    : 'Opens a new tab to edit the post and/or submit it to a different forum'
                  }}
                </p>

                <!-- Delete Post Button -->
                <button
                  :disabled="!isCurrentUserOriginalPoster"
                  class="w-full py-2 px-4 rounded flex items-center gap-2 justify-center text-white"
                  :class="[
                    isCurrentUserOriginalPoster
                      ? 'bg-red-600 hover:bg-red-500 cursor-pointer'
                      : 'bg-gray-400 cursor-not-allowed',
                  ]"
                  @click="handleDeletePost"
                >
                  <TrashIcon class="h-4 w-4" />
                  Delete {{ contentType === 'discussion' ? 'Discussion' : contentType === 'event' ? 'Event' : 'Comment' }}
                </button>
              </div>
            </template>
            <template #does-not-have-auth>
              <div class="flex flex-col space-y-4 mt-4">
                <p class="text-gray-600 dark:text-gray-400">
                  Please log in to access original poster features
                </p>
              </div>
            </template>
          </RequireAuth>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <WarningModal
        :open="showDeleteConfirmModal"
        :title="`Delete ${contentType === 'discussion' ? 'Discussion' : contentType === 'event' ? 'Event' : 'Comment'}`"
        :body="`Are you sure you want to delete this ${contentType}? This action cannot be undone.`"
        @close="cancelDelete"
        @primary-button-click="confirmDelete"
      />
    </template>
    <template #does-not-have-auth>
      <div class="flex pt-12 gap-x-2">
        <div class="flex justify-center items-center w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-lg">
          <div class="">
            <EyeIcon class="h-6 w-6 text-white" />
          </div>
        </div>
        <div class="flex-1 flex-col space-y-4 px-4 py-4 border border-gray-300 dark:border-gray-700 rounded-lg">
          <h1 class="text-xl font-bold text-gray-500 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600 pb-2">
            Original Poster Actions
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Please log in to access original poster features
          </p>
        </div>
      </div>
    </template>
  </RequireAuth>
</template>