<script setup lang="ts">
  import { ref } from "vue";
  import { useRoute, useRouter } from "nuxt/app";
  import { useMutation } from "@vue/apollo-composable";
  import { CREATE_WIKI_PAGE } from "@/graphQLData/channel/mutations";
  import TextEditor from "@/components/TextEditor.vue";
  import TextInput from "@/components/TextInput.vue";
  import PrimaryButton from "@/components/PrimaryButton.vue";
  import ErrorBanner from "@/components/ErrorBanner.vue";
  import GoBack from "@/components/GoBack.vue";
  import { usernameVar } from "@/cache";

  const route = useRoute();
  const router = useRouter();
  const forumId = route.params.forumId as string;

  // Form data
  const formValues = ref({
    title: "",
    body: "",
    slug: ""
  });

  // Derive slug from title
  function updateSlug(value) {
    formValues.value.slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
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
    if (!formValues.value.title || !formValues.value.body) return;

    const updateInput = {
      WikiHomePage: {
        create: {
          node: {
            title: formValues.value.title,
            body: formValues.value.body,
            slug: formValues.value.slug,
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
      where: { uniqueName: forumId },
      update: updateInput,
    });
  }

  // Handle mutation completion
  onDone(() => {
    router.push(`/forums/${forumId}/wiki`);
  });
</script>

<template>
  <div class="flex justify-center">
    <div class="mt-2 w-full max-w-3xl bg-white px-2 pt-2 dark:bg-gray-800">
      <div class="mx-auto max-w-3xl p-4">
        <GoBack :to="`/forums/${forumId}/wiki`" />

        <div class="mb-6">
          <h1 class="text-2xl font-bold dark:text-white">Create Wiki Page</h1>
          <p class="text-gray-600 dark:text-gray-300">This will be the home page for your wiki.</p>
        </div>

        <ErrorBanner
          v-if="creationError"
          :error="creationError"
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
              placeholder="wiki-home"
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
              :test-id="'content-input'"
              @update="formValues.body = $event"
            />
          </div>

          <div class="flex justify-end">
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
  </div>
</template>
