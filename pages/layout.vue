<template>
  <div class="tracking-layout">
    <Navbar />
    <main>
      <div class="main-title">
        <h1>Tracking</h1>
        <div v-if="user" class="profile">
          <img
            class="profile-image"
            :src="user.photo_url"
            alt="Profile"
            @click="toggleLogoutPopup"
          />
          <div v-if="showLogoutPopup" class="logout-popup">
            <p class="popup-name">{{ user.first_name }}</p>
            <button class="logout-btn" @click="logout">Выйти</button>
          </div>
        </div>
      </div>
      <div v-if="showLogoutPopup" class="popup-backdrop" @click="showLogoutPopup = false"></div>
      <slot />
    </main>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue';
import { useGeoLocation } from '@/composables/useGeoLocation.js';

export default {
  data() {
    return {
      user: null,
      showLogoutPopup: false,
      geoTracker: null,
    };
  },

  mounted() {
    if (!import.meta.client) return;

    // Один экземпляр трекера на компонент — переиспользуется для start/stop (BUG-118)
    this.geoTracker = useGeoLocation();

    const userParam = this.$route.query.user;
    if (userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('tg_user', JSON.stringify(user));
        this.user = user;
        navigateTo('/');
      } catch (e) {
        console.error('Ошибка обработки пользователя:', e);
        navigateTo('/login');
      }
    } else {
      const storedUser = localStorage.getItem('tg_user');
      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser);
        } catch {
          localStorage.removeItem('tg_user');
          navigateTo('/login');
          return;
        }
      } else {
        navigateTo('/login');
        return;
      }
    }

    // Запустить геотрекинг — позиция курьера будет отправляться на сервер
    if (this.user?.courierId) {
      this.geoTracker.startTracking(this.user.courierId);
    }
  },

  beforeUnmount() {
    if (import.meta.client) {
      this.geoTracker?.stopTracking();
    }
  },

  methods: {
    toggleLogoutPopup() {
      this.showLogoutPopup = !this.showLogoutPopup;
    },
    logout() {
      if (import.meta.client) {
        this.geoTracker?.stopTracking();
        localStorage.removeItem('tg_user');
      }
      this.showLogoutPopup = false;
      this.$router.push('/login?relogin=true');
    },
  },

  components: {
    Navbar,
  },
};
</script>

<style scoped lang="scss">
// Якорь для выпадающего меню: без него .logout-popup позиционировался
// относительно окна и уезжал поверх карты
.profile {
  position: relative;
  justify-self: end;
}

.profile-image {
  display: block;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

// Прозрачный слой-ловушка для закрытия по клику мимо меню. Раньше эту роль
// играл сам .logout-popup с @click.self, но он ужимался по размеру контента,
// и попасть «мимо» можно было только в углы
.popup-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
}

// Раньше это была обёртка с тёмным фоном без скругления, из-под скруглённого
// белого блока торчали её прямые углы — отсюда «кривое» скругление.
// Теперь сам блок и есть карточка меню
.logout-popup {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 100;
  min-width: 160px;
  padding: var(--padding);
  background: #fff;
  border-radius: var(--second-border-radius);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  text-align: center;
}

.popup-name {
  font-weight: 600;
  white-space: nowrap;
}

.logout-btn {
  margin-top: 10px;
  padding: 8px 14px;
  background: #f44336;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: darken(#f44336, 8%);
  }
}
</style>
