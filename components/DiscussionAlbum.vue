<!-- Carousel view -->
<div v-else class="flex flex-col">
  <!-- Counter and navigation row -->
  <div class="flex items-center justify-between p-2">
    <span class="text-sm">{{ `${activeIndex + 1} of ${orderedImages.length}` }}</span>
    
    <div v-if="orderedImages.length > 1" class="flex gap-2">
      <button
        type="button"
        class="hover:bg-gray-500 flex items-center justify-center px-2 h-8"
        @click="goLeft"
      >
        <LeftArrowIcon class="h-4 w-4" />
      </button>

      <button
        class="hover:bg-gray-500 flex items-center justify-center px-2 h-8"
        type="button"
        @click="goRight"
      >
        <RightArrowIcon class="h-4 w-4" />
      </button>
    </div>
  </div>

  <!-- Image container -->
  <div class="flex items-center justify-center">
    <div class="mb-4 flex rounded dark:text-white max-h-96 max-w-96">
      <div
        v-for="(image, idx) in orderedImages"
        :key="image.id"
        class="flex flex-shrink-0 w-auto"
      >
        <div
          class="max-h-96 max-w-96 min-h-10 cursor-pointer"
          @click="openLightbox(idx)"
        >
          <img
            v-if="image"
            :src="image.url || ''"
            :alt="image.alt || ''"
            class="shadow-sm max-h-96 max-w-96"
            :class="{ hidden: idx !== activeIndex }"
          >
          <span
            class="text-center"
            :class="{ hidden: idx !== activeIndex }"
          >
            {{ image.caption }}
          </span>
        </div>
      </div>
    </div>
  </div>
</div> 