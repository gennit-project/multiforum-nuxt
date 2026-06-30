<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import IdentificationIcon from '@/components/icons/IdentificationIcon.vue';
import UserIcon from '@/components/icons/UserIcon.vue';

const route = useRoute();
const router = useRouter();

const tabs = [
  {
    key: 'server-membership',
    label: 'Server Membership',
    icon: IdentificationIcon,
    path: '/admin/suspensions/server-membership',
  },
  {
    key: 'suspended-users',
    label: 'Suspended Users',
    icon: UserIcon,
    path: '/admin/suspensions/suspended-users',
  },
  {
    key: 'suspended-mods',
    label: 'Suspended Mods',
    icon: UserIcon,
    path: '/admin/suspensions/suspended-mods',
  },
];

const isDropdownOpen = ref(false);

onMounted(() => {
  if (route.path === '/admin/suspensions') {
    router.push({
      path: '/admin/suspensions/server-membership',
    });
  }
});

const getCurrentTabLabel = computed(() => {
  const currentTab = tabs.find(
    (tab) => route.path === tab.path
  );
  return currentTab?.label || 'Suspensions';
});
</script>

<template>
  <div class="mt-4 w-full px-0 pt-0">
    <div class="mt-5 w-full">
      <div class="mb-4 lg:hidden">
        <div class="relative">
          <button
            class="bg-gray-50 flex w-full items-center justify-between rounded-md border border-gray-300 px-4 py-2 text-sm dark:text-white"
            type="button"
            @click="isDropdownOpen = !isDropdownOpen"
          >
            <div class="flex items-center">
              <component
                :is="tabs.find((tab) => route.path === tab.path)?.icon"
                v-if="tabs.find((tab) => route.path === tab.path)?.icon"
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
                class="flex items-center py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                :class="{
                  'bg-gray-50 text-orange-500 dark:bg-gray-700':
                    route.path === tab.path,
                  'text-gray-700 dark:text-gray-300': route.path !== tab.path,
                }"
                :to="{
                  path: tab.path,
                }"
                @click="isDropdownOpen = false"
              >
                <component
                  :is="tab.icon"
                  class="mr-2 h-5 w-5"
                  :class="{
                    'text-orange-500': route.path === tab.path,
                    'text-gray-400 dark:text-gray-400': route.path !== tab.path,
                  }"
                />
                {{ tab.label }}
              </router-link>
            </li>
          </ul>
        </div>
      </div>

      <div class="flex w-full">
        <div
          class="bg-gray-50 mr-4 hidden w-1/3 border-r border-gray-300 dark:border-gray-300 lg:block"
        >
          <ul class="flex flex-col space-y-2">
            <li v-for="tab in tabs" :key="tab.key">
              <router-link
                class="flex cursor-pointer items-center px-3 py-2"
                :class="{
                  'border-r-2 border-orange-500 bg-orange-50 text-gray-900 font-medium dark:bg-orange-900/20 dark:text-white':
                    route.path === tab.path,
                  'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300':
                    route.path !== tab.path,
                }"
                :to="{
                  path: tab.path,
                }"
              >
                <component
                  :is="tab.icon"
                  class="mr-2 h-5 w-5"
                  :class="{
                    'text-orange-500': route.path === tab.path,
                    'text-gray-400 dark:text-gray-400': route.path !== tab.path,
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
</template>
