<script lang="ts">
import { useRouter } from "vue-router";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import { defineComponent, PropType } from "vue";

type MenuItemType = {
  value: string;
  icon: string;
  label: string;
  event?: string;
};

export default defineComponent({
  name: "IconButtonDropdown",
  components: {
    DropdownMenu: Menu,
    MenuButton,
    MenuItem,
    MenuItems,
  },
  props: {
    items: {
      type: Array as PropType<MenuItemType[]>,
      required: true,
    },
    menuButtonIcon: {
      type: String,
      required: false,
      default: "",
    },
  },
  setup() {
    const router = useRouter();
    return {
      router,
    };
  },
});
</script>
<template>
  <DropdownMenu
    as="div"
    class="relative text-left flex items-center"
  >
    <MenuButton
      class="font-semibold inline-flex h-10 w-full items-center justify-center gap-x-1.5 rounded-full px-2 text-sm text-black focus:outline-none dark:text-white"
    >
      <i
        v-if="menuButtonIcon"
        :class="` ${menuButtonIcon} `"
      />
      <div
        v-else
        class="flex items-center"
      >
        <slot />
      </div>
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
        class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700 dark:text-gray-200"
        style="margin-top: 160px;"
      >
        <div class="py-1">
          <MenuItem
            v-for="(item, i) in items"
            :key="i"
            v-slot="{ active }"
            class="cursor-pointer"
            @click="() => {
              if (item.event) {
                $emit(item.event)
              }
              router.push(item.value)
            }"
          >
            <span
              :class="[
                active
                  ? 'bg-gray-100 text-gray-900 dark:hover:bg-gray-500 dark:hover:text-gray-100'
                  : 'text-gray-700 dark:text-gray-200',
                'block px-4 py-2 text-sm',
              ]"
            >
              <i
                v-if="item.icon"
                :class="item.icon"
              /> {{ item.label }}
            </span>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>
  </DropdownMenu>
</template>
