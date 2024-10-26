<template>
  <div class="map-placeholder">
    <p>Map Placeholder</p>
  </div>
</template>

<script>
export default {
  name: 'MapComponent',
};
</script>

<style scoped>
.map-placeholder {
  background-color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #555;
  border-radius: var(--main-border-radius);
}
</style>
