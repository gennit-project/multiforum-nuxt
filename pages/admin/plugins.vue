<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import PlugIcon from '@/components/icons/PlugIcon.vue';
import LinkIcon from '@/components/icons/LinkIcon.vue';
import PipelineIcon from '@/components/icons/PipelineIcon.vue';

const route = useRoute();
const router = useRouter();

const tabs = [
  {
    key: 'management',
    label: 'Plugin Management',
    icon: PlugIcon,
    routeName: 'admin-plugins',
    routePath: '/admin/plugins',
  },
  {
    key: 'registries',
    label: 'Registries',
    icon: LinkIcon,
    routeName: 'admin-plugins-registries',
    routePath: '/admin/plugins/registries',
  },
  {
    key: 'pipelines',
    label: 'Pipelines',
    icon: PipelineIcon,
    routeName: 'admin-plugins-pipelines',
    routePath: '/admin/plugins/pipelines',
  },
];

const isDropdownOpen = ref(false);

const getCurrentTabLabel = computed(() => {
  const currentTab = tabs.find((tab) => route.path === tab.routePath);
  return currentTab?.label || 'Plugins';
});

const activeTabKey = computed(() => {
  if (route.path.startsWith('/admin/plugins/registries')) {
    return 'registries';
  }
  if (route.path.startsWith('/admin/plugins/pipelines')) {
    return 'pipelines';
  }
  return 'management';
});

if (route.name === 'admin-plugins' && route.path !== '/admin/plugins') {
  router.replace('/admin/plugins');
}
</script>

<template>
  <ClientOnly>
    <div class="mt-4 w-full px-0 pt-0">
      <div class="mt-5 w-full">
        <!-- Mobile Dropdown -->
        <div class="mb-4 lg:hidden">
          <div class="relative">
            <button
              class="flex w-full items-center justify-between rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              type="button"
              @click="isDropdownOpen = !isDropdownOpen"
            >
              <div class="flex items-center">
                <component
                  :is="tabs.find((tab) => tab.key === activeTabKey)?.icon"
                  class="text-brand-500 mr-2 h-5 w-5"
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
                    'text-brand-500 bg-gray-50 dark:bg-gray-700':
                      activeTabKey === tab.key,
                    'text-gray-700 dark:text-gray-300':
                      activeTabKey !== tab.key,
                  }"
                  :to="tab.routePath"
                  @click="isDropdownOpen = false"
                >
                  <component
                    :is="tab.icon"
                    class="mr-2 h-5 w-5"
                    :class="{
                      'text-brand-500': activeTabKey === tab.key,
                      'text-gray-500 dark:text-gray-400':
                        activeTabKey !== tab.key,
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
          <div
            class="mr-4 hidden w-1/3 border-r border-gray-300 bg-gray-50 lg:block dark:border-gray-700 dark:bg-gray-900"
          >
            <ul class="flex flex-col space-y-2">
              <li v-for="tab in tabs" :key="tab.key">
                <router-link
                  class="flex cursor-pointer items-center px-3 py-2"
                  :class="{
                    'border-brand-500 bg-brand-50 dark:bg-brand-900/20 border-r-2 font-medium text-gray-900 dark:text-white':
                      activeTabKey === tab.key,
                    'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300':
                      activeTabKey !== tab.key,
                  }"
                  :to="tab.routePath"
                >
                  <component
                    :is="tab.icon"
                    class="mr-2 h-5 w-5"
                    :class="{
                      'text-brand-500': activeTabKey === tab.key,
                      'text-gray-500 dark:text-gray-400':
                        activeTabKey !== tab.key,
                    }"
                  />
                  {{ tab.label }}
                </router-link>
              </li>
            </ul>
          </div>

          <div class="flex-1">
            <NuxtPage />
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>
