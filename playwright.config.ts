import os from 'node:os';
import { defineConfig } from '@playwright/test';
import { config } from './core/config';

/**
 * Все параметры берутся из core/config.ts (переменные окружения / .env).
 *
 * Браузер по умолчанию — Firefox: headless Chromium на mebel169.ru получает
 * антибот-CAPTCHA (Яндекс SmartCaptcha) на всех страницах. Chromium работает только в headed-режиме.
 *
 * Скриншоты при падении снимает фикстура core/fixtures.ts (с закрашенными полями ввода),
 * поэтому встроенные screenshot / trace / video выключены — в них могли бы попасть пароли и контакты.
 */
export default defineConfig({
  testDir: './autotest/specs',
  outputDir: './test-results',
  timeout: config.timeouts.test,
  expect: { timeout: config.timeouts.expect },
  fullyParallel: true,
  workers: config.workers,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: [
    ['list'],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: true,
        suiteTitle: false,
        environmentInfo: {
          'Сайт': config.baseUrl,
          'Личный кабинет': config.lkUrl,
          'Браузер': config.browser,
          'Headless': String(config.headless),
          'Создание заказа (ORDER_SUBMIT)': String(config.orderSubmit),
          'ОС': `${os.platform()} ${os.release()}`,
          'Node.js': process.version,
        },
      },
    ],
    // должен идти после allure-playwright: маскирует секреты в уже записанных результатах
    ['./core/SanitizingReporter.ts'],
  ],
  use: {
    baseURL: config.baseUrl,
    browserName: config.browser,
    headless: config.headless,
    launchOptions: { slowMo: config.slowMo },
    viewport: { width: 1366, height: 900 },
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    actionTimeout: config.timeouts.action,
    navigationTimeout: config.timeouts.navigation,
    screenshot: 'off',
    trace: 'off',
    video: 'off',
  },
  projects: [{ name: config.browser }],
});
