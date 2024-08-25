<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import RequireAuth from "../auth/RequireAuth.vue";
import ChevronDownIcon from "../icons/ChevronDownIcon.vue";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";

export default defineComponent({
  name: "CreateAnythingButton",
  components: {
    MenuButton,
    RequireAuth,
    DropdownMenu: Menu,
    MenuItem,
    ChevronDownIcon,
    MenuItems,
  },
  props: {
    usePrimaryButton: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const channelId = computed(() => {
      if (typeof route.params.channelId !== "string") {
        return "";
      }
      return route.params.channelId;
    });

    const { smAndDown } = useDisplay();
    const menuItems = [
      {
        text: '+ New Discussion',
        testId: 'create-discussion-menu-item',
        action: () => router.push(channelId.value ? `/channels/c/${channelId.value}/discussions/create` : '/discussions/create'),
      },
      {
        text: '+ New Event',
        testId: 'create-event-menu-item',
        action: () => router.push(channelId.value ? `/channels/c/${channelId.value}/events/create` : '/events/create'),
      },
      {
        text: '+ New Forum',
        testId: 'create-channel-menu-item',
        action: () => router.push('/channels/create'),
      },
    ];
    return { 
      channelId, 
      menuItems,
      router, 
      smAndDown, 
      showTooltip: ref(false) 
    };
  },
});
</script>

<template>
  <RequireAuth
    class="align-middle"
    :full-width="false"
  >
    <template #has-auth>
      <DropdownMenu
        as="div"
        class="relative inline-block text-left"
      >
        <MenuButton
          data-testid="create-anything-button"
          :class="[
            usePrimaryButton
              ? 'bg-blue-500 dark:bg-blue-600 text-white'
              : 'bg-white text-black hover:bg-gray-200 dark:border-gray-800 dark:bg-black dark:text-white dark:hover:bg-gray-600',
          ]"
          class="font-semibold whitespace-nowrap flex h-8 w-full items-center gap-x-1.5 rounded-md px-4 text-sm focus:outline-none"
          @click="showTooltip = false"
          @mouseover="showTooltip = true"
        >
          <span class="flex items-center text-md">+ {{ usePrimaryButton ? "Create" : '' }}</span>
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
        </MenuButton>
        <transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <MenuItems
            class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700 dark:text-gray-200"
          >
            <div>
              <MenuItem
                v-for="(item, index) in menuItems"
                :key="index"
                v-slot="{ active }"
                :data-testid="item.testId"
                class="cursor-pointer"
                @click="item.action"
              >
                <span
                  :class="[
                    active ? 'bg-gray-100 text-gray-900 dark:bg-gray-500 dark:text-gray-100' : 'text-gray-700 dark:text-gray-200',
                    'block px-4 py-2 text-sm',
                  ]"
                >
                  {{ item.text }}
                </span>
              </MenuItem>
            </div>
          </MenuItems>
        </transition>
      </DropdownMenu>
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
        + {{ usePrimaryButton ? 'Create' : '' }}
      </button>
      <v-tooltip
        v-if="!usePrimaryButton"
        activator="parent"
        location="bottom"
      >
        Create new...
      </v-tooltip>
    </template>
  </RequireAuth>
</template>
