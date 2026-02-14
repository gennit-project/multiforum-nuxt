<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { GET_USER_DOWNLOADS } from '@/graphQLData/user/queries';
import { useQuery } from '@vue/apollo-composable';
import SitewideDownloadListItem from '@/components/discussion/list/SitewideDownloadListItem.vue';
import DiscussionAlbum from '@/components/discussion/detail/DiscussionAlbum.vue';
import { useRoute } from 'nuxt/app';
import type { Album, Discussion } from '@/__generated__/graphql';
import { useSelectedChannelsFromQuery } from '@/composables/useSelectedChannelsFromQuery';

export default defineComponent({
  name: 'UserDownloads',
  components: {
    SitewideDownloadListItem,
    DiscussionAlbum,
  },

  setup() {
    const route = useRoute();
    const { selectedChannels, hasSelectedChannels } =
      useSelectedChannelsFromQuery();

    const username = computed(() => {
      if (typeof route.params.username === 'string') {
        return route.params.username;
      }
      return '';
    });

    const downloadsWhere = computed(() => {
      if (!hasSelectedChannels.value) {
        return { hasDownload: true };
      }
      return {
        AND: [
          { hasDownload: true },
          {
            DiscussionChannels_SOME: {
              channelUniqueName_IN: selectedChannels.value,
            },
          },
        ],
      };
    });

    const { result, loading, error } = useQuery(
      GET_USER_DOWNLOADS,
      () => ({
        username: username.value,
        where: downloadsWhere.value,
      }),
      {
        fetchPolicy: 'cache-first',
      }
    );

    type AlbumData = {
      discussion: Discussion;
      album: Album | null | undefined;
    };

    const openAlbumData = ref<AlbumData | null>(null);
    const isAlbumLightboxOpen = ref(false);

    const handleOpenAlbum = (payload: AlbumData) => {
      openAlbumData.value = payload;
      isAlbumLightboxOpen.value = true;
    };

    const handleCloseAlbum = () => {
      openAlbumData.value = null;
      isAlbumLightboxOpen.value = false;
    };

    return {
      loading,
      error,
      result,
      openAlbumData,
      isAlbumLightboxOpen,
      handleOpenAlbum,
      handleCloseAlbum,
    };
  },
});
</script>
<template>
  <div>
    <div class="py-3 dark:text-white">
      <div v-if="loading">Loading...</div>
      <div v-else-if="error">Error</div>
      <div
        v-else-if="
          result?.users?.length === 0 ||
          result.users[0]?.Discussions?.length === 0
        "
      >
        No downloads yet
      </div>
      <div v-else-if="result && result.users.length > 0">
        <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SitewideDownloadListItem
            v-for="discussion in result.users[0].Discussions"
            :key="discussion.id"
            :discussion="discussion"
            :search-input="''"
            :selected-tags="[]"
            :show-uploader="false"
            @open-album="handleOpenAlbum"
          />
        </ul>
      </div>
    </div>
    <DiscussionAlbum
      v-if="isAlbumLightboxOpen && openAlbumData?.album"
      :album="openAlbumData.album"
      :discussion-id="openAlbumData.discussion.id"
      :discussion-author="openAlbumData.discussion.Author?.username || ''"
      :show-edit-album="false"
      :start-in-lightbox="true"
      @close-lightbox="handleCloseAlbum"
    />
  </div>
</template>
