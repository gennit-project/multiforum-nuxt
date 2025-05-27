<script setup lang="ts">
<<<<<<< HEAD
  import { computed } from "vue";
  import RequireAuth from "@/components/auth/RequireAuth.vue";
  import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
  import FloatingDropdown from "@/components/FloatingDropdown.vue";
  import { useRoute, useRouter } from "nuxt/app";
=======
import { ref, nextTick, computed, onMounted } from "vue";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import { useRoute, useRouter } from "nuxt/app";
>>>>>>> parent of 666ae3d (Use automated formatting tools)

// Props
defineProps({
  usePrimaryButton: {
    type: Boolean,
    default: false,
  },
  backgroundColor: {
    type: String,
    default: 'light',
    validator: (value: string) => ['light', 'dark'].includes(value),
  },
});

// Setup logic
const route = useRoute();
const router = useRouter();

<<<<<<< HEAD
  const channelId = computed(() => {
    if (typeof route.params.forumId !== "string" || !route.params.forumId) {
      return null;
=======
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
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    }
  });
};

onMounted(() => {
  adjustMenuPosition();
  window.addEventListener("resize", adjustMenuPosition);
});

<<<<<<< HEAD
  const handleItemClick = async (item: any, close: () => void) => {
    try {
      await item.action();
      close();
    } catch (error) {
      console.error("Navigation error:", error);
      close();
    }
  };
=======
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
>>>>>>> parent of 666ae3d (Use automated formatting tools)
</script>

<template>
  <RequireAuth class="align-middle" :full-width="false">
    <template #has-auth>
<<<<<<< HEAD
      <FloatingDropdown placement="bottom-start">
        <template #trigger>
          <button
            class="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-2 text-xs focus:outline-none dark:border-gray-600"
=======
      <client-only>
        <v-menu v-model="isMenuOpen" :close-on-content-click="true" offset-y>
          <template #activator="{ props }">
            <button
              type="button"
              v-bind="props"
              class="inline-flex rounded-md border border-gray-800 dark:border-gray-600 px-2 py-2 items-center gap-1 focus:outline-none text-xs"
              :class="[
                backgroundColor === 'light' 
                  ? 'bg-white text-gray-800 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-700' 
                  : 'bg-gray-800 text-gray-100 hover:bg-gray-700'
              ]"
              @click="adjustMenuPosition"
              @mouseover="showTooltip = true"
            >
              <span
                class="flex whitespace-nowrap items-center">
                {{ usePrimaryButton ? "Create" : "+ Add" }}
              </span>
              <ChevronDownIcon
                class="-mr-1 ml-1 mt-0.5 h-3 w-3"
                aria-hidden="true"
              />
              <v-tooltip
                v-if="showTooltip && !usePrimaryButton"
                location="bottom"
                activator="parent"
              >
                Create new...
              </v-tooltip>
            </button>
          </template>

          <v-list
            class="bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700 dark:text-gray-200"
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
              class="hover:bg-gray-100 dark:hover:bg-gray-600"
              @click="() => handleItemClick(item)"
            >
              <span
                class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200"
              >
                {{ item.text }}
              </span>
            </v-list-item>
          </v-list>
        </v-menu>
        <template #fallback>
          <button
            class="inline-flex border border-gray-800 dark:border-gray-600 px-3 py-2 items-center gap-x-1.5 rounded-md text-xs focus:outline-none"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
            :class="[
              backgroundColor === 'light'
                ? 'bg-white text-gray-800 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-700'
                : 'bg-gray-800 text-gray-100 hover:bg-gray-700',
            ]"
            type="button"
          >
<<<<<<< HEAD
            <span class="flex items-center whitespace-nowrap">
              {{ usePrimaryButton ? "Create" : "+ Add" }}
=======
            <span class="flex items-center">
              + {{ usePrimaryButton ? "Create" : "" }}
>>>>>>> parent of 666ae3d (Use automated formatting tools)
            </span>
            <ChevronDownIcon
              class="-mr-1 ml-1 mt-0.5 h-3 w-3"
              aria-hidden="true"
            />
          </button>
        </template>

        <template #content="{ close }">
          <div class="py-1">
            <button
              v-for="(item, index) in menuItems"
              :key="index"
              class="flex w-full items-center px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              :data-testid="item.testId"
              @click="() => handleItemClick(item, close)"
            >
              {{ item.text }}
            </button>
          </div>
        </template>
      </FloatingDropdown>
    </template>

    <template #does-not-have-auth>
      <button
<<<<<<< HEAD
        class="inline-flex items-center gap-x-1.5 rounded-md border border-gray-300 px-3 py-2 text-xs focus:outline-none dark:border-gray-600"
=======
        class="inline-flex border border-gray-800 dark:border-gray-600 px-3 py-2 items-center gap-x-1.5 rounded-md text-xs focus:outline-none"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
        :class="[
          usePrimaryButton
            ? '!border !border-gray-300 dark:!border-gray-600'
            : backgroundColor === 'light'
              ? 'bg-white text-gray-800 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-700'
              : 'bg-gray-800 text-gray-100 hover:bg-gray-700',
        ]"
        data-testid="fake-create-anything-button"
      >
        <span class="flex items-center">
          + {{ usePrimaryButton ? "Create" : "" }}
        </span>
        <ChevronDownIcon
          class="-mr-1 ml-1 mt-0.5 h-3 w-3"
          aria-hidden="true"
        />
      </button>
<<<<<<< HEAD
=======
      <client-only>
        <v-tooltip v-if="showFooter" activator="parent" location="bottom">
          Create new...
        </v-tooltip>
      </client-only>
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    </template>
  </RequireAuth>
</template>