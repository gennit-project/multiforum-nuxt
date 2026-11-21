<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import ErrorBanner from '@/components/ErrorBanner.vue';
import PageSkeleton from '@/components/PageSkeleton.vue';
import OwnedCollectionDetail from '@/components/collection/OwnedCollectionDetail.vue';
import PublicCollectionDetail from '@/components/collection/PublicCollectionDetail.vue';
import { useUsername } from '@/composables/useAuthState';
import { useResolvedCollectionId } from '@/composables/useRouteContentIds';
import { parseSlugSegmentNumber } from '@/utils/slugify';

// The route carries `{collectionNumber}-{slug}` under the owner's username;
// resolve it to the global id the collection queries are keyed by.
const route = useRoute();
const usernameVar = useUsername();
const {
  id: collectionId,
  loading: collectionIdLoading,
  notFound: collectionIdNotFound,
} = useResolvedCollectionId();

const routeUsername = computed(() =>
  typeof route.params.username === 'string' ? route.params.username : ''
);

// A segment without a leading number can never resolve, so don't wait on it.
const hasInvalidSegment = computed(
  () =>
    parseSlugSegmentNumber(
      typeof route.params.collectionId === 'string'
        ? route.params.collectionId
        : ''
    ) === null
);
const isNotFound = computed(
  () => hasInvalidSegment.value || collectionIdNotFound.value
);

// The owner manages the collection; everyone else sees the public view.
// Ownership depends on client-only auth state, so the template renders in
// <ClientOnly>.
const isOwner = computed(
  () => !!usernameVar.value && usernameVar.value === routeUsername.value
);
</script>

<template>
  <ClientOnly>
    <PageSkeleton
      v-if="!isNotFound && (collectionIdLoading || !collectionId)"
      label="Loading collection…"
    />
    <div v-else-if="isNotFound" class="mx-auto w-full max-w-6xl px-3 py-6">
      <ErrorBanner
        text="This collection doesn't exist or you don't have access to it."
      />
    </div>
    <OwnedCollectionDetail v-else-if="isOwner" :collection-id="collectionId" />
    <PublicCollectionDetail v-else :collection-id="collectionId" />
    <template #fallback>
      <PageSkeleton label="Loading collection…" />
    </template>
  </ClientOnly>
</template>
