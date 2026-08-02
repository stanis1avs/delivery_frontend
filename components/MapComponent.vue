<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container" />

    <div v-if="routeInfo" class="route-info">
      <span>{{ routeInfo.distance }} км</span>
      <span>~{{ routeInfo.duration }} мин</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MapComponent',

  data() {
    return {
      L: null,
      map: null,
      routeLayer: null,
      pickupMarker: null,
      dropoffMarker: null,
      courierMarkers: {},
      routeInfo: null,
    };
  },

  async mounted() {
    if (!import.meta.client) return;

    const L = await import('leaflet');
    await import('leaflet/dist/leaflet.css');

    delete L.default.Icon.Default.prototype._getIconUrl;
    L.default.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    this.L = L.default;

    // Дефолтный центр — Самара (в зоне покрытия OSRM-данных Volga Federal District),
    // далее корректируется по геолокации браузера (BUG-114)
    this.map = this.L.map(this.$refs.mapContainer).setView([53.1959, 50.1002], 12);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    // Центрировать по геолокации браузера
    this._centerOnUserLocation();
  },

  beforeUnmount() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  },

  methods: {
    _centerOnUserLocation() {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (this.map) {
            this.map.setView([pos.coords.latitude, pos.coords.longitude], 13);
          }
        },
        () => { /* геолокация отклонена — остаётся дефолтный центр */ }
      );
    },

    /**
     * Показать маршрут pickup → dropoff через OSRM.
     * Вызывается из Sidebar при выборе активного заказа.
     */
    async showRoute(fromLat, fromLon, toLat, toLon) {
      if (!this.map) return;
      try {
        const res = await fetch(
          `/api/geo/route?fromLat=${fromLat}&fromLon=${fromLon}&toLat=${toLat}&toLon=${toLon}`
        );
        if (!res.ok) throw new Error('Маршрут не найден');

        const { geometry, distance_meters, duration_seconds } = await res.json();

        if (this.routeLayer) this.map.removeLayer(this.routeLayer);

        this.routeLayer = this.L.geoJSON(geometry, {
          style: { color: '#3b82f6', weight: 5, opacity: 0.85 },
        }).addTo(this.map);

        this.map.fitBounds(this.routeLayer.getBounds(), { padding: [40, 40] });

        this.routeInfo = {
          distance: (distance_meters / 1000).toFixed(1),
          duration: Math.round(duration_seconds / 60),
        };

        this._setMarker('pickup', fromLat, fromLon, 'Точка забора');
        this._setMarker('dropoff', toLat, toLon, 'Точка доставки');
      } catch (err) {
        console.error('Ошибка маршрута:', err);
      }
    },

    /**
     * Обновить/поставить маркер курьера на карту.
     * Вызывается при получении courier-location через WebSocket.
     */
    updateCourierPosition(courierId, lat, lon, label) {
      if (!this.map || !this.L) return;

      if (this.courierMarkers[courierId]) {
        this.courierMarkers[courierId].setLatLng([lat, lon]);
      } else {
        const icon = this.L.divIcon({
          className: '',
          html: '<div class="courier-dot"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        this.courierMarkers[courierId] = this.L.marker([lat, lon], { icon })
          .addTo(this.map)
          .bindTooltip(label || 'Курьер', { permanent: false });
      }
    },

    clearRoute() {
      if (this.routeLayer) {
        this.map.removeLayer(this.routeLayer);
        this.routeLayer = null;
      }
      ['pickup', 'dropoff'].forEach((key) => {
        const markerKey = `${key}Marker`;
        if (this[markerKey]) {
          this.map.removeLayer(this[markerKey]);
          this[markerKey] = null;
        }
      });
      this.routeInfo = null;
    },

    _setMarker(type, lat, lon, label) {
      const key = `${type}Marker`;
      if (this[key]) this.map.removeLayer(this[key]);
      this[key] = this.L.marker([lat, lon])
        .addTo(this.map)
        .bindPopup(label)
        .openPopup();
    },
  },
};
</script>

<style scoped lang="scss">
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
  border-radius: var(--main-border-radius);
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
}

.route-info {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: #fff;
  border-radius: var(--second-border-radius);
  padding: 6px 18px;
  display: flex;
  gap: var(--gap);
  font-size: var(--small-font-size);
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);

  @include responsive(768px) {
    font-size: 13px;
    padding: 5px 12px;
    gap: 12px;
  }
}
</style>

<style>
.courier-dot {
  width: 14px;
  height: 14px;
  background: #22c55e;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}
</style>
