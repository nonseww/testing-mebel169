import { test as base } from '@playwright/test';
import { getLogger, startTestLogCapture, stopTestLogCapture, type Logger } from './logger';
import { maskingSummary, maskSecrets } from './secrets';
import * as allure from 'allure-js-commons';
import { firstLine, setFailureCapture } from './reporting';

/**
 * Базовые фикстуры уровня core: логгер теста и диагностика.
 * Каждый тест получает новый browser context (без cookies и корзины предыдущего запуска).
 * При падении к Allure прикладывается скриншот с закрашенными полями ввода
 * (или причина, по которой скриншот недоступен) и лог теста.
 */
export interface CoreFixtures {
  log: Logger;
  /** CSS-селекторы, которые закрашиваются на скриншоте. Слой ui может дополнить список. */
  sensitiveSelectors: string[];
  _diagnostics: void;
}

export const test = base.extend<CoreFixtures>({
  sensitiveSelectors: [['input', 'textarea'], { option: true }],

  log: async ({}, use, testInfo) => {
    await use(getLogger(testInfo.titlePath.slice(1).join(' › ')));
  },

  _diagnostics: [
    async ({ page: basePage, log, sensitiveSelectors }, use, testInfo) => {
      startTestLogCapture();
      log.info(`Старт теста: ${testInfo.title}`);
      log.info(maskingSummary());

      // Скриншот снимается в момент падения шага, ещё в теле теста → в Allure он в Test body.
      let screenshotTaken = false;
      const captureScreenshot = async (): Promise<void> => {
        screenshotTaken = true;
        // Сценарий мог перейти в новую вкладку — снимаем последнюю открытую
        const page = basePage.context().pages().at(-1) ?? basePage;
        try {
          const screenshot = await page.screenshot({
            mask: sensitiveSelectors.map((selector) => page.locator(selector)),
            timeout: 10_000,
          });
          await allure.attachment('screenshot-on-failure', screenshot, 'image/png');
        } catch (error) {
          const reason = `Скриншот недоступен: ${firstLine(error)}`;
          log.warn(reason);
          await allure.attachment('screenshot-unavailable', reason, 'text/plain');
        }
      };
      setFailureCapture(captureScreenshot);

      await use();

      setFailureCapture(undefined);
      const failed = testInfo.status !== testInfo.expectedStatus;
      if (failed) {
        const page = basePage.context().pages().at(-1) ?? basePage;
        const where = failurePlace(testInfo.error?.stack);
        log.error(
          `Тест упал: ${firstLine(testInfo.error?.message ?? testInfo.error)}` +
            (where ? ` | место сбоя: ${where}` : '') +
            ` | URL: ${safeUrl(page.url())}`,
        );
        // Падение вне step() (например, тайм-аут теста) — снимаем здесь, в завершении теста.
        if (!screenshotTaken) await captureScreenshot();
      } else {
        log.info(`Завершён: ${testInfo.status}`);
      }

      await allure.attachment('log', stopTestLogCapture(), 'text/plain');
    },
    { auto: true },
  ],
});

/** Первая строка стека из кода проекта (не из node_modules) — «место сбоя» для лога. */
function failurePlace(stack: string | undefined): string | undefined {
  const frame = stack
    ?.split('\n')
    .find((l) => /\/(autotest|ui|core)\//.test(l) && !l.includes('node_modules') && !l.includes('core/fixtures'));
  return frame?.trim().replace(/^at\s+/, '').replace(process.cwd() + '/', '');
}

function safeUrl(url: string): string {
  return maskSecrets(url.replace(/([?&](token|code|session)[^=]*=)[^&]+/gi, '$1***'));
}

export { expect } from '@playwright/test';
