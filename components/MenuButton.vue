<script lang="ts" setup>
  import { ref, nextTick, onMounted } from "vue";
  import type { PropType } from "vue";
  import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
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

  const emits = defineEmits<(e: string) => void>(); // Accept any event type

  const emitEvent = (eventName: string) => {
    emits(eventName);
  };

  // Setup function
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

  const handleItemClick = (item: MenuItemType) => {
    if (item.event) {
      emitEvent(item.event);
    }
  };
  const isMenuOpen = ref(false);
  const menuStyles = {
    top: shouldOpenUpwards.value ? "auto" : "100%",
    right: shouldOpenLeftwards.value ? 0 : "auto",
    bottom: shouldOpenUpwards.value ? "100%" : "auto",
    zIndex: 10000,
  };
</script>

<template>
  <client-only>
    <v-menu
      v-model="isMenuOpen"
      :close-on-content-click="true"
      offset-y
    >
      <template #activator="{ props }">
        <button
          v-bind="props"
          class="focus:ring-indigo-500 inline-flex justify-start rounded-md px-1 text-sm shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100"
          :data-testid="dataTestid"
          variant="text"
          @click="adjustMenuPosition"
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

      <v-list
        class="dark:bg-gray-700"
        :style="menuStyles"
      >
        <template
          v-for="item in items"
          :key="item.label"
        >
          <!-- Divider -->
          <v-list-subheader
            v-if="item.isDivider"
            class="font-semibold cursor-default px-4 py-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            {{ item.value }}
          </v-list-subheader>
          <v-list-item
            v-else
            class="dark:hover:bg-gray-600"
            :data-testid="`${dataTestid}-item-${item.label}`"
            @click="
              () => {
                handleItemClick(item);
                isMenuOpen = false;
              }
            "
          >
            <nuxt-link
              v-if="item.value"
              class="flex items-center gap-2 text-sm"
              :class="['text-gray-700 dark:text-white']"
              :to="item.value"
            >
              <component
                :is="actionIconMap[item.icon]"
                v-if="item.icon"
                class="h-5 w-5"
              />
              {{ item.label }}
            </nuxt-link>
            <div
              v-else-if="item.event"
              class="flex cursor-pointer items-center gap-2 text-sm"
              :class="['text-gray-700 dark:text-white']"
              :data-testid="`${dataTestid}-item-${item.label}`"
              @click="emitEvent(item?.event ?? '')"
            >
              <component
                :is="actionIconMap[item.icon]"
                v-if="item.icon"
                class="h-5 w-5"
              />
              {{ item.label }}
            </div>
          </v-list-item>
        </template>
      </v-list>
    </v-menu>
  </client-only>
</template>
