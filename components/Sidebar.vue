<template>
  <div class="sidebar">
    <component
      v-for="(item, index) in trackingItems"
      :key="index"
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
      }, 300000); //  5 минут
    },
    cancelCompletion(index) {
      this.trackingItems[index].isCompleted = false;

      clearTimeout(this.trackingItems[index].timer);
      this.trackingItems[index].timer = null;
    },
    removeItem(index) {
      this.trackingItems.splice(index, 1);
    },
    handleIncomingMessage(message) {
      if (message.type === 'new-order') {
        this.trackingItems.push({
          id: `#${message.data.id}`,
          status: message.data.status,
          details: message.data.details,
        });
      }
    },
  },
  mounted() {
    const runtimeConfig = useRuntimeConfig();
    const serverUrl = runtimeConfig.public?.serverUrl

    this.socket = io(serverUrl,  {
      path: '/socket.io',
      transports: ['websocket'],
      secure: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('connect_error', (err) => {
      console.error('connect_error', err);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('disconnected', reason);
    });

    this.socket.on('new-order', (order) => {
      console.log('New order received:', order);

      const formatted = {
        id: `#${order.id}`,
        status: order.status || 'In Transit',
        details: order.delivery_address || 'Не указано',
      };

      this.trackingItems.push(formatted);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
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
