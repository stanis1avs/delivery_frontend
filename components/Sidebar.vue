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

export default {
  data() {
    return {
      activeItem: null,
      trackingItems: [
        { id: '#12777489-DL-NY', status: 'Out for Delivery', details: 'ул. Ново-Садовая 106' },
        { id: '#12777490-DL-NY', status: 'In Transit', details: 'ул. Мичурина 148' },
        { id: '#12777491-DL-NY', status: 'In Transit', details: 'ул. Ленина 228' },
      ],
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
