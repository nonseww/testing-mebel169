import type { Locator, Page } from '@playwright/test';
import { parsePrice } from '../../core/utils';
import { BaseElement } from '../elements/BaseElement';

/** Плитка товара в каталоге и выдаче поиска. */
export class ProductTile extends BaseElement {
  readonly titleLink: BaseElement;
  readonly price: BaseElement;

  constructor(root: Locator, name = 'Плитка товара') {
    super(root, name);
    this.titleLink = new BaseElement(root.locator('a.product-preview__link'), 'Название товара');
    this.price = new BaseElement(root.locator('.js-preview-price'), 'Цена товара');
  }

  async title(): Promise<string> {
    return this.titleLink.text();
  }

  async priceValue(): Promise<number> {
    const raw = await this.price.attribute('data-price');
    return raw ? Number(raw) : parsePrice(await this.price.text());
  }

  async productId(): Promise<string | null> {
    return this.root.locator('[data-product-id]').first().getAttribute('data-product-id');
  }

  /**
   * Открыть карточку кликом по названию. Сайт открывает товар в новой вкладке (target=_blank),
   * поэтому возвращаем страницу, на которой оказалась карточка.
   */
  async open(page: Page): Promise<Page> {
    const target = await this.titleLink.attribute('target');
    if (target === '_blank') {
      const [popup] = await Promise.all([page.context().waitForEvent('page'), this.titleLink.click()]);
      await popup.waitForLoadState('domcontentloaded');
      return popup;
    }
    await this.titleLink.click();
    return page;
  }
}
