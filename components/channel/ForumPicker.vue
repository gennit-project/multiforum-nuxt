<script lang="ts">
import type { PropType} from "vue";
import { defineComponent, ref } from "vue";
import clickOutside from "vue-click-outside";
import SearchableForumList from '@/components/channel/SearchableForumList.vue'

export default defineComponent({
  components: {
    SearchableForumList,
  },
  directives: {
    clickOutside,
  },
  props: {
    hideSelected: {
      type: Boolean,
      default: false,
    },
    selectedChannels: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    description: {
      type: String,
      default: "Select your intended audience",
    },
  },
  setup(props, { emit }) {
    const isDropdownOpen = ref(false);
    const selected = ref([...props.selectedChannels]);

    const toggleDropdown = () => {
      isDropdownOpen.value = !isDropdownOpen.value;
    };

    const toggleSelection = (channel: string) => {
      const index = selected.value.indexOf(channel);
      if (index === -1) {
        selected.value.push(channel);
      } else {
        selected.value.splice(index, 1);
      }
      emit("setSelectedChannels", selected.value);
    };

    return {
      channelOptions: ref([]),
      isDropdownOpen,
      toggleDropdown,
      selected,
      toggleSelection,
    };
  },
  watch: {
    selectedChannels(newVal) {
      this.selected = [...newVal];
    },
  },
  methods: {
    updateSearchResult(input: string) {
      this.searchInput = input;
    },
    outside() {
      this.isDropdownOpen = false;
    },
    removeSelection(channel: string) {
      this.selected = this.selected.filter((c: string) => c !== channel);
      this.$emit("setSelectedChannels", this.selected);
    },
  },
});
</script>

<template>
  <div>
    <div>
      <div
        v-if="description"
        class="py-1 text-sm dark:text-gray-300"
      >
        {{ description }}
      </div>
      <div class="relative">
        <div
          class="flex h-12 w-full cursor-pointer flex-wrap items-center rounded-lg border px-4 text-left dark:border-gray-700 dark:bg-gray-700"
          @click="toggleDropdown"
        >
          <div
            v-for="(channelName, index) in selected"
            :key="index"
            class="mr-2 flex items-center rounded-full bg-blue-100 pr-2 text-blue-700 dark:bg-gray-600 dark:text-white"
            @click="removeSelection(channelName)"
          >
            <Avatar
              :src="
                channelOptions.find(
                  (channel) => channel?.uniqueName === channelName,
                )?.icon || ''
              "
              :text="channelName"
              class="mr-1 h-8 w-8"
            />
            <span>{{ channelName }}</span>
            <span
              class="ml-1 cursor-pointer"
              @click.stop="removeSelection(channelName)"
            >
              &times;
            </span>
          </div>
        </div>
        <SearchableForumList
          v-if="isDropdownOpen"
          v-click-outside="outside"
          :selected-channels="selected"
          @toggle-selection="toggleSelection"
          @set-channel-options="channelOptions = $event"
        />
      </div>
    </div>
  </div>
</template>
