/**
 * Composable для отслеживания геопозиции курьера и отправки на сервер.
 *
 * Использование в layout.vue:
 *   const { startTracking, stopTracking } = useGeoLocation();
 *   onMounted(() => startTracking(user.courierId));
 *   onBeforeUnmount(() => stopTracking());
 */

let watchId = null;

export function useGeoLocation() {
  /**
   * Начать отслеживание и отправку позиции на /api/geo/courier/location
   * @param {string} courierId
   */
  function startTracking(courierId) {
    if (!courierId || typeof navigator === 'undefined' || !navigator.geolocation) return;

    // Остановить предыдущий watch если был
    stopTracking();

    watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;

        try {
          await fetch('/api/geo/courier/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courierId, lat, lon }),
          });
        } catch (err) {
          console.error('Ошибка отправки геопозиции:', err);
        }
      },
      (err) => {
        console.warn('Геолокация недоступна:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,   // кэш позиции 10 сек
        timeout: 15000,
      }
    );
  }

  /**
   * Получить текущую позицию один раз (Promise).
   * @returns {Promise<{lat: number, lon: number}>}
   */
  function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error('Геолокация не поддерживается'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        reject,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  function stopTracking() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  return { startTracking, stopTracking, getCurrentPosition };
}
