<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import type { PropType } from "vue";
import type { ApolloError } from "@apollo/client/errors";
import ErrorBanner from "@/components/ErrorBanner.vue";
import type { CreateEditChannelFormValues } from "@/types/Channel";
import TailwindForm from "@/components/FormComponent.vue";
import { useRoute, useRouter } from "nuxt/app";

const route = useRoute();
const props = defineProps({
  editMode: {
    type: Boolean,
    required: true,
  },
  createChannelError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  createChannelLoading: {
    type: Boolean,
    default: false,
  },
  editChannelLoading: {
    type: Boolean,
    default: false,
  },
  formValues: {
    type: Object as PropType<CreateEditChannelFormValues | null>,
    required: false,
    default: null,
  },
  getChannelError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  updateChannelError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  channelLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["submit", "updateFormValues"]);

const CHANNEL_ALREADY_EXISTS_ERROR = "Constraint validation failed";

const tabs = [
  {
    key: "basic",
    label: "Basic Settings",
  },
  {
    key: "rules",
    label: "Rules",
  },
  {
    key: "mods",
    label: "Moderators",
  },
  {
    key: "owners",
    label: "Forum Admins",
  },
];

const isValidTitle = (title: string) => /^[a-zA-Z0-9_]+$/.test(title);

const titleIsInvalid = computed(
  () => !isValidTitle(props.formValues?.uniqueName || "")
);
const touched = ref(false);
const router = useRouter();

// On mounted, if no tab is selected, go to /basic
onMounted(() => {
  if (route.name === "forums-forumId-edit") {
    router.push({
      name: "forums-forumId-edit-basic",
      params: {
        forumId: props.formValues?.uniqueName,
      },
    })
  }
});
</script>

<template>
  <div class="mt-4 w-full pt-0 px-0">
    <div v-if="channelLoading">Loading...</div>

    <div>
      <div v-if="updateChannelError" class="mt-6">
        <ErrorBanner :text="updateChannelError.message" />
      </div>
      <div v-if="getChannelError">
        <ErrorBanner
          v-for="(error, i) in getChannelError?.graphQLErrors"
          :key="i"
          :text="error.message"
        />
      </div>
      <div v-if="createChannelError">
        <ErrorBanner
          v-for="(error, i) in createChannelError?.graphQLErrors"
          :key="i"
          :text="`${error.message.split(CHANNEL_ALREADY_EXISTS_ERROR).join('Channel name is already taken')}`"
        />
      </div>

      <TailwindForm
        v-if="formValues"
        :form-title="editMode ? 'Forum Settings' : 'Create a Forum'"
        :description="'Forums are where you can start discussions and share content with others.'"
        :needs-changes="titleIsInvalid"
        :loading="createChannelLoading || editChannelLoading"
        @input="touched = true"
        @submit="emit('submit')"
      >
        <div class="mt-5 flex w-full">
          <div
            class="w-1/4 border-r border-gray-200 dark:border-gray-500 mr-4 bg-gray-50"
          >
            <ul class="flex flex-col space-y-2">
              <router-link
                v-for="tab in tabs"
                :key="tab.key"
                :to="{
                  name: `forums-forumId-edit-${tab.key}`,
                  params: {
                    forumId: formValues.uniqueName,
                  },
                }"
                class="py-2 cursor-pointer"
                :class="{
                  'dark:text-white border-r-2 border-blue-500': typeof route.name === 'string' && route.name?.includes(tab.key),
                  'text-gray-900 ': typeof route.name === 'string' && route.name?.includes(tab.key),
                  'text-gray-400 dark:text-gray-400 dark:hover:text-gray-300': typeof route.name === 'string' && !route.name?.includes(tab.key),
                }"
              >
                {{ tab.label }}
              </router-link>
            </ul>
          </div>
          <div class="flex-1">
            <NuxtPage
              :touched="touched"
              :title-is-invalid="titleIsInvalid"
              :form-values="formValues"
              :edit-mode="editMode"
              @update-form-values="emit('updateFormValues', $event)"
              @submit="$emit('submit', $event)"
            />
          </div>
        </div>
      </TailwindForm>
      <div v-for="(error, i) in getChannelError?.graphQLErrors" :key="i">
        {{ error.message }}
      </div>
    </div>
  </div>
</template>
