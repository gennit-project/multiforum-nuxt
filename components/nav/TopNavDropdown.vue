<script>
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import { defineComponent } from "vue";
import { useRoute } from "vue-router";

const DropdownButton = defineComponent({
  components: {
    MenuElement: Menu,
    MenuButton,
    MenuItem,
    MenuItems,
    ChevronDownIcon,
  },
  props: {
    selectedSearchType: {
      type: String,
      default: "Discussions",
    },
  },
  setup() {
    const items = [
      { name: "Discussions", href: "#" },
      { name: "Online Events", href: "#" },
      { name: "In-person Events", href: "#"},
      { name: "Channels", href: "#" },
    ];
    const route = useRoute();
    return {
      items,
      route
    };
  },
  created() {
    this.$watch("$route.path", () => {
      if (this.$route.path) {
        this.$emit('updateRoute',this.$route.path)
      }
    });
  },
  methods: {
    setSelectedSearchType(type) {
      this.$emit("updateSelectedSearchType", type);
    },
  },
});
export default DropdownButton;
</script>
<template>
  <div class="flex inline-flex h-10 w-fit-content">
    <MenuElement
      as="div"
      class="relative -ml-px block"
    >
      <MenuButton
        class="relative inline-flex items-center rounded-l-md pr-2 pl-3 h-full text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 focus:z-10"
      >
        <span class="text-xs mr-1">{{ selectedSearchType }}</span>
        <ChevronDownIcon
          class="h-3 w-3"
          aria-hidden="true"
        />
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
          class="absolute right-0 z-10 -mr-1 mt-2 w-56 origin-top-right rounded-md ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          <div class="py-1">
            <MenuItem
              v-for="item in items"
              :key="item.name"
              v-slot="{ active }"
            >
              <div
                :class="[
                  active ? 'text-gray-900' : 'text-gray-700',
                  'block px-4 py-2 text-sm',
                ]"
                @click="setSelectedSearchType(item.name)"
              >
                {{ item.name }}
              </div>
            </MenuItem>
          </div>
        </MenuItems>
      </transition>
    </MenuElement>
  </div>
</template>
