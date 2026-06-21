<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import { useMutation } from '@vue/apollo-composable';
import { CREATE_WIKI_PAGE } from '@/graphQLData/channel/mutations';
import TextEditor from '@/components/TextEditor.vue';
import TextInput from '@/components/TextInput.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import GoBack from '@/components/GoBack.vue';
import SuspensionNotice from '@/components/SuspensionNotice.vue';
import { useChannelSuspensionNotice } from '@/composables/useSuspensionNotice';
import { useUsername } from '@/composables/useAuthState';

const usernameVar = useUsername();

const route = useRoute();
const router = useRouter();
const forumId = route.params.forumId as string;

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

// Create wiki page mutation
const {
  mutate: createWikiPage,
  loading: isCreating,
  error: creationError,
  onDone,
} = useMutation(CREATE_WIKI_PAGE);

// Handle form submission
function handleSubmit() {
  if (wikiEditBlockedBySuspension.value) return;
  if (!formValues.value.title || !formValues.value.body) return;
  const channelUpdateInput = {
    WikiHomePage: {
      create: {
        node: {
          title: formValues.value.title,
          body: formValues.value.body,
          editReason: formValues.value.editReason || undefined,
          slug: formValues.value.slug,
          channelUniqueName: forumId,
          VersionAuthor: {
            connect: {
              where: {
                node: {
                  username: usernameVar.value,
                },
              },
            },
          },
        },
      },
    },
  };

  createWikiPage({
    where: {
      uniqueName: forumId,
    },
    update: channelUpdateInput,
  });
}

// Handle mutation completion
onDone(() => {
  // Navigate to the wiki page with a query parameter to avoid cached data
  router.push(`/forums/${forumId}/wiki?t=${Date.now()}`);
});
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
          v-if="!wikiEditBlockedBySuspension"
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
