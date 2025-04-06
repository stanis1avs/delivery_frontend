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

export default {
  data() {
    return {
      user: null,
      showLogoutPopup: false,
    };
  },
  mounted() {
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
        this.user = JSON.parse(storedUser);
      } else {
        navigateTo('/login');
      }
    }
  },
  methods: {
    toggleLogoutPopup() {
      this.showLogoutPopup = !this.showLogoutPopup;
    },
    logout() {
      if (process.client) {
        localStorage.removeItem('tg_user');
      }
      this.showLogoutPopup = false;
      this.$router.push('/login?relogin=true');
    }
  },
  components: {
    Navbar,
  },
};
</script>

<style scoped>
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
  right: 20px;
  background: rgba(0, 0, 0, 0.5);
}

.popup-content {
  background: white;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  min-width: 150px;
}

.logout-btn {
  margin-top: 10px;
  padding: 8px 14px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>