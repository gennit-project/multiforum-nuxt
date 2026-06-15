<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue';
import { CREATE_SCRATCHPAD_ENTRY } from '@/graphQLData/scratchpad/mutations';
import ErrorBanner from '@/components/ErrorBanner.vue';

const MAX_TEXT_LENGTH = 500;

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  recipientUsername: {
    type: String,
    required: true,
  },
  sourceType: {
    type: String as () => 'comment' | 'discussion',
    required: true,
  },
  sourceId: {
    type: String,
    required: true,
  },
  sourceChannelUniqueName: {
    type: String,
    default: '',
  },
  forumName: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close', 'success']);

const text = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const placeholderText = computed(() => {
  if (props.forumName) {
    return `Thanks for your ${props.sourceType === 'comment' ? 'comment' : 'post'} in ${props.forumName}!`;
  }
  return `Thanks for your ${props.sourceType === 'comment' ? 'comment' : 'post'}!`;
});

const charactersRemaining = computed(() => MAX_TEXT_LENGTH - text.value.length);
const isOverLimit = computed(() => charactersRemaining.value < 0);
const isValid = computed(() => text.value.trim().length > 0 && !isOverLimit.value);

// Reset text and focus textarea when modal opens
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      text.value = '';
      nextTick(() => {
        textareaRef.value?.focus();
      });
    }
  }
);

const {
  mutate: createScratchpadEntry,
  loading,
  error,
  onDone,
} = useMutation(CREATE_SCRATCHPAD_ENTRY, {
  update: (cache, { data }) => {
    if (data?.createScratchpadEntry?.superUpvotedByUsers) {
      const typename = props.sourceType === 'comment' ? 'Comment' : 'DiscussionChannel';
      cache.modify({
        id: cache.identify({ __typename: typename, id: props.sourceId }),
        fields: {
          SuperUpvotedByUsers: () => data.createScratchpadEntry.superUpvotedByUsers,
        },
      });
    }
  },
});

onDone(() => {
  emit('success');
  emit('close');
});

const handleSubmit = () => {
  if (!isValid.value || loading.value) return;

  createScratchpadEntry({
    recipientUsername: props.recipientUsername,
    text: text.value.trim(),
    sourceType: props.sourceType,
    sourceId: props.sourceId,
    sourceChannelUniqueName: props.sourceChannelUniqueName || null,
  });
};
</script>

<template>
  <client-only>
    <TransitionRoot as="template" :show="show">
      <Dialog as="div" class="relative z-50" @close="emit('close')">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div
            class="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75 transition-opacity"
          />
        </TransitionChild>

        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div
            class="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0"
          >
            <TransitionChild
              as="template"
              enter="ease-out duration-200"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
              >
                <div>
                  <!-- Rainbow star icon -->
                  <div
                    class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
                  >
                    <i
                      class="fa-solid fa-star text-white text-xl"
                      aria-hidden="true"
                    />
                  </div>
                  <div class="mt-3 sm:mt-5">
                    <DialogTitle
                      as="h3"
                      class="text-center text-lg font-semibold leading-6 text-gray-900 dark:text-white"
                    >
                      Super Upvote
                    </DialogTitle>
                    <p
                      class="mt-2 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Write a thank-you note to
                      <NuxtLink
                        :to="`/u/${recipientUsername}`"
                        class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                      >
                        @{{ recipientUsername }}
                      </NuxtLink>
                    </p>

                    <ErrorBanner v-if="error" :text="error.message" class="mt-4" />

                    <div class="mt-4">
                      <textarea
                        ref="textareaRef"
                        v-model="text"
                        :placeholder="placeholderText"
                        rows="4"
                        :maxlength="MAX_TEXT_LENGTH + 50"
                        class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                        :class="{
                          'border-red-500 focus:border-red-500 focus:ring-red-500':
                            isOverLimit,
                        }"
                      />
                      <div
                        class="mt-1 flex justify-end text-sm"
                        :class="{
                          'text-gray-500 dark:text-gray-400': !isOverLimit,
                          'text-red-500': isOverLimit,
                        }"
                      >
                        {{ charactersRemaining }} characters remaining
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    type="button"
                    class="flex-1 inline-flex justify-center rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    @click="emit('close')"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    :disabled="!isValid || loading"
                    class="flex-1 inline-flex justify-center items-center gap-2 rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:cursor-not-allowed"
                    :class="{
                      'bg-purple-500 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white':
                        isValid && !loading,
                      'bg-gray-200 text-gray-400 dark:bg-gray-600 dark:text-gray-400': !isValid || loading,
                    }"
                    @click="handleSubmit"
                  >
                    <i
                      v-if="loading"
                      class="fa-solid fa-spinner fa-spin"
                      aria-hidden="true"
                    />
                    <i
                      v-else
                      class="fa-solid fa-star"
                      aria-hidden="true"
                    />
                    {{ loading ? 'Sending...' : 'Send & Super Upvote' }}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </client-only>
</template>
