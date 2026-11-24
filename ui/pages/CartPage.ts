import { expect } from '@playwright/test';
import { CartItem } from '../components/CartItem';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Header } from '../components/Header';
import { OrderSummaryBlock } from '../components/OrderSummaryBlock';
import { BaseElement } from '../elements/BaseElement';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  readonly title = 'Корзина';
  readonly header = new Header(this.page);
  readonly summary = new OrderSummaryBlock(this.page);
  readonly checkoutButton = new BaseElement(
    this.page.locator('.cart-page__order-buttons .cart-page__button--order'),
    'Перейти к оформлению',
  );
  readonly emptyState = new BaseElement(this.page.getByText('Корзина пустая'), 'Пустая корзина');
  private readonly items = this.page.locator('.cart-page__basket-items[data-id]');
  private readonly pageTitle = new BaseElement(this.page.locator('h1.main-title'), 'Заголовок «Корзина»');

  protected url(): string {
    return '/cart/';
  }

  protected readyMarker(): BaseElement {
    return this.pageTitle;
  }

  /** Корзина — Vue-приложение: дожидаемся, пока отрисуется либо список, либо пустое состояние. */
  async waitRendered(): Promise<void> {
    await expect(this.items.first().or(this.emptyState.locator), 'Корзина должна отрисоваться').toBeVisible();
  }

  async count(): Promise<number> {
    await this.waitRendered();
    return this.items.count();
  }

  item(index = 0): CartItem {
    return new CartItem(this.items.nth(index), `Строка корзины #${index + 1}`);
  }

  itemById(productId: string): CartItem {
    return new CartItem(this.page.locator(`.cart-page__basket-items[data-id="${productId}"]`), `Товар ${productId}`);
  }

  async expectItemsCount(count: number): Promise<void> {
    await expect(this.items, 'Количество позиций в корзине').toHaveCount(count);
  }

  /** Удалить все позиции (подготовка: корзина не должна зависеть от прошлого запуска). */
  async removeAll(): Promise<void> {
    let remaining = await this.count();
    this.log.info(`Очистка корзины, позиций: ${remaining}`);
    while (remaining > 0) {
      await this.item(0).remove.click();
      await new ConfirmDialog(this.page, 'Вы точно хотите удалить', 'Удалить').accept();
      remaining -= 1;
      await this.expectItemsCount(remaining);
    }
    await this.emptyState.expectVisible();
  }

  async proceedToCheckout(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/\/cart\/checkout/, { waitUntil: 'domcontentloaded' }),
      this.checkoutButton.click(),
    ]);
  }
}
