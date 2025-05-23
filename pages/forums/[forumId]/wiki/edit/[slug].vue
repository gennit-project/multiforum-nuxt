<script setup lang="ts">
  import { ref, computed, watch } from "vue";
  import { useRoute, useRouter } from "nuxt/app";
  import { useMutation, useQuery } from "@vue/apollo-composable";
  import { GET_WIKI_PAGE, GET_CHANNEL } from "@/graphQLData/channel/queries";
  import { UPDATE_WIKI_PAGE, UPDATE_CHANNEL } from "@/graphQLData/channel/mutations";
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
  const slug = route.params.slug as string;

  // Determine if we're editing the home page
  const isHomePage = computed(() => slug === "home");

  // Query wiki page data for non-home pages
  const {
    result: wikiPageResult,
    loading: wikiPageLoading,
    error: wikiPageError,
  } = useQuery(
    GET_WIKI_PAGE,
    { channelUniqueName: forumId, slug: slug },
    {
      errorPolicy: "all",
      enabled: !isHomePage.value, // Only run this query for non-home pages
    }
  );

  // Query channel data for home page
  const {
    result: channelResult,
    loading: channelLoading,
    error: channelError,
  } = useQuery(
    GET_CHANNEL,
    { uniqueName: forumId },
    {
      errorPolicy: "all",
      enabled: isHomePage.value, // Only run this query for home page
    }
  );

  // Computed property for the wiki page data
  const wikiPage = computed(() => {
    if (isHomePage.value) {
      return channelResult.value?.channels[0]?.WikiHomePage;
    } else {
      return wikiPageResult.value?.wikiPages[0];
    }
  });

  // Computed loading and error states
  const loading = computed(() => {
    return isHomePage.value ? channelLoading.value : wikiPageLoading.value;
  });

  const error = computed(() => {
    return isHomePage.value ? channelError.value : wikiPageError.value;
  });

  // Form data
  const formValues = ref({
    title: "",
    body: "",
    slug: "",
  });

  // Initialize form with existing wiki data when available
  const dataLoaded = ref(false);
  watch(
    wikiPage,
    (newWikiPage) => {
      if (newWikiPage && !dataLoaded.value) {
        formValues.value = {
          title: newWikiPage.title || "",
          body: newWikiPage.body || "",
          slug: newWikiPage.slug || "",
        };
        dataLoaded.value = true;
      }
    },
    { immediate: true }
  );

  // Update wiki page mutation (for non-home pages)
  const {
    mutate: updateWikiPage,
    loading: isUpdatingWikiPage,
    error: updateWikiPageError,
    onDone: onWikiPageDone,
  } = useMutation(UPDATE_WIKI_PAGE);

  // Update channel mutation (for home page)
  const {
    mutate: updateChannel,
    loading: isUpdatingChannel,
    error: updateChannelError,
    onDone: onChannelDone,
  } = useMutation(UPDATE_CHANNEL);

  // Computed loading and error states for mutations
  const isUpdating = computed(() => {
    return isHomePage.value ? isUpdatingChannel.value : isUpdatingWikiPage.value;
  });

  const updateError = computed(() => {
    return isHomePage.value ? updateChannelError.value : updateWikiPageError.value;
  });

  // Handle form submission
  function handleSubmit() {
    if (!formValues.value.title || !formValues.value.body) return;

    if (isHomePage.value) {
      // Update home page via channel
      const updateInput = {
        WikiHomePage: {
          update: {
            node: {
              title: formValues.value.title,
              body: formValues.value.body,
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

      updateChannel({
        where: {
          uniqueName: forumId,
        },
        update: updateInput,
      });
    } else {
      // Update regular wiki page
      const updateInput = {
        title: formValues.value.title,
        body: formValues.value.body,
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

      updateWikiPage({
        where: {
          channelUniqueName: forumId,
          slug: slug,
        },
        update: updateInput,
      });
    }
  }

  // Derive slug from title
  function updateSlug(value) {
    if (!dataLoaded.value) return;

    formValues.value.slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // Handle mutation completion
  const handleDone = () => {
    // Navigate back to the correct wiki page based on the slug
    if (slug === "home") {
      // Navigate to wiki home page
      router.push(`/forums/${forumId}/wiki?t=${Date.now()}`);
    } else {
      // Navigate to the child wiki page
      router.push(`/forums/${forumId}/wiki/${slug}?t=${Date.now()}`);
    }
  };

  onWikiPageDone(handleDone);
  onChannelDone(handleDone);
</script>

<template>
  <div>
    <div
      v-if="loading"
      class="flex items-center justify-center p-8"
    >
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
      v-else-if="!wikiPage"
      class="mx-auto max-w-2xl p-4 text-center dark:text-white"
    >
      <p>This wiki page doesn't exist or you don't have permission to view it.</p>
      <PrimaryButton
        :label="'Go to Wiki Home'"
        @click="router.push(`/forums/${forumId}/wiki`)"
      >
      </PrimaryButton>
    </div>

    <div
      v-else
      class="mx-auto max-w-3xl p-4"
    >
      <GoBack
        :to="slug === 'home' ? `/forums/${forumId}/wiki` : `/forums/${forumId}/wiki/${slug}`"
      />

      <div class="mb-6">
        <h1 class="text-2xl font-bold dark:text-white">Edit Wiki Page</h1>
      </div>

      <ErrorBanner
        v-if="updateError"
        :text="updateError.message"
      />

      <form
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
