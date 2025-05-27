<script lang="ts" setup>
<<<<<<< HEAD
  import { ref, watch } from "vue";
  import type { PropType } from "vue";
  import SearchableForumList from "@/components/channel/SearchableForumList.vue";
  import AvatarComponent from "@/components/AvatarComponent.vue";
  import FloatingDropdown from "@/components/FloatingDropdown.vue";
  import type { Channel } from "@/__generated__/graphql";
=======
import { ref, watch } from 'vue';
import type { PropType } from 'vue';
import SearchableForumList from '@/components/channel/SearchableForumList.vue';
import type { Channel } from '@/__generated__/graphql';
>>>>>>> parent of 666ae3d (Use automated formatting tools)

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
    default: 'Select forums to submit to',
  },
  testId: {
    type: String,
    default: '',
  },
});

// Emits definition
const emit = defineEmits(['setSelectedChannels']);

<<<<<<< HEAD
  // Refs and state
  const selected = ref([...props.selectedChannels]);
  const channelOptions = ref<Channel[]>([]);

  // Methods
=======
// Refs and state
const isDropdownOpen = ref(false);
const selected = ref([...props.selectedChannels]);
const channelOptions = ref<Channel[]>([]);

// Methods
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};
>>>>>>> parent of 666ae3d (Use automated formatting tools)

const toggleSelection = (channel: string) => {
  const index = selected.value.indexOf(channel);
  if (index === -1) {
    selected.value.push(channel);
  } else {
    selected.value.splice(index, 1);
  }
  emit('setSelectedChannels', selected.value);
};

<<<<<<< HEAD
=======
const outside = () => {
  isDropdownOpen.value = false;
};
>>>>>>> parent of 666ae3d (Use automated formatting tools)

const removeSelection = (channel: string) => {
  selected.value = selected.value.filter((c) => c !== channel);
  emit('setSelectedChannels', selected.value);
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
      <div v-if="description" class="py-1 text-sm dark:text-gray-300">
        {{ description }}
      </div>
<<<<<<< HEAD
      <FloatingDropdown placement="bottom-start">
        <template #trigger>
=======
      <div class="relative">
        <div
          :data-testid="testId"
          class="flex h-12 w-full cursor-pointer flex-wrap items-center rounded-lg border px-4 text-left dark:border-gray-700 dark:bg-gray-700"
          @click="toggleDropdown"
        >
>>>>>>> parent of 666ae3d (Use automated formatting tools)
          <div
            class="px-4text-left flex h-12 w-full cursor-pointer flex-wrap items-center rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-700"
            :data-testid="testId"
          >
<<<<<<< HEAD
            <div
              v-for="(channelName, index) in selected"
              :key="index"
              class="mr-2 flex items-center rounded-full bg-orange-100 pr-2 text-orange-700 dark:bg-gray-600 dark:text-white"
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
        </template>

        <template #content>
          <SearchableForumList
            :selected-channels="selected"
            @set-channel-options="(channels: Channel[]) => (channelOptions = channels)"
            @toggle-selection="toggleSelection"
          />
        </template>
      </FloatingDropdown>
=======
            <AvatarComponent
              :src="
                channelOptions.find(
                  (channel: Channel) => channel?.uniqueName === channelName
                )?.channelIconURL || ''
              "
              :text="channelName"
              class="mr-1 h-8 w-8"
            />
            <span>{{ channelName }}</span>
            <span class="ml-1 cursor-pointer" @click.stop="removeSelection(channelName)">
              &times;
            </span>
          </div>
        </div>
        <SearchableForumList
          v-if="isDropdownOpen"
          v-click-outside="outside"
          :selected-channels="selected"
          @toggle-selection="toggleSelection"
          @set-channel-options="(channels: Channel[]) => (channelOptions = channels)"
        />
      </div>
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    </div>
  </div>
</template>
