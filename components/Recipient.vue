<template>
  <div class="recipient-info">
    <RecipientContact />
    <RecipientAdress />
  </div>
</template>

<script>
export default {
  name: 'Recipient',
};
</script>

<style lang="scss" scoped>
@import "@/assets/css/mixins.scss";

.recipient-info {
  background-color: #000;
  padding: 10px;
  border-radius: var(--main-border-radius);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap);

  @include responsive(1366px) {
    grid-template-columns: 1fr;
  }
}
</style>
