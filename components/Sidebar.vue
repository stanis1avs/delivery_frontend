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

    async markItemCompleted(index) {
      const item = this.trackingItems[index];
      item.isCompleted = true;
      // Завершить заказ на бэкенде: статус Completed, курьер освобождается (BUG-119)
      await this._postOrderAction(item.rawId, 'complete');
      item.timer = setTimeout(() => {
        this.removeItem(index);
      }, 300000); // 5 минут — грейс на отмену перед удалением карточки
    },

    async cancelCompletion(index) {
      const item = this.trackingItems[index];
      item.isCompleted = false;
      clearTimeout(item.timer);
      item.timer = null;
      // Откатить завершение на бэкенде (BUG-119)
      await this._postOrderAction(item.rawId, 'revert');
    },

    async _postOrderAction(rawId, action) {
      if (!rawId) return;
      let token = '';
      let courierId = '';
      try {
        const stored = JSON.parse(localStorage.getItem('tg_user') || '{}');
        token = stored.geoToken || '';
        courierId = stored.courierId || '';
      } catch { /* нет пользователя */ }

      try {
        await fetch(`/api/orders/${rawId}/${action}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Courier-Token': token,
            'X-Courier-Id': courierId,
          },
        });
      } catch (err) {
        console.error(`Ошибка действия "${action}" над заказом:`, err);
      }
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
        rawId: order.id, // исходный UUID для запросов к бэкенду
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

      // Подписаться на персональную комнату курьера, чтобы получать только свои заказы (BUG-107)
      try {
        const stored = JSON.parse(localStorage.getItem('tg_user') || '{}');
        if (stored.courierId) this.socket.emit('join-courier', stored.courierId);
      } catch (e) {
        /* нет сохранённого пользователя — пропускаем */
      }
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

<style scoped lang="scss">
.sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  overflow-y: auto;
  max-height: calc(100vh - 80px);

  @include responsive(768px) {
    max-height: 40vh;
  }
}
</style>
