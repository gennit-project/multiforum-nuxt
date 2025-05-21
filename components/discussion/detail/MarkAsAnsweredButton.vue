<script lang="ts" setup>
  import { defineProps } from "vue";
  import CheckCircleIcon from "@/components/icons/CheckCircleIcon.vue";
  import { useMutation } from "@vue/apollo-composable";
  import { MARK_AS_ANSWERED, MARK_AS_UNANSWERED } from "@/graphQLData/discussion/mutations";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import ErrorBanner from "@/components/ErrorBanner.vue";

  const props = defineProps({
    answered: {
      type: Boolean,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
    },
    discussionId: {
      type: String,
      required: true,
    },
  });

  const emit = defineEmits(["mark-unanswered"]);

  const {
    mutate: markAsAnswered,
    loading: markAsAnsweredLoading,
    error: markAsAnsweredError,
  } = useMutation(MARK_AS_ANSWERED);

  const {
    mutate: markAsUnanswered,
    loading: markAsUnansweredLoading,
    error: markAsUnansweredError,
  } = useMutation(MARK_AS_UNANSWERED);

  const clickMarkAsAnswered = async (event: any) => {
    event.preventDefault();
    await markAsAnswered({
      channelId: props.channelId,
      discussionId: props.discussionId,
    });
  };

  const clickMarkAsUnanswered = async (event: any) => {
    event.preventDefault();
    await markAsUnanswered({
      channelId: props.channelId,
      discussionId: props.discussionId,
    });
    emit("mark-unanswered");
  };
</script>

<template>
  <div>
    <button
      v-if="!answered"
      class="align-items flex gap-1 rounded-full border px-2 py-1 text-xs hover:bg-gray-200 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
      @click="clickMarkAsAnswered"
    >
      <LoadingSpinner
        v-if="markAsAnsweredLoading"
        aria-label="Loading"
        class="h-4 w-4"
      />
      <CheckCircleIcon
        v-else
        class="h-4 w-4"
      />
      Mark as Answered
    </button>
    <button
      v-else
      class="align-items flex gap-1 rounded-full border px-2 py-1 text-xs hover:bg-gray-200 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
      @click="clickMarkAsUnanswered"
    >
      <LoadingSpinner
        v-if="markAsUnansweredLoading"
        aria-label="Loading"
        class="h-4 w-4"
      />
      <CheckCircleIcon class="h-4 w-4" /> Mark as Unanswered
    </button>
    <ErrorBanner
      v-if="markAsAnsweredError || markAsUnansweredError"
      :text="markAsAnsweredError?.message || markAsUnansweredError?.message || 'An error occurred.'"
    />
  </div>
</template>
