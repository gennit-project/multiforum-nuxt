<script lang="ts" setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
} from 'vue';
import { useMutation } from '@vue/apollo-composable';
import type { NativeEmoji, SkinTone } from 'emoji-picker-element/shared';
import { ADD_EMOJI_TO_COMMENT } from '@/graphQLData/comment/mutations';
import { ADD_EMOJI_TO_DISCUSSION_CHANNEL } from '@/graphQLData/discussion/mutations';
import { useUsername } from '@/composables/useAuthState';
import {
  useEmojiCatalog,
  type EmojiSelection,
} from '@/composables/useEmojiCatalog';
import type { RecentEmoji } from '@/utils/emojiRecents';

const props = defineProps({
  commentId: {
    type: String,
    default: '',
  },
  discussionChannelId: {
    type: String,
    default: '',
  },
  emojiJson: {
    type: String,
    default: '',
  },
});

const emit = defineEmits<{
  close: [];
  'emoji-click': [event: { unicode: string; emoji: string }];
}>();

const usernameVar = useUsername();
const searchId = useId();
const searchInput = ref<HTMLInputElement | null>(null);
const pickerRoot = ref<HTMLElement | null>(null);
const scrollArea = ref<HTMLElement | null>(null);
const searchQuery = ref('');
let searchTimer: ReturnType<typeof setTimeout> | undefined;

const { mutate: addEmojiToComment } = useMutation(ADD_EMOJI_TO_COMMENT);
const { mutate: addEmojiToDiscussionChannel } = useMutation(
  ADD_EMOJI_TO_DISCUSSION_CHANNEL
);

const {
  categories,
  error,
  load,
  loading,
  recents,
  search,
  searching,
  searchResults,
  selectEmoji,
  selectRecent,
  setSkinTone,
  skinTone,
  unicodeFor,
} = useEmojiCatalog(() => usernameVar.value || 'anonymous');

const isSearching = computed(() => searchQuery.value.trim().length > 0);
const resultStatus = computed(() => {
  if (loading.value) return 'Loading emoji…';
  if (error.value) return error.value;
  if (searching.value) return 'Searching…';
  if (isSearching.value) {
    return `${searchResults.value.length} emoji found`;
  }
  return '';
});

function onSearchInput(event: Event) {
  searchQuery.value = (event.target as HTMLInputElement).value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => void search(searchQuery.value), 150);
}

function clearSearch() {
  searchQuery.value = '';
  if (searchInput.value) searchInput.value.value = '';
  void search('');
}

function onSearchKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusFirstEmoji();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    if (isSearching.value) clearSearch();
    else emit('close');
  }
}

function focusFirstEmoji() {
  void nextTick(() => {
    pickerRoot.value
      ?.querySelector<HTMLButtonElement>('[data-emoji-button]')
      ?.focus();
  });
}

function onGridKeydown(event: KeyboardEvent) {
  const current = event.target as HTMLButtonElement;
  const grid = current.closest('[data-emoji-grid]');
  if (!grid) return;

  const buttons = Array.from(
    grid.querySelectorAll<HTMLButtonElement>('[data-emoji-button]')
  );
  const currentIndex = buttons.indexOf(current);
  let nextIndex = currentIndex;

  switch (event.key) {
    case 'ArrowRight':
      nextIndex = Math.min(currentIndex + 1, buttons.length - 1);
      break;
    case 'ArrowLeft':
      nextIndex = Math.max(currentIndex - 1, 0);
      break;
    case 'ArrowDown':
      nextIndex = Math.min(currentIndex + 8, buttons.length - 1);
      break;
    case 'ArrowUp':
      nextIndex = Math.max(currentIndex - 8, 0);
      break;
    case 'Home':
      nextIndex = 0;
      break;
    case 'End':
      nextIndex = buttons.length - 1;
      break;
    case 'Escape':
      emit('close');
      return;
    default:
      return;
  }

  event.preventDefault();
  buttons[nextIndex]?.focus();
}

function scrollToCategory(categoryId: number) {
  scrollArea.value
    ?.querySelector<HTMLElement>(`#emoji-category-${categoryId}`)
    ?.scrollIntoView({ block: 'start' });
}

function handleSelection(selection: EmojiSelection) {
  if (!usernameVar.value) return;

  const variables = {
    emojiLabel: selection.annotation,
    unicode: selection.unicode,
    username: usernameVar.value,
  };

  if (props.commentId) {
    addEmojiToComment({ commentId: props.commentId, ...variables });
  } else if (props.discussionChannelId) {
    addEmojiToDiscussionChannel({
      discussionChannelId: props.discussionChannelId,
      ...variables,
    });
  }

  emit('emoji-click', {
    unicode: selection.unicode,
    emoji: selection.unicode,
  });
}

function chooseEmoji(emoji: NativeEmoji) {
  handleSelection(selectEmoji(emoji));
}

function chooseRecent(emoji: RecentEmoji) {
  handleSelection(selectRecent(emoji));
}

function onSkinToneChange(event: Event) {
  void setSkinTone(
    Number((event.target as HTMLSelectElement).value) as SkinTone
  );
}

onMounted(async () => {
  await load();
  await nextTick();
  searchInput.value?.focus();
});

onBeforeUnmount(() => clearTimeout(searchTimer));
</script>

<template>
  <section
    ref="pickerRoot"
    aria-label="Emoji picker"
    class="flex h-[min(30rem,calc(100vh-2rem))] w-[min(24rem,calc(100vw-1rem))] flex-col bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100"
  >
    <div
      class="flex items-center gap-2 border-b border-gray-200 p-2 dark:border-gray-600"
    >
      <label :for="searchId" class="sr-only">Search emoji</label>
      <input
        :id="searchId"
        ref="searchInput"
        type="search"
        autocomplete="off"
        enterkeyhint="search"
        placeholder="Search emoji"
        class="h-11 min-w-0 flex-1 rounded-md border border-gray-400 bg-white px-3 text-base text-gray-900 placeholder:text-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none dark:border-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
        :aria-controls="`${searchId}-results`"
        @input="onSearchInput"
        @keydown="onSearchKeydown"
      />
      <label :for="`${searchId}-skin-tone`" class="sr-only">Skin tone</label>
      <select
        :id="`${searchId}-skin-tone`"
        :value="skinTone"
        aria-label="Skin tone"
        class="h-11 w-16 rounded-md border border-gray-400 bg-white px-2 text-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none dark:border-gray-500 dark:bg-gray-800 dark:text-white"
        @change="onSkinToneChange"
      >
        <option :value="0">&#x1F590;&#xFE0F; Default</option>
        <option :value="1">&#x1F590;&#x1F3FB; Light</option>
        <option :value="2">&#x1F590;&#x1F3FC; Medium-light</option>
        <option :value="3">&#x1F590;&#x1F3FD; Medium</option>
        <option :value="4">&#x1F590;&#x1F3FE; Medium-dark</option>
        <option :value="5">&#x1F590;&#x1F3FF; Dark</option>
      </select>
    </div>

    <nav
      v-if="!isSearching && !loading && !error"
      aria-label="Emoji categories"
      class="flex shrink-0 gap-0.5 overflow-x-auto border-b border-gray-200 px-1 dark:border-gray-600"
    >
      <button
        v-if="recents.length"
        type="button"
        class="h-11 w-11 shrink-0 rounded-md text-xl hover:bg-gray-100 focus:ring-2 focus:ring-blue-600 focus:outline-none dark:hover:bg-gray-600"
        aria-label="Recently used"
        title="Recently used"
        @click="scrollArea?.scrollTo({ top: 0 })"
      >
        &#x1F551;
      </button>
      <button
        v-for="category in categories"
        :key="category.id"
        type="button"
        class="h-11 w-11 shrink-0 rounded-md text-xl hover:bg-gray-100 focus:ring-2 focus:ring-blue-600 focus:outline-none dark:hover:bg-gray-600"
        :aria-label="category.label"
        :title="category.label"
        @click="scrollToCategory(category.id)"
      >
        {{ category.icon }}
      </button>
    </nav>

    <p class="sr-only" aria-live="polite">{{ resultStatus }}</p>

    <div
      :id="`${searchId}-results`"
      ref="scrollArea"
      class="min-h-0 flex-1 overflow-y-auto scroll-smooth px-2 pb-2"
      :aria-busy="loading || searching"
    >
      <p
        v-if="loading"
        class="p-4 text-center text-sm text-gray-600 dark:text-gray-300"
      >
        Loading emoji…
      </p>
      <p
        v-else-if="error"
        role="alert"
        class="p-4 text-center text-sm text-red-700 dark:text-red-300"
      >
        {{ error }}
      </p>

      <template v-else-if="isSearching">
        <h2
          id="emoji-search-results-heading"
          class="sticky top-0 z-10 bg-white py-2 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        >
          Search results
        </h2>
        <p
          v-if="!searching && !searchResults.length"
          class="p-4 text-center text-sm text-gray-600 dark:text-gray-300"
        >
          No emoji found
        </p>
        <div
          v-else
          data-emoji-grid
          aria-labelledby="emoji-search-results-heading"
          class="grid grid-cols-8 justify-items-center"
          @keydown="onGridKeydown"
        >
          <div
            v-for="(emoji, index) in searchResults"
            :key="emoji.unicode"
          >
            <button
              type="button"
              data-emoji-button
              class="flex h-11 w-11 items-center justify-center rounded-md text-2xl hover:bg-gray-100 focus:ring-2 focus:ring-blue-600 focus:outline-none dark:hover:bg-gray-600"
              :tabindex="index === 0 ? 0 : -1"
              :aria-label="emoji.annotation"
              :title="emoji.annotation"
              @click="chooseEmoji(emoji)"
            >
              {{ unicodeFor(emoji) }}
            </button>
          </div>
        </div>
      </template>

      <template v-else>
        <section v-if="recents.length" class="[content-visibility:auto]">
          <h2
            id="recent-emoji-heading"
            class="sticky top-0 z-10 bg-white py-2 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >
            Recently used
          </h2>
          <div
            data-emoji-grid
            aria-labelledby="recent-emoji-heading"
            class="grid grid-cols-8 justify-items-center"
            @keydown="onGridKeydown"
          >
            <div
              v-for="(emoji, index) in recents"
              :key="emoji.unicode"
            >
              <button
                type="button"
                data-emoji-button
                class="flex h-11 w-11 items-center justify-center rounded-md text-2xl hover:bg-gray-100 focus:ring-2 focus:ring-blue-600 focus:outline-none dark:hover:bg-gray-600"
                :tabindex="index === 0 ? 0 : -1"
                :aria-label="emoji.annotation"
                :title="emoji.annotation"
                @click="chooseRecent(emoji)"
              >
                {{ emoji.unicode }}
              </button>
            </div>
          </div>
        </section>

        <section
          v-for="category in categories"
          :id="`emoji-category-${category.id}`"
          :key="category.id"
          class="scroll-mt-0 [contain-intrinsic-size:auto_28rem] [content-visibility:auto]"
        >
          <h2
            :id="`emoji-category-${category.id}-heading`"
            class="sticky top-0 z-10 bg-white py-2 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >
            {{ category.label }}
          </h2>
          <div
            data-emoji-grid
            :aria-labelledby="`emoji-category-${category.id}-heading`"
            class="grid grid-cols-8 justify-items-center"
            @keydown="onGridKeydown"
          >
            <div
              v-for="(emoji, index) in category.emojis"
              :key="emoji.unicode"
            >
              <button
                type="button"
                data-emoji-button
                class="flex h-11 w-11 items-center justify-center rounded-md text-2xl hover:bg-gray-100 focus:ring-2 focus:ring-blue-600 focus:outline-none dark:hover:bg-gray-600"
                :tabindex="index === 0 ? 0 : -1"
                :aria-label="emoji.annotation"
                :title="emoji.annotation"
                @click="chooseEmoji(emoji)"
              >
                {{ unicodeFor(emoji) }}
              </button>
            </div>
          </div>
        </section>
      </template>
    </div>
  </section>
</template>
