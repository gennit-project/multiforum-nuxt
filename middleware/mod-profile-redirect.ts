import { defineNuxtRouteMiddleware, navigateTo } from "nuxt/app";

export default defineNuxtRouteMiddleware((to) => {
  if (to.name === "mod-modId") {
    return navigateTo({
      name: "mod-modId-comments",
      params: {
        modId: to.params.modId,
      },
    });
  }
});
