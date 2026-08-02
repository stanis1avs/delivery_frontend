<template>
  <div class="tracking-layout">
    <Navbar />
    <main>
      <div class="main-title">
        <h1>Tracking</h1>
        <img
          v-if="user"
          class="profile-image"
          :src="user.photo_url"
          alt="Profile"
          @click="toggleLogoutPopup"
        />
      </div>
      <div v-if="showLogoutPopup" class="logout-popup" @click.self="showLogoutPopup = false">
        <div class="popup-content">
          <p>{{ user.first_name }}</p>
          <button class="logout-btn" @click="logout">Выйти</button>
        </div>
      </div>
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
.profile-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.logout-popup {
  position: absolute;
  top: 60px;
  right: var(--padding);
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.popup-content {
  background: #fff;
  padding: var(--padding);
  border-radius: var(--second-border-radius);
  text-align: center;
  min-width: 150px;
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
