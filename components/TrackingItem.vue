<template>
  <div @click="$emit('update-active')" class="tracking-item">
    <div class="progress-bar"><span class="progress"></span></div>
    <div class="tracking-info">
      <h2>№ {{ orderNumber }}</h2>
      <button>In Transit</button>
    </div>
    <div class="tracking-statuses">
      <div class="tracking-status">
        <span class="status-icon"></span>
        <div class="status-text">
          <p class="status-message">{{ item.customer_name || item.details }}</p>
          <p class="status-location">{{ summary }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { orderFormat } from '@/composables/useActiveOrder.js';

export default {
  name: 'TrackingItem',
  props: {
    item: Object,
  },
  computed: {
    orderNumber() {
      return orderFormat.shortId(this.item?.rawId);
    },
    summary() {
      return [
        orderFormat.distance(this.item?.distance_meters),
        orderFormat.duration(this.item?.estimated_duration_seconds),
      ].join(' · ');
    },
  },
};
</script>

<style scoped>
@import "@/assets/css/trackingItem.css";
</style>
