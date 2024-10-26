<template>
  <div @click="$emit('update-active')" class="tracking-item">
    <div class="progress-bar"><span class="progress"></span></div>
    <div class="tracking-info">
      <h2>{{ item.id }}</h2>
      <button>In Transit</button>
    </div>
    <div class="tracking-statuses">
      <div class="tracking-status">
        <span class="status-icon"></span>
        <div class="status-text">
          <p class="status-message">Status: {{ item.status }}</p>
          <p class="status-location">{{ item.details }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TrackingItem',
  props: {
    item: Object,
  }
};
</script>

<style scoped>
@import "@/assets/css/trackingItem.css";
</style>
