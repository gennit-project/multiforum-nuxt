<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import type { PropType } from 'vue';
import type { ApolloError } from '@apollo/client/errors';
import type { ServerConfigUpdateInput } from '@/__generated__/graphql';
import ErrorBanner from '@/components/ErrorBanner.vue';
import TailwindForm from '@/components/FormComponent.vue';
import { useRoute, useRouter } from 'nuxt/app';

// Import icons
import CogIcon from '@/components/icons/CogIcon.vue';
import BookIcon from '@/components/icons/BookIcon.vue';
import DownloadIcon from '@/components/icons/DownloadIcon.vue';
import CalendarIcon from '@/components/icons/CalendarIcon.vue';

const props = defineProps({
  editMode: {
    type: Boolean,
    required: true,
  },
  createServerError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  createServerLoading: {
    type: Boolean,
    default: false,
  },
  editServerLoading: {
    type: Boolean,
    default: false,
  },
  formValues: {
    type: Object as PropType<ServerConfigUpdateInput | null>,
    required: false,
    default: null,
  },
  getServerError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  updateServerError: {
    type: Object as PropType<ApolloError | null>,
    default: null,
  },
  serverLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit', 'updateFormValues']);

const route = useRoute();
const router = useRouter();

const tabs = [
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
  {
    key: 'calendar',
    label: 'Calendar Settings',
    icon: CalendarIcon,
    fontAwesome: null,
  },
  {
    key: 'downloads',
    label: 'Download Settings',
    icon: DownloadIcon,
    fontAwesome: null,
  },
];

const isDropdownOpen = ref(false);

// On mounted, if in edit mode and no tab is selected, go to /basic
onMounted(() => {
  if (props.editMode && route.name === 'admin-settings') {
    router.push({
      name: 'admin-settings-basic',
    });
  }
});

const getCurrentTabLabel = computed(() => {
  const currentTab = tabs.find(
    (tab) =>
      typeof route.name === 'string' &&
      route.name?.includes(`settings-${tab.key}`)
  );
  return currentTab?.label || 'Settings';
});
</script>

<template>
  <div class="mt-4 w-full px-0 pt-0">
    <div v-if="serverLoading">Loading...</div>

    <div>
      <!-- Error Displays -->
      <div v-if="updateServerError" class="mt-6">
        <ErrorBanner :text="updateServerError.message" />
        <ErrorBanner
          v-for="(error, i) in updateServerError?.graphQLErrors"
          :key="i"
          :text="error.message"
        />
      </div>
      <div v-if="getServerError">
        <ErrorBanner
          v-for="(error, i) in getServerError?.graphQLErrors"
          :key="i"
          :text="error.message"
        />
      </div>
      <div v-if="createServerError">
        <ErrorBanner
          v-for="(error, i) in createServerError?.graphQLErrors"
          :key="i"
          :text="error.message"
        />
      </div>

      <TailwindForm
        v-if="formValues && editMode"
        form-title="Server Settings"
        :loading="editServerLoading"
        :needs-changes="false"
        :show-cancel-button="false"
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
                          route.name?.includes(`settings-${tab.key}`)
                      )?.fontAwesome
                    "
                    :class="[
                      tabs.find(
                        (tab) =>
                          typeof route.name === 'string' &&
                          route.name?.includes(`settings-${tab.key}`)
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
                          route.name?.includes(`settings-${tab.key}`)
                      )?.icon
                    "
                    v-else-if="
                      tabs.find(
                        (tab) =>
                          typeof route.name === 'string' &&
                          route.name?.includes(`settings-${tab.key}`)
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
                <li
                  v-for="tab in tabs"
                  :key="tab.key"
                >
                  <router-link
                    class="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    :class="{
                      'bg-gray-50 text-orange-500 dark:bg-gray-700':
                        typeof route.name === 'string' &&
                        route.name?.includes(`settings-${tab.key}`),
                      'text-gray-700 dark:text-gray-300':
                        typeof route.name === 'string' &&
                        !route.name?.includes(`settings-${tab.key}`),
                    }"
                    :to="{
                      name: `admin-settings-${tab.key}`,
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
                            route.name?.includes(`settings-${tab.key}`),
                          'text-gray-400 dark:text-gray-400':
                            typeof route.name === 'string' &&
                            !route.name?.includes(`settings-${tab.key}`),
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
                          route.name?.includes(`settings-${tab.key}`),
                        'text-gray-400 dark:text-gray-400':
                          typeof route.name === 'string' &&
                          !route.name?.includes(`settings-${tab.key}`),
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
              class="bg-gray-50 mr-4 hidden w-1/3 border-r border-gray-300 dark:border-gray-300 lg:block"
            >
              <ul class="flex flex-col space-y-2">
                <li v-for="tab in tabs" :key="tab.key">
                  <router-link
                    class="flex cursor-pointer items-center px-3 py-2"
                    :class="{
                      'border-r-2 border-orange-500 dark:text-white':
                        typeof route.name === 'string' &&
                        route.name?.includes(`settings-${tab.key}`),
                      'text-gray-900':
                        typeof route.name === 'string' &&
                        route.name?.includes(`settings-${tab.key}`),
                      'text-gray-400 dark:text-gray-400 dark:hover:text-gray-300':
                        typeof route.name === 'string' &&
                        !route.name?.includes(`settings-${tab.key}`),
                    }"
                    :to="{
                      name: `admin-settings-${tab.key}`,
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
                            route.name?.includes(`settings-${tab.key}`),
                          'text-gray-400 dark:text-gray-400':
                            typeof route.name === 'string' &&
                            !route.name?.includes(`settings-${tab.key}`),
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
                          route.name?.includes(`settings-${tab.key}`),
                        'text-gray-400 dark:text-gray-400':
                          typeof route.name === 'string' &&
                          !route.name?.includes(`settings-${tab.key}`),
                      }"
                    />
                    {{ tab.label }}
                  </router-link>
                </li>
              </ul>
            </div>

            <!-- Main Content -->
            <div class="flex-1">
              <NuxtPage
                :edit-mode="true"
                :form-values="formValues"
                @submit="$emit('submit', $event)"
                @update-form-values="emit('updateFormValues', $event)"
              />
            </div>
          </div>
        </div>
      </TailwindForm>

      <div v-for="(error, i) in getServerError?.graphQLErrors" :key="i">
        {{ error.message }}
      </div>
    </div>
  </div>
</template>
