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
  // Получаем фабричную функцию доступа к карте от index.vue
  inject: {
    getMapRef: { default: null },
  },

  data() {
    return {
      activeItem: null,
      trackingItems: [],
      socket: null,
    };
  },

  methods: {
    setActiveItem(index) {
      // Если клик по уже активному — деактивируем
      if (this.activeItem === index) {
        this.activeItem = null;
        this._clearMap();
        return;
      }

      this.activeItem = index;
      const order = this.trackingItems[index];

      // Показать маршрут на карте если у заказа есть координаты
      if (order.pickup_location && order.dropoff_location) {
        const map = this.getMapRef?.();
        if (map) {
          map.showRoute(
            order.pickup_location.lat,
            order.pickup_location.lon,
            order.dropoff_location.lat,
            order.dropoff_location.lon
          );
        }
      }
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
      if (this.activeItem === index) {
        this.activeItem = null;
        this._clearMap();
      }
      this.trackingItems.splice(index, 1);
    },

    handleNewOrder(order) {
      // Дедупликация
      const alreadyExists = this.trackingItems.some((item) => item.id === `#${order.id}`);
      if (alreadyExists) return;

      this.trackingItems.push({
        id: `#${order.id}`,
        status: order.status || 'In Transit',
        details: order.details || 'Не указано',
        // Координаты для маршрута (если бэкенд их передаёт)
        pickup_location: order.pickup_location || null,
        dropoff_location: order.dropoff_location || null,
      });
    },

    _clearMap() {
      const map = this.getMapRef?.();
      if (map) map.clearRoute();
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
      this.socket.emit('join-dispatchers');
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connect_error:', err);
    });

    // Новый заказ от воркера
    this.socket.on('new-order', (order) => {
      this.handleNewOrder(order);
    });

    // Real-time позиция курьера → обновить маркер на карте
    this.socket.on('courier-location', ({ courierId, lat, lon, name }) => {
      const map = this.getMapRef?.();
      if (map) map.updateCourierPosition(courierId, lat, lon, name);
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
