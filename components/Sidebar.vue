<template>
  <div class="sidebar">
    <component
      v-for="(item, index) in trackingItems"
      :key="item.id"
      :item="item"
      :is="activeItem === index ? 'TrackingActiveItem' : 'TrackingItem'"
      @update-active="setActiveItem(index)"
      @mark-completed="markItemCompleted(index)"
      @cancel-completed="cancelCompletion(index)"
    />
  </div>
</template>

<script>
import TrackingItem from './TrackingItem.vue';
import TrackingActiveItem from './TrackingActiveItem.vue';
import { io } from 'socket.io-client';

export default {
  data() {
    return {
      activeItem: null,
      trackingItems: [],
      socket: null,
    };
  },
  methods: {
    setActiveItem(index) {
      this.activeItem = index;
    },
    markItemCompleted(index) {
      this.trackingItems[index].isCompleted = true;

      this.trackingItems[index].timer = setTimeout(() => {
        this.removeItem(index);
      }, 300000); // 5 минут
    },
    cancelCompletion(index) {
      this.trackingItems[index].isCompleted = false;
      clearTimeout(this.trackingItems[index].timer);
      this.trackingItems[index].timer = null;
    },
    removeItem(index) {
      this.trackingItems.splice(index, 1);
    },
    handleNewOrder(order) {
      // Дедупликация: не добавлять заказ, если он уже есть в списке
      const alreadyExists = this.trackingItems.some((item) => item.id === `#${order.id}`);
      if (alreadyExists) return;

      this.trackingItems.push({
        id: `#${order.id}`,
        status: order.status || 'In Transit',
        details: order.details || 'Не указано',
      });
    },
  },
  mounted() {
    const runtimeConfig = useRuntimeConfig();
    const serverUrl = runtimeConfig.public?.serverUrl;

    this.socket = io(serverUrl, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      // Вступить в комнату диспетчеров для получения обновлений заказов
      this.socket.emit('join-dispatchers');
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connect_error:', err);
    });

    this.socket.on('new-order', (order) => {
      this.handleNewOrder(order);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });
  },
  beforeUnmount() {
    if (this.socket) this.socket.disconnect();
  },
  components: {
    TrackingItem,
    TrackingActiveItem,
  },
};
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  overflow-y: auto;
  max-height: calc(100vh - 80px);
}
</style>
