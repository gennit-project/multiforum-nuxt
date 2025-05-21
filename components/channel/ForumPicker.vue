<script lang="ts" setup>
  import { ref, watch } from "vue";
  import type { PropType } from "vue";
  import SearchableForumList from "@/components/channel/SearchableForumList.vue";
  import type { Channel } from "@/__generated__/graphql";

  // Props definition
  const props = defineProps({
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
      default: "Select forums to submit to",
    },
    testId: {
      type: String,
      default: "",
    },
  });

  // Emits definition
  const emit = defineEmits(["setSelectedChannels"]);

  // Refs and state
  const isDropdownOpen = ref(false);
  const selected = ref([...props.selectedChannels]);
  const channelOptions = ref<Channel[]>([]);

  // Methods
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

  const outside = () => {
    isDropdownOpen.value = false;
  };

  const removeSelection = (channel: string) => {
    selected.value = selected.value.filter((c) => c !== channel);
    emit("setSelectedChannels", selected.value);
  };

  // Watchers
  watch(
    () => props.selectedChannels,
    (newVal) => {
      selected.value = [...newVal];
    }
  );
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
          :data-testid="testId"
          @click="toggleDropdown"
        >
          <div
            v-for="(channelName, index) in selected"
            :key="index"
            class="mr-2 flex items-center rounded-full bg-blue-100 pr-2 text-blue-700 dark:bg-gray-600 dark:text-white"
            @click="removeSelection(channelName)"
          >
            <AvatarComponent
              class="mr-1 h-8 w-8"
              :src="
                channelOptions.find((channel: Channel) => channel?.uniqueName === channelName)
                  ?.channelIconURL || ''
              "
              :text="channelName"
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
          @set-channel-options="(channels: Channel[]) => (channelOptions = channels)"
          @toggle-selection="toggleSelection"
        />
      </div>
    </div>
  </div>
</template>
