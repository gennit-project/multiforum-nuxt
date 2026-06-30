<script setup lang="ts">
import ExpandableImage from '@/components/ExpandableImage.vue';
import TagComponent from '@/components/TagComponent.vue';
import AddToChannelFavorites from '@/components/favorites/AddToChannelFavorites.vue';

type ChannelItem = {
  uniqueName: string;
  displayName?: string | null;
  description?: string | null;
  channelIconURL?: string | null;
  Tags?: Array<{ text?: string | null }> | null;
};

const props = withDefaults(
  defineProps<{
    channel: ChannelItem;
    showFavoriteButton?: boolean;
    allowAddToList?: boolean;
    isFavorited?: boolean;
  }>(),
  {
    showFavoriteButton: false,
    allowAddToList: false,
    isFavorited: false,
  }
);
</script>

<template>
  <article
    class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)] dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="flex items-start justify-between gap-4">
      <NuxtLink
        :to="`/forums/${channel.uniqueName}`"
        class="flex min-w-0 flex-1 items-start gap-4"
      >
        <div class="flex-shrink-0">
          <ExpandableImage
            v-if="channel.channelIconURL"
            :src="channel.channelIconURL"
            :alt="channel.displayName || channel.uniqueName"
            :rounded="true"
            class="h-12 w-12"
          />
          <AvatarComponent
            v-else
            :text="channel.displayName || channel.uniqueName"
            :src="''"
            class="h-12 w-12"
            :is-square="false"
          />
        </div>

        <div class="min-w-0 flex-1">
          <h3
            class="truncate text-lg font-semibold text-gray-900 transition-colors hover:text-orange-500 dark:text-white dark:hover:text-orange-400"
          >
            {{ channel.displayName || channel.uniqueName }}
          </h3>
          <p class="font-mono text-sm text-gray-500 dark:text-gray-400">
            /{{ channel.uniqueName }}
          </p>
          <p
            v-if="channel.description"
            class="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300"
          >
            {{ channel.description }}
          </p>
        </div>
      </NuxtLink>

      <div v-if="showFavoriteButton" class="flex-shrink-0">
        <AddToChannelFavorites
          :allow-add-to-list="allowAddToList"
          :channel-unique-name="channel.uniqueName"
          :channel-display-name="channel.displayName || ''"
          :initial-is-favorited="isFavorited"
          size="medium"
        />
      </div>
    </div>

    <div
      v-if="channel.Tags?.length"
      class="mt-4 flex flex-wrap gap-2 border-t border-slate-200/80 pt-4 dark:border-gray-700"
    >
      <TagComponent
        v-for="(tag, index) in channel.Tags.slice(0, 4)"
        :key="tag.text || `channel-tag-${index}`"
        :tag="tag.text || ''"
        class="text-xs"
        @click.prevent=""
      />
      <span
        v-if="channel.Tags.length > 4"
        class="text-xs text-gray-500 dark:text-gray-400"
      >
        +{{ channel.Tags.length - 4 }} more
      </span>
    </div>
  </article>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
