<script lang="ts">
import { defineComponent, computed, ref, Ref } from "vue";
// import TagPicker from "@/components/TagPicker.vue";
import SearchableForumList from "@/components/channel/SearchableForumList.vue";
import FilterChip from "@/components/FilterChip.vue";
import ChannelIcon from "@/components/icons/ChannelIcon.vue";
import TagIcon from "@/components/icons/TagIcon.vue";
import { getTagLabel, getChannelLabel } from "@/utils";
import SearchBar from "../../SearchBar.vue";
import { SearchDiscussionValues } from "@/types/Discussion";
import { useRoute } from "vue-router";
import { getFilterValuesFromParams } from "@/components/event/list/filters/getFilterValuesFromParams";
import SortButtons from "@/components/SortButtons.vue";
import { useDisplay } from "vuetify";
import SearchableTagList from '@/components/forms/SearchableTagList.vue'

export default defineComponent({
  name: "DiscussionFilterBar",
  // The DiscussionFilterBar component writes to the query
  // params, while the discussion list components
  // components consume the query params.
  components: {
    ChannelIcon,
    SortButtons,
    FilterChip,
    SearchableForumList,
    SearchableTagList,
    SearchBar,
    TagIcon,
  },
  props: {
    showMap: {
      type: Boolean,
      default: false,
    },
    loadedEventCount: {
      type: Number,
      default: 0,
    },
    resultCount: {
      type: Number,
      default: 0,
    },
  },

  setup() {
    const defaultFilterLabels = {
      channels: "Forums",
      tags: "Tags",
    };
    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });
    const route = useRoute();

    const filterValues: Ref<SearchDiscussionValues> = ref(
      getFilterValuesFromParams({
        route,
        channelId: channelId.value,
      }),
    );

    const channelLabel = computed(() => {
      return getChannelLabel(filterValues.value.channels);
    });

    const tagLabel = computed(() => {
      return getTagLabel(filterValues.value.tags);
    });
    const { smAndDown } = useDisplay();

    watch(
      () => route.query,
      () => {
        if (route.query) {
          filterValues.value = getFilterValuesFromParams({
            route: route,
            channelId: channelId.value,
          });
        }
      }
    );

    return {
      channelId,
      channelLabel,
      defaultFilterLabels,
      drawerIsOpen: ref(false),
      filterValues,
      route,
      smAndDown,
      tagLabel,
    };
  },
  
  methods: {
    handleClickMoreFilters() {
      this.drawerIsOpen = true;
    },
    handleCloseFilters() {
      this.drawerIsOpen = false;
    },
    updateFilters(params: SearchDiscussionValues) {
      const existingQuery = this.$route.query;
      // Updating the URL params causes the discussions
      // to be refetched by the discussion list components.
      this.$router.replace({
        query: {
          ...existingQuery,
          ...params,
        },
      });
    },
    updateLocalState(params: SearchDiscussionValues) {
      // Updating filterValues updates local state
      // so that parts of the filter form don't get
      // outdated when a related setting is updated.
      const existingFilterValues = this.filterValues;
      this.filterValues = {
        ...existingFilterValues,
        ...params,
      };
    },
    setSelectedChannels(channels: string[]) {
      this.updateLocalState({ channels });
      this.updateFilters({ channels });
    },
    setSelectedTags(tags: string[]) {
      this.updateLocalState({ tags });
      this.updateFilters({ tags });
    },
    updateSearchInput(searchInput: string) {
      this.updateLocalState({ searchInput });
      this.updateFilters({ searchInput });
    },
    toggleSelectedChannel(channel: string) {
      const index = this.filterValues.channels.indexOf(channel);
      if (index === -1) {
        this.filterValues.channels.push(channel);
      } else {
        this.filterValues.channels.splice(index, 1);
      }
      this.setSelectedChannels(this.filterValues.channels);
    },
    toggleSelectedTag(tag: string) {
      const index = this.filterValues.tags.indexOf(tag);
      if (index === -1) {
        this.filterValues.tags.push(tag);
      } else {
        this.filterValues.tags.splice(index, 1);
      }
      this.setSelectedTags(this.filterValues.tags);
    },
  },
});
</script>

<template>
  <div>
    <div class="mb-4 mt-3 flex items-center justify-between">
      <SearchBar
        v-if="smAndDown"
        class="flex flex-grow px-1"
        data-testid="discussion-filter-search-bar"
        :initial-value="filterValues.searchInput"
        :search-placeholder="'Search...'"
        :small="true"
        @updateSearchInput="updateSearchInput"
      />
    </div>
    <div class="mb-4 mt-3 flex items-center justify-end">
      <SearchBar
        v-if="!smAndDown"
        class="mr-2 flex flex-grow"
        data-testid="discussion-filter-search-bar"
        :initial-value="filterValues.searchInput"
        :search-placeholder="'Search...'"
        :small="true"
        @updateSearchInput="updateSearchInput"
      />
      <FilterChip
        v-if="!channelId"
        class="align-middle"
        data-testid="channel-filter-button"
        :label="channelLabel"
        :highlighted="channelLabel !== defaultFilterLabels.channels"
      >
        <template #icon>
          <ChannelIcon class="-ml-0.5 mr-2 h-4 w-4" />
        </template>
        <template #content>
          <div class="relative w-96">
            <SearchableForumList
              :selected-channels="filterValues.channels"
              @toggleSelection="toggleSelectedChannel"
            />
          </div>
        </template>
      </FilterChip>
      <FilterChip
        class="align-middle"
        data-testid="tag-filter-button"
        :label="tagLabel"
        :highlighted="tagLabel !== defaultFilterLabels.tags"
      >
        <template #icon>
          <TagIcon class="-ml-0.5 mr-2 h-4 w-4" />
        </template>
        <template #content>
          <div class="relative w-96">
            <SearchableTagList
              :selected-tags="filterValues.tags"
              @toggleSelection="toggleSelectedTag"
            />
          </div>
        </template>
      </FilterChip>
      <SortButtons />
    </div>
  </div>
</template>
