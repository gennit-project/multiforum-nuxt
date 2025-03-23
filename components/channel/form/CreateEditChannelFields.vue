<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import type { PropType } from "vue";
import type { ApolloError } from "@apollo/client/errors";
import ErrorBanner from "@/components/ErrorBanner.vue";
import type { CreateEditChannelFormValues } from "@/types/Channel";
import TailwindForm from "@/components/FormComponent.vue";
import { useRoute, useRouter } from "nuxt/app";
import { MAX_CHARS_IN_CHANNEL_NAME } from "@/utils/constants";

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
  {
    key: "roles",
    label: "Roles",
  },
  {
    key: "suspended-users",
    label: "User Suspensions",
  },
  {
    key: "suspended-mods",
    label: "Mod Suspensions",
  },
];

const isValidTitle = (title: string) => /^[a-zA-Z0-9_]+$/.test(title);

const titleIsInvalid = computed(
  () => !isValidTitle(props.formValues?.uniqueName || "")
);
const touched = ref(false);
const router = useRouter();

// On mounted, if in edit mode and no tab is selected, go to /basic
onMounted(() => {
  if (props.editMode && route.name === "forums-forumId-edit") {
    router.push({
      name: "forums-forumId-edit-basic",
      params: {
        forumId: props.formValues?.uniqueName,
      },
    });
  }
});

const isDropdownOpen = ref(false);

const getCurrentTabLabel = computed(() => {
  const currentTab = tabs.find(
    (tab) =>
      typeof route.name === "string" && route.name?.includes(`edit-${tab.key}`)
  );
  return currentTab?.label || "Settings";
});
</script>

<template>
  <div class="mt-4 w-full pt-0 px-0">
    <div v-if="channelLoading">Loading...</div>

    <div>
      <!-- Error Displays -->
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
        v-if="formValues && !editMode"
        form-title="Create a Forum"
        description="Forums are where you can start discussions and share content with others."
        :needs-changes="titleIsInvalid"
        :loading="createChannelLoading"
        :show-buttons-in-header="false"
        @input="touched = true"
        @submit="emit('submit')"
      >
        <FormRow
          section-title="Forum Unique Name"
          :required="!editMode"
          class="mt-4"
        >
          <template #content>
            <TextInput
              ref="titleInputRef"
              :test-id="'title-input'"
              :disabled="false"
              :value="formValues.uniqueName"
              :placeholder="'Add unique name with no spaces. Ex. forum_name'"
              :full-width="true"
              @update="$emit('updateFormValues', { uniqueName: $event })"
            />
            <CharCounter
              :current="formValues.uniqueName?.length || 0"
              :max="MAX_CHARS_IN_CHANNEL_NAME"
            />
            <p
              v-if="titleIsInvalid && touched"
              class="text-red-500 text-sm mt-2"
            >
              Title can only contain letters, numbers, and underscores.
            </p>
          </template>
        </FormRow>
      </TailwindForm>

      <TailwindForm
        v-if="formValues && editMode"
        form-title="Forum Settings"
        :needs-changes="titleIsInvalid"
        :loading="editChannelLoading"
        @input="touched = true"
        @submit="emit('submit')"
      >
        <div class="mt-5 w-full">
          <!-- Mobile Dropdown -->
          <div class="lg:hidden mb-4">
            <div class="relative">
              <button
                type="button"
                class="w-full flex items-center justify-between px-4 py-2 text-sm bg-gray-50 border border-gray-500 rounded-md dark:text-white"
                @click="isDropdownOpen = !isDropdownOpen"
                >
                <span>{{ getCurrentTabLabel }}</span>
                <i
                  class="fa-solid fa-chevron-down"
                  :class="{ 'rotate-180': isDropdownOpen }"
                ></i>
              </button>

              <ul
                v-if="isDropdownOpen"
                class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg"
              >
                <router-link
                  v-for="tab in tabs"
                  :key="tab.key"
                  :to="{
                    name: `forums-forumId-edit-${tab.key}`,
                    params: {
                      forumId: formValues.uniqueName,
                    },
                  }"
                  class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  :class="{
                    'text-blue-500 bg-gray-50 dark:bg-gray-700':
                      typeof route.name === 'string' &&
                      route.name?.includes(`edit-${tab.key}`),
                    'text-gray-700 dark:text-gray-300':
                      typeof route.name === 'string' &&
                      !route.name?.includes(`edit-${tab.key}`),
                  }"
                  @click="isDropdownOpen = false"
                >
                  {{ tab.label }}
                </router-link>
              </ul>
            </div>
          </div>

          <!-- Desktop Sidebar and Content -->
          <div class="flex w-full">
            <!-- Left Sidebar (hidden on mobile) -->
            <div
              class="hidden lg:block w-1/4 border-r border-gray-200 dark:border-gray-500 mr-4 bg-gray-50"
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
                    'dark:text-white border-r-2 border-blue-500':
                      typeof route.name === 'string' &&
                      route.name?.includes(`edit-${tab.key}`),
                    'text-gray-900':
                      typeof route.name === 'string' &&
                      route.name?.includes(`edit-${tab.key}`),
                    'text-gray-400 dark:text-gray-400 dark:hover:text-gray-300':
                      typeof route.name === 'string' &&
                      !route.name?.includes(`edit-${tab.key}`),
                  }"
                >
                  {{ tab.label }}
                </router-link>
              </ul>
            </div>

            <!-- Main Content -->
            <div class="flex-1">
              <NuxtPage
                :touched="touched"
                :title-is-invalid="titleIsInvalid"
                :form-values="formValues"
                :edit-mode="true"
                @update-form-values="emit('updateFormValues', $event)"
                @submit="$emit('submit', $event)"
              />
            </div>
          </div>
        </div>
      </TailwindForm>

      <div v-for="(error, i) in getChannelError?.graphQLErrors" :key="i">
        {{ error.message }}
      </div>
    </div>
  </div>
</template>
