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
@use '../assets/css/mixins.scss' as mixins;

/* Внутренний радиус = внешний минус отступ, иначе углы вложенных карточек
   не повторяют угол чёрной подложки и стык выглядит кривым */
$inset: 10px;

.recipient-info {
  background-color: #000;
  padding: $inset;
  border-radius: var(--main-border-radius);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap);

  > * {
    border-radius: calc(var(--main-border-radius) - #{$inset});
  }

  @include responsive(1366px) {
    grid-template-columns: 1fr;
  }
}
</style>
