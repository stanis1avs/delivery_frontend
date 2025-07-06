export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  css: ['@/assets/css/global.css'],
  runtimeConfig: {
    public: {
      apiUrl: process.env.DOMAIN_URL,
      serverUrl: process.env.SERVER_URL,
      telegramWidgetUrl: process.env.TELEGRAM_WIDGET_URL,
      telegramBotName: process.env.TG_BOT_NAME,
      telegramBotId: process.env.TG_BOT_ID
    },
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/css/mixins.scss" as *;`,
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.SERVER_URL,
          changeOrigin: true,
        },
      },
    },
  },
});
