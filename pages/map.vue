<template>
  <layout>
    <MapComponent ref="mapComponent" />
  </layout>
</template>

<script>
import Layout from "./layout.vue";
import MapComponent from '@/components/MapComponent.vue';
import { io } from 'socket.io-client';

// BUG-120: раньше /map использовала мёртвый дубль Map.vue без сокета.
// Теперь переиспользует рабочий MapComponent и показывает позиции курьеров в реальном времени.
export default {
  components: {
    Layout,
    MapComponent,
  },

  data() {
    return { socket: null };
  },

  mounted() {
    if (!import.meta.client) return;

    const runtimeConfig = useRuntimeConfig();
    const serverUrl = runtimeConfig.public?.serverUrl;

    this.socket = io(serverUrl, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    this.socket.on('connect', () => this.socket.emit('join-dispatchers'));

    this.socket.on('courier-location', ({ courierId, lat, lon, name }) => {
      this.$refs.mapComponent?.updateCourierPosition(courierId, lat, lon, name);
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connect_error:', err);
    });
  },

  beforeUnmount() {
    if (this.socket) this.socket.disconnect();
  },
};
</script>
