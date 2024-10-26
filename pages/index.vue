<template>
  <layout>
    <div class="main-body">
      <Sidebar />
      <div class="main-content">
        <div class="truck-info">
          <img class="truck-image" src="/truck.png" alt="Truck" />
          <div class="truck-details">
            <DetailsCar />
            <DetailsDelivery />
          </div>
        </div>
        <div class="truck-info">
          <MapComponent />
          <Recipient />
        </div>
      </div>
    </div>
  </layout>
</template>

<script>
import Layout from "./layout.vue";
import Sidebar from '@/components/Sidebar.vue';
import MapComponent from '@/components/MapComponent.vue';
import Recipient from '@/components/Recipient.vue';
import DetailsDelivery from '@/components/DetailsDelivery.vue';
import DetailsCar from '@/components/DetailsCar.vue';

export default {
  components: {
    Layout,
    Sidebar,
    DetailsCar,
    DetailsDelivery,
    MapComponent,
    Recipient,
  }
};
</script>