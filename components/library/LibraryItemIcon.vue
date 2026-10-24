<script setup lang="ts">
import { computed, type Component } from 'vue';
import BookmarkIcon from '@/components/icons/BookmarkIcon.vue';
import CommentIcon from '@/components/icons/CommentIcon.vue';
import DiscussionIcon from '@/components/icons/DiscussionIcon.vue';
import DocumentIcon from '@/components/icons/DocumentIcon.vue';
import DownloadIcon from '@/components/icons/DownloadIcon.vue';
import ImageIcon from '@/components/icons/ImageIcon.vue';
import StarIcon from '@/components/icons/StarIcon.vue';

const props = withDefaults(
  defineProps<{
    collectionType?: string;
    itemId?: string;
  }>(),
  {
    collectionType: '',
    itemId: '',
  }
);

const iconDefinition = computed<{ component: Component; name: string }>(() => {
  if (
    props.itemId === 'all-favorites' ||
    props.collectionType === 'FAVORITES'
  ) {
    return { component: StarIcon, name: 'favorites' };
  }
  if (props.itemId === 'uploaded-files') {
    return { component: DocumentIcon, name: 'uploaded-files' };
  }
  if (props.collectionType === 'IMAGES') {
    return { component: ImageIcon, name: 'images' };
  }
  if (props.collectionType === 'DOWNLOADS') {
    return { component: DownloadIcon, name: 'downloads' };
  }
  if (props.collectionType === 'COMMENTS') {
    return { component: CommentIcon, name: 'comments' };
  }
  if (props.collectionType === 'CHANNELS') {
    return { component: DiscussionIcon, name: 'forums' };
  }
  return { component: BookmarkIcon, name: 'collections' };
});
</script>

<template>
  <component
    :is="iconDefinition.component"
    :data-library-icon="iconDefinition.name"
    aria-hidden="true"
  />
</template>
