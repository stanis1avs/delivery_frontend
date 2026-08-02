import { defineConfig } from '@playwright/test';

// E2E поднимает СВОЙ бэкенд на тестовой базе и свой dev-сервер, чтобы прогон
// не зависел от того, что запущено у разработчика, и не портил рабочие данные.
const BACKEND_PORT = 7071;
const FRONTEND_PORT = 3100;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/globalSetup.js',
  // Первый заход в dev-режиме тянет за собой компиляцию страницы — она долгая
  timeout: 90000,
  expect: { timeout: 15000 },
  // Общая база на всех — параллельные файлы затирали бы данные друг друга
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],

  use: {
    baseURL: `http://127.0.0.1:${FRONTEND_PORT}`,
    trace: 'retain-on-failure',
  },

  webServer: [
    {
      command: 'npm start',
      cwd: '../delivery_backend',
      port: BACKEND_PORT,
      reuseExistingServer: false,
      timeout: 60000,
      env: {
        DB_NAME: 'delivery_test',
        REDIS_DB: '1',
        PORT: String(BACKEND_PORT),
        // Воркер и бот в E2E не нужны: подбор курьера проверяется юнитами,
        // а polling конфликтует с рабочим инстансом бота
        WORKER_IN_PROCESS: 'false',
        TELEGRAM_ENABLED: 'false',
        CLIENT_URL: `http://127.0.0.1:${FRONTEND_PORT}`,
      },
    },
    {
      // --host 127.0.0.1 обязателен: по умолчанию Nuxt слушает localhost, который
      // на Windows резолвится в IPv6 ::1, а Playwright ждёт порт на IPv4
      command: `npm run dev -- --port ${FRONTEND_PORT} --host 127.0.0.1`,
      url: `http://127.0.0.1:${FRONTEND_PORT}/`,
      reuseExistingServer: false,
      timeout: 180000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        SERVER_URL: BACKEND_URL,
      },
    },
  ],
});
