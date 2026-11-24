import { test as coreTest } from '../core/fixtures';
import { App, SENSITIVE_SELECTORS } from '../ui/App';
import { AuthSteps } from './steps/AuthSteps';
import { ShopSteps } from './steps/ShopSteps';

/** Фикстуры уровня сценариев: Page Object'ы и общие шаги. */
export const test = coreTest.extend<{ app: App; auth: AuthSteps; shop: ShopSteps }>({
  sensitiveSelectors: SENSITIVE_SELECTORS,
  app: async ({ page }, use) => {
    await use(new App(page));
  },
  auth: async ({ app }, use) => {
    await use(new AuthSteps(app));
  },
  shop: async ({ app }, use) => {
    await use(new ShopSteps(app));
  },
});

export { expect } from '../core/fixtures';
