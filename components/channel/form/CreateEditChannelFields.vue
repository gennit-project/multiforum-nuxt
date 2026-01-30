<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import type { PropType } from 'vue';
import type { ApolloError } from '@apollo/client/errors';
import ErrorBanner from '@/components/ErrorBanner.vue';
import SuspensionNotice from '@/components/SuspensionNotice.vue';
import type { CreateEditChannelFormValues } from '@/types/Channel';
import TailwindForm from '@/components/FormComponent.vue';
import { useRoute, useRouter } from 'nuxt/app';
import { MAX_CHARS_IN_CHANNEL_NAME } from '@/utils/constants';
// Server config query removed since individual settings pages handle validation

// Import icons
import CogIcon from '@/components/icons/CogIcon.vue';
import BookIcon from '@/components/icons/BookIcon.vue';
import UserAddIcon from '@/components/icons/UserAddIcon.vue';
import IdentificationIcon from '@/components/icons/IdentificationIcon.vue';
import UserMinus from '@/components/icons/UserMinus.vue';
import PencilIcon from '@/components/icons/PencilIcon.vue';
import CalendarIcon from '@/components/icons/CalendarIcon.vue';
import AnnotationIcon from '@/components/icons/AnnotationIcon.vue';
import DownloadIcon from '@/components/icons/DownloadIcon.vue';

interface TabItem {
  key: string;
  label: string;
  icon: any | null;
  fontAwesome: string | null;
}

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
  submitError: {
    type: String,
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
  suspensionIssueNumber: {
    type: Number,
    default: null,
  },
  suspensionChannelId: {
    type: String,
    default: '',
  },
  suspensionUntil: {
    type: String,
    default: null,
  },
  suspensionIndefinitely: {
    type: Boolean,
    default: false,
  },
  ownerList: {
    type: Array,
    default: () => [],
  },
  hasPermission: {
    type: Boolean,
    default: true,
  },
  dataLoaded: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit', 'updateFormValues']);

const CHANNEL_ALREADY_EXISTS_ERROR = 'Constraint validation failed';

const tabs = computed(() => {
  const baseTabs: TabItem[] = [
    {
      key: 'basic',
      label: 'Basic Settings',
      icon: CogIcon,
      fontAwesome: null,
    },
    {
      key: 'rules',
      label: 'Rules',
      icon: BookIcon,
      fontAwesome: null,
    },
  ];

  // Always show events and downloads tabs
  baseTabs.push({
    key: 'events',
    label: 'Calendar',
    icon: CalendarIcon,
    fontAwesome: null,
  });

  baseTabs.push({
    key: 'downloads',
    label: 'Downloads',
    icon: DownloadIcon,
    fontAwesome: null,
  });

  baseTabs.push({
    key: 'pipelines',
    label: 'Pipelines',
    icon: null,
    fontAwesome: 'fa-solid fa-diagram-project',
  });

  baseTabs.push({
    key: 'plugins',
    label: 'Plugins',
    icon: null,
    fontAwesome: 'fa-solid fa-plug',
  });

  baseTabs.push(
    {
      key: 'feedback',
      label: 'Feedback',
      icon: AnnotationIcon,
      fontAwesome: null,
    },
    {
      key: 'wiki-settings',
      label: 'Wiki Settings',
      icon: PencilIcon,
      fontAwesome: null,
    },
    {
      key: 'mods',
      label: 'Moderators',
      icon: UserAddIcon,
      fontAwesome: null,
    },
    {
      key: 'owners',
      label: 'Forum Admins',
      icon: null,
      fontAwesome: 'fa-solid fa-user-shield',
    },
    {
      key: 'roles',
      label: 'Roles',
      icon: IdentificationIcon,
      fontAwesome: null,
    },
    {
      key: 'suspended-users',
      label: 'User Suspensions',
      icon: UserMinus,
      fontAwesome: null,
    },
    {
      key: 'suspended-mods',
      label: 'Mod Suspensions',
      icon: UserMinus,
      fontAwesome: null,
    }
  );

  return baseTabs;
});

const isValidTitle = (title: string) => /^[a-zA-Z0-9_]+$/.test(title);

const titleIsInvalid = computed(() => {
  // In edit mode, don't consider title invalid until we have loaded data
  if (props.editMode && !props.formValues?.uniqueName) {
    return false;
  }
  return !isValidTitle(props.formValues?.uniqueName || '');
});
const touched = ref(false);
const titleInputRef = ref<{ focus: () => void } | null>(null);
const router = useRouter();
const forumId = computed(() => {
  if (typeof route.params.forumId === 'string') {
    return route.params.forumId;
  }
  return '';
});

// On mounted, if in edit mode and no tab is selected, go to /basic
onMounted(() => {
  if (props.editMode && route.name === 'forums-forumId-edit') {
    router.push({
      name: 'forums-forumId-edit-basic',
      params: {
        forumId: forumId.value,
      },
    });
  }
  // Auto-focus the forum unique name field in create mode
  if (!props.editMode && titleInputRef.value?.focus) {
    titleInputRef.value.focus();
  }
});

const isDropdownOpen = ref(false);

const getCurrentTabLabel = computed(() => {
  const currentTab = tabs.value.find(
    (tab) =>
      typeof route.name === 'string' && route.name?.includes(`edit-${tab.key}`)
  );
  return currentTab?.label || 'Settings';
});
</script>

<template>
  <div class="mt-4 w-full px-0 pt-0">
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
      <ErrorBanner v-if="submitError" :text="submitError" />
      <SuspensionNotice
        v-if="suspensionIssueNumber && suspensionChannelId"
        class="mt-2"
        :issue-number="suspensionIssueNumber"
        :channel-id="suspensionChannelId"
        :suspended-until="suspensionUntil"
        :suspended-indefinitely="suspensionIndefinitely"
        :message="'You have an active suspension and cannot create forums.'"
      />

      <TailwindForm
        v-if="formValues && !editMode"
        description="Forums are where you can start discussions and share content with others."
        form-title="Create a Forum"
        :loading="createChannelLoading"
        :needs-changes="titleIsInvalid"
        :show-buttons-in-header="false"
        @input="touched = true"
        @submit="emit('submit')"
      >
        <FormRow
          class="mt-4"
          :required="!editMode"
          section-title="Forum Unique Name"
        >
          <template #content>
            <TextInput
              ref="titleInputRef"
              :disabled="false"
              :full-width="true"
              :placeholder="'Add unique name with no spaces. Ex. forum_name'"
              :test-id="'title-input'"
              :value="formValues.uniqueName"
              @update="$emit('updateFormValues', { uniqueName: $event })"
            />
            <CharCounter
              :current="formValues.uniqueName?.length || 0"
              :max="MAX_CHARS_IN_CHANNEL_NAME"
            />
            <p
              v-if="titleIsInvalid && touched"
              class="mt-2 text-sm text-red-500"
            >
              Title can only contain letters, numbers, and underscores.
            </p>
          </template>
        </FormRow>
      </TailwindForm>

      <TailwindForm
        v-if="formValues && editMode"
        form-title="Forum Settings"
        :loading="editChannelLoading"
        :needs-changes="titleIsInvalid"
        :show-cancel-button="false"
        @input="touched = true"
        @submit="emit('submit')"
      >
        <div class="mt-5 w-full">
          <!-- Mobile Dropdown -->
          <div class="mb-4 lg:hidden">
            <div class="relative">
              <button
                class="bg-gray-50 flex w-full items-center justify-between rounded-md border border-gray-300 px-4 py-2 text-sm dark:text-white"
                type="button"
                @click="isDropdownOpen = !isDropdownOpen"
              >
                <div class="flex items-center">
                  <!-- For Font Awesome icons -->
                  <i
                    v-if="
                      tabs.find(
                        (tab) =>
                          typeof route.name === 'string' &&
                          route.name?.includes(`edit-${tab.key}`)
                      )?.fontAwesome
                    "
                    :class="[
                      tabs.find(
                        (tab) =>
                          typeof route.name === 'string' &&
                          route.name?.includes(`edit-${tab.key}`)
                      )?.fontAwesome,
                      'mr-2 text-orange-500',
                    ]"
                  />
                  <!-- For component icons -->
                  <component
                    :is="
                      tabs.find(
                        (tab) =>
                          typeof route.name === 'string' &&
                          route.name?.includes(`edit-${tab.key}`)
                      )?.icon
                    "
                    v-else-if="
                      tabs.find(
                        (tab) =>
                          typeof route.name === 'string' &&
                          route.name?.includes(`edit-${tab.key}`)
                      )?.icon
                    "
                    class="mr-2 h-5 w-5 text-orange-500"
                  />
                  <span>{{ getCurrentTabLabel }}</span>
                </div>
                <i
                  class="fa-solid fa-chevron-down"
                  :class="{ 'rotate-180': isDropdownOpen }"
                />
              </button>

              <ul
                v-if="isDropdownOpen"
                class="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg dark:bg-gray-800"
              >
                <li v-for="tab in tabs" :key="tab.key">
                  <router-link
                    class="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    :class="{
                      'bg-gray-50 text-orange-500 dark:bg-gray-700':
                        typeof route.name === 'string' &&
                        route.name?.includes(`edit-${tab.key}`),
                      'text-gray-700 dark:text-gray-300':
                        typeof route.name === 'string' &&
                        !route.name?.includes(`edit-${tab.key}`),
                    }"
                    :to="{
                      name: `forums-forumId-edit-${tab.key}`,
                      params: {
                        forumId,
                      },
                    }"
                    @click="isDropdownOpen = false"
                  >
                    <!-- For Font Awesome icons -->
                    <i
                      v-if="tab.fontAwesome"
                      :class="[
                        tab.fontAwesome,
                        'mr-2',
                        {
                          'text-orange-500':
                            typeof route.name === 'string' &&
                            route.name?.includes(`edit-${tab.key}`),
                          'text-gray-400 dark:text-gray-400':
                            typeof route.name === 'string' &&
                            !route.name?.includes(`edit-${tab.key}`),
                        },
                      ]"
                    />
                    <!-- For component icons -->
                    <component
                      :is="tab.icon"
                      v-else-if="tab.icon"
                      class="mr-2 h-5 w-5"
                      :class="{
                        'text-orange-500':
                          typeof route.name === 'string' &&
                          route.name?.includes(`edit-${tab.key}`),
                        'text-gray-400 dark:text-gray-400':
                          typeof route.name === 'string' &&
                          !route.name?.includes(`edit-${tab.key}`),
                      }"
                    />
                    {{ tab.label }}
                  </router-link>
                </li>
              </ul>
            </div>
          </div>

          <!-- Desktop Sidebar and Content -->
          <div class="flex w-full">
            <!-- Left Sidebar (hidden on mobile) -->
            <div
              class="bg-gray-50 mr-4 hidden w-1/4 border-r border-gray-300 dark:border-gray-300 lg:block"
            >
              <ul class="flex flex-col space-y-2">
                <li v-for="tab in tabs" :key="tab.key">
                  <router-link
                    class="flex cursor-pointer items-center py-2 text-sm"
                    :class="{
                      'border-r-2 border-orange-500 dark:text-white':
                        typeof route.name === 'string' &&
                        route.name?.includes(`edit-${tab.key}`),
                      'text-gray-900':
                        typeof route.name === 'string' &&
                        route.name?.includes(`edit-${tab.key}`),
                      'text-gray-400 dark:text-gray-400 dark:hover:text-gray-300':
                        typeof route.name === 'string' &&
                        !route.name?.includes(`edit-${tab.key}`),
                    }"
                    :to="{
                      name: `forums-forumId-edit-${tab.key}`,
                      params: {
                        forumId,
                      },
                    }"
                  >
                    <!-- For Font Awesome icons -->
                    <i
                      v-if="tab.fontAwesome"
                      :class="[
                        tab.fontAwesome,
                        'mr-2',
                        {
                          'text-orange-500':
                            typeof route.name === 'string' &&
                            route.name?.includes(`edit-${tab.key}`),
                          'text-gray-400 dark:text-gray-400':
                            typeof route.name === 'string' &&
                            !route.name?.includes(`edit-${tab.key}`),
                        },
                      ]"
                    />
                    <!-- For component icons -->
                    <component
                      :is="tab.icon"
                      v-else-if="tab.icon"
                      class="mr-2 h-4 w-4"
                      :class="{
                        'text-orange-500':
                          typeof route.name === 'string' &&
                          route.name?.includes(`edit-${tab.key}`),
                        'text-gray-400 dark:text-gray-400':
                          typeof route.name === 'string' &&
                          !route.name?.includes(`edit-${tab.key}`),
                      }"
                    />
                    {{ tab.label }}
                  </router-link>
                </li>
              </ul>
            </div>

            <!-- Main Content -->
            <div class="flex-1">
              <!-- Loading state while checking permissions -->
              <div
                v-if="!dataLoaded"
                class="p-8 text-center text-gray-500 dark:text-gray-400"
              >
                <i class="fa-solid fa-spinner mr-2 animate-spin" />
                Loading...
              </div>
              <!-- Permission denied message -->
              <div
                v-else-if="!hasPermission"
                class="bg-yellow-50 m-4 rounded-lg p-6 dark:bg-yellow-900/20"
              >
                <div class="flex items-start">
                  <i class="fa-solid fa-lock mr-3 mt-0.5 text-yellow-500" />
                  <div>
                    <h3
                      class="text-sm font-medium text-yellow-800 dark:text-yellow-200"
                    >
                      Permission Required
                    </h3>
                    <p
                      class="mt-1 text-sm text-yellow-700 dark:text-yellow-300"
                    >
                      You don't have permission to edit this forum's settings.
                      Only forum admins can access this page.
                    </p>
                  </div>
                </div>
              </div>
              <!-- Normal content when user has permission -->
              <NuxtPage
                v-else
                :edit-mode="true"
                :form-values="formValues"
                :title-is-invalid="titleIsInvalid"
                :touched="touched"
                :owner-list="ownerList"
                @submit="$emit('submit', $event)"
                @update-form-values="emit('updateFormValues', $event)"
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
