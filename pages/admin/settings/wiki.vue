<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PropType } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import type { ServerConfigUpdateInput } from '@/__generated__/graphql';
import FormRow from '@/components/FormRow.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import {
  GET_SITE_WIDE_WIKI_LIST,
  GET_WIKI_PAGES_BY_IDS,
} from '@/graphQLData/wiki/queries';

type WikiPageOption = {
  id: string;
  title?: string | null;
  slug?: string | null;
  channelUniqueName?: string | null;
};

type ServerSettingsFormValues = ServerConfigUpdateInput & {
  featuredWikiPageIds?: string[];
};

const props = defineProps({
  editMode: {
    type: Boolean,
    required: true,
  },
  formValues: {
    type: Object as PropType<ServerSettingsFormValues | null>,
    required: false,
    default: null,
  },
});

const emit = defineEmits(['updateFormValues']);

const searchInput = ref('');
const selectedIds = computed(() => props.formValues?.featuredWikiPageIds || []);

const { result: searchResult, loading: searchLoading } = useQuery(
  GET_SITE_WIDE_WIKI_LIST,
  () => ({
    searchInput: searchInput.value,
    selectedChannels: [],
    options: { limit: 12, offset: 0 },
  }),
  { fetchPolicy: 'cache-first' }
);

const { result: selectedPagesResult } = useQuery(
  GET_WIKI_PAGES_BY_IDS,
  () => ({ ids: selectedIds.value }),
  {
    enabled: computed(() => selectedIds.value.length > 0),
    fetchPolicy: 'cache-first',
  }
);

const selectedPagesById = computed(() => {
  const pages = (selectedPagesResult.value?.wikiPages || []) as WikiPageOption[];
  return new Map(pages.map((page) => [page.id, page]));
});

const selectedPages = computed(() =>
  selectedIds.value.map(
    (id) =>
      selectedPagesById.value.get(id) || {
        id,
        title: id,
        slug: '',
        channelUniqueName: '',
      }
  )
);

const searchResults = computed(() => {
  const pages = (searchResult.value?.getSiteWideWikiList?.wikiPages ||
    []) as WikiPageOption[];
  const selected = new Set(selectedIds.value);
  return pages.filter((page) => !selected.has(page.id));
});

const updateIds = (ids: string[]) => {
  emit('updateFormValues', { featuredWikiPageIds: ids });
};

const addPage = (page: WikiPageOption) => {
  if (selectedIds.value.includes(page.id)) return;
  updateIds([...selectedIds.value, page.id]);
};

const removePage = (pageId: string) => {
  updateIds(selectedIds.value.filter((id) => id !== pageId));
};

const movePage = (pageId: string, direction: -1 | 1) => {
  const ids = [...selectedIds.value];
  const index = ids.indexOf(pageId);
  const nextIndex = index + direction;

  if (index === -1 || nextIndex < 0 || nextIndex >= ids.length) {
    return;
  }

  const id = ids[index];
  if (!id) {
    return;
  }

  ids.splice(index, 1);
  ids.splice(nextIndex, 0, id);
  updateIds(ids);
};
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <FormRow section-title="Featured Wiki Pages">
      <template #content>
        <div class="space-y-5">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Choose wiki pages to feature above the normal results on the
            server-wide wiki search page.
          </p>

          <div>
            <label
              for="featured-wiki-search"
              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Search wiki pages
            </label>
            <input
              id="featured-wiki-search"
              v-model="searchInput"
              type="search"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              placeholder="Search by title or body"
            />
          </div>

          <div v-if="selectedPages.length" class="space-y-2">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Featured order
            </h3>
            <ol class="space-y-2" data-testid="featured-wiki-selected-list">
              <li
                v-for="(page, index) in selectedPages"
                :key="page.id"
                class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 dark:border-orange-800 dark:bg-orange-950/30"
              >
                <div>
                  <div class="font-medium text-gray-900 dark:text-gray-100">
                    {{ index + 1 }}. {{ page.title || page.id }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ page.channelUniqueName }}/{{ page.slug }}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-900"
                    :disabled="index === 0"
                    @click="movePage(page.id, -1)"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    class="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-900"
                    :disabled="index === selectedPages.length - 1"
                    @click="movePage(page.id, 1)"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    class="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                    @click="removePage(page.id)"
                  >
                    Remove
                  </button>
                </div>
              </li>
            </ol>
          </div>
          <p v-else class="text-sm text-gray-500 dark:text-gray-400">
            No featured wiki pages selected.
          </p>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Search results
              </h3>
              <LoadingSpinner v-if="searchLoading" size="sm" />
            </div>
            <ul
              v-if="searchResults.length"
              class="space-y-2"
              data-testid="featured-wiki-search-results"
            >
              <li
                v-for="page in searchResults"
                :key="page.id"
                class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              >
                <div>
                  <div class="font-medium text-gray-900 dark:text-gray-100">
                    {{ page.title || page.id }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ page.channelUniqueName }}/{{ page.slug }}
                  </div>
                </div>
                <button
                  type="button"
                  class="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700"
                  @click="addPage(page)"
                >
                  Add
                </button>
              </li>
            </ul>
            <p v-else class="text-sm text-gray-500 dark:text-gray-400">
              No wiki pages match your search.
            </p>
          </div>
        </div>
      </template>
    </FormRow>
  </div>
</template>
