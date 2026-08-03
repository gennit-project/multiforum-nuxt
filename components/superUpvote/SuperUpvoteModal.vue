<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import type { Reference, StoreObject } from '@apollo/client/core';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue';
import { CREATE_SCRATCHPAD_ENTRY } from '@/graphQLData/scratchpad/mutations';
import ErrorBanner from '@/components/ErrorBanner.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import StarIcon from '@/components/icons/StarIcon.vue';
import { useUsername } from '@/composables/useAuthState';

const usernameVar = useUsername();

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
const isValid = computed(
  () => text.value.trim().length > 0 && !isOverLimit.value
);

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
    if (!data?.createScratchpadEntry) return;
    const typename =
      props.sourceType === 'comment' ? 'Comment' : 'DiscussionChannel';
    const cacheId = cache.identify({
      __typename: typename,
      id: props.sourceId,
    });
    if (!cacheId) return;
    const me = usernameVar.value;
    // Be authoritative about the actor instead of trusting the server's returned
    // list: the logged-in user just super upvoted this content, so ensure they
    // appear in SuperUpvotedByUsers. A server read-after-write lag can return a
    // stale list that omits them, which would otherwise leave the button looking
    // inactive (and un-undoable). See tests/playwright/mocked/superUpvote.
    cache.modify({
      id: cacheId,
      fields: {
        SuperUpvotedByUsers: (
          existing: Reference | ReadonlyArray<Reference | StoreObject> = [],
          { readField }
        ) => {
          if (!me || !Array.isArray(existing)) return existing;
          const alreadyPresent = existing.some(
            (user) => readField('username', user) === me
          );
          if (alreadyPresent) return existing;
          return [...existing, { __typename: 'User', username: me }];
        },
      },
    });
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
            class="fixed inset-0 bg-gray-500/75 transition-opacity dark:bg-gray-900/75"
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
                class="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 dark:bg-gray-800"
              >
                <div>
                  <!-- Rainbow star icon -->
                  <div
                    class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500"
                  >
                    <StarIcon
                      class="h-6 w-6 fill-current text-white"
                      filled
                      aria-hidden="true"
                    />
                  </div>
                  <div class="mt-3 sm:mt-5">
                    <DialogTitle
                      as="h3"
                      class="text-center text-lg leading-6 font-semibold text-gray-900 dark:text-white"
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

                    <ErrorBanner
                      v-if="error"
                      :text="error.message"
                      class="mt-4"
                    />

                    <div class="mt-4">
                      <textarea
                        ref="textareaRef"
                        v-model="text"
                        data-testid="super-upvote-text-input"
                        :placeholder="placeholderText"
                        rows="4"
                        :maxlength="MAX_TEXT_LENGTH + 50"
                        class="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
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

                <div
                  class="mt-5 flex flex-col-reverse gap-3 sm:mt-6 sm:flex-row"
                >
                  <button
                    type="button"
                    class="inline-flex flex-1 justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    @click="emit('close')"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-testid="super-upvote-submit"
                    :disabled="!isValid || loading"
                    class="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed"
                    :class="{
                      'bg-purple-500 bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 text-white hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600':
                        isValid && !loading,
                      'bg-gray-200 text-gray-400 dark:bg-gray-600 dark:text-gray-400':
                        !isValid || loading,
                    }"
                    @click="handleSubmit"
                  >
                    <LoadingSpinner
                      v-if="loading"
                      class="h-4 w-4"
                      aria-hidden="true"
                    />
                    <StarIcon
                      v-else
                      class="h-4 w-4 fill-current"
                      filled
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
