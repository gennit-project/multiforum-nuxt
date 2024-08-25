<script lang="ts">
import { defineComponent } from "vue";
import { useDisplay } from "vuetify";
import { useRoute } from "vue-router";

export default defineComponent({
  components: {},
  props: {
    showRightPaneAtMediumScreenWidth: {
      type: Boolean,
      default: false,
    }
  },
  setup() {
    const { lgAndDown, lgAndUp, smAndDown, mdAndDown, mdAndUp, xlAndUp } = useDisplay();
    const route = useRoute();

    return {
      lgAndDown,
      lgAndUp,
      mdAndDown,
      mdAndUp,
      smAndDown,
      xlAndUp,
      route,
    };
  },
});
</script>

<template>
  <v-container
    fluid
    class="w-full p-0"
  >
    <v-row class="w-full">
      <v-col
        :cols="6"
        :class="[
          lgAndUp ? 'constrain-height' : '',
        ]"
        class="w-full"
      >
        <slot name="leftpane" />
      </v-col>
      <v-col
        v-if="mdAndUp"
        :cols="6"
        :class="[
          'p-0',
          lgAndUp ? 'constrain-height' : '',
          'lg:max-h-screen',
          'lg:overflow-y-auto',
        ]"
      >
        <slot name="rightpane" />
      </v-col>
    </v-row>
  </v-container>
</template>
  
<style>
.constrain-height {
  max-height: 90vh;
  height: 100% - 200px;
}
</style>