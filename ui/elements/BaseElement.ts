import { expect, type Locator } from '@playwright/test';
import { getLogger } from '../../core/logger';

const log = getLogger('ui');

/**
 * Базовая обёртка над элементом страницы: имя для логов и отчёта,
 * явные ожидания состояния вместо фиксированных задержек.
 */
export class BaseElement {
  constructor(
    protected readonly root: Locator,
    readonly name: string,
  ) {}

  get locator(): Locator {
    return this.root;
  }

  protected get log() {
    return log;
  }

  async click(): Promise<void> {
    log.debug(`Клик: ${this.name}`);
    await this.root.click();
  }

  async waitVisible(): Promise<void> {
    log.debug(`Ожидание видимости: ${this.name}`);
    await this.root.waitFor({ state: 'visible' });
  }

  async waitHidden(): Promise<void> {
    await this.root.waitFor({ state: 'hidden' });
  }

  async isVisible(): Promise<boolean> {
    return this.root.isVisible();
  }

  async text(): Promise<string> {
    await this.waitVisible();
    return (await this.root.innerText()).trim();
  }

  async attribute(name: string): Promise<string | null> {
    return this.root.getAttribute(name);
  }

  async expectVisible(): Promise<void> {
    await expect(this.root, `«${this.name}» должен отображаться`).toBeVisible();
  }

  async expectHidden(): Promise<void> {
    await expect(this.root, `«${this.name}» не должен отображаться`).toBeHidden();
  }

  async expectText(expected: string | RegExp): Promise<void> {
    await expect(this.root, `Текст «${this.name}»`).toHaveText(expected);
  }

  async expectContainsText(expected: string | RegExp): Promise<void> {
    await expect(this.root, `Текст «${this.name}»`).toContainText(expected);
  }

  async expectEnabled(): Promise<void> {
    await expect(this.root, `«${this.name}» должна быть доступна`).toBeEnabled();
  }
}
