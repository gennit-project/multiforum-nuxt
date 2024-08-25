<script>
  export default {
    name: 'ImageChip',
    props: {
      text: {
        type: String,
        required: true
      },
      imageSrc: {
        type: String,
        required: true
      }
    },
    data: () => ({
      menu: false,
    }),
  }

</script>
<template>
  <v-menu
    v-model="menu"
    location="top start"
    origin="top start"
    transition="scale-transition"
  >
    <template #activator="{ props }">
      <v-chip
        pill
        v-bind="props"
        link
      >
        <v-avatar start>
          <v-img src="https://cdn.vuetifyjs.com/images/john.png" />
        </v-avatar>

        John Leider
      </v-chip>
    </template>

    <v-card width="300">
      <v-list bg-color="black">
        <v-list-item>
          <template #prepend>
            <v-avatar image="https://cdn.vuetifyjs.com/images/john.png" />
          </template>

          <v-list-item-title>John Leider</v-list-item-title>

          <v-list-item-subtitle>john@google.com</v-list-item-subtitle>

          <template #append>
            <v-list-item-action>
              <v-btn
                icon
                variant="text"
                @click="menu = false"
              >
                <v-icon>mdi-close-circle</v-icon>
              </v-btn>
            </v-list-item-action>
          </template>
        </v-list-item>
      </v-list>

      <v-list>
        <v-list-item
          link
          prepend-icon="mdi-briefcase"
        >
          <v-list-item-subtitle>john@gmail.com</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

  
  <style scoped>
  .chip {
    display: flex;
    align-items: center;
    background-color: #f2f2f2;
    border-radius: 20px;
    padding: 8px;
    margin: 8px;
  }
  
  .left {
    flex-grow: 1;
  }
  
  .right {
    margin-left: 16px;
    border-top-right-radius: 20px;
    border-bottom-right-radius: 20px;
    overflow: hidden;
  }
  
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  </style>
  