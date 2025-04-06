<template>
  <div class="login-wrapper">
    <div class="auth-box">
      <div class="icon-flow">
        <img src="/telegram.png" alt="Telegram" class="icon"/>
        <span class="arrow">➞</span>
        <div class="icon circle">
          <span class="logo">D</span>
        </div>
      </div>
      <p class="auth-text">
        Войдите, чтобы использовать аккаунт Telegram<br />
        для <b>delivery app</b>.
      </p>
      <div id="telegram-login-container"></div>
    </div>
  </div>
  </template>
  
  <script>
  export default {
    mounted() {
      const botUsername = 'DeliveryAuthBot';
      const authUrl = 'https://eeda-198-98-50-3.ngrok-free.app/api/signup/telegram-login';
    
    //   const relogin = this.$route.query.relogin;

    //   if (relogin) {
    //     window.location.href = `https://oauth.telegram.org/auth?bot=${botUsername}&origin=${window.location.origin}&embed=1&request_access=write&return_to=${encodeURIComponent(authUrl)}`;
    //     return;
    //   }

      const existingScript = document.querySelector('script[data-telegram-widget]');
      if (existingScript) existingScript.remove();
  
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      script.dataset.telegramLogin = botUsername;
      script.dataset.userpic = false;
      script.dataset.size = 'large';
      script.dataset.authUrl = authUrl;
      script.dataset.requestAccess = 'write';
      script.dataset.telegramWidget = 'true';
  
      document.getElementById('telegram-login-container').appendChild(script);
    }
  };
  </script>
  
<style scoped>
.login-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f5f5f5;
  text-align: center;
}

.auth-box {
  background: white;
  padding: 30px 40px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.icon-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.icon {
  width: 50px;
  height: 50px;
}

.arrow {
  font-size: 28px;
  color: #555;
}

.circle {
  background: #f44336;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle .logo {
  color: white;
  font-size: 22px;
  font-weight: bold;
}

.auth-text {
  margin-bottom: 20px;
  color: #333;
  font-size: 15px;
}

.auth-text a {
  color: #1e88e5;
  text-decoration: none;
}
</style>
  