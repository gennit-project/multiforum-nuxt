<script lang="ts">
import { defineComponent, ref, PropType, computed } from "vue";
import { GET_LOCAL_USERNAME, GET_USER } from "@/graphQLData/user/queries";
import { useQuery } from "@vue/apollo-composable";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import TextEditor from "@/components/forms/TextEditor.vue";
import CancelButton from "@/components/CancelButton.vue";
import SaveButton from "@/components/SaveButton.vue";
import { CreateEditCommentFormValues } from "@/types/Comment";
import { ApolloError } from "@apollo/client/errors";
import ErrorBanner from "../ErrorBanner.vue";

export default defineComponent({
  components: {
    CancelButton,
    ErrorBanner,
    RequireAuth,
    SaveButton,
    TextEditor,
  },
  props: {
    createCommentError: {
      type: Object as PropType<ApolloError | null>,
      required: false,
      default: null,
    },
    createCommentLoading: {
      type: Boolean,
      required: true,
    },
    createFormValues: {
      type: Object as PropType<CreateEditCommentFormValues>,
      required: true,
    },
    commentEditorOpen: {
      type: Boolean,
      required: true,
    },
  },
  setup() {
    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

    const { result: getUserResult } = useQuery(GET_USER, {
      username: localUsernameResult.value?.username || "",
    });

    const username = computed(() => {
      let username = localUsernameResult.value?.username;
      if (username) {
        return username;
      }
      return "";
    });

    const profilePicURL = computed(() => {
      let profilePicURL = getUserResult.value?.users[0]?.profilePicURL;
      if (profilePicURL) {
        return profilePicURL;
      }
      return "";
    });

    const writeReplyStyle =
      "block h-10 w-full rounded-lg border-gray-300 dark:bg-gray-700 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-800 dark:placeholder-gray-400 dark:focus:ring-gray-9";

    return {
      profilePicURL,
      showEditorInCommentSection: ref(false),
      showCreateCommentModal: ref(false),
      showRootCommentEditor: ref(false),
      username,
      writeReplyStyle,
    };
  },
});
</script>
<template>
  <div class="ml-1 flex w-full flex-col space-x-2 px-1">
    <ErrorBanner
      v-if="createCommentError"
      :text="createCommentError && createCommentError.message"
    />
    <div class="flex gap-2">
      <Avatar
        v-if="username"
        class="h-5 w-5"
        :text="username"
        :src="profilePicURL"
        :is-small="true"
      />

      <RequireAuth
        v-if="!commentEditorOpen"
        class="w-full"
      >
        <template #has-auth>
          <textarea
            id="addComment"
            data-testid="addComment"
            name="addcomment"
            rows="1"
            placeholder="Write a comment"
            :class="writeReplyStyle"
            @click="$emit('openCommentEditor')"
          />
        </template>
        <template #does-not-have-auth>
          <textarea
            id="addCommentLoginPrompt"
            name="addcomment"
            rows="1"
            placeholder="Write a comment"
            :class="writeReplyStyle"
          />
        </template>
      </RequireAuth>
      <div
        v-else
        class="flex w-full flex-col"
      >
        <TextEditor
          :test-id="'texteditor-textarea'"
          :placeholder="'Please be kind'"
          @update="$emit('handleUpdateComment', $event)"
        />
        <div class="mt-3 flex justify-start">
          <CancelButton @click="$emit('closeCommentEditor')" />
          <SaveButton
            data-testid="createCommentButton"
            :disabled="createFormValues.text.length === 0"
            :loading="createCommentLoading && !createCommentError"
            @click.prevent="$emit('handleCreateComment')"
          />
        </div>
      </div>
    </div>
  </div>
</template>
