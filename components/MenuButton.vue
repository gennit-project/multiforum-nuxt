<script lang="ts" setup>
  import type { PropType } from "vue";
  import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
  import FloatingDropdown from "@/components/FloatingDropdown.vue";
  import { actionIconMap } from "@/utils";

  import type { MenuItemType } from "./IconButtonDropdown.vue";

  defineProps({
    dataTestid: {
      type: String,
      default: "",
    },
    items: {
      type: Array as PropType<MenuItemType[]>,
      default: () => [],
    },
  });

  const emits = defineEmits<(e: string) => void>();

  const emitEvent = (eventName: string) => {
    emits(eventName);
  };
</script>

<template>
  <FloatingDropdown placement="bottom-start">
    <template #trigger>
      <button
        class="focus:ring-indigo-500 inline-flex justify-start rounded-md px-1 text-sm shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100"
        :data-testid="dataTestid"
      >
        <slot>
          Options
          <ChevronDownIcon
            aria-hidden="true"
            class="-mr-1 ml-2 h-5 w-5"
          />
        </slot>
      </button>
    </template>

    <template #content="{ close }">
      <div class="py-1">
        <template
          v-for="item in items"
          :key="item.label"
        >
          <!-- Divider -->
          <div
            v-if="item.isDivider"
            class="font-semibold cursor-default px-4 py-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            {{ item.value }}
          </div>
          <div v-else>
            <nuxt-link
              v-if="item.value"
              class="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              :to="item.value"
              @click="close"
            >
              <component
                :is="actionIconMap[item.icon]"
                v-if="item.icon"
                class="h-5 w-5"
              />
              {{ item.label }}
            </nuxt-link>
            <button
              v-else-if="item.event"
              class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              :data-testid="`${dataTestid}-item-${item.label}`"
              @click="() => { emitEvent(item.event); close(); }"
            >
              <component
                :is="actionIconMap[item.icon]"
                v-if="item.icon"
                class="h-5 w-5"
              />
              {{ item.label }}
            </button>
          </div>
        </template>
      </div>
    </template>
  </FloatingDropdown>
</template>