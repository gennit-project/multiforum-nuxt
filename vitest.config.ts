import { defineConfig } from "vitest/config";
import Vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [Vue()],
  test: {
    globals: true,
    environment: "happy-dom",
    deps: {
      optimizer: {
        web: {
          include: ["@vue", "vuemoji-picker"],
        },
      },
    },
    setupFiles: ["./tests/setup.ts"],
    // Suppress Vue compiler warnings about defineProps and defineExpose
    onConsoleLog(log) {
      if (
        log.includes("`defineProps` is a compiler macro") ||
        log.includes("`defineExpose` is a compiler macro")
      ) {
        return false; // Returning false prevents the log from being displayed
      }
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
