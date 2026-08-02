// Уровень 6 из TESTING_PLAN.md: E2E в настоящем браузере.
//
// Проверяется то, что не видно ни одному backend-тесту: доходят ли данные до
// экрана. Именно здесь жили баги, которые вы находили руками — пустой сайдбар
// после перезагрузки и захардкоженные карточки.

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(path.join(here, '.seed.json'), 'utf8'));

/** Короткий номер заказа — так его показывают карточки. */
const shortId = seed.orderId.split('-')[0].toUpperCase();

test.beforeEach(async ({ page }) => {
  // Логин подменяем напрямую: Telegram Login Widget в тесте не пройти.
  // Полезная нагрузка ровно та, что кладёт signup.js после редиректа.
  await page.addInitScript((user) => {
    localStorage.setItem('tg_user', JSON.stringify(user));
  }, seed.tgUser);

  // Геолокация в браузере недоступна — трекер молча выключится, это не мешает
  await page.context().setGeolocation({ latitude: 40.5952146, longitude: -74.1827119 });
});

test('E-08: активные заказы восстанавливаются после перезагрузки', async ({ page }) => {
  await page.goto('/');

  const card = page.locator('.tracking-item').first();
  await expect(card).toContainText(shortId);

  // Тот самый сценарий, который раньше очищал список
  await page.reload();

  await expect(page.locator('.tracking-item').first()).toContainText(shortId);
});

test('E-09: карточки получателя и транспорта заполнены данными заказа', async ({ page }) => {
  await page.goto('/');

  // До выбора заказа данных нет
  await expect(page.locator('.recipient-name')).toHaveText('Заказ не выбран');

  await page.locator('.tracking-item').first().click();

  await expect(page.locator('.recipient-name')).toHaveText('Matthew Perry');
  await expect(page.locator('.recipient-id')).toContainText(shortId);

  // Телефон получателя — из orders.customer_phone
  const call = page.locator('.recipient-contact a');
  await expect(call).toHaveAttribute('href', 'tel:+1 718 555-0142');

  // Транспорт — из couriers
  await expect(page.locator('.car-cert h2')).toHaveText('Volkswagen Transporter');
  await expect(page.locator('.license-plate')).toContainText('XYZ-123');

  // Дистанция и время — из OSRM, посчитаны при назначении
  const details = page.locator('.details-delivery');
  await expect(details).toContainText('1000');   // payload_kg
  await expect(details).toContainText('5.8');    // volume_m3
  await expect(details).toContainText('2.9 км'); // distance_meters 2852
  await expect(details).toContainText('4 мин');  // estimated_duration_seconds 237
});

test('E-09b: адрес доставки и расчётное прибытие берутся из заказа', async ({ page }) => {
  await page.goto('/');
  await page.locator('.tracking-item').first().click();

  const address = page.locator('.recipient-adress');
  await expect(address).toContainText('Forest Ave 1200');
  // Прочерка быть не должно — время считается из status_changed_at + ETA
  await expect(address).not.toContainText('—');
});

test('E-01: выбор заказа строит маршрут на карте', async ({ page }) => {
  await page.goto('/');
  await page.locator('.tracking-item').first().click();

  // Leaflet рисует маршрут SVG-полилинией внутри overlay-слоя
  await expect(page.locator('.leaflet-overlay-pane path').first()).toBeVisible();

  // И показывает сводку по маршруту
  await expect(page.locator('.route-info')).toBeVisible();
});

test('карта не перекрывает меню профиля', async ({ page }) => {
  await page.goto('/');
  await page.locator('.profile-image').click();

  const popup = page.locator('.logout-popup');
  await expect(popup).toBeVisible();

  // Меню должно принимать клик: если Leaflet сверху, сюда прилетит перехват
  await expect(popup.locator('.logout-btn')).toBeVisible();
  await popup.locator('.logout-btn').click({ timeout: 3000 });
  await expect(page).toHaveURL(/\/login/);
});

test('E-02: страница /map открывается с картой', async ({ page }) => {
  await page.goto('/map');

  await expect(page.locator('.map-wrapper')).toBeVisible();
  // Тайлы OpenStreetMap подгружаются — значит карта инициализировалась
  await expect(page.locator('.leaflet-tile-pane img').first()).toBeVisible();
});

test('E-06: завершение заказа меняет статус на бэкенде', async ({ page, request }) => {
  await page.goto('/');
  await page.locator('.tracking-item').first().click();

  await page.getByRole('button', { name: 'Out for Delivery' }).click();

  // Кнопка переключается на отмену — значит запрос ушёл
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

  // Состояние проверяем на бэкенде: UI мог бы «завершить» только у себя
  await expect
    .poll(
      async () => {
        const res = await request.get('http://127.0.0.1:7071/api/orders/active', {
          headers: {
            'X-Courier-Token': seed.tgUser.geoToken,
            'X-Courier-Id': seed.courierId,
          },
        });
        return (await res.json()).length;
      },
      { timeout: 10000 }
    )
    .toBe(0);
});
