<script lang="ts" setup>
import { computed } from 'vue';
import { GET_IMAGE_DETAILS } from '@/graphQLData/image/queries';
import { useQuery } from '@vue/apollo-composable';
import ErrorBanner from '../ErrorBanner.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import AppImage from '@/components/image/AppImage.vue';
import { stableRelativeTime } from '@/utils';
import { getPreferredImageUrl } from '@/utils/imageVariants';

const props = defineProps({
  imageId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['fetchedOriginalAuthorUsername']);

const {
  result: imageResult,
  error: imageError,
  loading: imageLoading,
  onResult: onImageResult,
} = useQuery(GET_IMAGE_DETAILS, {
  imageId: props.imageId,
});

const image = computed(() => {
  if (imageLoading.value || imageError.value) {
    return null;
  }
  return imageResult.value?.images?.[0] ?? null;
});

const uploaderDisplayName = computed(() => {
  const uploader = image.value?.Uploader;
  return uploader?.displayName || uploader?.username || 'Unknown';
});

const uploaderUsername = computed(() => {
  return image.value?.Uploader?.username || null;
});

const detailImageUrl = computed(() =>
  getPreferredImageUrl({
    source: image.value,
    preferred: ['detail640', 'detail960', 'detail1280'],
    originalUrl: image.value?.url,
  }) || ''
);

const uploaderImageUrl = computed(() =>
  getPreferredImageUrl({
    source: image.value?.Uploader,
    preferred: ['avatar32', 'avatar48'],
    originalUrl: image.value?.Uploader?.profilePicURL,
  }) || ''
);

const formattedDate = computed(() => {
  if (!image.value?.createdAt) return '';
  return stableRelativeTime(image.value.createdAt);
});

const albumContext = computed(() => {
  const album = image.value?.Album;
  if (!album) return null;

  const discussion = album.Discussions?.[0];
  if (!discussion) return null;

  const channelUniqueName = discussion.DiscussionChannels?.[0]?.channelUniqueName;
  if (!channelUniqueName) return null;

  return {
    discussionId: discussion.id,
    discussionTitle: discussion.title,
    channelUniqueName,
  };
});

onImageResult(({ data }) => {
  if (data?.images?.length) {
    const uploader = data.images[0].Uploader;
    if (uploader?.username) {
      emit('fetchedOriginalAuthorUsername', uploader.username);
    }
  }
});
</script>

<template>
  <div class="flex w-full flex-col space-y-4">
    <LoadingSpinner v-if="imageLoading" />
    <ErrorBanner v-else-if="imageError" :text="imageError.message" />
    <div
      v-else-if="!image"
      class="rounded-lg border border-gray-300 bg-gray-50 p-4 text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
    >
      <p>Can't find the image that was reported. It may have been deleted.</p>
    </div>
    <template v-else>
      <div class="flex flex-col gap-4">
        <div class="flex items-start gap-4">
          <div class="relative max-w-md overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <AppImage
              :src="detailImageUrl"
              :alt="image.alt || 'Reported image'"
              class="max-h-80 w-auto object-contain"
              :width="640"
              :height="640"
              sizes="(min-width: 1024px) 32rem, 100vw"
              loading="lazy"
              decoding="async"
            />
            <div
              v-if="image.hasSensitiveContent"
              class="absolute right-2 top-2 rounded bg-red-500 px-2 py-1 text-xs font-medium text-white"
            >
              Sensitive
            </div>
            <div
              v-if="image.hasSpoiler"
              class="absolute left-2 top-2 rounded bg-yellow-500 px-2 py-1 text-xs font-medium text-black"
            >
              Spoiler
            </div>
          </div>
          <div class="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div class="flex items-center gap-2">
              <AppImage
                v-if="uploaderImageUrl"
                :src="uploaderImageUrl"
                :alt="uploaderDisplayName"
                class="h-8 w-8 rounded-full object-cover"
                :width="32"
                :height="32"
                sizes="32px"
                loading="lazy"
                decoding="async"
              />
              <div
                v-else
                class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
              >
                {{ uploaderDisplayName.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  <nuxt-link
                    v-if="uploaderUsername"
                    :to="{ name: 'u-username', params: { username: uploaderUsername } }"
                    class="hover:underline"
                  >
                    {{ uploaderDisplayName }}
                  </nuxt-link>
                  <span v-else>{{ uploaderDisplayName }}</span>
                </p>
                <p class="text-xs">Uploaded {{ formattedDate }}</p>
              </div>
            </div>
            <div v-if="image.caption" class="mt-2">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Caption</p>
              <p class="text-gray-900 dark:text-white">{{ image.caption }}</p>
            </div>
            <div v-if="image.alt" class="mt-1">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Alt text</p>
              <p>{{ image.alt }}</p>
            </div>
            <div v-if="image.longDescription" class="mt-1">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Description</p>
              <p>{{ image.longDescription }}</p>
            </div>
            <div v-if="image.copyright" class="mt-1">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Copyright</p>
              <p>{{ image.copyright }}</p>
            </div>
            <div v-if="albumContext" class="mt-2">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Context</p>
              <nuxt-link
                :to="{
                  name: 'forums-forumId-discussions-discussionId',
                  params: {
                    forumId: albumContext.channelUniqueName,
                    discussionId: albumContext.discussionId,
                  },
                }"
                class="text-orange-500 hover:underline"
              >
                {{ albumContext.discussionTitle }}
              </nuxt-link>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
