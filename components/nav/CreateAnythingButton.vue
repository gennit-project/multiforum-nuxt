<script setup lang="ts">
  import { computed } from "vue";
  import RequireAuth from "@/components/auth/RequireAuth.vue";
  import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
  import FloatingDropdown from "@/components/FloatingDropdown.vue";
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
    if (typeof route.params.forumId !== "string" || !route.params.forumId) {
      return null;
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

  const handleItemClick = async (item: any, close: () => void) => {
    try {
      await item.action();
      close();
    } catch (error) {
      console.error("Navigation error:", error);
      close();
    }
  };
</script>

<template>
  <RequireAuth
    class="align-middle"
    :full-width="false"
  >
    <template #has-auth>
      <FloatingDropdown placement="bottom-start">
        <template #trigger>
          <button
            class="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-2 text-xs focus:outline-none dark:border-gray-600"
            :class="[
              backgroundColor === 'light'
                ? 'bg-white text-gray-800 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-700'
                : 'bg-gray-800 text-gray-100 hover:bg-gray-700',
            ]"
            type="button"
          >
            <span class="flex items-center whitespace-nowrap">
              {{ usePrimaryButton ? "Create" : "+ Add" }}
            </span>
            <ChevronDownIcon
              aria-hidden="true"
              class="-mr-1 ml-1 mt-0.5 h-3 w-3"
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
        class="inline-flex items-center gap-x-1.5 rounded-md border border-gray-300 px-3 py-2 text-xs focus:outline-none dark:border-gray-600"
        :class="[
          usePrimaryButton
            ? '!border !border-gray-300 dark:!border-gray-600'
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
  </RequireAuth>
</template>
