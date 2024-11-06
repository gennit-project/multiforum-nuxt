<script setup lang="ts">
import { ref, nextTick, computed, onMounted } from "vue";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import { useRoute, useRouter } from "vue-router";

// Props
defineProps({
  usePrimaryButton: {
    type: Boolean,
    default: false,
  },
});

// Setup logic
const route = useRoute();
const router = useRouter();

const channelId = computed(() => {
  if (typeof route.params.forumId !== "string") {
    return "";
  }
  return route.params.forumId;
});

const menuItems = [
  {
    text: "+ New Discussion",
    testId: "create-discussion-menu-item",
    action: () =>
      router.push(
        channelId.value
          ? `/forums/${channelId.value}/discussions/create`
          : "/discussions/create"
      ),
  },
  {
    text: "+ New Event",
    testId: "create-event-menu-item",
    action: () =>
      router.push(
        channelId.value
          ? `/forums/${channelId.value}/events/create`
          : "/events/create"
      ),
  },
  {
    text: "+ New Forum",
    testId: "create-channel-menu-item",
    action: () => router.push("/forums/create"),
  },
];

const uniqueID = ref(Math.random().toString(36).substring(7));
const shouldOpenUpwards = ref(false);
const shouldOpenLeftwards = ref(false);

const adjustMenuPosition = () => {
  nextTick(() => {
    const menuButton = document.querySelector(`#menu-button-${uniqueID.value}`);
    const menuItems = document.querySelector(`#menu-items-${uniqueID.value}`);

    if (menuButton && menuItems) {
      const menuButtonRect = menuButton.getBoundingClientRect();
      const menuItemsHeight = menuItems.getBoundingClientRect().height;
      const menuItemsWidth = menuItems.getBoundingClientRect().width;
      const spaceBelow = window.innerHeight - menuButtonRect.bottom;
      shouldOpenUpwards.value = spaceBelow < menuItemsHeight;

      const spaceLeft = menuButtonRect.left;
      shouldOpenLeftwards.value = spaceLeft > menuItemsWidth;
    }
  });
};

onMounted(() => {
  adjustMenuPosition();
  window.addEventListener("resize", adjustMenuPosition);
});

const isMenuOpen = ref(false);
const showTooltip = ref(false);
const showFooter = computed(() => {
  return (
    route.name && typeof route.name === "string" && !route.name.includes("map")
  );
});

const handleItemClick = (item: any) => {
  item.action();
  isMenuOpen.value = false;
};
</script>

<template>
  <client-only>
    <RequireAuth class="align-middle" :full-width="false">
      <template #has-auth>
        <v-menu v-model="isMenuOpen" :close-on-content-click="true" offset-y>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              class="font-semibold whitespace-nowrap flex h-8 w-full items-center gap-x-1.5 rounded-md px-4 text-sm focus:outline-none"
              :class="[
                usePrimaryButton
                  ? 'bg-blue-500 dark:bg-blue-600 text-white'
                  : 'bg-white text-black hover:bg-gray-200 dark:border-gray-800 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
              ]"
              @click="adjustMenuPosition"
              @mouseover="showTooltip = true"
            >
              <span class="flex items-center text-md dark:text-white">
                + {{ usePrimaryButton ? "Create" : "" }}
              </span>
              <ChevronDownIcon
                class="-mr-1 ml-1 mt-0.5 h-3 w-3 dark:text-white"
                aria-hidden="true"
              />
              <v-tooltip
                v-if="showTooltip && !usePrimaryButton"
                location="bottom"
                activator="parent"
              >
                Create new...
              </v-tooltip>
            </v-btn>
          </template>

          <v-list
            class="dark:bg-gray-700 dark:text-white"
            :style="{
              top: shouldOpenUpwards ? 'auto' : '100%',
              right: shouldOpenLeftwards ? 0 : 'auto',
              bottom: shouldOpenUpwards ? '100%' : 'auto',
              zIndex: 10000,
            }"
          >
            <v-list-item
              v-for="(item, index) in menuItems"
              :key="index"
              :data-testid="item.testId"
              @click="() => handleItemClick(item)"
            >
              <span
                class="block px-4 py-2 text-sm"
                :class="['text-gray-700 dark:text-white']"
              >
                {{ item.text }}
              </span>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>

      <template #does-not-have-auth>
        <button
          :class="[
            usePrimaryButton
              ? 'bg-blue-500 dark:bg-blue-600 text-white'
              : 'bg-white text-black hover:bg-gray-200 dark:border-gray-800 dark:bg-black dark:text-white dark:hover:bg-gray-600',
          ]"
          class="font-semibold whitespace-nowrap h-8 w-full items-center gap-x-1.5 rounded-md border px-4 text-sm focus:outline-none"
          data-testid="fake-create-anything-button"
        >
          + {{ usePrimaryButton ? "Create" : "" }}
        </button>
        <v-tooltip v-if="showFooter" activator="parent" location="bottom">
          Create new...
        </v-tooltip>
      </template>
    </RequireAuth>
  </client-only>
</template>
