<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from "vue";
  import { DateTime } from "luxon";

  const props = defineProps({
    value: {
      type: String,
      required: true,
    },
    testId: {
      type: String,
      default: "time-picker",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(["update"]);

  const isDropdownOpen = ref(false);
  const dropdownRef = ref<HTMLElement | null>(null);

  // Format the display time in 12-hour clock format with error handling
  const formattedTime = computed(() => {
    try {
      const time = DateTime.fromFormat(props.value, "HH:mm");
      if (!time.isValid) {
        console.warn("Invalid time format:", props.value);
        return props.value;
      }
      return time.toFormat("h:mm a"); // 12-hour format with AM/PM, no leading zeros
    } catch (error) {
      console.error("Error formatting time:", error);
      return props.value;
    }
  });

  // Generate time options for the dropdown (15-minute intervals)
  const timeOptions = computed(() => {
    const options = [];

    // Generate intervals of 15 minutes for a 24-hour period
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = DateTime.fromObject({ hour, minute });
        options.push({
          value: time.toFormat("HH:mm"), // 24-hour format for internal use
          display: time.toFormat("h:mm a"), // 12-hour format without leading zeros for display
          hour12:
            time.hour > 11
              ? time.hour === 12
                ? 12
                : time.hour - 12
              : time.hour === 0
                ? 12
                : time.hour,
          minute,
          period: time.hour >= 12 ? "PM" : "AM",
          dateTime: time,
        });
      }
    }

    return options;
  });

  const selectTime = (value: string) => {
    emit("update", value);
    isDropdownOpen.value = false;
  };

  const toggleDropdown = () => {
    if (!props.disabled) {
      isDropdownOpen.value = !isDropdownOpen.value;
    }
  };

  const closeDropdown = () => {
    isDropdownOpen.value = false;
  };

  // Handle clicks outside the dropdown to close it
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
      closeDropdown();
    }
  };

  // Add/remove event listeners for click outside functionality
  onMounted(() => {
    document.addEventListener("click", handleClickOutside);
  });

  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
  });
</script>

<template>
  <div class="relative">
    <!-- Custom input field instead of native time input -->
    <div
      class="flex h-10 w-full cursor-pointer items-center rounded border border-gray-300 px-3 pr-8 text-sm focus:border-orange-500 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-32"
      :class="{ 'cursor-not-allowed opacity-60': disabled }"
      :data-testid="testId"
      @click="!disabled && toggleDropdown()"
    >
      {{ formattedTime }}

      <!-- Time dropdown toggle button -->
      <div class="absolute right-3 top-1/2 -translate-y-1/2 transform">
        <i class="far fa-clock text-gray-500 dark:text-gray-400" />
      </div>
    </div>

    <!-- Custom dropdown for time selection -->
    <div
      v-if="isDropdownOpen"
      ref="dropdownRef"
      class="touch-scroll-y absolute left-0 top-full z-10 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      style="-webkit-overflow-scrolling: touch; scrollbar-width: thin"
    >
      <!-- Using generated time options -->
      <template
        v-for="(option, index) in timeOptions"
        :key="'time-option-' + index"
      >
        <!-- Create a new time group whenever we have a new hour (minutes === 0) -->
        <div
          v-if="option.minute === 0"
          class="border-b border-gray-300/5 last:border-b-0 dark:border-white/5"
        >
          <!-- For each group, render all options for that hour -->
          <div
            v-for="hourOption in timeOptions.slice(index, index + 4)"
            :key="
              'hour-' + hourOption.hour12 + '-min-' + hourOption.minute + '-' + hourOption.period
            "
            :class="[
              'cursor-pointer px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700',
              formattedTime === hourOption.display ? 'bg-orange-50 dark:bg-orange-900' : '',
            ]"
            @click="selectTime(hourOption.value)"
          >
            {{ hourOption.display }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
