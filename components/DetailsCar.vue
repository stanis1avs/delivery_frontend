<template>
  <div class="car-cert">
    <h2>{{ model }}</h2>
    <a href="/documents">View documents</a>
  </div>
  <div class="license-plate">
    <span>{{ plate }}</span>
  </div>
</template>

<script>
import { useActiveOrder } from '@/composables/useActiveOrder.js';

export default {
  name: 'DetailsCar',

  setup() {
    return { order: useActiveOrder() };
  },

  computed: {
    // Транспорт привязан к курьеру и приезжает вместе с заказом (vehicle)
    model() {
      return this.order?.vehicle?.model || 'Транспорт не указан';
    },
    plate() {
      return this.order?.vehicle?.plate || '—';
    },
  },
};
</script>

<style lang="scss" scoped>
  .car-cert {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;

    a {
      justify-self: end;
      color: var(--primary-color);
    }
  }

  .license-plate {
    display: inline-block;
    position: relative;
    padding: 10px 30px;
    border: 4px solid black;
    border-radius: var(--second-border-radius);
    font-size: 20px;
    font-weight: bold;
    width: 185px;
    box-sizing: border-box;
    margin-bottom: 20px;
    letter-spacing: 2px;

    span {
      padding: 0 10px;
    }

    &::before, &::after {
      content: "";
      position: absolute;
      width: 10px;
      height: 10px;
      background-color: #000;
      border-radius: 50%;
    }

    &::before {
      top: 10px;
      left: 10px;
    }

    &::after {
      bottom: 10px;
      right: 10px;
    }
  }
</style>
