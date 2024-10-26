<template>
  <div class="tracking-item tracking-item-active" :class="{ completed: item.isCompleted }">
    <div class="progress-bar progress-bar-active"><span class="progress progress-active"></span></div>
    <div class="tracking-info">
      <h2>{{ item.id }}</h2>
      <button class="button-active" v-if="!item.isCompleted" @click="handleComplete">Out for Delivery</button>
      <button class="button-active" v-if="item.isCompleted" @click="cancelCompletion">Cancel</button>
    </div>
    <div class="tracking-statuses tracking-statuses-active">
      <div class="tracking-status tracking-status-active">
        <span class="status-icon status-icon-active"></span>
        <div class="status-text">
          <p class="status-message">Package has left Courier Facility </p>
          <p class="status-location">ул. Губанова 56</p>
        </div>
      </div>
      <div class="tracking-status tracking-status-active">
        <span class="status-icon status-icon-active"></span>
        <div class="status-text">
          <p class="status-message">Package arrived at Local Facility</p>
          <p class="status-location">ул. Губанова 56</p>
        </div>
      </div>
      <div class="tracking-status tracking-status-active">
        <span class="status-icon status-icon-active status-icon-current"></span>
        <div class="status-text">
          <p class="status-message">Out for Delivery</p>
          <p class="status-location">ул. Губанова 56</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TrackingActiveItem',
  props: {
    item: Object,
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
