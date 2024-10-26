<template>
  <layout>
    <MapComponent />
  </layout>
</template>

<script>
import Layout from "./layout.vue";
import Map from '@/components/Map.vue';

export default {
  components: {
    Layout,
    Map
  },
};
</script>