// Сид выполняется НЕ здесь, а до запуска playwright (см. npm-скрипт test:e2e).
//
// Причина: Playwright поднимает webServer раньше globalSetup, а сид пересоздаёт
// базу через DROP ... WITH (FORCE). Уже подключившийся бэкенд переподключится,
// но сохранит закэшированные OID типов PostGIS — в новой базе они другие, и
// geometry перестаёт распознаваться: координаты приходят null, маршрут не строится.
//
// Здесь остаётся только проверка, что сид отработал.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.join(here, '.seed.json');

export default function globalSetup() {
  if (!existsSync(SEED_FILE)) {
    throw new Error(
      'Нет e2e/.seed.json — база не засеяна.\n' +
        'Запускайте прогон через `npm run test:e2e`: он выполняет сид ДО старта серверов.'
    );
  }

  const seed = JSON.parse(readFileSync(SEED_FILE, 'utf8'));
  console.log(`\nE2E: используется заказ ${seed.orderId}`);
}
