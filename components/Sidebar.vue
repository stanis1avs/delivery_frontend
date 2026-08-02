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

  // Выбранный заказ читают блоки получателя, транспорта и параметров доставки
  setup() {
    return { activeOrder: useActiveOrder() };
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
        this.activeOrder = null;
        this._clearMap();
        return;
      }

      this.activeItem = index;
      const order = this.trackingItems[index];
      // Отдать заказ соседним блокам (получатель, транспорт, параметры доставки)
      this.activeOrder = order;

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

    _courierAuth() {
      try {
        const stored = JSON.parse(localStorage.getItem('tg_user') || '{}');
        return { token: stored.geoToken || '', courierId: stored.courierId || '' };
      } catch {
        return { token: '', courierId: '' };
      }
    },

    /**
     * Подтянуть уже принятые заказы с бэкенда.
     * Без этого список жил только на событиях new-order и обнулялся при перезагрузке.
     */
    async _loadActiveOrders() {
      const { token, courierId } = this._courierAuth();
      if (!token || !courierId) return;

      try {
        const res = await fetch('/api/orders/active', {
          headers: { 'X-Courier-Token': token, 'X-Courier-Id': courierId },
        });
        if (!res.ok) return;
        // handleNewOrder дедуплицирует, поэтому гонка с сокетом безопасна
        (await res.json()).forEach((order) => this.handleNewOrder(order));
      } catch (err) {
        console.error('Не удалось загрузить активные заказы:', err);
      }
    },

    async _postOrderAction(rawId, action) {
      if (!rawId) return;
      const { token, courierId } = this._courierAuth();

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
        this.activeOrder = null;
        this._clearMap();
      }
      this.trackingItems.splice(index, 1);
    },

    handleNewOrder(order) {
      // Дедупликация
      const alreadyExists = this.trackingItems.some((item) => item.id === `#${order.id}`);
      if (alreadyExists) return;

      // Раскладывать поля по одному больше не нужно: бэкенд отдаёт единый формат
      // и для REST, и для сокета (OrderModule.serializeForClient)
      this.trackingItems.push({
        ...order,
        id: `#${order.id}`,
        rawId: order.id, // исходный UUID для запросов к бэкенду
        status: order.status || 'In Transit',
        details: order.details || 'Не указано',
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
    // Восстановить уже принятые заказы — иначе после F5 список пуст
    this._loadActiveOrders();

    // Подключаемся к своему origin — Nuxt проксирует /socket.io на бэкенд.
    // Прямой адрес localhost:7070 работал только с машины бэкенда и блокировался
    // как mixed content на HTTPS-странице (ngrok).
    //
    // Только polling: dev-прокси Nitro не умеет апгрейд до WebSocket — бэкенд
    // отвечает 101 и шлёт бинарные кадры, а HTTP-парсер Node падает на них с
    // «Parse Error: Invalid character in chunk size». Polling через прокси работает
    // стабильно; для этого приложения его пропускной способности достаточно.
    this.socket = io({
      path: '/socket.io',
      transports: ['polling'],
      upgrade: false,
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
