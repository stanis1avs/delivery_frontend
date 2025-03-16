<template>
  <div class="tracking-layout">
    <Navbar />
    <main>
      <div class="main-title">
        <h1>Tracking</h1>
        <img class="profile-image" src="/profile.jpg" alt="Profile" @click="toggleTelegramAuth" />
      </div>
      <div v-if="showPopup" class="telegram-popup">
        <div class="popup-content">
          <h3>Авторизация через Telegram</h3>
          <div id="telegram-login-container"></div>
          <button @click="closePopup">Закрыть</button>
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
      showPopup: false,
    };
  },
  methods: {
    toggleTelegramAuth() {
      this.showPopup = true;
      this.$nextTick(() => {
        this.loadTelegramWidget();
      });
    },
    closePopup() {
      this.showPopup = false;
    },
    loadTelegramWidget() {
      const botUsername = 'DeliveryAuthBot';
      const authUrl = 'https://6eca-198-98-50-3.ngrok-free.app/api/signup/telegram-login';

      const existingScript = document.querySelector('script[data-telegram-widget]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      script.dataset.telegramLogin = botUsername;
      script.dataset.size = 'large';
      script.dataset.authUrl = authUrl;
      script.dataset.requestAccess = 'write';
      script.dataset.telegramWidget = 'true';
      document.getElementById('telegram-login-container').appendChild(script);
    },
  },
  components: {
    Navbar,
  },
};
</script>

<style scoped>
.telegram-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.popup-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
}

.telegram-login-btn {
  display: inline-block;
  padding: 10px 20px;
  background-color: #0088cc;
  color: white;
  border-radius: 5px;
  text-decoration: none;
}
</style>
