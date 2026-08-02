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
  // Проксирование /api на бэкенд работает и в dev (devProxy), и в production-сборке
  // (Nitro routeRules) — раньше прокси был только в vite.server и в проде отваливался (BUG-109).
  nitro: {
    devProxy: {
      '/api': {
        target: `${process.env.SERVER_URL}/api`,
        changeOrigin: true,
      },
    },
    routeRules: {
      '/api/**': {
        proxy: `${process.env.SERVER_URL}/api/**`,
      },
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
  },
});
