<script setup lang="ts">
  import { ref, computed } from "vue";
  import { useRoute, useRouter } from "nuxt/app";
  import { useMutation, useQuery } from "@vue/apollo-composable";
  import { GET_CHANNEL } from "@/graphQLData/channel/queries";
  import { CREATE_CHILD_WIKI_PAGE } from "@/graphQLData/channel/mutations";
  import TextEditor from "@/components/TextEditor.vue";
  import TextInput from "@/components/TextInput.vue";
  import PrimaryButton from "@/components/PrimaryButton.vue";
  import ErrorBanner from "@/components/ErrorBanner.vue";
  import GoBack from "@/components/GoBack.vue";
  import { usernameVar } from "@/cache";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";

  const route = useRoute();
  const router = useRouter();
  const forumId = route.params.forumId as string;

  // Query channel to get the wiki home page
  const {
    result: channelResult,
    loading: channelLoading,
    error: channelError,
  } = useQuery(GET_CHANNEL, { uniqueName: forumId }, { errorPolicy: "all" });

  // Computed property for the channel data
  const channel = computed(() => channelResult.value?.channels[0]);
  const wikiHomePage = computed(() => channel.value?.WikiHomePage);

  // Form data
  const formValues = ref({
    title: "",
    body: "",
    slug: "",
  });

  // Create child wiki page mutation
  const {
    mutate: createChildWikiPage,
    loading: isCreating,
    error: createError,
    onDone,
  } = useMutation(CREATE_CHILD_WIKI_PAGE);

  // Handle form submission
  function handleSubmit() {
    if (!formValues.value.title || !formValues.value.body || !wikiHomePage.value) return;

    const childPageInput = {
      title: formValues.value.title,
      body: formValues.value.body,
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
    };

    createChildWikiPage({
      where: {
        id: wikiHomePage.value.id, // Connect by parent page ID
      },
      update: {
        ChildPages: {
          create: [
            {
              node: childPageInput,
            },
          ],
        },
      },
    });
  }

  // Derive slug from title
  function updateSlug(value: string) {
    formValues.value.slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // Handle mutation completion
  onDone(() => {
    // Navigate back to wiki home page
    router.push(`/forums/${forumId}/wiki?t=${Date.now()}`);
  });

  // Check if wiki is enabled
  const wikiEnabled = computed(() => channel.value?.wikiEnabled);

  // Check if we have a wiki home page
  const hasWikiHomePage = computed(() => !!wikiHomePage.value);
</script>

<template>
  <div>
    <div
      v-if="channelLoading"
      class="flex items-center justify-center p-8"
    >
      <LoadingSpinner size="lg" />
    </div>

    <div
      v-else-if="channelError"
      class="mx-auto max-w-2xl rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900 dark:text-red-200"
    >
      <p>Sorry, there was an error loading the channel data.</p>
      <p class="mt-2 text-sm">{{ channelError.message }}</p>
    </div>

    <div
      v-else-if="!wikiEnabled"
      class="mx-auto max-w-2xl p-4 text-center dark:text-white"
    >
      <p>The wiki feature is not enabled for this forum.</p>
      <PrimaryButton
        :label="'Go Back'"
        @click="router.push(`/forums/${forumId}/wiki`)"
      />
    </div>

    <div
      v-else-if="!hasWikiHomePage"
      class="mx-auto max-w-2xl p-4 text-center dark:text-white"
    >
      <p class="mb-4 text-lg">
        You need to create a wiki home page first before adding child pages.
      </p>
      <div class="space-x-4">
        <PrimaryButton
          :label="'Create Wiki Home Page'"
          @click="router.push(`/forums/${forumId}/wiki/create`)"
        />
        <PrimaryButton
          :label="'Go Back'"
          @click="router.push(`/forums/${forumId}/wiki`)"
        />
      </div>
    </div>

    <div
      v-else
      class="mx-auto max-w-3xl p-4"
    >
      <GoBack :to="`/forums/${forumId}/wiki`" />

      <div class="mb-6">
        <h1 class="text-2xl font-bold dark:text-white">Add Wiki Page</h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Create a new page in the {{ channel.displayName || forumId }} wiki.
        </p>
      </div>

      <ErrorBanner
        v-if="createError"
        :text="createError.message"
      />

      <form
        class="space-y-6"
        @submit.prevent="handleSubmit"
      >
        <div>
          <TextInput
            id="wiki-title"
            :full-width="true"
            label="Page Title"
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
          <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
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

        <div class="flex justify-end space-x-3">
          <PrimaryButton
            type="button"
            :label="'Cancel'"
            @click="router.push(`/forums/${forumId}/wiki`)"
          />
          <PrimaryButton
            type="submit"
            :loading="isCreating"
            :disabled="!formValues.title || !formValues.body || isCreating"
          >
            Create Wiki Page
          </PrimaryButton>
        </div>
      </form>
    </div>
  </div>
</template>
