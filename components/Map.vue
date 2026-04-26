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
  name: 'Map',

  data() {
    return {
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

    // Leaflet загружается только на клиенте (SSR-safe)
    const L = await import('leaflet');
    await import('leaflet/dist/leaflet.css');

    // Исправить путь иконок по умолчанию (webpack/vite ломает их)
    delete L.default.Icon.Default.prototype._getIconUrl;
    L.default.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    this.L = L.default;

    // Дефолтный центр — Москва, потом скорректируем по геолокации
    this.map = this.L.map(this.$refs.mapContainer).setView([55.75, 37.62], 11);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    // Центрировать по реальной геолокации браузера
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (this.map) {
            this.map.setView([pos.coords.latitude, pos.coords.longitude], 13);
          }
        },
        () => { /* отклонено — остаётся дефолт */ }
      );
    }
  },

  beforeUnmount() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  },

  methods: {
    /**
     * Показать маршрут между двумя точками.
     * Запрашивает геометрию с бэкенда (OSRM через /api/geo/route).
     */
    async showRoute(fromLat, fromLon, toLat, toLon) {
      if (!this.map) return;

      try {
        const res = await fetch(
          `/api/geo/route?fromLat=${fromLat}&fromLon=${fromLon}&toLat=${toLat}&toLon=${toLon}`
        );

        if (!res.ok) throw new Error('Маршрут не найден');

        const { geometry, distance_meters, duration_seconds } = await res.json();

        // Убрать предыдущий маршрут
        if (this.routeLayer) {
          this.map.removeLayer(this.routeLayer);
        }

        // Нарисовать новый маршрут
        this.routeLayer = this.L.geoJSON(geometry, {
          style: { color: '#3b82f6', weight: 5, opacity: 0.85 },
        }).addTo(this.map);

        this.map.fitBounds(this.routeLayer.getBounds(), { padding: [40, 40] });

        this.routeInfo = {
          distance: (distance_meters / 1000).toFixed(1),
          duration: Math.round(duration_seconds / 60),
        };

        // Маркеры начала и конца
        this._setMarker('pickup', fromLat, fromLon, 'Точка забора');
        this._setMarker('dropoff', toLat, toLon, 'Точка доставки');
      } catch (err) {
        console.error('Ошибка маршрута:', err);
      }
    },

    /**
     * Обновить позицию курьера на карте (real-time).
     * @param {string} courierId
     * @param {number} lat
     * @param {number} lon
     */
    updateCourierPosition(courierId, lat, lon) {
      if (!this.map) return;

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
          .bindTooltip(`Курьер`);
      }
    },

    /**
     * Очистить маршрут и маркеры.
     */
    clearRoute() {
      if (this.routeLayer) {
        this.map.removeLayer(this.routeLayer);
        this.routeLayer = null;
      }
      ['pickup', 'dropoff'].forEach((key) => {
        if (this[`${key}Marker`]) {
          this.map.removeLayer(this[`${key}Marker`]);
          this[`${key}Marker`] = null;
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
  height: calc(100vh - 70px - 21px);
  border-radius: var(--main-border-radius);
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
}

.route-info {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: #fff;
  border-radius: var(--second-border-radius);
  padding: 8px 20px;
  display: flex;
  gap: var(--gap);
  font-size: var(--small-font-size);
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);

  @include responsive(768px) {
    font-size: 13px;
    padding: 6px 14px;
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
