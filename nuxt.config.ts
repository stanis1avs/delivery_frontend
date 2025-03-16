export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  css: ['@/assets/css/global.css'],
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
          target: 'http://localhost:7070',
          changeOrigin: true,
        },
      },
    },
  },
});
