<template>
  <div class="tracking-item tracking-item-active" :class="{ completed: item.isCompleted }">
    <div class="progress-bar progress-bar-active"><span class="progress progress-active"></span></div>
    <div class="tracking-info">
      <h2>№ {{ orderNumber }}</h2>
      <button class="button-active" v-if="!item.isCompleted" @click="handleComplete">Out for Delivery</button>
      <button class="button-active" v-if="item.isCompleted" @click="cancelCompletion">Cancel</button>
    </div>
    <div class="tracking-statuses tracking-statuses-active">
      <div
        v-for="step in steps"
        :key="step.message"
        class="tracking-status tracking-status-active"
      >
        <span
          class="status-icon status-icon-active"
          :class="{ 'status-icon-current': step.current }"
        ></span>
        <div class="status-text">
          <p class="status-message">{{ step.message }}</p>
          <p class="status-location">{{ step.location }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { orderFormat } from '@/composables/useActiveOrder.js';

export default {
  name: 'TrackingActiveItem',
  props: {
    item: Object,
  },
  computed: {
    orderNumber() {
      return orderFormat.shortId(this.item?.rawId);
    },

    /**
     * Этапы выводятся из фактического состояния заказа, а не из выдуманной истории.
     * Отдельного журнала событий в системе нет (см. NOT_IMPLEMENTED.md), поэтому
     * показываем то, что действительно известно: адреса и текущий статус.
     */
    steps() {
      const o = this.item || {};
      const done = o.isCompleted || o.status === 'Completed';
      const coords = (p) => (p ? `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}` : 'координаты не заданы');

      return [
        {
          message: 'Заказ принят курьером',
          location: o.pickup_address || coords(o.pickup_location),
          current: false,
        },
        {
          message: 'В пути к получателю',
          location: [
            orderFormat.distance(o.distance_meters),
            orderFormat.duration(o.estimated_duration_seconds),
          ].join(' · '),
          current: !done,
        },
        {
          message: done ? 'Доставлен' : 'Доставка',
          location: o.dropoff_address || coords(o.dropoff_location),
          current: done,
        },
      ];
    },
  },
  methods: {
    handleComplete() {
      this.$emit('mark-completed');
    },
    cancelCompletion() {
      this.$emit('cancel-completed');
    },
  },
};
</script>

<style scoped>
@import "@/assets/css/trackingItem.css";

.tracking-item.completed {
  opacity: 0.7;
}
</style>
