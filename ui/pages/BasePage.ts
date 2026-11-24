import type { Page } from '@playwright/test';
import { getLogger } from '../../core/logger';
import type { BaseElement } from '../elements/BaseElement';

/**
 * Базовая страница. Готовность определяется по ключевому элементу, а не по событию load:
 * на сайте много сторонних трекеров, из-за которых load может не наступать десятки секунд.
 */
export abstract class BasePage {
  protected readonly log = getLogger('page');

  constructor(readonly page: Page) {}

  /** Человекочитаемое имя страницы для логов. */
  abstract readonly title: string;

  /** Адрес страницы: относительный (от BASE_URL) или абсолютный. */
  protected abstract url(): string;

  /** Элемент, появление которого означает, что страница готова. */
  protected abstract readyMarker(): BaseElement;

  async open(): Promise<this> {
    const url = this.url();
    this.log.info(`Открыть «${this.title}»: ${url}`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.waitLoaded();
    return this;
  }

  async waitLoaded(): Promise<this> {
    await this.readyMarker().waitVisible();
    this.log.debug(`Страница «${this.title}» готова`);
    return this;
  }
}
