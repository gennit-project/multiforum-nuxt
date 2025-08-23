<template>
  <li class="mb-2 flex border-gray-300 pt-2 dark:bg-gray-800 md:rounded-lg">
    <div
      class="flex w-full flex-row justify-start gap-4 overflow-hidden rounded-lg"
    >
      <div class="w-full flex-col">
        <!-- Image skeleton -->
        <div class="relative mb-1">
          <div
            class="aspect-square w-full animate-pulse bg-gray-200 dark:bg-gray-600"
          />
        </div>

        <div class="flex gap-3">
          <div class="w-full flex-col">
            <!-- Title skeleton -->
            <div class="mb-1">
              <div
                class="mb-2 h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-600"
              />
            </div>

            <!-- Author info skeleton -->
            <div class="mb-2 flex items-center gap-2">
              <div
                class="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-600"
              />
              <div
                class="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-600"
              />
            </div>

            <!-- Tags skeleton -->
            <div class="my-1 flex space-x-1">
              <div
                class="h-5 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-600"
              />
              <div
                class="h-5 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-600"
              />
            </div>

            <!-- Vote and comment section skeleton -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1">
                <!-- Heart vote skeleton -->
                <div
                  class="h-6 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-600"
                />

                <!-- Comment button skeleton -->
                <div
                  class="h-6 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </li>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.animate-pulse {
  background: linear-gradient(90deg, 
    theme('colors.gray.200') 25%, 
    theme('colors.gray.100') 37%, 
    theme('colors.gray.200') 63%
  );
  background-size: 400px 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.dark .animate-pulse {
  background: linear-gradient(90deg, 
    theme('colors.gray.600') 25%, 
    theme('colors.gray.500') 37%, 
    theme('colors.gray.600') 63%
  );
  background-size: 400px 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
</style>