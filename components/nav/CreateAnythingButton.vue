<script setup lang="ts">
  import { ref, nextTick, computed, onMounted } from "vue";
  import RequireAuth from "@/components/auth/RequireAuth.vue";
  import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
  import { useRoute, useRouter } from "nuxt/app";

  // Props
  defineProps({
    usePrimaryButton: {
      type: Boolean,
      default: false,
    },
    backgroundColor: {
      type: String,
      default: "light",
      validator: (value: string) => ["light", "dark"].includes(value),
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
          channelId.value ? `/forums/${channelId.value}/discussions/create` : "/discussions/create"
        ),
    },
    {
      text: "+ New Event",
      testId: "create-event-menu-item",
      action: () =>
        router.push(
          channelId.value ? `/forums/${channelId.value}/events/create` : "/events/create"
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
    return route.name && typeof route.name === "string" && !route.name.includes("map");
  });

  const handleItemClick = (item: any) => {
    item.action();
    isMenuOpen.value = false;
  };
</script>

<template>
  <RequireAuth
    class="align-middle"
    :full-width="false"
  >
    <template #has-auth>
      <client-only>
        <v-menu
          v-model="isMenuOpen"
          :close-on-content-click="true"
          offset-y
        >
          <template #activator="{ props }">
            <button
              v-bind="props"
              class="inline-flex items-center gap-1 rounded-md border border-gray-800 px-2 py-2 text-xs focus:outline-none dark:border-gray-600"
              :class="[
                backgroundColor === 'light'
                  ? 'bg-white text-gray-800 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-700'
                  : 'bg-gray-800 text-gray-100 hover:bg-gray-700',
              ]"
              type="button"
              @click="adjustMenuPosition"
              @mouseover="showTooltip = true"
            >
              <span class="flex items-center whitespace-nowrap">
                {{ usePrimaryButton ? "Create" : "+ Add" }}
              </span>
              <ChevronDownIcon
                aria-hidden="true"
                class="-mr-1 ml-1 mt-0.5 h-3 w-3"
              />
              <v-tooltip
                v-if="showTooltip && !usePrimaryButton"
                activator="parent"
                location="bottom"
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
              class="hover:bg-gray-100 dark:hover:bg-gray-600"
              :data-testid="item.testId"
              @click="() => handleItemClick(item)"
            >
              <span class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                {{ item.text }}
              </span>
            </v-list-item>
          </v-list>
        </v-menu>
        <template #fallback>
          <button
            class="inline-flex items-center gap-x-1.5 rounded-md border border-gray-800 px-3 py-2 text-xs focus:outline-none dark:border-gray-600"
            :class="[
              usePrimaryButton
                ? '!border !border-gray-800 dark:!border-gray-600'
                : backgroundColor === 'light'
                  ? 'bg-white text-gray-800 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-700'
                  : 'bg-gray-800 text-gray-100 hover:bg-gray-700',
            ]"
            data-testid="fake-create-anything-button"
          >
            <span class="flex items-center"> + {{ usePrimaryButton ? "Create" : "" }} </span>
            <ChevronDownIcon
              aria-hidden="true"
              class="-mr-1 ml-1 mt-0.5 h-3 w-3"
            />
          </button>
        </template>
      </client-only>
    </template>

    <template #does-not-have-auth>
      <button
        class="inline-flex items-center gap-x-1.5 rounded-md border border-gray-800 px-3 py-2 text-xs focus:outline-none dark:border-gray-600"
        :class="[
          usePrimaryButton
            ? '!border !border-gray-800 dark:!border-gray-600'
            : backgroundColor === 'light'
              ? 'bg-white text-gray-800 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-700'
              : 'bg-gray-800 text-gray-100 hover:bg-gray-700',
        ]"
        data-testid="fake-create-anything-button"
      >
        <span class="flex items-center"> + {{ usePrimaryButton ? "Create" : "" }} </span>
        <ChevronDownIcon
          aria-hidden="true"
          class="-mr-1 ml-1 mt-0.5 h-3 w-3"
        />
      </button>
      <client-only>
        <v-tooltip
          v-if="showFooter"
          activator="parent"
          location="bottom"
        >
          Create new...
        </v-tooltip>
      </client-only>
    </template>
  </RequireAuth>
</template>
