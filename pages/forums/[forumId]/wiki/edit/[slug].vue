<script setup lang="ts">
import {
  WriteWikiPageDocument,
  GetSiteWideWikiListDocument,
  GetWikiPageDocument as GET_WIKI_PAGE,
  GetChannelDocument as GET_CHANNEL,
} from '@/__generated__/operations';
import {
  updateWikiPageVariables,
  wikiWriteListVariables,
  wikiWriteChannelVariables,
} from '@/utils/wikiWrites';
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import { useMutation, useQuery } from '@vue/apollo-composable';
import TextEditor from '@/components/TextEditor.vue';
import TextInput from '@/components/TextInput.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import GoBack from '@/components/GoBack.vue';
import SuspensionNotice from '@/components/SuspensionNotice.vue';
import { useChannelSuspensionNotice } from '@/composables/useSuspensionNotice';
import { useUsername } from '@/composables/useAuthState';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { useWikiPageLockPermissions } from '@/composables/useWikiPageLockPermissions';

const usernameVar = useUsername();

const route = useRoute();
const router = useRouter();
const forumId = computed(() =>
  typeof route.params.forumId === 'string' ? route.params.forumId : ''
);
const slug = computed(() =>
  typeof route.params.slug === 'string' ? route.params.slug : ''
);

// Load the selected page, including lock state, for both home and child editors.
const {
  result: wikiPageResult,
  loading: wikiPageLoading,
  error: wikiPageError,
} = useQuery(
  GET_WIKI_PAGE,
  () => ({ channelUniqueName: forumId.value, slug: slug.value }),
  {
    errorPolicy: 'all',
    enabled: computed(() => !!forumId.value && !!slug.value),
    keepPreviousResult: false,
  }
);

// Query channel data for home page
const {
  result: channelResult,
  loading: channelLoading,
  error: channelError,
} = useQuery(GET_CHANNEL, () => ({ uniqueName: forumId.value }), {
  errorPolicy: 'all',
});

const channel = computed(() => channelResult.value?.channels?.[0] ?? null);

const wikiPage = computed(() =>
  wikiPageResult.value?.wikiPages.find((page) => page.slug === slug.value)
);
const loading = computed(() => wikiPageLoading.value || channelLoading.value);
const error = computed(() => wikiPageError.value || channelError.value);

const {
  activeSuspension,
  issueNumber: suspensionIssueNumber,
  suspendedUntil,
  suspendedIndefinitely,
  channelId: suspensionChannelId,
} = useChannelSuspensionNotice(forumId);

const wikiEditBlockedBySuspension = computed(() => {
  return !!usernameVar.value && !!activeSuspension.value;
});

const { canManageWikiPageLock } = useWikiPageLockPermissions(channel);
const wikiEditBlockedByLock = computed(
  () => wikiPage.value?.locked === true && !canManageWikiPageLock.value
);

const showWikiEditSuspensionNotice = computed(() => {
  return wikiEditBlockedBySuspension.value && !!suspensionIssueNumber.value;
});

const wikiEditSuspensionMessage =
  'You are suspended in this forum and cannot edit wiki pages.';

// Form data
const formValues = ref({
  title: '',
  body: '',
  editReason: '',
  slug: '',
});

// Initialize form with existing wiki data when available
const dataLoaded = ref(false);
watch(
  [forumId, slug],
  () => {
    dataLoaded.value = false;
    formValues.value = { title: '', body: '', editReason: '', slug: '' };
  },
  { flush: 'sync' }
);
watch(
  wikiPage,
  (newWikiPage) => {
    if (newWikiPage && !dataLoaded.value) {
      formValues.value = {
        title: newWikiPage.title || '',
        body: newWikiPage.body || '',
        editReason: '',
        slug: newWikiPage.slug || '',
      };
      dataLoaded.value = true;
    }
  },
  { immediate: true }
);

const submitting = ref(false);
const {
  mutate: writeWikiPage,
  loading: mutationLoading,
  error: updateError,
} = useMutation(WriteWikiPageDocument);
const isUpdating = computed(() => submitting.value || mutationLoading.value);

async function handleSubmit() {
  if (
    isUpdating.value ||
    !forumId.value ||
    !usernameVar.value ||
    !wikiPage.value ||
    loading.value ||
    wikiEditBlockedBySuspension.value ||
    wikiEditBlockedByLock.value
  )
    return;
  if (!formValues.value.title || !formValues.value.body) return;
  const submittedForum = forumId.value;
  const submittedSlug = slug.value;
  const pageId = wikiPage.value.id;
  submitting.value = true;
  try {
    const result = await writeWikiPage(
      updateWikiPageVariables(formValues.value, submittedForum, pageId),
      {
        awaitRefetchQueries: true,
        refetchQueries: [
          {
            query: GET_CHANNEL,
            variables: wikiWriteChannelVariables(submittedForum),
          },
          {
            query: GetSiteWideWikiListDocument,
            variables: wikiWriteListVariables(submittedForum),
          },
        ],
      }
    );
    if (
      result?.data?.writeWikiPage &&
      forumId.value === submittedForum &&
      slug.value === submittedSlug
    ) {
      const target =
        submittedSlug === 'home' ? '' : `/${result.data.writeWikiPage.slug}`;
      await router.push(
        `/forums/${submittedForum}/wiki${target}?t=${Date.now()}`
      );
    }
  } catch {
    // Apollo's error ref supplies the existing form error banner.
  } finally {
    submitting.value = false;
  }
}

// Derive slug from title
function updateSlug(value: string) {
  if (!dataLoaded.value) return;

  formValues.value.slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
</script>

<template>
  <div>
    <div v-if="loading" class="flex items-center justify-center p-8">
      <LoadingSpinner size="lg" />
    </div>

    <div
      v-else-if="error"
      class="mx-auto max-w-2xl rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900 dark:text-red-200"
    >
      <p>Sorry, there was an error loading the wiki data.</p>
      <p class="mt-2 text-sm">{{ error.message }}</p>
    </div>

    <div
      v-else-if="!wikiPage || !usernameVar"
      class="mx-auto max-w-2xl p-4 text-center dark:text-white"
    >
      <p>
        This wiki page doesn't exist or you don't have permission to view it.
      </p>
      <PrimaryButton
        :label="'Go to Wiki Home'"
        @click="router.push(`/forums/${forumId}/wiki`)"
      />
    </div>
    <div v-else class="mx-auto p-4">
      <GoBack
        :to="
          slug === 'home'
            ? `/forums/${forumId}/wiki`
            : `/forums/${forumId}/wiki/${slug}`
        "
      />

      <div class="mb-6">
        <h1 class="text-2xl font-bold dark:text-white">Edit Wiki Page</h1>
      </div>

      <ErrorBanner v-if="updateError" :text="updateError.message" />
      <SuspensionNotice
        v-if="showWikiEditSuspensionNotice"
        class="mb-4"
        :message="wikiEditSuspensionMessage"
        :issue-number="suspensionIssueNumber ?? 0"
        :channel-id="suspensionChannelId"
        :suspended-until="suspendedUntil ?? undefined"
        :suspended-indefinitely="suspendedIndefinitely"
      />
      <div
        v-if="wikiPage.locked"
        class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
        data-testid="wiki-edit-locked-banner"
      >
        <div class="font-medium">This wiki page is locked.</div>
        <p v-if="wikiPage.lockReason" class="mt-1">
          Reason: {{ wikiPage.lockReason }}
        </p>
        <p v-if="!canManageWikiPageLock" class="mt-1">
          You do not have permission to edit locked wiki pages.
        </p>
      </div>

      <form
        v-if="!wikiEditBlockedBySuspension && !wikiEditBlockedByLock"
        class="space-y-6"
        @submit.prevent="handleSubmit"
      >
        <div>
          <TextInput
            id="wiki-title"
            :full-width="true"
            label="Title"
            placeholder="Enter wiki page title"
            :test-id="'title-input'"
            :value="formValues.title"
            required
            @update="
              updateSlug($event);
              formValues.title = $event;
            "
          />
        </div>

        <div>
          <TextInput
            id="wiki-slug"
            :full-width="true"
            label="URL Slug"
            placeholder="wiki-page-url-slug"
            :test-id="'slug-input'"
            :value="formValues.slug"
            :disabled="true"
            help-text="This is automatically generated from the title and will be used in the URL."
          />
        </div>

        <div>
          <TextInput
            id="wiki-edit-reason"
            :full-width="true"
            label="Edit reason"
            placeholder="Briefly describe this change"
            :test-id="'edit-reason-input'"
            :value="formValues.editReason"
            :rows="3"
            @update="formValues.editReason = $event"
          />
        </div>

        <div>
          <label
            class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Content
          </label>
          <TextEditor
            :allow-image-upload="true"
            class="my-3"
            :disable-auto-focus="false"
            :initial-value="formValues.body || ''"
            :placeholder="'Write your wiki page content here...'"
            :min-height="300"
            :rows="20"
            :test-id="'content-input'"
            @update="formValues.body = $event"
          />
        </div>

        <div class="flex justify-end">
          <PrimaryButton
            type="submit"
            :loading="isUpdating"
            :disabled="!formValues.title || !formValues.body || isUpdating"
          >
            Update Wiki Page
          </PrimaryButton>
        </div>
      </form>
    </div>
  </div>
</template>
