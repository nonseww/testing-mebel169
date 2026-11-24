import type { Page } from '@playwright/test';
import { parsePrice } from '../../core/utils';
import { BaseElement } from '../elements/BaseElement';

/** Окно «Товар успешно добавлен в корзину». */
export class AddedToCartModal extends BaseElement {
  readonly heading: BaseElement;
  readonly productTitle: BaseElement;
  readonly price: BaseElement;
  readonly goToCart: BaseElement;
  readonly continueShopping: BaseElement;

  constructor(page: Page) {
    const root = page.locator('#cart-modal.hystmodal--active');
    super(root, 'Окно добавления в корзину');
    this.heading = new BaseElement(root.locator('.form__title'), 'Заголовок окна');
    this.productTitle = new BaseElement(root.locator('.cart-added-modal__product-row__product-title'), 'Товар в окне');
    this.price = new BaseElement(root.locator('.cart-added-modal__product-row__actual-price__price'), 'Цена в окне');
    this.goToCart = new BaseElement(root.getByRole('link', { name: 'Перейти в корзину' }), 'Перейти в корзину');
    this.continueShopping = new BaseElement(root.locator('.cart-close-modal'), 'Продолжить покупки');
  }

  async priceValue(): Promise<number> {
    return parsePrice(await this.price.text());
  }
}
