<script setup lang="ts">
import {
  WriteWikiPageDocument,
  GetSiteWideWikiListDocument,
  GetChannelDocument as GET_CHANNEL,
} from '@/__generated__/operations';
import {
  createWikiHomeVariables,
  wikiWriteListVariables,
  wikiWriteChannelVariables,
} from '@/utils/wikiWrites';
import { computed, ref } from 'vue';
import { DateTime } from 'luxon';
import { useRoute, useRouter } from 'nuxt/app';
import { useMutation, useQuery } from '@vue/apollo-composable';
import TextEditor from '@/components/TextEditor.vue';
import TextInput from '@/components/TextInput.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import InfoBanner from '@/components/InfoBanner.vue';
import GoBack from '@/components/GoBack.vue';
import SuspensionNotice from '@/components/SuspensionNotice.vue';
import { useChannelSuspensionNotice } from '@/composables/useSuspensionNotice';
import { useUsername } from '@/composables/useAuthState';

const usernameVar = useUsername();

const route = useRoute();
const router = useRouter();
const forumId = computed(() =>
  typeof route.params.forumId === 'string' ? route.params.forumId : ''
);

// Form data
const formValues = ref({
  title: '',
  body: '',
  editReason: '',
  slug: 'home', // Default slug for the wiki home page
});

const {
  activeSuspension,
  issueNumber: suspensionIssueNumber,
  suspendedUntil,
  suspendedIndefinitely,
  channelId: suspensionChannelId,
} = useChannelSuspensionNotice(forumId);

// A forum can turn its wiki off; the create page should explain that rather
// than rendering an editor whose submit the backend will reject. Reuse the
// forum layout's channel query (cache-first) to read the flag.
const { result: channelResult, loading: channelLoading } = useQuery(
  GET_CHANNEL,
  computed(() => ({
    uniqueName: forumId.value,
    now: DateTime.utc().startOf('hour').toISO(),
  })),
  {
    fetchPolicy: 'cache-first',
    enabled: computed(() => !!forumId.value),
  }
);

const wikiDisabled = computed(
  () => channelResult.value?.channels?.[0]?.wikiEnabled === false
);

const wikiEditBlockedBySuspension = computed(() => {
  return !!usernameVar.value && !!activeSuspension.value;
});

const showWikiEditSuspensionNotice = computed(() => {
  return wikiEditBlockedBySuspension.value && !!suspensionIssueNumber.value;
});

const wikiEditSuspensionMessage =
  'You are suspended in this forum and cannot create wiki pages.';

// No need to derive slug for home page as it's always "home"
function updateSlug() {
  // We're keeping the slug as "home" for the wiki home page
  // This is intentional - the home page must have the slug "home"
}

const submitting = ref(false);
const {
  mutate: writeWikiPage,
  loading: mutationLoading,
  error: creationError,
} = useMutation(WriteWikiPageDocument);
const isCreating = computed(() => submitting.value || mutationLoading.value);

async function handleSubmit() {
  if (
    isCreating.value ||
    !forumId.value ||
    !usernameVar.value ||
    wikiEditBlockedBySuspension.value
  )
    return;
  if (
    !channelResult.value?.channels[0] ||
    wikiDisabled.value ||
    channelLoading.value
  )
    return;
  if (!formValues.value.title || !formValues.value.body) return;
  const submittedForum = forumId.value;
  submitting.value = true;
  try {
    const result = await writeWikiPage(
      createWikiHomeVariables(formValues.value, submittedForum),
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
    if (result?.data?.writeWikiPage && forumId.value === submittedForum) {
      await router.push(`/forums/${submittedForum}/wiki?t=${Date.now()}`);
    }
  } catch {
    // Apollo's error ref supplies the existing form error banner.
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="flex justify-center">
    <div class="mt-2 w-full max-w-3xl bg-white px-2 pt-2 dark:bg-gray-800">
      <div class="mx-auto max-w-3xl p-4">
        <GoBack :to="`/forums/${forumId}/wiki`" />

        <div class="mb-6">
          <h1 class="text-2xl font-bold dark:text-white">Create Wiki Page</h1>
          <p class="text-gray-600 dark:text-gray-300">
            This will be the home page for your wiki.
          </p>
        </div>

        <ErrorBanner v-if="creationError" :text="creationError.message" />
        <InfoBanner
          v-if="wikiDisabled"
          data-testid="wiki-disabled-banner"
          text="The wiki is disabled in this forum, so wiki pages cannot be created. A forum owner can enable it in the forum's settings."
        />
        <SuspensionNotice
          v-if="showWikiEditSuspensionNotice"
          class="mb-4"
          :message="wikiEditSuspensionMessage"
          :issue-number="suspensionIssueNumber ?? 0"
          :channel-id="suspensionChannelId"
          :suspended-until="suspendedUntil ?? undefined"
          :suspended-indefinitely="suspendedIndefinitely"
        />

        <form
          v-if="!wikiEditBlockedBySuspension && !wikiDisabled"
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
                updateSlug();
                formValues.title = $event;
              "
            />
          </div>

          <div>
            <TextInput
              id="wiki-slug"
              :full-width="true"
              label="URL Slug"
              placeholder="wiki-home"
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
              :test-id="'content-input'"
              @update="formValues.body = $event"
            />
          </div>

          <div class="flex justify-end">
            <PrimaryButton
              type="submit"
              :label="' Create Wiki Page'"
              :loading="isCreating"
              :disabled="!formValues.title || !formValues.body || isCreating"
            />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
