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

    // Свой origin + прокси Nuxt — работает через HTTPS-тоннель и с других устройств.
    // Только polling: dev-прокси Nitro не тянет апгрейд до WebSocket (см. Sidebar.vue)
    this.socket = io({
      path: '/socket.io',
      transports: ['polling'],
      upgrade: false,
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
