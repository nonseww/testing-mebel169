import { expect, type Page } from '@playwright/test';
import type { OrderSummary } from '../../core/dto';
import { parseCount, parsePrice } from '../../core/utils';
import { BaseElement } from '../elements/BaseElement';

/** Блок «Ваша корзина» с суммами — одинаковый на странице корзины и оформления. */
export class OrderSummaryBlock extends BaseElement {
  readonly itemsCount: BaseElement;
  readonly itemsSum: BaseElement;
  readonly discount: BaseElement;
  readonly total: BaseElement;

  constructor(page: Page) {
    const root = page.locator('.cart-page__order-info');
    super(root, 'Итоги корзины');
    this.itemsCount = new BaseElement(root.locator('.cart-page__products-amount-text').first(), 'Товары (N)');
    this.itemsSum = new BaseElement(root.locator('.cart-page__result'), 'Сумма товаров');
    this.discount = new BaseElement(root.locator('.cart-page__result--discount'), 'Скидка');
    this.total = new BaseElement(root.locator('.cart-page__result--final'), 'Итого');
  }

  /** Итоги пересчитываются асинхронно после изменения корзины — ждём нужных значений. */
  async expectTotals(expected: { itemsCount: number; total: number }): Promise<void> {
    await expect
      .poll(async () => {
        const { itemsCount, total } = await this.read();
        return { itemsCount, total };
      }, { message: 'Итоги корзины (количество товаров и «Итого»)' })
      .toEqual(expected);
  }

  async read(): Promise<OrderSummary> {
    const hasDiscount = await this.discount.isVisible();
    return {
      itemsCount: parseCount(await this.itemsCount.text()),
      itemsSum: parsePrice(await this.itemsSum.text()),
      discount: hasDiscount ? parsePrice(await this.discount.text()) : 0,
      total: parsePrice(await this.total.text()),
    };
  }
}
