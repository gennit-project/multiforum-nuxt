<script lang="ts" setup>
  import type { PropType } from "vue";
  import { computed } from "vue";
  import type { Channel, Tag as TagData } from "@/__generated__/graphql";
  import HighlightedSearchTerms from "@/components/HighlightedSearchTerms.vue";
  import Tag from "@/components/TagComponent.vue";
  import CalendarIcon from "@/components/icons/CalendarIcon.vue";
  import DiscussionIcon from "@/components/icons/DiscussionIcon.vue";

  const props = defineProps({
    channel: {
      type: Object as PropType<Channel>,
      required: true,
    },
    searchInput: {
      type: String,
      default: "",
    },
    selectedTags: {
      type: Array as PropType<Array<string>>,
      default: () => [],
    },
  });

  const tags = computed(() => props.channel.Tags.map((tag: TagData) => tag.text));

  defineEmits(["filterByTag"]);
</script>

<template>
  <div
    class="mb-4 break-inside-avoid rounded-lg border border-gray-300 bg-white p-4 shadow-sm dark:border-gray-300 dark:bg-gray-900 dark:text-gray-200"
  >
    <nuxt-link
      class="mb-2 block"
      :to="`/forums/${channel.uniqueName}/discussions`"
    >
      <AvatarComponent
        class="mb-2"
        :is-small="true"
        :square="true"
        :src="channel?.channelIconURL || ''"
        :text="channel.uniqueName"
      />
      <div>
        <h3
          v-if="channel.displayName"
          class="font-bold text-gray-700 dark:text-gray-200"
        >
          <HighlightedSearchTerms
            :search-input="searchInput"
            :text="channel.displayName"
          />
        </h3>
        <p class="text-sm text-gray-400 dark:text-gray-300">
          <HighlightedSearchTerms
            :search-input="searchInput"
            :text="channel.uniqueName"
          />
        </p>
      </div>
    </nuxt-link>
    <p
      v-if="channel.description"
      class="mb-2 text-sm text-gray-500 dark:text-gray-400"
    >
      <HighlightedSearchTerms
        :search-input="searchInput"
        :text="channel.description"
      />
    </p>
    <div class="mb-2 flex gap-1">
      <Tag
        v-for="tag in tags"
        :key="tag"
        :active="selectedTags.includes(tag)"
        :tag="tag"
        @click="$emit('filterByTag', tag)"
      />
    </div>
    <div class="flex justify-between text-sm">
      <nuxt-link
        class="flex items-center gap-1"
        :to="`/forums/${channel.uniqueName}/discussions`"
      >
        <DiscussionIcon class="h-4 w-4" />
        {{ channel?.DiscussionChannelsAggregate?.count || 0 }} Discussions
      </nuxt-link>
      <nuxt-link
        v-if="channel?.EventChannelsAggregate?.count"
        class="flex items-center gap-1"
        :to="`/forums/${channel.uniqueName}/events`"
      >
        <CalendarIcon class="h-4 w-4" />
        {{ channel?.EventChannelsAggregate?.count || 0 }} Events
      </nuxt-link>
    </div>
  </div>
</template>

<style scoped>
  .break-inside-avoid {
    break-inside: avoid;
  }
</style>
